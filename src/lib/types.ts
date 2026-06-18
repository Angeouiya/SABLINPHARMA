// Shared domain types for SABLIN PHARMA

export type View =
  | "home"
  | "medications"
  | "medication-detail"
  | "pharmacies"
  | "pharmacy-detail"
  | "prescription"
  | "prescription-result"
  | "profile"
  | "auth"
  | "subscription"
  | "payment"
  | "success"
  | "notifications"
  | "requests"
  | "history"
  | "favorites"
  | "settings"
  | "design-system"
  | "wallet";

export interface NavParams {
  slug?: string;
  query?: string;
  category?: string;
  filter?: string; // "open" | "on-duty" | "all" | "247"
  authMode?: "login" | "register";
  fromEstimate?: boolean;
  // Prescription estimate payload (passed from prescription view to result view)
  estimateItems?: { slug: string; quantity: number }[];
  // Wallet → Payment : montant du pack de crédits sélectionné (FCFA)
  packAmount?: number;
  // Wallet → Payment : achat du Pass Ordonnance Unique
  passOrdonnance?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconName: string;
  color: string;
}

export interface Medication {
  id: string;
  name: string;
  slug: string;
  genericName: string;
  categoryId: string;
  category?: Category;
  form: string;
  dosage: string;
  packSize: string;
  description: string;
  imageUrl: string | null;
  imageBadge?: string | null;
  imageAttribution?: string | null;
  informationBadge?: string | null;
  verificationStatus?: string | null;
  manufacturer?: string | null;
  packaging?: string | null;
  requiresRx: boolean;
  avgPrice: number;
  createdAt: string;
  pharmacyCount?: number;
}

export interface Pharmacy {
  id: string;
  name: string;
  slug: string;
  address: string;
  commune: string;
  district?: string | null;
  phone: string;
  whatsapp?: string | null;
  professionalEmail?: string | null;
  accountStatus?: string;
  creationSource?: string;
  dataQuality?: string;
  lastDataUpdate?: string | null;
  hoursWeekday: string;
  hoursSaturday: string;
  hoursSunday: string;
  isOpen247: boolean;
  isOnDuty: boolean;
  latitude: number;
  longitude: number;
  rating: number;
  imageUrl: string | null;
  logoUrl?: string | null;
  facadeUrl?: string | null;
  coverImageUrl?: string | null;
  publicMedia?: PharmacyMedia[];
  medicationCount?: number;
  openNow?: boolean;
}

export interface PharmacyMedia {
  id: string;
  type: string;
  title: string;
  url: string;
  visibility: "public" | "admin_only" | "internal" | string;
  usage: string | null;
  isPublic: boolean;
  isValidated: boolean;
}

export interface PharmacyMedication {
  id: string;
  pharmacyId: string;
  medicationId: string;
  price: number;
  inStock: boolean;
  availabilityStatus?: string;
  dataSource?: string;
  reliabilityLevel?: string;
  lastUpdatedAt?: string;
  pharmacy?: Pharmacy;
  medication?: Medication;
}

export interface User {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  commune: string | null;
  avatarColor?: string;
  credits?: number;
}

export interface Subscription {
  id: string;
  plan: string;
  status: string;
  amount: number;
  startDate: string;
  endDate: string | null;
}

export type NotificationType = "info" | "success" | "warning" | "alert" | "promotion";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  icon: string;
  read: boolean;
  link: string | null;
  createdAt: string;
}

export type HistoryKind = "medication" | "pharmacy" | "prescription";

export interface HistoryItem {
  id: string;
  kind: HistoryKind;
  query: string | null;
  slug: string | null;
  label: string;
  meta: string | null;
  createdAt: string;
}

export type FavoriteKind = "medication" | "pharmacy";

export interface FavoriteItem {
  id: string;
  kind: FavoriteKind;
  slug: string;
  label: string;
  meta: string | null;
  createdAt: string;
}

export interface UserSettings {
  pushAlerts: boolean;
  dutyAlerts: boolean;
  priceAlerts: boolean;
  promoAlerts: boolean;
  emailRecap: boolean;
  language: string;
  theme: string;
  defaultCommune: string | null;
}

// Prescription estimation result
export interface EstimateLine {
  medication: {
    id: string;
    name: string;
    slug: string;
    form: string;
    dosage: string;
    packSize: string;
    requiresRx: boolean;
  };
  quantity: number;
  unitMin: number;
  unitMax: number;
  lineMin: number;
  lineMax: number;
  pharmacyCount: number;
}

export interface EstimateResult {
  lines: EstimateLine[];
  totalMin: number;
  totalMax: number;
  availablePharmacies: number;
}

// Visual status badges
export type MedicationStatus = "available" | "low-stock" | "out-of-stock" | "to-confirm";
export type PharmacyStatus = "open" | "closed" | "on-duty";
