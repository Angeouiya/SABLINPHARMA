import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  CREDIT_PACKS,
  FCFA_PER_CREDIT,
  PASS_ORDONNANCE_PRICE,
  getRechargeCreditsForAmount,
  getRechargeLabelForAmount,
} from "@/lib/restrictions";
import {
  ADMIN_SESSION_COOKIE,
  decodeProfessionalSession,
  type ProfessionalSession,
} from "@/lib/professional-sessions";
import { normalizeRole } from "@/lib/access-control";

export const PAYMENT_STATUSES = [
  "INITIATED",
  "PENDING",
  "PROCESSING",
  "SUCCESS",
  "FAILED",
  "CANCELLED",
  "EXPIRED",
  "REJECTED",
  "SUSPICIOUS",
  "REFUNDED",
  "CHARGEBACK",
  "MANUAL_REVIEW",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type PaymentRiskStatus = "Normal" | "À surveiller" | "Suspect" | "Bloqué";
export type PaymentProviderId = "paydunya" | "wave" | "orange" | "mtn" | "moov";
export type PurchaseType = "credit_pack" | "pass_ordonnance";

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  INITIATED: "Paiement initié",
  PENDING: "En attente",
  PROCESSING: "En cours",
  SUCCESS: "Confirmé",
  FAILED: "Échoué",
  CANCELLED: "Annulé",
  EXPIRED: "Expiré",
  REJECTED: "Rejeté",
  SUSPICIOUS: "Suspect",
  REFUNDED: "Remboursé",
  CHARGEBACK: "Contesté",
  MANUAL_REVIEW: "Vérification manuelle",
};

export const PAYMENT_PROVIDERS: PaymentProviderId[] = ["paydunya", "wave", "orange", "mtn", "moov"];

type PaymentProduct = {
  purchaseType: PurchaseType;
  amount: number;
  credits: number;
  passOrdonnance: boolean;
  label: string;
};

const CREDIT_PACK_BY_AMOUNT = new Map<number, PaymentProduct>(
  CREDIT_PACKS.map((pack) => [
    pack.amount,
    {
      purchaseType: "credit_pack" as const,
      amount: pack.amount,
      credits: pack.credits,
      passOrdonnance: false,
      label: `${pack.label} (${pack.credits} crédits)`,
    },
  ])
);

export function productFromPurchase(purchaseType: PurchaseType, amount: number): PaymentProduct | null {
  if (purchaseType === "pass_ordonnance") {
    return amount === PASS_ORDONNANCE_PRICE
      ? {
          purchaseType,
          amount: PASS_ORDONNANCE_PRICE,
          credits: 0,
          passOrdonnance: true,
          label: "Pass Ordonnance Unique",
        }
      : null;
  }
  const credits = getRechargeCreditsForAmount(amount);
  if (!credits) return null;
  return (
    CREDIT_PACK_BY_AMOUNT.get(amount) ?? {
      purchaseType,
      amount,
      credits,
      passOrdonnance: false,
      label: getRechargeLabelForAmount(amount) ?? `Recharge personnalisée (${credits} crédits)`,
    }
  );
}

function safeProvider(provider: unknown): PaymentProviderId | null {
  const normalized = String(provider ?? "").trim().toLowerCase();
  return PAYMENT_PROVIDERS.includes(normalized as PaymentProviderId)
    ? (normalized as PaymentProviderId)
    : null;
}

function technicalIp(req?: NextRequest) {
  return (
    req?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req?.headers.get("x-real-ip") ??
    null
  );
}

function userAgent(req?: NextRequest) {
  return req?.headers.get("user-agent") ?? null;
}

export function generatePaymentReference() {
  const year = new Date().getUTCFullYear();
  const suffix = randomBytes(4).toString("hex").toUpperCase();
  const counter = String(Date.now()).slice(-6);
  return `SP-PAY-${year}-${counter}-${suffix}`;
}

export function generateIdempotencyKey(userId: string, seed?: string | null) {
  if (seed && seed.length >= 16 && seed.length <= 160) return seed;
  return `pay:${userId}:${Date.now()}:${randomBytes(8).toString("hex")}`;
}

