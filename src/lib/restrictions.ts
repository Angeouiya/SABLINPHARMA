export const FCFA_PER_CREDIT = 100;
export const PASS_ORDONNANCE_PRICE = 500;

export const CREDIT_PACKS = [
  { amount: 200, credits: 2, label: "Pack Découverte", popular: false },
  { amount: 500, credits: 6, label: "Pack Standard", popular: true },
  { amount: 1000, credits: 13, label: "Pack Plus", popular: false },
  { amount: 2000, credits: 28, label: "Pack Famille", popular: false },
] as const;

export const PASS_ORDONNANCE_RULE =
  "Valable pour une seule ordonnance. Après estimation et comparaison des pharmacies, le pass expire automatiquement.";

export const PASS_STATUSES = {
  none: "Aucun pass",
  active: "Pass actif",
  linked: "Pass lié à une ordonnance",
  used: "Pass utilisé",
  expired: "Pass expiré",
} as const;

export type PassStatus = keyof typeof PASS_STATUSES;
export type AccessType = "free" | "credits" | "pass" | "credits_or_pass" | "locked";

export type FeatureKey =
  | "createAccount"
  | "login"
  | "searchMedication"
  | "viewMedicationInfo"
  | "viewMedicationCategories"
  | "searchPharmacy"
  | "viewPharmacyName"
  | "viewPharmacyCommune"
  | "viewPharmacyQuartier"
  | "viewPharmacyHours"
  | "viewPharmacyOpenStatus"
  | "viewPharmacyDutyStatus"
  | "viewProfile"
  | "accessHelp"
  | "viewPlatformInfo"
  | "seeMedicationPharmacies"
  | "seeDetailedPrices"
  | "addMedicationToPrescription"
  | "estimatePrescription"
  | "bestPharmacy"
  | "comparePharmacies"
  | "comparePharmacyPrices"
  | "seePharmacyContact"
  | "callPharmacy"
  | "whatsappPharmacy"
  | "advicePharmacy"
  | "confirmAvailability"
  | "confirmPrice"
  | "confirmFull"
  | "alertAvailability"
  | "buyPassOrdonnance"
  | "usePassOrdonnance";

export interface FeatureRestriction {
  key: FeatureKey;
  name: string;
  description: string;
  access: AccessType;
  creditCost: number;
  fcfaCost?: number;
  passAllowed?: boolean;
  lockedMessage: string;
  insufficientMessage: string;
  successMessage: string;
}

const freeFeature = (
  key: FeatureKey,
  name: string,
  description: string
): FeatureRestriction => ({
  key,
  name,
  description,
  access: "free",
  creditCost: 0,
  lockedMessage: "Cette fonctionnalité est gratuite.",
  insufficientMessage: "",
  successMessage: "Service disponible.",
});

const creditFeature = (
  key: FeatureKey,
  name: string,
  description: string,
  creditCost: number,
  passAllowed = false
): FeatureRestriction => ({
  key,
  name,
  description,
  access: passAllowed ? "credits_or_pass" : "credits",
  creditCost,
  passAllowed,
  lockedMessage: `${name} nécessite ${creditCost} crédit${creditCost > 1 ? "s" : ""}.`,
  insufficientMessage: "Vous devez recharger vos crédits pour continuer.",
  successMessage: `${name} débloqué avec succès.`,
});

