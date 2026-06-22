import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  PAYMENT_STATUS_LABELS,
  type PaymentStatus,
  requireAdminPaymentAccess,
} from "@/lib/payment-security";
import { writeAudit, notifySecurity } from "@/lib/professional-auth";

const RISK_STATUSES = ["Normal", "À surveiller", "Suspect", "Bloqué"] as const;

function startOfDay() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function paymentLabel(status: string) {
  return PAYMENT_STATUS_LABELS[status as PaymentStatus] ?? status;
}

function serializePayment(payment: Prisma.PaymentGetPayload<{ include: { user: { select: { id: true; name: true; email: true; phone: true; commune: true } } } }>) {
  return {
    id: payment.id,
    reference: payment.reference,
    providerReference: payment.providerReference,
    userId: payment.userId,
    user: payment.user?.name ?? payment.user?.phone ?? payment.user?.email ?? "Utilisateur inconnu",
    userContact: payment.user?.phone ?? payment.user?.email ?? null,
    commune: payment.user?.commune ?? null,
    amount: payment.amount,
    currency: payment.currency,
    method: payment.method,
    provider: payment.provider,
    productType: payment.productType,
    expectedCredits: payment.expectedCredits,
    passOrdonnance: payment.passOrdonnance,
    status: payment.status,
    statusLabel: paymentLabel(payment.status),
    riskStatus: payment.riskStatus,
    riskScore: payment.riskScore,
    riskReasons: payment.riskReasons,
    webhookSignatureValid: payment.webhookSignatureValid,
    idempotencyKey: payment.idempotencyKey,
    createdAt: payment.createdAt,
    expiresAt: payment.expiresAt,
    processedAt: payment.processedAt,
    verifiedAt: payment.verifiedAt,
    refundedAt: payment.refundedAt,
    manualReviewReason: payment.manualReviewReason,
    manualValidatedBy: payment.manualValidatedBy,
    manualValidatedAt: payment.manualValidatedAt,
  };
}