async function writeAudit(input: {
  action: string;
  entityId?: string | null;
  userId?: string | null;
  actor?: ProfessionalSession | null;
  oldValue?: unknown;
  newValue?: unknown;
  result?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  comment?: string;
}) {
  await db.auditLog.create({
    data: {
      platform: input.actor ? "admin" : "system",
      action: input.action,
      entityType: "payment",
      entityId: input.entityId ?? undefined,
      actorAccountId: input.actor?.accountId,
      actorName: input.actor?.name ?? (input.userId ? `Utilisateur ${input.userId}` : "Système paiement"),
      actorRole: input.actor?.role ?? (input.userId ? "USER" : "SYSTEM"),
      result: input.result ?? "réussi",
      oldValue: input.oldValue ? JSON.stringify(input.oldValue) : undefined,
      newValue: input.newValue ? JSON.stringify(input.newValue) : undefined,
      ipAddress: input.ipAddress ?? undefined,
      userAgent: input.userAgent ?? undefined,
      sessionId: input.actor?.sessionId,
      comment: input.comment,
    },
  });
}

async function notifyUser(userId: string | null | undefined, title: string, message: string, type = "info") {
  if (!userId) return;
  await db.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      icon: type === "success" ? "CheckCircle2" : type === "warning" ? "AlertTriangle" : "CreditCard",
      link: "wallet",
    },
  });
}

async function notifyAdmins(title: string, message: string, type = "payment_security") {
  await db.securityNotification.create({
    data: {
      platform: "admin",
      type,
      title,
      message,
      status: "non_lue",
    },
  });
}

export async function createPaymentIntent(input: {
  userId: string;
  purchaseType: PurchaseType;
  amount: number;
  provider: unknown;
  idempotencyKey?: string | null;
  req?: NextRequest;
  metadata?: Record<string, unknown>;
}) {
  const product = productFromPurchase(input.purchaseType, input.amount);
  if (!product) {
    throw new Error("Montant ou produit non autorisé.");
  }
  const requestedProvider = safeProvider(input.provider);
  const provider: PaymentProviderId = "paydunya";
  if (requestedProvider && requestedProvider !== "paydunya") {
    throw new Error("Le moyen de paiement se choisit sur PayDunya, pas sur SABLIN PHARMA.");
  }

  const idempotencyKey = generateIdempotencyKey(input.userId, input.idempotencyKey);
  const existing = await db.payment.findFirst({ where: { idempotencyKey } });
  if (existing) {
    return { payment: existing, duplicate: true, checkoutUrl: getCheckoutUrlFromMetadata(existing) };
  }

  const attempts = await db.payment.count({
    where: {
      userId: input.userId,
      createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) },
      status: { in: ["FAILED", "REJECTED", "SUSPICIOUS", "PENDING", "INITIATED"] },
    },
  });
  const riskStatus: PaymentRiskStatus = attempts >= 5 ? "À surveiller" : "Normal";
  const riskReasons = attempts >= 5 ? "Plusieurs tentatives récentes." : undefined;
  const account = await db.user.findUnique({
    where: { id: input.userId },
    select: { name: true, email: true, phone: true },
  });
  const baseMetadata = {
    productLabel: product.label,
    phoneLastDigits: String(account?.phone ?? input.metadata?.phone ?? "").replace(/\D/g, "").slice(-4),
  };

  const payment = await db.payment.create({
    data: {
      userId: input.userId,
      amount: product.amount,
      currency: "XOF",
      method: "mobile_money",
      provider,
      reference: generatePaymentReference(),
      productType: product.purchaseType,
      expectedCredits: product.credits,
      passOrdonnance: product.passOrdonnance,
      status: "PENDING",
      riskStatus,
      riskScore: attempts >= 5 ? 50 : 0,
      riskReasons,
      idempotencyKey,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      ipAddress: technicalIp(input.req) ?? undefined,
      userAgent: userAgent(input.req) ?? undefined,
      metadataJson: JSON.stringify(baseMetadata),
    },
  });
  const providerIntent = await getPaymentProvider(provider).createPaymentIntent({
    reference: payment.reference,
    amount: payment.amount,
    productLabel: product.label,
    purchaseType: product.purchaseType,
    origin: input.req?.nextUrl.origin ?? process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? null,
    customer: {
      name: String(input.metadata?.holderName ?? account?.name ?? ""),
      email: account?.email ?? null,
      phone: account?.phone ?? null,
    },
  });
  const paymentWithProvider = await db.payment.update({
    where: { id: payment.id },
    data: {
      providerReference: providerIntent.providerReference ?? payment.providerReference,
      metadataJson: JSON.stringify({
        ...baseMetadata,
        checkoutUrl: providerIntent.checkoutUrl ?? null,
        provider: provider,
        providerConfigured: Boolean(providerIntent.checkoutUrl),
      }),
    },
  });

  await notifyUser(
    input.userId,
    "Paiement initié",
    "Paiement en cours de vérification. Les crédits ou le Pass seront activés uniquement après confirmation officielle."
  );
  await writeAudit({
    action: "payment-intent-created",
    entityId: payment.reference,
    userId: input.userId,
    newValue: { amount: payment.amount, productType: payment.productType, status: payment.status },
    ipAddress: payment.ipAddress,
    userAgent: payment.userAgent,
  });

  if (riskStatus !== "Normal") {
    await notifyAdmins("Paiement à surveiller", `${payment.reference} : ${riskReasons}`);
  }

  return { payment: paymentWithProvider, duplicate: false, checkoutUrl: providerIntent.checkoutUrl ?? null };
}

