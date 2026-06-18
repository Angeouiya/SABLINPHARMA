export const CREDIT_FCFA_VALUE = 100;
export const CONTACT_UNLOCK_DURATION_HOURS = 24;
export const DISPUTE_WINDOW_HOURS = 48;

export const REQUEST_STATUSES = [
  "Brouillon",
  "Paiement en attente",
  "Nouvelle",
  "Reçue",
  "Acceptée",
  "En cours",
  "Réponse envoyée",
  "Répondue",
  "Expirée",
  "Refusée",
  "Annulée",
  "Litige",
  "Remboursée",
  "Partiellement remboursée",
  "Fermée",
] as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export type UserServiceId =
  | "see_contact"
  | "call_pharmacy"
  | "whatsapp_pharmacy"
  | "advice_pharmacy"
  | "confirm_availability"
  | "confirm_price"
  | "confirm_full"
  | "prescription_request";

export type UserServiceConfig = {
  id: UserServiceId;
  publicName: string;
  description: string;
  creditCost: number;
  fcfaEquivalent: number;
  expectedResponseMinutes: number;
  expirationMinutes: number;
  refundable: boolean;
  requiresPharmacy: boolean;
  requiresMedication: boolean;
  requiresPrescription: boolean;
  active: boolean;
  immediate: boolean;
};

export const USER_SERVICE_CONFIG: Record<UserServiceId, UserServiceConfig> = {
  see_contact: {
    id: "see_contact",
    publicName: "Voir le contact complet d’une pharmacie",
    description: "Affiche le contact professionnel verrouillé de la pharmacie après validation serveur.",
    creditCost: 1,
    fcfaEquivalent: 100,
    expectedResponseMinutes: 0,
    expirationMinutes: CONTACT_UNLOCK_DURATION_HOURS * 60,
    refundable: false,
    requiresPharmacy: true,
    requiresMedication: false,
    requiresPrescription: false,
    active: true,
    immediate: true,
  },
  call_pharmacy: {
    id: "call_pharmacy",
    publicName: "Débloquer le bouton Appeler",
    description: "Débloque un lien d’appel après débit confirmé.",
    creditCost: 1,
    fcfaEquivalent: 100,
    expectedResponseMinutes: 0,
    expirationMinutes: CONTACT_UNLOCK_DURATION_HOURS * 60,
    refundable: false,
    requiresPharmacy: true,
    requiresMedication: false,
    requiresPrescription: false,
    active: true,
    immediate: true,
  },
  whatsapp_pharmacy: {
    id: "whatsapp_pharmacy",
    publicName: "Débloquer WhatsApp",
    description: "Débloque le canal WhatsApp professionnel enregistré.",
    creditCost: 1,
    fcfaEquivalent: 100,
    expectedResponseMinutes: 0,
    expirationMinutes: CONTACT_UNLOCK_DURATION_HOURS * 60,
    refundable: false,
    requiresPharmacy: true,
    requiresMedication: false,
    requiresPrescription: false,
    active: true,
    immediate: true,
  },
  advice_pharmacy: {
    id: "advice_pharmacy",
    publicName: "Demander conseil à une pharmacie",
    description: "Envoie une demande courte à la pharmacie. Ce service ne remplace pas une consultation médicale.",
    creditCost: 2,
    fcfaEquivalent: 200,
    expectedResponseMinutes: 60,
    expirationMinutes: 240,
    refundable: true,
    requiresPharmacy: true,
    requiresMedication: false,
    requiresPrescription: false,
    active: true,
    immediate: false,
  },
  confirm_availability: {
    id: "confirm_availability",
    publicName: "Confirmer la disponibilité d’un médicament",
    description: "Demande à la pharmacie de confirmer la disponibilité avant déplacement.",
    creditCost: 3,
    fcfaEquivalent: 300,
    expectedResponseMinutes: 30,
    expirationMinutes: 180,
    refundable: true,
    requiresPharmacy: true,
    requiresMedication: true,
    requiresPrescription: false,
    active: true,
    immediate: false,
  },
  confirm_price: {
    id: "confirm_price",
    publicName: "Confirmer le prix d’un médicament",
    description: "Demande à la pharmacie de confirmer le prix indicatif affiché.",
    creditCost: 3,
    fcfaEquivalent: 300,
    expectedResponseMinutes: 30,
    expirationMinutes: 180,
    refundable: true,
    requiresPharmacy: true,
    requiresMedication: true,
    requiresPrescription: false,
    active: true,
    immediate: false,
  },
  confirm_full: {
    id: "confirm_full",
    publicName: "Confirmation complète",
    description: "Confirme médicament, disponibilité et prix avant déplacement.",
    creditCost: 4,
    fcfaEquivalent: 400,
    expectedResponseMinutes: 45,
    expirationMinutes: 240,
    refundable: true,
    requiresPharmacy: true,
    requiresMedication: true,
    requiresPrescription: false,
    active: true,
    immediate: false,
  },
  prescription_request: {
    id: "prescription_request",
    publicName: "Demande liée à une ordonnance",
    description: "Demande couverte par les règles actuelles de l’ordonnance, crédits ou Pass Ordonnance Unique actif.",
    creditCost: 0,
    fcfaEquivalent: 0,
    expectedResponseMinutes: 60,
    expirationMinutes: 360,
    refundable: true,
    requiresPharmacy: true,
    requiresMedication: false,
    requiresPrescription: true,
    active: true,
    immediate: false,
  },
};

export const USER_SERVICES = Object.values(USER_SERVICE_CONFIG);

export function getUserService(id: string) {
  return USER_SERVICE_CONFIG[id as UserServiceId] ?? null;
}

export function serviceRequiresManualResponse(id: string) {
  return Boolean(getUserService(id) && !getUserService(id)?.immediate);
}

export function serviceExpirationDate(id: string, base = new Date()) {
  const service = getUserService(id);
  const minutes = service?.expirationMinutes ?? 180;
  return new Date(base.getTime() + minutes * 60 * 1000);
}

export function contactUnlockExpiration(base = new Date()) {
  return new Date(base.getTime() + CONTACT_UNLOCK_DURATION_HOURS * 60 * 60 * 1000);
}
