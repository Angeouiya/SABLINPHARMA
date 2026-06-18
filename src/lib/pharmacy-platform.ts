export const PHARMACY_CREATION_SOURCES = [
  "Inscription directe pharmacie",
  "Création administrateur",
  "Import administrateur",
  "Ajout après contact téléphonique",
  "Ajout après échange WhatsApp",
  "Fiche provisoire",
  "Migration de données",
] as const;

export const PHARMACY_ACCOUNT_STATUSES = [
  "Brouillon",
  "Incomplète",
  "En attente de validation",
  "Validée",
  "Refusée",
  "Suspendue",
  "Archivée",
] as const;

export const PHARMACY_PUBLICATION_STATUSES = [
  "Brouillon",
  "Non publiée",
  "Publiée",
  "Masquée",
  "Archivée",
] as const;

export const PUBLIC_AVAILABILITY_STATUSES = [
  "Disponible",
  "Stock faible",
  "Rupture",
  "À confirmer",
] as const;

export const DATA_SOURCES = [
  "Saisie pharmacie",
  "Import pharmacie",
  "Saisie administrateur",
  "Import administrateur",
  "Confirmation téléphone",
  "Confirmation WhatsApp",
  "Confirmation email",
  "Saisie depuis document papier",
  "Migration de données",
  "Donnée ancienne",
  "Donnée à vérifier",
] as const;

export const RELIABILITY_LEVELS = [
  "Confirmé",
  "À vérifier",
  "Ancien",
  "Incomplet",
  "Contesté",
] as const;

export const PHARMACY_ROLES = [
  "Pharmacien responsable",
  "Employé pharmacie",
  "Administrateur SABLIN",
  "Super administrateur",
] as const;

export const REQUEST_STATUSES = [
  "Nouvelle",
  "En cours",
  "Répondue",
  "Expirée",
  "Annulée",
] as const;

export const PHARMACY_OPERATION_STATUSES = [
  "Ouvert",
  "Fermé",
  "De garde",
  "Ouvert 24h/24",
  "Fermeture exceptionnelle",
  "Horaires à confirmer",
] as const;

export const PHARMACY_MEDIA_VALIDATION_STATUSES = [
  "En attente",
  "Validée",
  "Refusée",
  "Masquée",
  "Archivée",
] as const;

export const IMPORT_STATUSES = [
  "En préparation",
  "En cours",
  "Terminé",
  "Terminé avec erreurs",
  "Échoué",
  "Annulé",
] as const;

export const MEDICATION_ADD_REQUEST_STATUSES = [
  "En attente",
  "En analyse",
  "Validée",
  "Refusée",
  "Fusionnée avec un médicament existant",
] as const;

export const DEFAULT_FRESHNESS_CONFIG = {
  warningDays: 3,
  staleDays: 5,
  veryStaleDays: 15,
} as const;

export const PHARMACY_PROFILE_STEPS = [
  {
    title: "Informations générales",
    fields: ["Nom officiel", "Nom commercial", "Nom du pharmacien responsable", "Fonction du responsable", "Téléphone professionnel", "Email professionnel", "Commune", "Quartier", "Adresse complète"],
  },
  {
    title: "Localisation",
    fields: ["Point GPS latitude", "Point GPS longitude", "Repère connu", "Zone de couverture", "Carte"],
  },
  {
    title: "Photos & images",
    fields: ["Logo", "Photo extérieure", "Photo de façade", "Image de couverture", "Photo intérieure optionnelle", "Document admin privé"],
  },
  {
    title: "Horaires & garde",
    fields: ["Horaires lundi à dimanche", "Ouverture exceptionnelle", "Fermeture exceptionnelle", "Statut de garde", "Période de garde"],
  },
  {
    title: "Médicaments",
    fields: ["Saisie manuelle", "Import Excel/CSV", "Prix indicatif", "Disponibilité", "Source", "Fiabilité"],
  },
  {
    title: "Validation",
    fields: ["Aperçu", "Qualité des données", "Envoyer pour validation", "Publication après validation"],
  },
] as const;

