import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { FCFA_PER_CREDIT, FEATURE_RESTRICTIONS, type FeatureKey } from "@/lib/restrictions";
import { RestrictionError } from "@/lib/restrictions-server";

export type AdvancedFeatureKey =
  | "seeMedicationPharmacies"
  | "seeDetailedPrices"
  | "addMedicationToPrescription"
  | "comparePharmacies"
  | "comparePharmacyPrices"
  | "seePharmacyInventory"
  | "seePharmacyContact"
  | "callPharmacy"
  | "whatsappPharmacy"
  | "advicePharmacy"
  | "confirmAvailability"
  | "confirmPrice"
  | "confirmFull"
  | "alertAvailability";

const FEATURE_LABELS: Record<AdvancedFeatureKey, { name: string; cost: number; description: string }> = {
  seeMedicationPharmacies: {
    name: FEATURE_RESTRICTIONS.seeMedicationPharmacies.name,
    cost: FEATURE_RESTRICTIONS.seeMedicationPharmacies.creditCost,
    description: "Voir les pharmacies qui possèdent réellement ce médicament.",
  },
  seeDetailedPrices: {
    name: FEATURE_RESTRICTIONS.seeDetailedPrices.name,
    cost: FEATURE_RESTRICTIONS.seeDetailedPrices.creditCost,
    description: "Voir les prix détaillés par pharmacie.",
  },
  addMedicationToPrescription: {
    name: FEATURE_RESTRICTIONS.addMedicationToPrescription.name,
    cost: FEATURE_RESTRICTIONS.addMedicationToPrescription.creditCost,
    description: "Ajouter ce médicament à une ordonnance.",
  },
  comparePharmacies: {
    name: FEATURE_RESTRICTIONS.comparePharmacies.name,
    cost: 2,
    description: "Comparer les pharmacies selon disponibilité, prix et distance.",
  },
  comparePharmacyPrices: {
    name: FEATURE_RESTRICTIONS.comparePharmacyPrices.name,
    cost: FEATURE_RESTRICTIONS.comparePharmacyPrices.creditCost,
    description: "Comparer les prix dans les pharmacies.",
  },
  seePharmacyInventory: {
    name: "Voir les médicaments disponibles dans cette pharmacie",
    cost: 1,
    description: "Voir l’inventaire public contrôlé de cette pharmacie.",
  },
  seePharmacyContact: {
    name: FEATURE_RESTRICTIONS.seePharmacyContact.name,
    cost: FEATURE_RESTRICTIONS.seePharmacyContact.creditCost,
    description: "Voir le contact complet d’une pharmacie.",
  },
  callPharmacy: {
    name: FEATURE_RESTRICTIONS.callPharmacy.name,
    cost: FEATURE_RESTRICTIONS.callPharmacy.creditCost,
    description: "Débloquer le bouton d’appel.",
  },
  whatsappPharmacy: {
    name: FEATURE_RESTRICTIONS.whatsappPharmacy.name,
    cost: FEATURE_RESTRICTIONS.whatsappPharmacy.creditCost,
    description: "Débloquer le contact WhatsApp.",
  },
  advicePharmacy: {
    name: FEATURE_RESTRICTIONS.advicePharmacy.name,
    cost: FEATURE_RESTRICTIONS.advicePharmacy.creditCost,
    description: "Demander conseil à une pharmacie.",
  },
  confirmAvailability: {
    name: FEATURE_RESTRICTIONS.confirmAvailability.name,
    cost: FEATURE_RESTRICTIONS.confirmAvailability.creditCost,
    description: "Confirmer une disponibilité avant déplacement.",
  },
  confirmPrice: {
    name: FEATURE_RESTRICTIONS.confirmPrice.name,
    cost: FEATURE_RESTRICTIONS.confirmPrice.creditCost,
    description: "Confirmer un prix avant déplacement.",
  },
  confirmFull: {
    name: FEATURE_RESTRICTIONS.confirmFull.name,
    cost: FEATURE_RESTRICTIONS.confirmFull.creditCost,
    description: "Confirmation complète médicament, prix et disponibilité.",
  },
  alertAvailability: {
    name: FEATURE_RESTRICTIONS.alertAvailability.name,
    cost: FEATURE_RESTRICTIONS.alertAvailability.creditCost,
    description: "Activer une alerte de disponibilité.",
  },
};

export function getAdvancedFeature(featureKey: AdvancedFeatureKey) {
  return FEATURE_LABELS[featureKey];
}

