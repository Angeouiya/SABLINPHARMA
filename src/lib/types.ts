// Shared domain types for SABLIN PHARMA

export type View =
  | "home"
  | "medications"
  | "medication-detail"
  | "pharmacies"
  | "pharmacy-detail"
  | "prescription"
  | "profile"
  | "auth"
  | "subscription"
  | "payment"
  | "success";

export interface NavParams {
  slug?: string;
  query?: string;
  category?: string;
  filter?: string; // "open" | "on-duty" | "all"
  authMode?: "login" | "register";
  fromEstimate?: boolean;
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
  phone: string;
  hoursWeekday: string;
  hoursSaturday: string;
  hoursSunday: string;
  isOpen247: boolean;
  isOnDuty: boolean;
  latitude: number;
  longitude: number;
  rating: number;
  imageUrl: string | null;
  medicationCount?: number;
  openNow?: boolean;
}

export interface PharmacyMedication {
  id: string;
  pharmacyId: string;
  medicationId: string;
  price: number;
  inStock: boolean;
  pharmacy?: Pharmacy;
  medication?: Medication;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  commune: string | null;
}

export interface Subscription {
  id: string;
  plan: string;
  status: string;
  amount: number;
  startDate: string;
  endDate: string | null;
}
