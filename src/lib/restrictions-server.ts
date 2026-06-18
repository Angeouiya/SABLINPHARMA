import { db } from "@/lib/db";
import {
  FCFA_PER_CREDIT,
  FEATURE_RESTRICTIONS,
  PASS_STATUSES,
  type FeatureKey,
} from "@/lib/restrictions";

export class RestrictionError extends Error {
  status: number;
  details?: Record<string, unknown>;

  constructor(message: string, status = 400, details?: Record<string, unknown>) {
    super(message);
    this.name = "RestrictionError";
    this.status = status;
    this.details = details;
  }
}

export async function debitCredits(userId: string, action: FeatureKey | string, cost: number) {
  if (!Number.isFinite(cost) || cost <= 0) {
    throw new RestrictionError("Montant invalide", 400);
  }

  const fullUser = await db.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });
  const balanceBefore = fullUser?.credits ?? 0;
  const feature = FEATURE_RESTRICTIONS[action as FeatureKey];
  const description = feature?.name ?? action;

  if (balanceBefore < cost) {
    await db.creditTransaction.create({
      data: {
        userId,
        type: "debit",
        amount: 0,
        description: `${description} — solde insuffisant`,
        fcfaEquivalent: cost * FCFA_PER_CREDIT,
        balanceBefore,
        balanceAfter: balanceBefore,
        status: "échoué",
      },
    });
    throw new RestrictionError("Solde insuffisant", 402, {
      balance: balanceBefore,
      needed: cost,
      missingCredits: cost - balanceBefore,
    });
  }

  const balanceAfter = balanceBefore - cost;

  const [updatedUser, transaction] = await db.$transaction([
    db.user.update({
      where: { id: userId },
      data: { credits: balanceAfter },
      select: { credits: true },
    }),
    db.creditTransaction.create({
      data: {
        userId,
        type: "debit",
        amount: -cost,
        description,
        fcfaEquivalent: cost * FCFA_PER_CREDIT,
        balanceBefore,
        balanceAfter,
        status: "réussi",
      },
    }),
  ]);

  return {
    success: true,
    balance: updatedUser.credits,
    balanceBefore,
    balanceAfter,
    transaction,
  };
}

export async function validatePassOrdonnance(userId: string, ordonnanceId?: string) {
  const pass = await db.passOrdonnance.findFirst({
    where: {
      userId,
      status: { in: ["active", "linked"] },
      active: true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!pass) {
    return {
      allowed: false,
      status: "none" as const,
      label: PASS_STATUSES.none,
      message: "Aucun Pass Ordonnance Unique actif.",
      pass: null,
    };
  }

  if (pass.status === "expired" || pass.status === "used" || !pass.active) {
    return {
      allowed: false,
      status: pass.status,
      label: PASS_STATUSES.expired,
      message: "Ce Pass Ordonnance Unique est expiré.",
      pass,
    };
  }

  if (pass.ordonnanceId && ordonnanceId && pass.ordonnanceId !== ordonnanceId) {
    return {
      allowed: false,
      status: "linked" as const,
      label: PASS_STATUSES.linked,
      message: "Ce Pass Ordonnance Unique est déjà lié à une autre ordonnance.",
      pass,
    };
  }

  if (ordonnanceId && !pass.ordonnanceId) {
    const linkedPass = await db.passOrdonnance.update({
      where: { id: pass.id },
      data: { status: "linked", ordonnanceId },
    });
    return {
      allowed: true,
      status: "linked" as const,
      label: PASS_STATUSES.linked,
      message: "Pass Ordonnance Unique lié à cette ordonnance.",
      pass: linkedPass,
    };
  }

  return {
    allowed: true,
    status: pass.status as "active" | "linked",
    label: pass.status === "linked" ? PASS_STATUSES.linked : PASS_STATUSES.active,
    message: "Pass Ordonnance Unique valide.",
    pass,
  };
}

export async function expirePassOrdonnance(userId: string, ordonnanceId?: string) {
  const validation = await validatePassOrdonnance(userId, ordonnanceId);
  if (!validation.pass || !validation.allowed) {
    return validation;
  }

  const pass = await db.passOrdonnance.update({
    where: { id: validation.pass.id },
    data: {
      active: false,
      status: "expired",
      usedAt: new Date(),
      ordonnanceId: validation.pass.ordonnanceId ?? ordonnanceId,
    },
  });

  const fullUser = await db.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });
  const balance = fullUser?.credits ?? 0;

  await db.creditTransaction.create({
    data: {
      userId,
      type: "pass",
      amount: 0,
      description: "Pass Ordonnance Unique utilisé puis expiré",
      fcfaEquivalent: 0,
      balanceBefore: balance,
      balanceAfter: balance,
      status: "réussi",
    },
  });

  return {
    allowed: false,
    status: "expired" as const,
    label: PASS_STATUSES.expired,
    message: "Pass Ordonnance Unique expiré.",
    pass,
  };
}