export function lockedFeaturePayload(input: {
  featureKey: AdvancedFeatureKey;
  isAuthenticated: boolean;
  balance?: number;
  isUnlocked?: boolean;
  message?: string;
}) {
  const feature = getAdvancedFeature(input.featureKey);
  const missingCredits = Math.max(0, feature.cost - (input.balance ?? 0));
  return {
    locked: !input.isUnlocked,
    requiresAuth: !input.isAuthenticated,
    requiresCredits: true,
    isUnlocked: Boolean(input.isUnlocked),
    featureKey: input.featureKey,
    cost: feature.cost,
    currentBalance: input.balance ?? 0,
    missingCredits,
    title: !input.isAuthenticated ? "Service avancé verrouillé" : missingCredits > 0 ? "Solde insuffisant" : "Service avancé verrouillé",
    message:
      input.message ??
      (!input.isAuthenticated
        ? "Connectez-vous et utilisez vos crédits SABLIN pour accéder à cette information."
        : missingCredits > 0
          ? "Vous devez recharger vos crédits pour continuer."
          : "Cette information nécessite des crédits SABLIN."),
    actions: !input.isAuthenticated
      ? ["Se connecter", "Recharger mes crédits", "Voir les tarifs"]
      : missingCredits > 0
        ? ["Recharger maintenant", "Acheter un Pass Ordonnance Unique — 500 FCFA", "Annuler"]
        : [`Débloquer — ${feature.cost} crédit${feature.cost > 1 ? "s" : ""}`],
  };
}

export async function getCurrentUserCreditAccess(input: {
  featureKey: AdvancedFeatureKey;
  entityType: string;
  entityId: string;
}) {
  const user = await getSessionUser();
  if (!user) {
    return {
      user: null,
      balance: 0,
      access: null,
      isUnlocked: false,
      locked: lockedFeaturePayload({ featureKey: input.featureKey, isAuthenticated: false }),
    };
  }

  const [fullUser, access] = await Promise.all([
    db.user.findUnique({ where: { id: user.id }, select: { credits: true } }),
    db.userFeatureAccess.findFirst({
      where: {
        userId: user.id,
        featureKey: input.featureKey,
        entityType: input.entityType,
        entityId: input.entityId,
        status: "Actif",
        expiresAt: { gt: new Date() },
      },
      orderBy: { unlockedAt: "desc" },
    }),
  ]);

  const balance = fullUser?.credits ?? 0;
  const isUnlocked = Boolean(access);
  return {
    user,
    balance,
    access,
    isUnlocked,
    locked: lockedFeaturePayload({
      featureKey: input.featureKey,
      isAuthenticated: true,
      balance,
      isUnlocked,
    }),
  };
}

export async function unlockAdvancedFeature(input: {
  userId: string;
  featureKey: AdvancedFeatureKey;
  entityType: string;
  entityId: string;
  idempotencyKey?: string | null;
}) {
  const feature = getAdvancedFeature(input.featureKey);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  if (input.idempotencyKey) {
    const duplicate = await db.userFeatureAccess.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (duplicate && duplicate.userId === input.userId && duplicate.expiresAt > new Date() && duplicate.status === "Actif") {
      const balance = await db.user.findUnique({ where: { id: input.userId }, select: { credits: true } });
      return { reused: true, access: duplicate, balance: balance?.credits ?? 0, transaction: null };
    }
  }

  const result = await db.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: input.userId },
      select: { credits: true },
    });
    const balanceBefore = user?.credits ?? 0;
    if (balanceBefore < feature.cost) {
      await tx.creditTransaction.create({
        data: {
          userId: input.userId,
          type: "debit",
          amount: 0,
          description: `${feature.name} — solde insuffisant`,
          fcfaEquivalent: feature.cost * FCFA_PER_CREDIT,
          balanceBefore,
          balanceAfter: balanceBefore,
          status: "échoué",
        },
      });
      throw new RestrictionError("Solde insuffisant", 402, {
        balance: balanceBefore,
        needed: feature.cost,
        missingCredits: feature.cost - balanceBefore,
      });
    }

    const balanceAfter = balanceBefore - feature.cost;
    await tx.user.update({
      where: { id: input.userId },
      data: { credits: balanceAfter },
    });
    const transaction = await tx.creditTransaction.create({
      data: {
        userId: input.userId,
        type: "debit",
        amount: -feature.cost,
        description: feature.name,
        fcfaEquivalent: feature.cost * FCFA_PER_CREDIT,
        balanceBefore,
        balanceAfter,
        status: "réussi",
        source: "credit-gate",
      },
    });
    const access = await tx.userFeatureAccess.create({
      data: {
        userId: input.userId,
        featureKey: input.featureKey,
        entityType: input.entityType,
        entityId: input.entityId,
        creditCost: feature.cost,
        fcfaEquivalent: feature.cost * FCFA_PER_CREDIT,
        transactionId: transaction.id,
        idempotencyKey: input.idempotencyKey || null,
        expiresAt,
      },
    });

    return { access, transaction, balance: balanceAfter };
  });

  return { reused: false, ...result };
}

export function restrictionFeatureToAdvanced(featureKey: FeatureKey | AdvancedFeatureKey): AdvancedFeatureKey {
  return featureKey as AdvancedFeatureKey;
}