export const FEATURE_RESTRICTIONS: Record<FeatureKey, FeatureRestriction> = {
  createAccount: freeFeature("createAccount", "Créer un compte", "Créer un compte utilisateur SABLIN PHARMA."),
  login: freeFeature("login", "Se connecter", "Accéder à son compte."),
  searchMedication: freeFeature("searchMedication", "Rechercher un médicament", "Recherche simple par nom, DCI ou dosage."),
  viewMedicationInfo: freeFeature("viewMedicationInfo", "Voir les informations générales d’un médicament", "Nom, DCI, dosage, forme, catégorie et prix indicatif général."),
  viewMedicationCategories: freeFeature("viewMedicationCategories", "Consulter les catégories de médicaments", "Parcourir les catégories disponibles."),
  searchPharmacy: freeFeature("searchPharmacy", "Rechercher une pharmacie", "Recherche simple par nom, commune ou quartier."),
  viewPharmacyName: freeFeature("viewPharmacyName", "Voir le nom d’une pharmacie", "Nom public de la pharmacie."),
  viewPharmacyCommune: freeFeature("viewPharmacyCommune", "Voir la commune", "Commune de la pharmacie."),
  viewPharmacyQuartier: freeFeature("viewPharmacyQuartier", "Voir le quartier", "Quartier ou repère général."),
  viewPharmacyHours: freeFeature("viewPharmacyHours", "Voir les horaires généraux", "Horaires généraux communiqués."),
  viewPharmacyOpenStatus: freeFeature("viewPharmacyOpenStatus", "Voir le statut ouvert ou fermé", "Statut indicatif d’ouverture."),
  viewPharmacyDutyStatus: freeFeature("viewPharmacyDutyStatus", "Voir si une pharmacie est de garde", "Statut pharmacie de garde."),
  viewProfile: freeFeature("viewProfile", "Consulter son profil", "Accéder aux informations du compte."),
  accessHelp: freeFeature("accessHelp", "Accéder à l’aide", "Consulter l’aide et le support."),
  viewPlatformInfo: freeFeature("viewPlatformInfo", "Consulter les informations générales de la plateforme", "Informations publiques SABLIN PHARMA."),
  seeMedicationPharmacies: creditFeature("seeMedicationPharmacies", "Voir les pharmacies qui possèdent réellement un médicament", "Liste des pharmacies avec disponibilité réelle.", 1),
  seeDetailedPrices: creditFeature("seeDetailedPrices", "Voir les prix détaillés par pharmacie", "Prix indicatifs détaillés selon les pharmacies.", 1),
  addMedicationToPrescription: creditFeature("addMedicationToPrescription", "Ajouter un médicament à une ordonnance", "Ajouter un médicament à l’ordonnance en cours.", 1, true),
  estimatePrescription: creditFeature("estimatePrescription", "Estimer l’ordonnance", "Obtenir le coût total estimatif et les pharmacies recommandées.", 2, true),
  bestPharmacy: creditFeature("bestPharmacy", "Trouver la meilleure pharmacie", "Identifier la pharmacie la plus pertinente.", 1, true),
  comparePharmacies: creditFeature("comparePharmacies", "Comparer les pharmacies", "Comparer les pharmacies par disponibilité et distance.", 1, true),
  comparePharmacyPrices: creditFeature("comparePharmacyPrices", "Comparer les prix dans les pharmacies", "Comparer les prix dans les pharmacies disponibles.", 1, true),
  seePharmacyContact: creditFeature("seePharmacyContact", "Voir le contact complet d’une pharmacie", "Débloquer le numéro complet de la pharmacie.", 1),
  callPharmacy: creditFeature("callPharmacy", "Appeler une pharmacie", "Débloquer le bouton d’appel direct.", 1),
  whatsappPharmacy: creditFeature("whatsappPharmacy", "WhatsApp pharmacie", "Débloquer le contact WhatsApp.", 1),
  advicePharmacy: creditFeature("advicePharmacy", "Demander conseil à une pharmacie", "Envoyer une demande de conseil.", 2),
  confirmAvailability: creditFeature("confirmAvailability", "Confirmer une disponibilité", "Confirmer le stock avant déplacement.", 3),
  confirmPrice: creditFeature("confirmPrice", "Confirmer un prix", "Confirmer le prix avant déplacement.", 3),
  confirmFull: creditFeature("confirmFull", "Confirmation complète médicament + prix + disponibilité", "Vérification complète avant déplacement.", 4),
  alertAvailability: creditFeature("alertAvailability", "Activer une alerte de disponibilité", "Recevoir une alerte de retour en stock.", 1),
  buyPassOrdonnance: {
    key: "buyPassOrdonnance",
    name: "Acheter un Pass Ordonnance Unique",
    description: PASS_ORDONNANCE_RULE,
    access: "pass",
    creditCost: 0,
    fcfaCost: PASS_ORDONNANCE_PRICE,
    lockedMessage: "Achetez un Pass Ordonnance Unique pour traiter une seule ordonnance.",
    insufficientMessage: "Le paiement du Pass Ordonnance Unique est requis.",
    successMessage: "Pass Ordonnance Unique acheté.",
  },
  usePassOrdonnance: {
    key: "usePassOrdonnance",
    name: "Continuer avec mon Pass Ordonnance",
    description: PASS_ORDONNANCE_RULE,
    access: "pass",
    creditCost: 0,
    fcfaCost: PASS_ORDONNANCE_PRICE,
    lockedMessage: "Aucun Pass Ordonnance Unique actif.",
    insufficientMessage: "Achetez un Pass Ordonnance Unique ou utilisez vos crédits SABLIN.",
    successMessage: "Pass Ordonnance Unique utilisé.",
  },
};