export function getWebhookSecret() {
  return process.env.PAYMENT_WEBHOOK_SECRET ?? (process.env.NODE_ENV === "production" ? null : "sablin-dev-webhook-secret");
}

export function verifyWebhookSignature(rawBody: string, signature?: string | null) {
  const secret = getWebhookSecret();
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const clean = signature.replace(/^sha256=/i, "");
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(clean);
  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
}

export function verifyPayDunyaHash(hash?: string | null) {
  const masterKey = process.env.PAYDUNYA_MASTER_KEY;
  const clean = String(hash ?? "").trim().toLowerCase();
  if (!masterKey || !clean) return false;
  const expected = createHash("sha512").update(masterKey).digest("hex").toLowerCase();
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(clean);
  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
}

function normalizeProviderStatus(value: unknown): PaymentStatus {
  const raw = String(value ?? "").trim().toUpperCase();
  if (["SUCCESS", "SUCCEEDED", "CONFIRMED", "PAID", "OK", "COMPLETED"].includes(raw)) return "SUCCESS";
  if (["FAILED", "FAILURE", "ERROR"].includes(raw)) return "FAILED";
  if (["CANCELLED", "CANCELED"].includes(raw)) return "CANCELLED";
  if (raw === "EXPIRED") return "EXPIRED";
  if (raw === "REJECTED") return "REJECTED";
  if (raw === "REFUNDED") return "REFUNDED";
  if (raw === "CHARGEBACK") return "CHARGEBACK";
  if (raw === "PROCESSING") return "PROCESSING";
  return "PENDING";
}