export const PUBLIC_PHARMACY_DATA = [
  "Nom pharmacie",
  "Commune",
  "Quartier",
  "Adresse générale",
  "Repère",
  "Horaires",
  "Statut ouvert ou fermé",
  "Statut de garde",
  "Services proposés",
  "Logo",
  "Photo extérieure",
  "Photo de façade",
  "Image de couverture",
  "Médicaments",
  "Prix indicatif",
  "Statut Disponible / Stock faible / Rupture / À confirmer",
  "Dernière mise à jour simplifiée",
  "GPS pour distance ou itinéraire",
] as const;

export const INTERNAL_PHARMACY_DATA = [
  "Stock exact",
  "Quantité interne",
  "Seuil de stock faible",
  "Téléphone complet avant déblocage",
  "WhatsApp avant déblocage",
  "Email direct",
  "Documents administratifs",
  "Autorisation officielle",
  "Notes internes",
  "Historique interne",
  "Nom des employés",
  "Données confidentielles",
  "Motif de suspension",
  "Commentaires de validation",
  "Données de sécurité",
] as const;

export const PHARMACY_IMAGE_FIELDS = [
  { type: "logo", label: "Logo de la pharmacie", visibility: "Public", usage: "Fiche pharmacie" },
  { type: "cover", label: "Image de couverture", visibility: "Public", usage: "Profil pharmacie" },
  { type: "exterior", label: "Photo extérieure", visibility: "Public", usage: "Reconnaissance sur place" },
  { type: "facade", label: "Photo de façade", visibility: "Public", usage: "Repérage utilisateur" },
  { type: "entrance", label: "Photo de l’entrée", visibility: "Public", usage: "Reconnaissance utilisateur" },
  { type: "interior", label: "Photo intérieure", visibility: "Public optionnel", usage: "Rassurer l’utilisateur" },
  { type: "counter", label: "Photo du comptoir", visibility: "Interne ou public contrôlé", usage: "Qualité visuelle" },
  { type: "sign", label: "Photo de l’enseigne", visibility: "Public recommandé", usage: "Repère visuel" },
  { type: "landmark", label: "Photo d’un repère proche", visibility: "Public optionnel", usage: "Orientation utilisateur" },
  { type: "authorization_document", label: "Autorisation d’exploitation", visibility: "Admin uniquement", usage: "Validation interne" },
  { type: "approval_document", label: "Document d’agrément", visibility: "Admin uniquement", usage: "Validation interne" },
  { type: "professional_document", label: "Justificatif professionnel", visibility: "Admin uniquement", usage: "Validation interne" },
  { type: "identification_document", label: "Document d’identification", visibility: "Admin uniquement", usage: "Validation interne" },
] as const;

export const PUBLIC_MEDIA_TYPES = ["logo", "cover", "exterior", "facade", "entrance", "interior", "counter", "sign", "landmark"] as const;
export const INTERNAL_MEDIA_TYPES = ["authorization_document", "approval_document", "professional_document", "identification_document", "administrative_document", "validation_document", "internal_note"] as const;

export function isPublicPharmacyMedia(media: {
  type?: string | null;
  visibility?: string | null;
  isPublic?: boolean | null;
  isValidated?: boolean | null;
  validationStatus?: string | null;
  containsSensitiveData?: boolean | null;
}) {
  return Boolean(
      media.isPublic &&
      media.isValidated &&
      (!media.validationStatus || media.validationStatus === "Validée") &&
      media.visibility === "public" &&
      !media.containsSensitiveData &&
      PUBLIC_MEDIA_TYPES.includes(media.type as never)
  );
}

export const PHARMACY_SERVICES = [
  "Pharmacie de garde",
  "Paiement mobile",
  "Conseil pharmaceutique",
  "Produits bébé",
  "Parapharmacie",
  "Produits d’hygiène",
  "Produits dermatologiques",
  "Suivi tension",
  "Produits mère & enfant",
  "Produits diabète",
  "Produits respiratoires",
  "Produits premiers soins",
  "Produits vétérinaires si autorisés",
  "Accessibilité aux personnes à mobilité réduite",
  "Parking",
  "Ouverture 24h/24",
] as const;