export const CREDIT_COSTS = {
  seePharmacies: FEATURE_RESTRICTIONS.seeMedicationPharmacies.creditCost,
  seePrices: FEATURE_RESTRICTIONS.seeDetailedPrices.creditCost,
  estimatePrescription: FEATURE_RESTRICTIONS.estimatePrescription.creditCost,
  bestPharmacy: FEATURE_RESTRICTIONS.bestPharmacy.creditCost,
  comparePharmacies: FEATURE_RESTRICTIONS.comparePharmacies.creditCost,
  alertAvailability: FEATURE_RESTRICTIONS.alertAvailability.creditCost,
  confirmBeforeVisit: FEATURE_RESTRICTIONS.confirmAvailability.creditCost,
  seeContact: FEATURE_RESTRICTIONS.seePharmacyContact.creditCost,
  callPharmacy: FEATURE_RESTRICTIONS.callPharmacy.creditCost,
  whatsappPharmacy: FEATURE_RESTRICTIONS.whatsappPharmacy.creditCost,
  advicePharmacy: FEATURE_RESTRICTIONS.advicePharmacy.creditCost,
  confirmAvailability: FEATURE_RESTRICTIONS.confirmAvailability.creditCost,
  confirmPrice: FEATURE_RESTRICTIONS.confirmPrice.creditCost,
  confirmFull: FEATURE_RESTRICTIONS.confirmFull.creditCost,
} as const;

export const FREE_FEATURES = Object.values(FEATURE_RESTRICTIONS)
  .filter((feature) => feature.access === "free")
  .map((feature) => feature.name);

export const PAID_FEATURES = Object.values(FEATURE_RESTRICTIONS)
  .filter((feature) => feature.access !== "free")
  .map((feature) => ({
    label: feature.name,
    cost: feature.creditCost,
    desc: feature.description,
    isPass: feature.key === "buyPassOrdonnance" || feature.key === "usePassOrdonnance",
  }));

export interface AccessSubject {
  credits?: number | null;
  hasPass?: boolean | null;
  passStatus?: PassStatus | null;
}

export function canAccessFeature(user: AccessSubject | null | undefined, featureKey: FeatureKey) {
  const feature = FEATURE_RESTRICTIONS[featureKey];
  const currentBalance = user?.credits ?? 0;
  const hasValidPass =
    Boolean(user?.hasPass) &&
    (user?.passStatus === "active" || user?.passStatus === "linked" || !user?.passStatus);
  const requiresCredits = feature.access === "credits" || feature.access === "credits_or_pass";
  const requiresPass = feature.access === "pass";
  const passCanCover = feature.access === "credits_or_pass" && feature.passAllowed && hasValidPass;
  const missingCredits = Math.max(0, feature.creditCost - currentBalance);

  if (feature.access === "free") {
    return {
      allowed: true,
      reason: "free",
      cost: 0,
      requiresCredits: false,
      requiresPass: false,
      currentBalance,
      missingCredits: 0,
      message: feature.successMessage,
    };
  }

  if (requiresPass && hasValidPass) {
    return {
      allowed: true,
      reason: "pass",
      cost: 0,
      requiresCredits: false,
      requiresPass: true,
      currentBalance,
      missingCredits: 0,
      message: feature.successMessage,
    };
  }

  if (passCanCover) {
    return {
      allowed: true,
      reason: "pass",
      cost: 0,
      requiresCredits: false,
      requiresPass: false,
      currentBalance,
      missingCredits: 0,
      message: feature.successMessage,
    };
  }

  if (requiresCredits && currentBalance >= feature.creditCost) {
    return {
      allowed: true,
      reason: "credits",
      cost: feature.creditCost,
      requiresCredits: true,
      requiresPass: false,
      currentBalance,
      missingCredits: 0,
      message: feature.successMessage,
    };
  }

  return {
    allowed: false,
    reason: missingCredits > 0 ? "insufficient_credits" : "locked",
    cost: feature.creditCost,
    requiresCredits,
    requiresPass,
    currentBalance,
    missingCredits,
    message: missingCredits > 0 ? feature.insufficientMessage : feature.lockedMessage,
  };
}