export async function processProviderConfirmation(input: {
  reference: string;
  providerReference?: string | null;
  amount: number;
  currency?: string | null;
  status: unknown;
  provider?: string | null;
  webhookEventId?: string | null;
  signatureValid?: boolean;
  actor?: ProfessionalSession | null;
  manualReason?: string | null;
}) {
  const incomingStatus = normalizeProviderStatus(input.status);

  return db.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { reference: input.reference } });
    if (!payment) {
      await notifyAdmins("Référence paiement inconnue", `Référence inconnue reçue : ${input.reference}`, "payment_suspicious");
      return { ok: false, status: "SUSPICIOUS" as PaymentStatus, message: "Référence inconnue." };
    }

    if (payment.status === "SUCCESS" || payment.processedAt) {
      await writeAudit({
        action: "payment-webhook-duplicate",
        entityId: payment.reference,
        oldValue: { status: payment.status },
        result: "ignoré",
        comment: "Webhook déjà traité — aucune action supplémentaire.",
      });
      return {
        ok: true,
        alreadyProcessed: true,
        status: payment.status as PaymentStatus,
        message: "Webhook déjà traité — aucune action supplémentaire.",
      };
    }

    if (!input.signatureValid && !input.actor) {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "SUSPICIOUS",
          riskStatus: "Suspect",
          riskScore: 90,
          riskReasons: "Signature webhook invalide.",
        },
      });
      await notifyAdmins("Webhook paiement invalide", `${payment.reference} : signature invalide.`, "payment_webhook_invalid");
      return { ok: false, status: "SUSPICIOUS" as PaymentStatus, message: "Signature invalide." };
    }

    const expectedAmount = payment.amount;
    const receivedAmount = Number(input.amount);
    if (receivedAmount !== expectedAmount || (input.currency && input.currency !== payment.currency)) {
      const status: PaymentStatus = receivedAmount > expectedAmount ? "MANUAL_REVIEW" : "SUSPICIOUS";
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status,
          riskStatus: receivedAmount > expectedAmount ? "À surveiller" : "Suspect",
          riskScore: receivedAmount > expectedAmount ? 60 : 95,
          riskReasons: `Montant incohérent. Attendu ${expectedAmount}, reçu ${receivedAmount}.`,
          providerReference: input.providerReference ?? payment.providerReference,
          webhookEventId: input.webhookEventId ?? payment.webhookEventId,
          webhookSignatureValid: Boolean(input.signatureValid),
        },
      });
      await notifyAdmins("Montant paiement incohérent", `${payment.reference} : attendu ${expectedAmount}, reçu ${receivedAmount}.`);
      return { ok: false, status, message: "Montant incohérent." };
    }

    if (incomingStatus !== "SUCCESS") {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: incomingStatus,
          providerReference: input.providerReference ?? payment.providerReference,
          webhookEventId: input.webhookEventId ?? payment.webhookEventId,
          webhookSignatureValid: Boolean(input.signatureValid),
          verifiedAt: new Date(),
        },
      });
      await notifyUser(payment.userId, "Paiement non confirmé", "Aucun crédit n’a été ajouté tant que le paiement n’est pas confirmé.", "warning");
      return { ok: false, status: incomingStatus, message: "Paiement non confirmé." };
    }

    const claim = await tx.payment.updateMany({
      where: {
        id: payment.id,
        status: { notIn: ["SUCCESS", "REFUNDED"] },
        processedAt: null,
      },
      data: {
        status: "PROCESSING",
        providerReference: input.providerReference ?? payment.providerReference,
        webhookEventId: input.webhookEventId ?? payment.webhookEventId,
        webhookSignatureValid: Boolean(input.signatureValid),
        verifiedAt: new Date(),
      },
    });
    if (claim.count !== 1) {
      return { ok: true, alreadyProcessed: true, status: payment.status as PaymentStatus };
    }

    const user = payment.userId
      ? await tx.user.findUnique({ where: { id: payment.userId }, select: { credits: true } })
      : null;
    if (!payment.userId || !user) {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "MANUAL_REVIEW",
          riskStatus: "Suspect",
          riskScore: 90,
          riskReasons: "Utilisateur introuvable.",
        },
      });
      return { ok: false, status: "MANUAL_REVIEW" as PaymentStatus, message: "Utilisateur introuvable." };
    }

    const balanceBefore = user.credits;
    let balanceAfter = balanceBefore;

    if (payment.productType === "credit_pack") {
      balanceAfter = balanceBefore + payment.expectedCredits;
      await tx.user.update({ where: { id: payment.userId }, data: { credits: balanceAfter } });
      await tx.creditTransaction.create({
        data: {
          userId: payment.userId,
          type: "recharge",
          amount: payment.expectedCredits,
          description: `Recharge confirmée — ${payment.expectedCredits} crédits via PayDunya`,
          fcfaEquivalent: payment.amount,
          balanceBefore,
          balanceAfter,
          status: "réussi",
          reference: payment.reference,
          source: "payment_webhook",
          paymentId: payment.id,
        },
      });
      await notifyUser(payment.userId, "Paiement confirmé", "Paiement confirmé. Vos crédits ont été ajoutés.", "success");
    } else if (payment.productType === "pass_ordonnance") {
      const existingPass = await tx.passOrdonnance.findFirst({
        where: { userId: payment.userId, active: true, status: { in: ["active", "linked"] } },
      });
      if (existingPass) {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: "MANUAL_REVIEW",
            riskStatus: "À surveiller",
            riskScore: 70,
            riskReasons: "Pass actif déjà présent.",
          },
        });
        return { ok: false, status: "MANUAL_REVIEW" as PaymentStatus, message: "Pass déjà actif." };
      }
      await tx.passOrdonnance.create({
        data: {
          userId: payment.userId,
          active: true,
          status: "active",
          price: PASS_ORDONNANCE_PRICE,
          paymentId: payment.id,
          paymentReference: payment.reference,
        },
      });
      await tx.creditTransaction.create({
        data: {
          userId: payment.userId,
          type: "pass",
          amount: 0,
          description: `Pass Ordonnance Unique activé — ${PASS_ORDONNANCE_PRICE} FCFA`,
          fcfaEquivalent: PASS_ORDONNANCE_PRICE,
          balanceBefore,
          balanceAfter,
          status: "réussi",
          reference: payment.reference,
          source: "payment_webhook",
          paymentId: payment.id,
        },
      });
      await notifyUser(payment.userId, "Pass activé", "Paiement confirmé. Votre Pass Ordonnance Unique est actif.", "success");
    } else {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "MANUAL_REVIEW", riskStatus: "Suspect", riskReasons: "Produit acheté non reconnu." },
      });
      return { ok: false, status: "MANUAL_REVIEW" as PaymentStatus, message: "Produit non reconnu." };
    }

    const updated = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "SUCCESS",
        processedAt: new Date(),
        providerReference: input.providerReference ?? payment.providerReference,
        webhookEventId: input.webhookEventId ?? payment.webhookEventId,
        webhookSignatureValid: Boolean(input.signatureValid),
        manualReviewReason: input.manualReason ?? payment.manualReviewReason,
        manualValidatedBy: input.actor?.name ?? payment.manualValidatedBy,
        manualValidatedAt: input.actor ? new Date() : payment.manualValidatedAt,
      },
    });

    await tx.auditLog.create({
      data: {
        platform: input.actor ? "admin" : "system",
        action: input.actor ? "payment-manual-success" : "payment-provider-success",
        entityType: "payment",
        entityId: payment.reference,
        actorAccountId: input.actor?.accountId,
        actorName: input.actor?.name ?? "Prestataire paiement",
        actorRole: input.actor?.role ?? "PAYMENT_PROVIDER",
        result: "réussi",
        oldValue: JSON.stringify({ status: payment.status, balanceBefore }),
        newValue: JSON.stringify({ status: "SUCCESS", balanceAfter }),
        comment: input.manualReason ?? "Confirmation officielle serveur.",
      },
    });

    return { ok: true, status: "SUCCESS" as PaymentStatus, payment: updated, balanceAfter };
  });
}