export const IMPORT_TEMPLATE_COLUMNS = [
  "Nom du médicament",
  "DCI",
  "Dosage",
  "Forme",
  "Conditionnement",
  "Laboratoire",
  "Code-barres",
  "Prix indicatif",
  "Statut",
  "Quantité interne",
  "Seuil stock faible",
  "Date mise à jour",
  "Remarque",
] as const;

export const USER_VISIBLE_MAPPING = [
  ["Nom pharmacie", "Fiche pharmacie"],
  ["Commune / quartier", "Recherche pharmacie"],
  ["Horaires", "Ouvert / fermé"],
  ["Statut garde", "Pharmacies de garde"],
  ["Médicaments", "Disponibilités"],
  ["Prix indicatif", "Estimation ordonnance"],
  ["Statut stock", "Disponible / rupture"],
  ["Photos", "Fiche pharmacie"],
  ["GPS", "Distance / itinéraire"],
  ["Contact", "Verrouillé par crédits"],
] as const;

export const DATA_FRESHNESS_DAYS = DEFAULT_FRESHNESS_CONFIG.staleDays;

export function isDataFresh(date: string | Date | null | undefined, staleDays: number = DATA_FRESHNESS_DAYS) {
  if (!date) return false;
  const updated = typeof date === "string" ? new Date(date) : date;
  const ageMs = Date.now() - updated.getTime();
  return ageMs <= staleDays * 24 * 60 * 60 * 1000;
}

export function simplifiedFreshnessLabel(date: string | Date | null | undefined, staleDays: number = DATA_FRESHNESS_DAYS) {
  if (!date) return "À confirmer";
  const updated = typeof date === "string" ? new Date(date) : date;
  const ageDays = Math.floor((Date.now() - updated.getTime()) / (24 * 60 * 60 * 1000));
  if (ageDays <= 0) return "Mis à jour aujourd’hui";
  if (ageDays <= staleDays) return "Mis à jour récemment";
  if (ageDays <= DEFAULT_FRESHNESS_CONFIG.veryStaleDays) return "Information ancienne";
  return "À confirmer";
}

export function publicAvailabilityStatus(input: {
  status?: string | null;
  reliabilityLevel?: string | null;
  lastUpdatedAt?: string | Date | null;
  publicationStatus?: string | null;
  staleDays?: number | null;
}) {
  if (input.publicationStatus && input.publicationStatus !== "Publiée") return "À confirmer";
  if (!isDataFresh(input.lastUpdatedAt, input.staleDays ?? DATA_FRESHNESS_DAYS)) return "À confirmer";
  if (input.reliabilityLevel && input.reliabilityLevel !== "Confirmé") return "À confirmer";
  if (!input.status || !PUBLIC_AVAILABILITY_STATUSES.includes(input.status as never)) return "À confirmer";
  return input.status;
}

export function isUserVisiblePharmacy(pharmacy: {
  accountStatus?: string | null;
  publicationStatus?: string | null;
  publishProvisional?: boolean | null;
  name?: string | null;
  commune?: string | null;
  address?: string | null;
}) {
  return Boolean(
    pharmacy.accountStatus === "Validée" &&
      (pharmacy.publicationStatus === "Publiée" || pharmacy.publishProvisional) &&
      pharmacy.name &&
      pharmacy.commune &&
      pharmacy.address
  );
}