export async function GET(req: NextRequest) {
  const access = requireAdminPaymentAccess(req);
  if (!access.allowed) return NextResponse.json({ error: access.error }, { status: access.status });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const status = searchParams.get("status")?.trim() ?? "all";
  const risk = searchParams.get("risk")?.trim() ?? "all";
  const provider = searchParams.get("provider")?.trim() ?? "all";
  const productType = searchParams.get("productType")?.trim() ?? "all";
  const limit = Math.min(Number(searchParams.get("limit") ?? 120) || 120, 250);

  const where: Prisma.PaymentWhereInput = {
    ...(status !== "all" ? { status } : {}),
    ...(risk !== "all" ? { riskStatus: risk } : {}),
    ...(provider !== "all" ? { provider } : {}),
    ...(productType !== "all" ? { productType } : {}),
  };

  const [
    payments,
    total,
    today,
    success,
    pending,
    failed,
    expired,
    suspicious,
    manualReview,
    refunded,
    chargeback,
    alerts,
    audits,
  ] = await Promise.all([
    db.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { user: { select: { id: true, name: true, email: true, phone: true, commune: true } } },
    }),
    db.payment.count({ where }),
    db.payment.count({ where: { ...where, createdAt: { gte: startOfDay() } } }),
    db.payment.count({ where: { ...where, status: "SUCCESS" } }),
    db.payment.count({ where: { ...where, status: { in: ["INITIATED", "PENDING", "PROCESSING"] } } }),
    db.payment.count({ where: { ...where, status: { in: ["FAILED", "CANCELLED", "REJECTED"] } } }),
    db.payment.count({ where: { ...where, status: "EXPIRED" } }),
    db.payment.count({ where: { ...where, OR: [{ status: "SUSPICIOUS" }, { riskStatus: { in: ["Suspect", "Bloqué"] } }] } }),
    db.payment.count({ where: { ...where, status: "MANUAL_REVIEW" } }),
    db.payment.count({ where: { ...where, status: "REFUNDED" } }),
    db.payment.count({ where: { ...where, status: "CHARGEBACK" } }),
    db.securityNotification.findMany({
      where: {
        platform: "admin",
        type: { in: ["payment_security", "payment_suspicious", "payment_webhook_invalid", "security", "critical", "alert"] },
        status: { not: "archivée" },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    db.auditLog.findMany({
      where: {
        platform: "admin",
        OR: [
          { action: { contains: "payment" } },
          { entityType: "payment" },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  const rows = payments
    .map(serializePayment)
    .filter((payment) => {
      if (!q) return true;
      return [
        payment.reference,
        payment.providerReference,
        payment.user,
        payment.userContact,
        payment.provider,
        payment.status,
        payment.statusLabel,
        payment.riskStatus,
        payment.riskReasons,
        payment.productType,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });

  return NextResponse.json({
    rows,
    filters: {
      statuses: Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => ({ value, label })),
      risks: RISK_STATUSES,
      providers: ["paydunya", "wave", "orange", "mtn", "moov"],
      productTypes: [
        { value: "credit_pack", label: "Recharge crédits" },
        { value: "pass_ordonnance", label: "Pass Ordonnance Unique" },
        { value: "legacy", label: "Ancien paiement" },
      ],
    },
    summary: {
      total,
      today,
      success,
      pending,
      failed,
      expired,
      suspicious,
      manualReview,
      refunded,
      chargeback,
      visibleRows: rows.length,
    },
    alerts: alerts.map((item) => ({
      id: item.id,
      title: item.title,
      message: item.message,
      type: item.type,
      status: item.status,
      createdAt: item.createdAt,
    })),
    audits: audits.map((item) => ({
      id: item.id,
      action: item.action,
      entityId: item.entityId,
      actorName: item.actorName,
      actorRole: item.actorRole,
      result: item.result,
      comment: item.comment,
      createdAt: item.createdAt,
    })),
  });
}

export async function PATCH(req: NextRequest) {
  const access = requireAdminPaymentAccess(req);
  if (!access.allowed || !access.session) return NextResponse.json({ error: access.error }, { status: access.status });

  const body = await req.json().catch(() => ({}));
  const reference = String(body.reference ?? "").trim();
  const action = String(body.action ?? "").trim();
  const reason = String(body.reason ?? "").trim();
  if (!reference || !action) {
    return NextResponse.json({ error: "Référence et action obligatoires." }, { status: 400 });
  }
  if (reason.length < 8) {
    return NextResponse.json({ error: "Un motif clair est obligatoire pour toute action anti-fraude." }, { status: 400 });
  }

  const payment = await db.payment.findUnique({ where: { reference } });
  if (!payment) return NextResponse.json({ error: "Paiement introuvable." }, { status: 404 });

  if (action === "mark_suspicious") {
    const updated = await db.payment.update({
      where: { id: payment.id },
      data: {
        status: payment.status === "SUCCESS" || payment.status === "REFUNDED" ? payment.status : "SUSPICIOUS",
        riskStatus: "Suspect",
        riskScore: Math.max(payment.riskScore, 85),
        riskReasons: reason,
        manualReviewReason: reason,
      },
    });
    await writeAudit({
      req,
      platform: "admin",
      action: "payment-mark-suspicious",
      entityType: "payment",
      entityId: reference,
      actorAccountId: access.session.accountId,
      actorName: access.session.name,
      actorRole: access.session.role,
      oldValue: { status: payment.status, riskStatus: payment.riskStatus, riskScore: payment.riskScore },
      newValue: { status: updated.status, riskStatus: updated.riskStatus, riskScore: updated.riskScore, reason },
      comment: reason,
    });
    await notifySecurity({
      platform: "admin",
      recipientAccountId: access.session.accountId,
      type: "payment_suspicious",
      title: "Paiement marqué suspect",
      message: `${reference} : ${reason}`,
    });
    return NextResponse.json({
      success: true,
      payment: {
        reference: updated.reference,
        status: updated.status,
        riskStatus: updated.riskStatus,
        riskScore: updated.riskScore,
      },
    });
  }

  if (action === "add_note") {
    const updated = await db.payment.update({
      where: { id: payment.id },
      data: {
        manualReviewReason: reason,
        riskReasons: payment.riskReasons ? `${payment.riskReasons}\n${reason}` : reason,
      },
    });
    await writeAudit({
      req,
      platform: "admin",
      action: "payment-note",
      entityType: "payment",
      entityId: reference,
      actorAccountId: access.session.accountId,
      actorName: access.session.name,
      actorRole: access.session.role,
      newValue: { reason },
      comment: reason,
    });
    return NextResponse.json({
      success: true,
      payment: {
        reference: updated.reference,
        status: updated.status,
        riskStatus: updated.riskStatus,
      },
    });
  }

  return NextResponse.json({ error: "Action anti-fraude inconnue." }, { status: 400 });
}