export async function expireStalePayment(reference: string) {
  const payment = await db.payment.findUnique({ where: { reference } });
  if (!payment) return null;
  if (payment.status === "SUCCESS" || payment.status === "REFUNDED") return payment;
  if (payment.expiresAt && payment.expiresAt.getTime() < Date.now()) {
    return db.payment.update({ where: { id: payment.id }, data: { status: "EXPIRED" } });
  }
  return payment;
}

export type ProviderVerification = {
  status: PaymentStatus;
  amount: number;
  currency: string;
  providerReference?: string | null;
};

type ProviderIntentInput = {
  reference: string;
  amount: number;
  productLabel: string;
  purchaseType: PurchaseType;
  origin?: string | null;
  customer?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  };
};

type ProviderIntentResult = {
  providerReference?: string | null;
  checkoutUrl?: string | null;
};

export interface PaymentProvider {
  createPaymentIntent(input: ProviderIntentInput): Promise<ProviderIntentResult>;
  verifyPayment(reference: string): Promise<ProviderVerification>;
  refundPayment(reference: string): Promise<{ status: PaymentStatus }>;
  getTransactionStatus(reference: string): Promise<ProviderVerification>;
  reconcilePayment(reference: string): Promise<ProviderVerification>;
}

function payDunyaHeaders() {
  const masterKey = process.env.PAYDUNYA_MASTER_KEY;
  const privateKey = process.env.PAYDUNYA_PRIVATE_KEY;
  const token = process.env.PAYDUNYA_TOKEN;
  if (!masterKey || !privateKey || !token) return null;
  return {
    "Content-Type": "application/json",
    "PAYDUNYA-MASTER-KEY": masterKey,
    "PAYDUNYA-PRIVATE-KEY": privateKey,
    "PAYDUNYA-TOKEN": token,
  };
}