export const PHARMACY_PORTAL_MEDICATIONS = [
  {
    name: "Paracétamol 500 mg",
    dci: "Paracétamol",
    dosage: "500 mg",
    form: "Comprimé",
    category: "Douleur",
    price: 600,
    status: "Disponible",
    source: "Saisie pharmacie",
    reliability: "Confirmé",
    updatedAt: "2026-06-17 09:20",
    internalQuantity: 48,
    remark: "Boîte de 20",
  },
  {
    name: "Doliprane",
    dci: "Paracétamol",
    dosage: "500 mg",
    form: "Comprimé",
    category: "Douleur",
    price: 800,
    status: "Stock faible",
    source: "Confirmation téléphone",
    reliability: "Confirmé",
    updatedAt: "2026-06-16 17:10",
    internalQuantity: 5,
    remark: "À surveiller",
  },
  {
    name: "Amoxicilline 500 mg",
    dci: "Amoxicilline",
    dosage: "500 mg",
    form: "Gélule",
    category: "Antibiotique",
    price: 1200,
    status: "Disponible",
    source: "Import pharmacie",
    reliability: "Confirmé",
    updatedAt: "2026-06-15 11:45",
    internalQuantity: 21,
    remark: "Prix indicatif",
  },
  {
    name: "Augmentin",
    dci: "Amoxicilline + acide clavulanique",
    dosage: "1 g",
    form: "Comprimé",
    category: "Antibiotique",
    price: 4200,
    status: "À confirmer",
    source: "Donnée ancienne",
    reliability: "Ancien",
    updatedAt: "2026-06-07 08:00",
    internalQuantity: 0,
    remark: "Mise à jour demandée",
  },
  {
    name: "Vitamine C",
    dci: "Acide ascorbique",
    dosage: "500 mg",
    form: "Comprimé effervescent",
    category: "Vitamines",
    price: 1500,
    status: "Disponible",
    source: "Saisie administrateur",
    reliability: "À vérifier",
    updatedAt: "2026-06-13 14:30",
    internalQuantity: 18,
    remark: "Vérification pharmacie attendue",
  },
  {
    name: "Smecta",
    dci: "Diosmectite",
    dosage: "3 g",
    form: "Sachet",
    category: "Digestion",
    price: 1800,
    status: "Rupture",
    source: "Confirmation WhatsApp",
    reliability: "Confirmé",
    updatedAt: "2026-06-17 10:05",
    internalQuantity: 0,
    remark: "Réapprovisionnement prévu",
  },
];

export const PHARMACY_PORTAL_PHARMACIES = [
  {
    name: "Pharmacie Sainte Marie Cocody",
    commune: "Cocody",
    district: "Sainte Marie",
    status: "Validée",
    source: "Inscription pharmacie",
    guard: "De garde",
    quality: "Données à jour",
  },
  {
    name: "Pharmacie Les Palmiers Yopougon",
    commune: "Yopougon",
    district: "Niangon",
    status: "En attente de validation",
    source: "Inscription pharmacie",
    guard: "Fermé",
    quality: "Données incomplètes",
  },
  {
    name: "Pharmacie Centrale Plateau",
    commune: "Plateau",
    district: "Avenue Chardy",
    status: "Validée",
    source: "Création administrateur",
    guard: "Ouvert",
    quality: "Données à jour",
  },
  {
    name: "Pharmacie Riviera Santé",
    commune: "Cocody",
    district: "Riviera 2",
    status: "Validée",
    source: "Création administrateur",
    guard: "Ouvert",
    quality: "Disponibilités à confirmer",
  },
  {
    name: "Pharmacie Marcory Résidentiel",
    commune: "Marcory",
    district: "Résidentiel",
    status: "Incomplète",
    source: "Création administrateur",
    guard: "Fermé",
    quality: "Prix non renseignés",
  },
  {
    name: "Pharmacie Abobo Centre",
    commune: "Abobo",
    district: "Centre",
    status: "Suspendue",
    source: "Création administrateur",
    guard: "Fermé",
    quality: "Données anciennes",
  },
  {
    name: "Pharmacie Bingerville Santé",
    commune: "Bingerville",
    district: "Quartier résidentiel",
    status: "Validée",
    source: "Inscription pharmacie",
    guard: "Ouvert",
    quality: "Données à jour",
  },
];
