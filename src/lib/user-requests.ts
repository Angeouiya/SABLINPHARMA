import { db } from "@/lib/db";
import { isOpenNow } from "@/lib/format";
import {
  CONTACT_UNLOCK_DURATION_HOURS,
  CREDIT_FCFA_VALUE,
  DISPUTE_WINDOW_HOURS,
  getUserService,
  serviceExpirationDate,
  type UserServiceId,
} from "@/config/user-services";

export class UserRequestError extends Error {
  status: number;
  details?: Record<string, unknown>;

  constructor(message: string, status = 400, details?: Record<string, unknown>) {
    super(message);
    this.name = "UserRequestError";
    this.status = status;
    this.details = details;
  }
}

export const REQUEST_RESPONSE_STATUSES = ["Disponible", "Stock faible", "Rupture", "À confirmer"] as const;

function addHours(base: Date, hours: number) {
  return new Date(base.getTime() + hours * 60 * 60 * 1000);
}

function referenceNumber() {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `SP-REQ-${year}-${random}`;
}

async function uniqueReference(tx: Pick<typeof db, "pharmacyRequest">) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const reference = referenceNumber();
    const existing = await tx.pharmacyRequest.findUnique({ where: { reference } });
    if (!existing) return reference;
  }
  return `SP-REQ-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
}

function assertService(serviceId: string) {
  const service = getUserService(serviceId);
  if (!service || !service.active) {
    throw new UserRequestError("Service indisponible.", 400);
  }
  return service;
}

async function assertPharmacyAvailable(pharmacyId: string) {
  const pharmacy = await db.pharmacy.findUnique({ where: { id: pharmacyId } });
  if (!pharmacy) throw new UserRequestError("Pharmacie introuvable.", 404);
  if (pharmacy.accountStatus !== "Validée" || pharmacy.publicationStatus !== "Publiée") {
    throw new UserRequestError("Cette pharmacie ne peut pas recevoir de demandes payantes.", 403);
  }
  return {
    pharmacy,
    closedWarning: !isOpenNow(pharmacy)
      ? "Cette pharmacie est actuellement fermée. La réponse peut être retardée."
      : null,
  };
}

export function serializeRequest(request: {
  id: string;
  reference: string;
  requestType: string;
  serviceName: string;
  status: string;
  priority: string;
  creditCost: number;
  fcfaEquivalent: number;
  userMessage?: string | null;
  requestedQuantity?: string | null;
  dosage?: string | null;
  form?: string | null;
  packaging?: string | null;
  preferredResponse?: string | null;
  createdAt: Date;
  expiresAt: Date;
  respondedAt?: Date | null;
  closedAt?: Date | null;
  pharmacy?: { name: string; slug: string; commune: string; district?: string | null } | null;
  medication?: { name: string; slug: string; dosage: string; form: string; packSize?: string | null } | null;
  user?: { name: string; commune?: string | null } | null;
  responses?: Array<{
    id: string;
    responderName?: string | null;
    responderRole: string;
    availabilityStatus?: string | null;
    confirmedPrice?: number | null;
    packaging?: string | null;
    responseMessage: string;
    validUntil?: Date | null;
    dataSource: string;
    createdAt: Date;
  }>;
  history?: Array<{
    previousStatus?: string | null;
    newStatus: string;
    changedBy?: string | null;
    changedByRole?: string | null;
    reason?: string | null;
    createdAt: Date;
  }>;
  disputes?: Array<{ id: string; reason: string; status: string; createdAt: Date; resolvedAt?: Date | null }>;
  refunds?: Array<{ id: string; creditAmount: number; reason: string; status: string; createdAt: Date; completedAt?: Date | null }>;
}) {
  return {
    id: request.id,
    reference: request.reference,
    requestType: request.requestType,
    serviceName: request.serviceName,
    status: request.status,
    priority: request.priority,
    creditCost: request.creditCost,
    fcfaEquivalent: request.fcfaEquivalent,
    userMessage: request.userMessage,
    requestedQuantity: request.requestedQuantity,
    dosage: request.dosage,
    form: request.form,
    packaging: request.packaging,
    preferredResponse: request.preferredResponse,
    createdAt: request.createdAt,
    expiresAt: request.expiresAt,
    respondedAt: request.respondedAt,
    closedAt: request.closedAt,
    pharmacy: request.pharmacy,
    medication: request.medication,
    user: request.user ? { name: request.user.name.split(" ")[0], commune: request.user.commune } : null,
    responses: request.responses ?? [],
    history: request.history ?? [],
    disputes: request.disputes ?? [],
    refunds: request.refunds ?? [],
  };
}

export async function createContactUnlock(input: {
  userId: string;
  pharmacySlug: string;
  unlockType: "see_contact" | "call_pharmacy" | "whatsapp_pharmacy";
  idempotencyKey?: string | null;
}) {
  const service = assertService(input.unlockType);
  const pharmacy = await db.pharmacy.findUnique({ where: { slug: input.pharmacySlug } });
  if (!pharmacy) throw new UserRequestError("Pharmacie introuvable.", 404);
  if (pharmacy.accountStatus !== "Validée" || pharmacy.publicationStatus !== "Publiée") {
    throw new UserRequestError("Cette pharmacie ne peut pas recevoir de demandes payantes.", 403);
  }

  const now = new Date();
  const existing = await db.contactUnlock.findFirst({
    where: {
      userId: input.userId,
      pharmacyId: pharmacy.id,
      unlockType: input.unlockType,
      status: "Actif",
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: "desc" },
  });
  if (existing) {
    return {
      reused: true,
      unlock: existing,
      balance: null,
      contact: {
        phone: pharmacy.phone,
        whatsapp: pharmacy.whatsapp,
        expiresAt: existing.expiresAt,
      },
    };
  }

  if (input.idempotencyKey) {
    const duplicate = await db.contactUnlock.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
    if (duplicate) {
      return {
        reused: true,
        unlock: duplicate,
        balance: null,
        contact: { phone: pharmacy.phone, whatsapp: pharmacy.whatsapp, expiresAt: duplicate.expiresAt },
      };
    }
  }

  return db.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: input.userId }, select: { credits: true, name: true } });
    const balanceBefore = user?.credits ?? 0;
    if (balanceBefore < service.creditCost) {
      await tx.creditTransaction.create({
        data: {
          userId: input.userId,
          type: "debit",
          amount: 0,
          description: `${service.publicName} — solde insuffisant`,
          fcfaEquivalent: service.fcfaEquivalent,
          balanceBefore,
          balanceAfter: balanceBefore,
          status: "échoué",
        },
      });
      throw new UserRequestError("Solde insuffisant", 402, {
        balance: balanceBefore,
        needed: service.creditCost,
        missingCredits: service.creditCost - balanceBefore,
      });
    }
    const balanceAfter = balanceBefore - service.creditCost;
    await tx.user.update({ where: { id: input.userId }, data: { credits: balanceAfter } });
    const transaction = await tx.creditTransaction.create({
      data: {
        userId: input.userId,
        type: "debit",
        amount: -service.creditCost,
        description: `${service.publicName} — ${pharmacy.name}`,
        fcfaEquivalent: service.fcfaEquivalent,
        balanceBefore,
        balanceAfter,
        status: "réussi",
      },
    });
    const unlock = await tx.contactUnlock.create({
      data: {
        userId: input.userId,
        pharmacyId: pharmacy.id,
        unlockType: input.unlockType,
        creditCost: service.creditCost,
        fcfaEquivalent: service.fcfaEquivalent,
        transactionId: transaction.id,
        idempotencyKey: input.idempotencyKey || null,
        expiresAt: addHours(now, CONTACT_UNLOCK_DURATION_HOURS),
      },
    });
    await tx.notification.create({
      data: {
        userId: input.userId,
        type: "success",
        title: "Contact pharmacie débloqué",
        message: `${service.publicName} pour ${pharmacy.name}. Contact disponible pendant ${CONTACT_UNLOCK_DURATION_HOURS}h.`,
        icon: "CheckCircle2",
        link: "pharmacies",
      },
    });
    await tx.professionalActionLog.create({
      data: {
        scope: "user",
        action: "contact-unlock",
        label: service.publicName,
        entityType: "contact-unlock",
        entityId: unlock.id,
        pharmacyId: pharmacy.id,
        pharmacySlug: pharmacy.slug,
        actorRole: "Utilisateur",
        status: "réussi",
        message: "Contact débloqué après débit serveur.",
        details: JSON.stringify({ transactionId: transaction.id, balanceBefore, balanceAfter }),
      },
    });
    return {
      reused: false,
      unlock,
      balance: balanceAfter,
      transaction,
      contact: { phone: pharmacy.phone, whatsapp: pharmacy.whatsapp, expiresAt: unlock.expiresAt },
    };
  });
}

export async function createManualPharmacyRequest(input: {
  userId: string;
  pharmacyId: string;
  medicationId?: string | null;
  prescriptionId?: string | null;
  requestType: UserServiceId;
  userMessage?: string | null;
  requestedQuantity?: string | null;
  dosage?: string | null;
  form?: string | null;
  packaging?: string | null;
  preferredResponse?: string | null;
  idempotencyKey?: string | null;
}) {
  const service = assertService(input.requestType);
  if (service.immediate) {
    throw new UserRequestError("Ce service immédiat doit passer par le déblocage contact.", 400);
  }
  if (service.requiresMedication && !input.medicationId) {
    throw new UserRequestError("Médicament obligatoire pour cette demande.", 400);
  }
  if (service.requiresPrescription && !input.prescriptionId) {
    throw new UserRequestError("Ordonnance obligatoire pour cette demande.", 400);
  }
  const availability = await assertPharmacyAvailable(input.pharmacyId);

  if (input.idempotencyKey) {
    const duplicate = await db.pharmacyRequest.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: {
        pharmacy: { select: { name: true, slug: true, commune: true, district: true } },
        medication: { select: { name: true, slug: true, dosage: true, form: true, packSize: true } },
        responses: true,
        history: true,
      },
    });
    if (duplicate) return { request: serializeRequest(duplicate), reused: true, balance: null, warning: availability.closedWarning };
  }

  return db.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: input.userId }, select: { credits: true, name: true } });
    const balanceBefore = user?.credits ?? 0;
    if (balanceBefore < service.creditCost) {
      await tx.creditTransaction.create({
        data: {
          userId: input.userId,
          type: "debit",
          amount: 0,
          description: `${service.publicName} — solde insuffisant`,
          fcfaEquivalent: service.fcfaEquivalent,
          balanceBefore,
          balanceAfter: balanceBefore,
          status: "échoué",
        },
      });
      throw new UserRequestError("Solde insuffisant", 402, {
        balance: balanceBefore,
        needed: service.creditCost,
        missingCredits: service.creditCost - balanceBefore,
      });
    }
    const balanceAfter = balanceBefore - service.creditCost;
    const reference = await uniqueReference(tx);
    await tx.user.update({ where: { id: input.userId }, data: { credits: balanceAfter } });
    const transaction = await tx.creditTransaction.create({
      data: {
        userId: input.userId,
        type: "debit",
        amount: -service.creditCost,
        description: `${service.publicName} — ${availability.pharmacy.name}`,
        fcfaEquivalent: service.fcfaEquivalent,
        balanceBefore,
        balanceAfter,
        status: "réussi",
      },
    });
    const expiresAt = serviceExpirationDate(service.id);
    const request = await tx.pharmacyRequest.create({
      data: {
        reference,
        userId: input.userId,
        pharmacyId: input.pharmacyId,
        medicationId: input.medicationId || null,
        prescriptionId: input.prescriptionId || null,
        requestType: service.id,
        serviceName: service.publicName,
        status: "Nouvelle",
        priority: service.id === "confirm_full" ? "Haute" : "Normale",
        userMessage: input.userMessage?.trim() || null,
        requestedQuantity: input.requestedQuantity?.trim() || null,
        dosage: input.dosage?.trim() || null,
        form: input.form?.trim() || null,
        packaging: input.packaging?.trim() || null,
        preferredResponse: input.preferredResponse || "Notification SABLIN",
        creditCost: service.creditCost,
        fcfaEquivalent: service.fcfaEquivalent,
        transactionId: transaction.id,
        idempotencyKey: input.idempotencyKey || null,
        expiresAt,
        refundEligible: service.refundable,
        disputeAllowedUntil: addHours(expiresAt, DISPUTE_WINDOW_HOURS),
      },
    });
    await tx.requestStatusHistory.create({
      data: {
        requestId: request.id,
        previousStatus: "Paiement en attente",
        newStatus: "Nouvelle",
        changedBy: user?.name ?? "Utilisateur",
        changedByRole: "Utilisateur",
        reason: "Paiement confirmé et demande transmise à la pharmacie.",
      },
    });
    await tx.notification.create({
      data: {
        userId: input.userId,
        type: "success",
        title: "Demande créée",
        message: `Votre demande ${reference} a été transmise à ${availability.pharmacy.name}.`,
        icon: "CheckCircle2",
        link: "requests",
      },
    });
    await tx.professionalActionLog.create({
      data: {
        scope: "pharmacy",
        action: "user-request-created",
        label: service.publicName,
        entityType: "pharmacy-request",
        entityId: request.id,
        pharmacyId: availability.pharmacy.id,
        pharmacySlug: availability.pharmacy.slug,
        actorRole: "Utilisateur",
        status: "réussi",
        message: `Nouvelle demande utilisateur ${reference}.`,
        details: JSON.stringify({ transactionId: transaction.id, balanceBefore, balanceAfter }),
      },
    });
    const loaded = await tx.pharmacyRequest.findUniqueOrThrow({
      where: { id: request.id },
      include: {
        pharmacy: { select: { name: true, slug: true, commune: true, district: true } },
        medication: { select: { name: true, slug: true, dosage: true, form: true, packSize: true } },
        responses: true,
        history: true,
      },
    });
    return {
      request: serializeRequest(loaded),
      reused: false,
      balance: balanceAfter,
      transaction,
      warning: availability.closedWarning,
    };
  });
}

export async function addRequestHistory(input: {
  requestId: string;
  previousStatus?: string | null;
  newStatus: string;
  changedBy?: string | null;
  changedByRole?: string | null;
  reason?: string | null;
}) {
  return db.requestStatusHistory.create({
    data: {
      requestId: input.requestId,
      previousStatus: input.previousStatus ?? null,
      newStatus: input.newStatus,
      changedBy: input.changedBy ?? null,
      changedByRole: input.changedByRole ?? null,
      reason: input.reason ?? null,
    },
  });
}