function payDunyaBaseUrl() {
  const mode = (process.env.PAYDUNYA_MODE ?? process.env.PAYMENT_PROVIDER_MODE ?? "sandbox").toLowerCase();
  return mode === "production" || mode === "live"
    ? "https://app.paydunya.com/api/v1"
    : "https://app.paydunya.com/sandbox-api/v1";
}

function getCheckoutUrlFromMetadata(payment: { metadataJson?: string | null }) {
  try {
    const metadata = payment.metadataJson ? JSON.parse(payment.metadataJson) : null;
    return typeof metadata?.checkoutUrl === "string" ? metadata.checkoutUrl : null;
  } catch {
    return null;
  }
}

function getPayDunyaProvider(): PaymentProvider {
  return {
    async createPaymentIntent(input) {
      const headers = payDunyaHeaders();
      if (!headers) {
        return { providerReference: `PAYDUNYA-PENDING-${input.reference}`, checkoutUrl: null };
      }
      const origin = input.origin?.replace(/\/$/, "") ?? "";
      const body = {
        invoice: {
          items: {
            item_0: {
              name: input.productLabel,
              quantity: 1,
              unit_price: input.amount,
              total_price: input.amount,
              description: input.purchaseType === "pass_ordonnance"
                ? "Pass Ordonnance Unique SABLIN PHARMA"
                : "Recharge de crédits SABLIN PHARMA",
            },
          },
          customer: {
            name: input.customer?.name ?? "",
            email: input.customer?.email ?? "",
            phone: input.customer?.phone ?? "",
          },
          total_amount: input.amount,
          description: `${input.productLabel} — référence ${input.reference}`,
        },
        store: {
          name: "SABLIN PHARMA",
          tagline: "Information, disponibilité et orientation pharmacie",
          website_url: origin,
          logo_url: origin ? `${origin}/images/logo-sablin-pharma.png` : "",
        },
        custom_data: {
          sablin_reference: input.reference,
          product_type: input.purchaseType,
        },
        actions: {
          cancel_url: origin ? `${origin}/portefeuille?payment=${encodeURIComponent(input.reference)}&status=cancelled` : "",
          return_url: origin ? `${origin}/portefeuille?payment=${encodeURIComponent(input.reference)}&status=return` : "",
          callback_url: origin ? `${origin}/api/payments/webhook` : "",
        },
      };
      const response = await fetch(`${payDunyaBaseUrl()}/checkout-invoice/create`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => null) as
        | { response_code?: string; response_text?: string; token?: string; description?: string }
        | null;
      if (!response.ok || data?.response_code !== "00" || !data.token) {
        return { providerReference: `PAYDUNYA-PENDING-${input.reference}`, checkoutUrl: null };
      }
      return { providerReference: data.token, checkoutUrl: data.response_text ?? null };
    },
    async verifyPayment(reference) {
      const payment = await db.payment.findUnique({ where: { reference } });
      if (!payment?.providerReference || payment.providerReference.startsWith("PAYDUNYA-PENDING-")) {
        return {
          status: "PENDING",
          amount: payment?.amount ?? 0,
          currency: payment?.currency ?? "XOF",
          providerReference: payment?.providerReference,
        };
      }
      const headers = payDunyaHeaders();
      if (!headers) {
        return {
          status: payment.status as PaymentStatus,
          amount: payment.amount,
          currency: payment.currency,
          providerReference: payment.providerReference,
        };
      }
      const response = await fetch(`${payDunyaBaseUrl()}/checkout-invoice/confirm/${encodeURIComponent(payment.providerReference)}`, {
        method: "GET",
        headers,
      });
      const data = await response.json().catch(() => null) as
        | { status?: string; invoice?: { total_amount?: number | string; token?: string } }
        | null;
      return {
        status: normalizeProviderStatus(data?.status),
        amount: Number(data?.invoice?.total_amount ?? payment.amount),
        currency: "XOF",
        providerReference: data?.invoice?.token ?? payment.providerReference,
      };
    },
    async getTransactionStatus(reference) {
      return this.verifyPayment(reference);
    },
    async reconcilePayment(reference) {
      return this.verifyPayment(reference);
    },
    async refundPayment() {
      return { status: "MANUAL_REVIEW" };
    },
  };
}

export function getPaymentProvider(providerId: PaymentProviderId | string = "paydunya"): PaymentProvider {
  if (providerId === "paydunya") return getPayDunyaProvider();
  return {
    async createPaymentIntent(input) {
      return { providerReference: `PROVIDER-${input.reference}`, checkoutUrl: null };
    },
    async verifyPayment(reference) {
      const payment = await db.payment.findUnique({ where: { reference } });
      return {
        status: "PENDING",
        amount: payment?.amount ?? 0,
        currency: payment?.currency ?? "XOF",
        providerReference: payment?.providerReference,
      };
    },
    async getTransactionStatus(reference) {
      return this.verifyPayment(reference);
    },
    async reconcilePayment(reference) {
      return this.verifyPayment(reference);
    },
    async refundPayment() {
      return { status: "MANUAL_REVIEW" };
    },
  };
}

export async function verifyPayment(reference: string) {
  const payment = await expireStalePayment(reference);
  if (!payment) return { ok: false, status: "SUSPICIOUS" as PaymentStatus, message: "Référence inconnue." };
  if (payment.status === "SUCCESS") return { ok: true, status: "SUCCESS" as PaymentStatus, payment };
  if (payment.status === "EXPIRED") return { ok: false, status: "EXPIRED" as PaymentStatus, payment };

  const provider = getPaymentProvider(payment.provider);
  const verification = await provider.verifyPayment(reference);
  return processProviderConfirmation({
    reference,
    providerReference: verification.providerReference,
    amount: verification.amount,
    currency: verification.currency,
    status: verification.status,
    signatureValid: true,
  });
}

export function readAdminPaymentSession(req: NextRequest) {
  const session = decodeProfessionalSession(req.cookies.get(ADMIN_SESSION_COOKIE)?.value);
  const role = normalizeRole(session?.role);
  return { session, role };
}

export function requireAdminPaymentAccess(req: NextRequest, financeOnly = false) {
  const { session, role } = readAdminPaymentSession(req);
  if (!session || !role) {
    return { allowed: false, session: null, role: null, status: 401, error: "Accès réservé à l’administration SABLIN PHARMA." };
  }
  const allowed = financeOnly
    ? role === "FINANCE_ADMIN" || role === "SUPER_ADMIN"
    : ["ADMIN", "FINANCE_ADMIN", "SUPER_ADMIN", "SUPPORT_ADMIN"].includes(role);
  if (!allowed) {
    return {
      allowed: false,
      session,
      role,
      status: 403,
      error: financeOnly
        ? "Action réservée à un administrateur finance ou super administrateur."
        : "Permission paiement insuffisante.",
    };
  }
  return { allowed: true, session, role, status: 200, error: null };
}

export async function listPaymentSecurityDashboard() {
  const [payments, total, success, pending, failed, expired, suspicious, manualReview] = await Promise.all([
    db.payment.findMany({ orderBy: { createdAt: "desc" }, take: 80, include: { user: { select: { name: true, email: true, phone: true } } } }),
    db.payment.count(),
    db.payment.count({ where: { status: "SUCCESS" } }),
    db.payment.count({ where: { status: { in: ["INITIATED", "PENDING", "PROCESSING"] } } }),
    db.payment.count({ where: { status: { in: ["FAILED", "CANCELLED", "REJECTED"] } } }),
    db.payment.count({ where: { status: "EXPIRED" } }),
    db.payment.count({ where: { OR: [{ status: "SUSPICIOUS" }, { riskStatus: { in: ["Suspect", "Bloqué"] } }] } }),
    db.payment.count({ where: { status: "MANUAL_REVIEW" } }),
  ]);
  return {
    summary: { total, success, pending, failed, expired, suspicious, manualReview },
    payments: payments.map((payment) => ({
      id: payment.id,
      reference: payment.reference,
      providerReference: payment.providerReference,
      user: payment.user?.name ?? payment.user?.phone ?? payment.user?.email ?? "Utilisateur inconnu",
      amount: payment.amount,
      productType: payment.productType,
      expectedCredits: payment.expectedCredits,
      provider: payment.provider,
      status: payment.status,
      statusLabel: PAYMENT_STATUS_LABELS[payment.status as PaymentStatus] ?? payment.status,
      riskStatus: payment.riskStatus,
      riskReasons: payment.riskReasons,
      createdAt: payment.createdAt,
      expiresAt: payment.expiresAt,
    })),
  };
}

export async function markPaymentManualReview(reference: string, reason: string, actor: ProfessionalSession) {
  const payment = await db.payment.update({
    where: { reference },
    data: {
      status: "MANUAL_REVIEW",
      riskStatus: "À surveiller",
      manualReviewReason: reason,
      riskReasons: reason,
    },
  });
  await writeAudit({
    action: "payment-manual-review",
    entityId: reference,
    actor,
    newValue: { status: "MANUAL_REVIEW", reason },
  });
  await notifyAdmins("Paiement en vérification manuelle", `${reference} : ${reason}`);
  return payment;
}

export async function refundPayment(reference: string, actor: ProfessionalSession, reason: string) {
  return db.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { reference } });
    if (!payment) return { ok: false, message: "Paiement introuvable." };
    if (payment.status === "REFUNDED") return { ok: false, message: "Paiement déjà remboursé." };
    if (payment.status !== "SUCCESS") return { ok: false, message: "Seul un paiement confirmé peut être remboursé." };

    const user = payment.userId
      ? await tx.user.findUnique({ where: { id: payment.userId }, select: { credits: true } })
      : null;
    if (!payment.userId || !user) return { ok: false, message: "Utilisateur introuvable." };

    let balanceAfter = user.credits;
    if (payment.productType === "credit_pack") {
      if (user.credits < payment.expectedCredits) {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: "MANUAL_REVIEW", riskStatus: "À surveiller", riskReasons: "Remboursement demandé mais crédits déjà consommés." },
        });
        return { ok: false, message: "Crédits déjà consommés. Vérification manuelle requise." };
      }
      balanceAfter = user.credits - payment.expectedCredits;
      await tx.user.update({ where: { id: payment.userId }, data: { credits: balanceAfter } });
      await tx.creditTransaction.create({
        data: {
          userId: payment.userId,
          type: "refund",
          amount: -payment.expectedCredits,
          description: `Remboursement paiement ${reference}`,
          fcfaEquivalent: payment.amount,
          balanceBefore: user.credits,
          balanceAfter,
          status: "réussi",
          reference,
          source: "admin_refund",
          paymentId: payment.id,
        },
      });
    } else if (payment.productType === "pass_ordonnance") {
      await tx.passOrdonnance.updateMany({
        where: { paymentReference: reference, status: { in: ["active", "linked"] } },
        data: { active: false, status: "cancelled" },
      });
    }

    const updated = await tx.payment.update({
      where: { id: payment.id },
      data: { status: "REFUNDED", refundedAt: new Date() },
    });
    await tx.auditLog.create({
      data: {
        platform: "admin",
        action: "payment-refund",
        entityType: "payment",
        entityId: reference,
        actorAccountId: actor.accountId,
        actorName: actor.name,
        actorRole: actor.role,
        result: "réussi",
        oldValue: JSON.stringify({ status: payment.status, balanceBefore: user.credits }),
        newValue: JSON.stringify({ status: "REFUNDED", balanceAfter }),
        comment: reason,
      },
    });
    await notifyUser(payment.userId, "Remboursement effectué", `Le paiement ${reference} a été remboursé.`, "warning");
    return { ok: true, payment: updated };
  });
}
