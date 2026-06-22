"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bell,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Database,
  Filter,
  FileCheck2,
  FileSpreadsheet,
  History,
  ImageIcon,
  LayoutDashboard,
  Loader2,
  LockKeyhole,
  LogOut,
  Pill,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  UserCog,
  Users,
  WalletCards,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { InventorySyncPanel } from "@/components/views/inventory-sync-panels";
import { ProfessionalRequestsPanel } from "@/components/views/professional-requests-panel";
import { ProfessionalActionButton } from "@/components/shared/professional-action-button";
import { LogoutConfirmDialog } from "@/components/shared/logout-confirm-dialog";
import {
  ImportValidationPanel,
  safePublishLineNumbers,
  type ImportPreviewData,
} from "@/components/shared/import-validation-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Heading, Muted, Price } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import {
  DATA_SOURCES,
  IMPORT_TEMPLATE_COLUMNS,
  INTERNAL_PHARMACY_DATA,
  PHARMACY_ACCOUNT_STATUSES,
  PHARMACY_CREATION_SOURCES,
  PHARMACY_IMAGE_FIELDS,
  PHARMACY_OPERATION_STATUSES,
  PHARMACY_PORTAL_MEDICATIONS,
  PHARMACY_PORTAL_PHARMACIES,
  PHARMACY_PROFILE_STEPS,
  PHARMACY_SERVICES,
  PUBLIC_AVAILABILITY_STATUSES,
  PUBLIC_PHARMACY_DATA,
  RELIABILITY_LEVELS,
  REQUEST_STATUSES,
  USER_VISIBLE_MAPPING,
} from "@/lib/pharmacy-platform";

export type AdminPage =
  | "login"
  | "dashboard"
  | "pharmacies"
  | "pharmacies-nouveau"
  | "pharmacie-detail"
  | "pharmacy-dashboard"
  | "pharmacy-medicaments"
  | "pharmacy-import-inventaire"
  | "pharmacy-synchronisation-inventaire"
  | "pharmacy-demandes"
  | "pharmacy-confirmations"
  | "pharmacy-horaires-garde"
  | "pharmacy-profil"
  | "pharmacy-photos"
  | "pharmacy-equipe"
  | "pharmacy-historique"
  | "validations-pharmacies"
  | "comptes-professionnels"
  | "referentiel-medicaments"
  | "medicaments-interdits"
  | "enrichissement-medicaments"
  | "moteur-marketplace"
  | "sources-licences-images"
  | "imports"
  | "synchronisations"
  | "demandes-ajout-medicaments"
  | "utilisateurs"
  | "utilisateur-detail"
  | "credits-transactions"
  | "payments-fraud"
  | "demandes-utilisateurs"
  | "qualite-donnees"
  | "historique"
  | "notifications"
  | "parametres"
  | "administrateurs";

type AdminPharmacyMode =
  | "dashboard"
  | "medicaments"
  | "import-inventaire"
  | "synchronisation-inventaire"
  | "demandes"
  | "confirmations"
  | "horaires-garde"
  | "profil"
  | "photos"
  | "equipe"
  | "historique";

const adminNavItems: { page: AdminPage; label: string; icon: typeof LayoutDashboard; href: string }[] = [
  { page: "dashboard", label: "Tableau de bord", icon: LayoutDashboard, href: "/admin/dashboard" },
  { page: "pharmacies", label: "Pharmacies", icon: Building2, href: "/admin/pharmacies" },
  { page: "comptes-professionnels", label: "Comptes pro", icon: ShieldCheck, href: "/admin/comptes-professionnels" },
  { page: "utilisateurs", label: "Utilisateurs", icon: Users, href: "/admin/utilisateurs" },
  { page: "referentiel-medicaments", label: "Référentiel médicaments", icon: Pill, href: "/admin/referentiel-medicaments" },
  { page: "medicaments-interdits", label: "Médicaments interdits", icon: ShieldCheck, href: "/admin/medicaments-interdits" },
  { page: "enrichissement-medicaments", label: "Enrichissement", icon: Database, href: "/admin/enrichissement-medicaments" },
  { page: "moteur-marketplace", label: "Moteur Marketplace", icon: Database, href: "/admin/moteur-marketplace" },
  { page: "sources-licences-images", label: "Sources images", icon: ShieldCheck, href: "/admin/sources-licences-images" },
  { page: "imports", label: "Imports", icon: FileSpreadsheet, href: "/admin/imports" },
  { page: "synchronisations", label: "Synchronisations", icon: Database, href: "/admin/synchronisations" },
  { page: "qualite-donnees", label: "Qualité données", icon: Database, href: "/admin/qualite-donnees" },
  { page: "demandes-utilisateurs", label: "Demandes utilisateurs", icon: ClipboardList, href: "/admin/demandes-utilisateurs" },
  { page: "credits-transactions", label: "Crédits & transactions", icon: WalletCards, href: "/admin/credits-transactions" },
  { page: "payments-fraud", label: "Paiements & fraudes", icon: ShieldCheck, href: "/admin/paiements-fraudes" },
  { page: "historique", label: "Historique", icon: History, href: "/admin/historique" },
  { page: "administrateurs", label: "Administrateurs", icon: ShieldCheck, href: "/admin/administrateurs" },
  { page: "parametres", label: "Paramètres", icon: Settings, href: "/admin/parametres" },
];

const managementNav: { mode: AdminPharmacyMode; label: string; href: (slug: string) => string }[] = [
  { mode: "dashboard", label: "Dashboard pharmacie", href: (slug) => `/admin/pharmacies/${slug}/dashboard` },
  { mode: "medicaments", label: "Médicaments", href: (slug) => `/admin/pharmacies/${slug}/medicaments` },
  { mode: "import-inventaire", label: "Import inventaire", href: (slug) => `/admin/pharmacies/${slug}/import-inventaire` },
  { mode: "synchronisation-inventaire", label: "Synchronisation", href: (slug) => `/admin/pharmacies/${slug}/synchronisation-inventaire` },
  { mode: "demandes", label: "Demandes", href: (slug) => `/admin/pharmacies/${slug}/demandes` },
  { mode: "confirmations", label: "Confirmations", href: (slug) => `/admin/pharmacies/${slug}/confirmations` },
  { mode: "horaires-garde", label: "Horaires & garde", href: (slug) => `/admin/pharmacies/${slug}/horaires-garde` },
  { mode: "profil", label: "Profil", href: (slug) => `/admin/pharmacies/${slug}/profil` },
  { mode: "photos", label: "Photos", href: (slug) => `/admin/pharmacies/${slug}/photos` },
  { mode: "equipe", label: "Équipe", href: (slug) => `/admin/pharmacies/${slug}/equipe` },
  { mode: "historique", label: "Historique", href: (slug) => `/admin/pharmacies/${slug}/historique` },
];

const ADMIN_WEEK_DAYS = [
  { key: "monday", label: "Lundi" },
  { key: "tuesday", label: "Mardi" },
  { key: "wednesday", label: "Mercredi" },
  { key: "thursday", label: "Jeudi" },
  { key: "friday", label: "Vendredi" },
  { key: "saturday", label: "Samedi" },
  { key: "sunday", label: "Dimanche" },
] as const;

type AdminDaySchedule = {
  enabled: boolean;
  open: string;
  close: string;
  breakStart: string;
  breakEnd: string;
  status: string;
};

const adminDefaultSchedule: Record<string, AdminDaySchedule> = Object.fromEntries(
  ADMIN_WEEK_DAYS.map((day, index) => [
    day.key,
    {
      enabled: index < 6,
      open: index < 5 ? "08:00" : "08:30",
      close: index < 5 ? "22:00" : "20:00",
      breakStart: "13:00",
      breakEnd: "14:00",
      status: index === 6 ? "Fermé" : "Ouvert",
    },
  ])
) as Record<string, AdminDaySchedule>;

function toDateTimeInput(value: unknown, fallback = "") {
  if (!value) return fallback;
  const raw = String(value);
  return raw.includes("T") ? raw.slice(0, 16) : fallback;
}

const adminExecutivePillars = [
  { title: "Utilisateurs", score: "92%", status: "Stable", detail: "Crédits, Pass Ordonnance Unique, demandes et restrictions actives." },
  { title: "Pharmacies", score: "86%", status: "À renforcer", detail: "Validation, horaires, garde, photos et données anciennes à suivre." },
  { title: "Marketplace", score: "78%", status: "Contrôle", detail: "Imports sûrs publiés, images et descriptions sous validation admin." },
  { title: "Paiements", score: "100%", status: "Sécurisé", detail: "Aucun crédit ajouté sans SUCCESS serveur et webhook vérifié." },
];

const adminPriorityQueue = [
  { title: "Valider les nouvelles pharmacies", value: "3 dossiers", status: "Avant publication", href: "/admin/validations-pharmacies" },
  { title: "Traiter les imports ambigus", value: "12 lignes", status: "Référentiel", href: "/admin/imports" },
  { title: "Contrôler les images web", value: "8 images", status: "Licence", href: "/admin/sources-licences-images" },
  { title: "Suivre les paiements suspects", value: "1 dossier", status: "Finance", href: "/admin/paiements-fraudes" },
];

const adminRiskControls = [
  "Routes /admin réservées aux rôles Administrateur SABLIN et Super administrateur",
  "Actions sensibles journalisées dans l’historique professionnel",
  "Pharmacies non validées non publiées côté utilisateur par défaut",
  "Contacts, stocks, prix détaillés et ordonnances verrouillés par crédits côté utilisateur",
  "Paiements non SUCCESS bloqués avant crédit ou Pass Ordonnance Unique",
  "Images web publiées uniquement après validation source/licence",
];

const professionalPermissionLabels: Record<string, string> = {
  "pharmacy.profile.read": "Voir profil",
  "pharmacy.profile.update": "Modifier profil",
  "pharmacy.images.read": "Voir images",
  "pharmacy.images.create": "Ajouter images",
  "pharmacy.images.update": "Modifier images",
  "pharmacy.images.delete": "Retirer images",
  "pharmacy.schedule.read": "Voir horaires",
  "pharmacy.schedule.update": "Modifier horaires",
  "pharmacy.inventory.read": "Voir inventaire",
  "pharmacy.inventory.create": "Ajouter médicaments",
  "pharmacy.inventory.update": "Modifier disponibilités",
  "pharmacy.inventory.delete": "Retirer médicament",
  "pharmacy.inventory.import": "Importer inventaire",
  "pharmacy.requests.read": "Voir demandes",
  "pharmacy.requests.assign": "Assigner demandes",
  "pharmacy.requests.respond": "Répondre demandes",
  "pharmacy.confirmations.read": "Voir confirmations",
  "pharmacy.confirmations.respond": "Répondre confirmations",
  "pharmacy.advice.respond": "Conseils pharmacie",
  "pharmacy.team.read": "Voir équipe",
  "pharmacy.team.invite": "Inviter équipe",
  "pharmacy.team.update": "Modifier équipe",
  "pharmacy.team.remove": "Révoquer équipe",
  "pharmacy.history.read": "Voir historique",
  "pharmacy.settings.update": "Paramètres",
};

function professionalPermissionLabel(permission: string) {
  return professionalPermissionLabels[permission] ?? permission;
}

const adminPermissionMatrix = [
  ["Super administrateur", "Toutes pharmacies", "Utilisateurs", "Paiements", "Paramètres sensibles"],
  ["Administrateur SABLIN", "Pharmacies, imports, qualité", "Support utilisateur", "Transactions consultables", "Paramètres limités"],
  ["Data admin", "Référentiel, images, imports", "Aucun mot de passe", "Aucun remboursement", "Qualité données"],
  ["Support admin", "Demandes utilisateurs", "Assistance", "Lecture transactions", "Pas de publication directe"],
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function formatDateTime(value?: string | Date | null) {
  if (!value) return "Non renseigné";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Non renseigné";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatFcfa(value: number) {
  return `${Number(value || 0).toLocaleString("fr-FR")} FCFA`;
}

type ProfessionalRequestItem = {
  id: string;
  reference: string;
  requestType: string;
  serviceName: string;
  status: string;
  priority: string;
  creditCost: number;
  fcfaEquivalent: number;
  userMessage?: string | null;
  dosage?: string | null;
  form?: string | null;
  createdAt: string;
  expiresAt: string;
  medication?: { name: string; slug: string; dosage?: string | null; form?: string | null; packSize?: string | null } | null;
  user?: { name: string; commune?: string | null } | null;
  responses?: Array<{ id: string; availabilityStatus?: string | null; confirmedPrice?: number | null; responseMessage: string; createdAt: string }>;
};

type RequestStats = {
  total?: number;
  new?: number;
  inProgress?: number;
  answered?: number;
  expired?: number;
  highPriority?: number;
};

type HistoryRow = {
  id: string;
  date: string;
  action: string;
  author: string;
  source: string;
  oldValue?: unknown;
  newValue?: unknown;
  status: string;
  message?: string | null;
  kind: string;
};

type AdminSecurityNotification = {
  id: string;
  type: string;
  group?: string;
  title: string;
  message: string;
  status: string;
  createdAt: string;
  pharmacy?: {
    id: string;
    name: string;
    slug: string;
    accountStatus: string;
    dataQuality: string;
  } | null;
};

type AdminUserRow = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  commune?: string | null;
  credits: number;
  createdAt: string;
  updatedAt: string;
  lastActivity?: string | null;
  status: string;
  passStatus: string;
  counts: {
    transactions: number;
    payments: number;
    requests: number;
    contacts: number;
    featureAccesses: number;
    favorites: number;
    history: number;
    notifications: number;
    passOrdonnances: number;
  };
  recent: {
    transactions: Array<{
      id: string;
      type: string;
      amount: number;
      fcfaEquivalent: number;
      balanceBefore: number;
      balanceAfter: number;
      status: string;
      reference?: string | null;
      description: string;
      createdAt: string;
    }>;
    requests: Array<{
      id: string;
      reference: string;
      requestType: string;
      serviceName: string;
      status: string;
      priority: string;
      creditCost: number;
      createdAt: string;
    }>;
    payments: Array<{
      id: string;
      reference: string;
      amount: number;
      provider: string;
      productType: string;
      status: string;
      riskStatus: string;
      createdAt: string;
    }>;
    passOrdonnances: Array<{
      id: string;
      status: string;
      price: number;
      ordonnanceId?: string | null;
      paymentReference?: string | null;
      createdAt: string;
      usedAt?: string | null;
    }>;
    contacts: Array<{
      id: string;
      unlockType: string;
      creditCost: number;
      status: string;
      unlockedAt: string;
      expiresAt: string;
    }>;
    favorites: Array<{ id: string; kind: string; slug: string; label: string; createdAt: string }>;
    history: Array<{ id: string; kind: string; label: string; query?: string | null; slug?: string | null; createdAt: string }>;
  };
};

type AdminUsersSummary = {
  totalUsers: number;
  usersWithCredits: number;
  zeroCreditUsers: number;
  activeUsers: number;
  transactionsToday: number;
  pendingRequests: number;
  listedUsers: number;
  totalCreditsVisible: number;
  totalTransactionsVisible: number;
  totalPassVisible: number;
};

type AdminTransactionRow = {
  id: string;
  source: "credit" | "payment";
  action: string;
  user: string;
  userId?: string | null;
  amountFcfa: number;
  credits: number;
  balanceBefore?: number | null;
  balanceAfter?: number | null;
  status: string;
  reference: string;
  provider: string;
  riskStatus: string;
  description: string;
  createdAt: string;
};

type AdminTransactionsSummary = {
  creditsSold: number;
  creditsSoldFcfa: number;
  creditsDebited: number;
  creditsDebitedFcfa: number;
  netCredits: number;
  passCount: number;
  activePassCount: number;
  successfulPayments: number;
  pendingPayments: number;
  failedPayments: number;
  suspiciousPayments: number;
  todayTransactions: number;
  usersImpacted: number;
  totalMovements: number;
  visibleRows: number;
};

const emptyAdminTransactionsSummary: AdminTransactionsSummary = {
  creditsSold: 0,
  creditsSoldFcfa: 0,
  creditsDebited: 0,
  creditsDebitedFcfa: 0,
  netCredits: 0,
  passCount: 0,
  activePassCount: 0,
  successfulPayments: 0,
  pendingPayments: 0,
  failedPayments: 0,
  suspiciousPayments: 0,
  todayTransactions: 0,
  usersImpacted: 0,
  totalMovements: 0,
  visibleRows: 0,
};

const emptyAdminUsersSummary: AdminUsersSummary = {
  totalUsers: 0,
  usersWithCredits: 0,
  zeroCreditUsers: 0,
  activeUsers: 0,
  transactionsToday: 0,
  pendingRequests: 0,
  listedUsers: 0,
  totalCreditsVisible: 0,
  totalTransactionsVisible: 0,
  totalPassVisible: 0,
};

function stringifyCell(value: unknown) {
  if (value === null || value === undefined || value === "") return "Non renseigné";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return "Valeur complexe";
  }
}

function downloadImportTemplate(fileName = "modele-import-sablin-pharma.csv") {
  const header = IMPORT_TEMPLATE_COLUMNS.join(";");
  const example = [
    "Paracétamol 500 mg",
    "Paracétamol",
    "500 mg",
    "Comprimé",
    "Boîte de 20",
    "Laboratoire exemple",
    "6180000000000",
    "500",
    "Disponible",
    "20",
    "5",
    "17/06/2026",
    "Prix indicatif à confirmer",
  ].join(";");
  const blob = new Blob([`${header}\n${example}\n`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

const adminPharmacies = PHARMACY_PORTAL_PHARMACIES.map((pharmacy, index) => ({
  ...pharmacy,
  slug: slugify(pharmacy.name),
  manager: ["Dr N’Guessan Kouamé", "Dr Fatou Bamba", "Dr Serge Aka", "Dr Sarah Kouadio", "Dr Mireille Yao", "Dr Ibrahim Cissé", "Dr Estelle N'Dri"][index] ?? "Responsable pharmacie",
  phone: `+225 07 0${index + 1} 45 20 ${10 + index}`,
  meds: [128, 86, 154, 112, 64, 38, 91][index] ?? 50,
  updatedAt: ["Aujourd’hui 10:05", "Hier 17:30", "Aujourd’hui 08:40", "Il y a 4 jours", "Il y a 9 jours", "Il y a 18 jours", "Aujourd’hui 11:20"][index] ?? "À confirmer",
  operationalStatus: pharmacy.guard === "De garde" ? "Ouvert" : pharmacy.guard,
}));

type AdminDashboardSummary = {
  totalUsers: number;
  activeUsers: number;
  usersWithCredits: number;
  totalCreditsSold: number;
  transactionsToday: number;
  totalPharmacies: number;
  validatedPharmacies: number;
  pendingPharmacies: number;
  suspendedPharmacies: number;
  referencedMedications: number;
  medicationRequestsPending: number;
  recentImports: number;
  staleData: number;
  pendingConfirmations: number;
  pendingUserRequests: number;
  dataQualityPercent: number;
};

type AdminSettingsData = {
  canManage: boolean;
  dataFreshness: {
    warningDays: number;
    staleDays: number;
    veryStaleDays: number;
    updatedAt?: string | null;
    updatedBy?: string | null;
  };
  environment: {
    databaseConfigured: boolean;
    supabaseConfigured: boolean;
    sessionSecretConfigured: boolean;
    proSessionHours: number;
    paymentProviderMode: string;
    paydunyaConfigured: boolean;
    paymentWebhookConfigured: boolean;
    googleApiConfigured: boolean;
    googleSearchEngineConfigured: boolean;
  };
  enrichment: {
    providerStatus: string;
    modeLabel: string;
    reason: string;
    adminMessage: string;
    imageSearchProvider: string;
    activeProviders: string[];
    googleApiConfigured: boolean;
    googleSearchEngineConfigured: boolean;
    braveApiConfigured?: boolean;
    openverseEnabled?: boolean;
    dailyLimit?: number;
    confidenceThreshold?: number;
    lastTest?: { status: string; at: string | null; message: string };
    lastError?: string | null;
    lastErrorAt?: string | null;
  };
  security: {
    activeAdminSessions: number;
    adminAccounts: number;
    pharmacyAccounts: number;
    unreadAdminNotifications: number;
    criticalAdminNotifications: number;
    recentSensitiveActions: number;
  };
  policies: Array<{ title: string; status: string; detail: string }>;
  recentActions: Array<{
    id: string;
    action: string;
    label: string;
    status: string;
    actorRole?: string | null;
    createdAt: string;
    message?: string | null;
  }>;
  message?: string;
};

const adminDashboardFallback: AdminDashboardSummary = {
  totalUsers: 0,
  activeUsers: 0,
  usersWithCredits: 0,
  totalCreditsSold: 0,
  transactionsToday: 0,
  totalPharmacies: 0,
  validatedPharmacies: 0,
  pendingPharmacies: 0,
  suspendedPharmacies: 0,
  referencedMedications: 0,
  medicationRequestsPending: 0,
  recentImports: 0,
  staleData: 0,
  pendingConfirmations: 0,
  pendingUserRequests: 0,
  dataQualityPercent: 0,
};

type AdminManagedDashboardSummary = {
  medicationCount: number;
  staleAvailabilityCount: number;
  receivedRequests: number;
  pendingRequests: number;
  pendingConfirmations: number;
  dutyStatus: string;
  dataQualityPercent: number;
  lastDataUpdateLabel: string;
  priceToCheck: number;
};

const adminManagedDashboardFallback: AdminManagedDashboardSummary = {
  medicationCount: 0,
  staleAvailabilityCount: 0,
  receivedRequests: 0,
  pendingRequests: 0,
  pendingConfirmations: 0,
  dutyStatus: "Inactif",
  dataQualityPercent: 0,
  lastDataUpdateLabel: "Non renseignée",
  priceToCheck: 0,
};

const adminSettingsFallback: AdminSettingsData = {
  canManage: false,
  dataFreshness: {
    warningDays: 3,
    staleDays: 5,
    veryStaleDays: 15,
    updatedAt: null,
    updatedBy: null,
  },
  environment: {
    databaseConfigured: false,
    supabaseConfigured: false,
    sessionSecretConfigured: false,
    proSessionHours: 12,
    paymentProviderMode: "sandbox",
    paydunyaConfigured: false,
    paymentWebhookConfigured: false,
    googleApiConfigured: false,
    googleSearchEngineConfigured: false,
  },
  enrichment: {
    providerStatus: "disabled",
    modeLabel: "Fallback interne",
    reason: "Configuration non chargée.",
    adminMessage: "L’état d’enrichissement sera affiché après chargement serveur.",
    imageSearchProvider: "auto",
    activeProviders: [],
    googleApiConfigured: false,
    googleSearchEngineConfigured: false,
    dailyLimit: 100,
    confidenceThreshold: 85,
    lastTest: { status: "not_run", at: null, message: "Aucun test récent enregistré." },
    lastError: null,
    lastErrorAt: null,
  },
  security: {
    activeAdminSessions: 0,
    adminAccounts: 0,
    pharmacyAccounts: 0,
    unreadAdminNotifications: 0,
    criticalAdminNotifications: 0,
    recentSensitiveActions: 0,
  },
  policies: [],
  recentActions: [],
};

function statusClass(label: string) {
  const value = label.toLowerCase();
  if (value.includes("valid") || value.includes("confirm") || value.includes("réussi") || value.includes("à jour") || value.includes("actif") || value.includes("ouvert")) return "bg-success-light text-success";
  if (value.includes("attente") || value.includes("ancien") || value.includes("incomplet") || value.includes("vérifier") || value.includes("prix") || value.includes("solde")) return "bg-amber-100 text-amber-800";
  if (value.includes("suspend") || value.includes("refus") || value.includes("rupture") || value.includes("erreur") || value.includes("fermé")) return "bg-danger-light text-danger";
  if (value.includes("garde")) return "bg-sky-100 text-sky-800";
  return "bg-muted text-foreground";
}

function StatusBadge({ label }: { label: string }) {
  return <Badge className={cn("border-0 whitespace-normal text-center", statusClass(label))}>{label}</Badge>;
}

type PharmacyMediaItem = {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  altText?: string | null;
  url: string;
  visibility: string;
  validationStatus: string;
  displayOrder: number;
  isPrimary: boolean;
  isPublic: boolean;
  isValidated: boolean;
  containsSensitiveData: boolean;
  rejectedReason?: string | null;
  createdAt: string;
  pharmacy?: { name: string; slug: string; accountStatus: string };
};

function SectionBlock({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card className="border-border/70 p-4 shadow-card">
      <h3 className="text-base font-extrabold text-foreground">{title}</h3>
      {description && <p className="mt-1 text-sm font-medium text-muted-foreground">{description}</p>}
      <div className="mt-4">{children}</div>
    </Card>
  );
}

function PillList({ items }: { items: readonly string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => <StatusBadge key={item} label={item} />)}
    </div>
  );
}

function AdminHero({
  badge,
  title,
  description,
  icon: Icon = ShieldCheck,
  children,
  actions,
}: {
  badge: string;
  title: string;
  description: string;
  icon?: typeof ShieldCheck;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <Card className="border-border/70 bg-white p-5 shadow-card">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="grid size-10 place-items-center rounded-lg bg-brand text-white">
              <Icon className="size-5" />
            </span>
            <Badge className="border-0 bg-brand-light text-brand-dark">{badge}</Badge>
          </div>
          <Heading level="h2" className="mt-3">{title}</Heading>
          <Muted className="mt-2 max-w-3xl">{description}</Muted>
        </div>
        {actions && <div className="flex flex-wrap gap-2 lg:justify-end">{actions}</div>}
      </div>
      {children && <div className="mt-5">{children}</div>}
    </Card>
  );
}

function MiniMetric({ label, value, status, icon: Icon = Activity }: { label: string; value: string | number; status: string; icon?: typeof Activity }) {
  return (
    <Card className="border-border/70 bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-extrabold uppercase text-muted-foreground">{label}</p>
          <p className="mt-2 break-words text-2xl font-extrabold text-foreground">{value}</p>
        </div>
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-light text-brand-dark">
          <Icon className="size-4" />
        </span>
      </div>
      <div className="mt-3"><StatusBadge label={status} /></div>
    </Card>
  );
}

function MetricsGrid({ metrics }: { metrics: Array<{ label: string; value: string | number; status: string; icon?: typeof Activity }> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => <MiniMetric key={metric.label} {...metric} />)}
    </div>
  );
}

function AdminFilterPanel({ filters, actionLabel = "Appliquer les filtres" }: { filters: string[]; actionLabel?: string }) {
  return (
    <Card className="border-border/70 bg-white p-4 shadow-card">
      <div className="flex flex-wrap items-center gap-2">
        <SlidersHorizontal className="size-4 text-brand-dark" />
        <p className="text-sm font-extrabold text-foreground">Filtres dynamiques</p>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {filters.map((filter) => <Input key={filter} placeholder={filter} className="bg-white" />)}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button className="bg-brand text-white hover:bg-brand-dark">{actionLabel}</Button>
        <Button variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light">Réinitialiser</Button>
      </div>
    </Card>
  );
}

function WorkflowBoard({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: Array<{ title: string; status: string; owner: string; detail: string }>;
}) {
  return (
    <SectionBlock title={title} description={description}>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <Card key={item.title} className="border-border/70 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <StatusBadge label={item.status} />
              <Badge className="border border-border bg-white text-foreground">{item.owner}</Badge>
            </div>
            <p className="mt-3 font-extrabold text-foreground">{item.title}</p>
            <p className="mt-1 text-sm font-medium text-muted-foreground">{item.detail}</p>
          </Card>
        ))}
      </div>
    </SectionBlock>
  );
}

function ControlChecklist({ title, items }: { title: string; items: string[] }) {
  return (
    <SectionBlock title={title} description="Contrôles critiques à vérifier avant toute publication ou action sensible.">
      <div className="grid gap-2 md:grid-cols-2">
        {items.map((item) => (
          <div key={item} className="flex gap-3 rounded-lg border border-border bg-white p-3 text-sm font-semibold text-foreground">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </SectionBlock>
  );
}

function ActionQueue({
  title,
  items,
  action = "process-admin-card",
}: {
  title: string;
  items: Array<{ title: string; detail: string; status: string; entityId?: string }>;
  action?: string;
}) {
  return (
    <SectionBlock title={title} description="Chaque action est confirmée côté API puis journalisée dans l’historique professionnel.">
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <Card key={item.title} className="border-border/70 bg-white p-4">
            <StatusBadge label={item.status} />
            <p className="mt-3 font-extrabold text-foreground">{item.title}</p>
            <p className="mt-1 text-sm font-medium text-muted-foreground">{item.detail}</p>
            <ProfessionalActionButton
              action={action}
              label="Traiter"
              entityId={item.entityId ?? item.title}
              payload={{ details: item }}
              className="mt-3 bg-brand text-white hover:bg-brand-dark"
            >
              Traiter
            </ProfessionalActionButton>
          </Card>
        ))}
      </div>
    </SectionBlock>
  );
}

function ResponsiveTable({ headers, rows }: { headers: string[]; rows: Array<Array<React.ReactNode>> }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-white">
      <table className="w-full min-w-[900px] text-sm">
        <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
          <tr>{headers.map((header) => <th key={header} className="px-4 py-3">{header}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => <td key={cellIndex} className="px-4 py-3 align-top">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProfileSteps() {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {PHARMACY_PROFILE_STEPS.map((step, index) => (
        <Card key={step.title} className="border-border/70 p-4">
          <StatusBadge label={`Étape ${index + 1}`} />
          <h3 className="mt-3 font-extrabold text-foreground">{step.title}</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {step.fields.map((field) => <Badge key={field} className="border border-border bg-white text-foreground">{field}</Badge>)}
          </div>
        </Card>
      ))}
    </div>
  );
}

function AdminMediaUploadPanel({ pharmacySlug, helper }: { pharmacySlug: string; helper?: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState("facade");
  const [visibility, setVisibility] = useState("public");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [altText, setAltText] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [displayOrder, setDisplayOrder] = useState("0");
  const [media, setMedia] = useState<PharmacyMediaItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const loadMedia = useCallback(async () => {
    if (!pharmacySlug) return;
    setLoadingMedia(true);
    try {
      const res = await fetch(`/api/pharmacy-platform/media?pharmacySlug=${encodeURIComponent(pharmacySlug)}`, {
        headers: { "X-Sablin-Session-Kind": "admin" },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Chargement des médias impossible.");
      setMedia(data.media ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Chargement des médias impossible.");
    } finally {
      setLoadingMedia(false);
    }
  }, [pharmacySlug]);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  const upload = async () => {
    if (!file) {
      setMessage("Choisissez un fichier avant de charger.");
      return;
    }
    setUploading(true);
    setMessage("");
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("pharmacySlug", pharmacySlug);
      form.set("type", type);
      form.set("visibility", visibility);
      form.set("title", title || file.name);
      form.set("description", description);
      form.set("altText", altText || title || file.name);
      form.set("usage", type === "authorization_document" ? "Validation interne" : "Fiche pharmacie");
      form.set("containsSensitiveData", visibility === "admin_only" || type === "authorization_document" ? "true" : "false");
      form.set("isPrimary", isPrimary ? "true" : "false");
      form.set("displayOrder", displayOrder);
      const res = await fetch("/api/pharmacy-platform/media/upload", { method: "POST", headers: { "X-Sablin-Session-Kind": "admin" }, body: form });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Chargement impossible.");
      setMessage(`Fichier chargé : ${data.media.title}. ${data.media.isPublic ? "Visible côté utilisateur." : "Non public."}`);
      setFile(null);
      setTitle("");
      setDescription("");
      setAltText("");
      setIsPrimary(false);
      setDisplayOrder("0");
      await loadMedia();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Chargement impossible.");
    } finally {
      setUploading(false);
    }
  };

  const mediaAction = async (mediaId: string, action: string, extra: Record<string, unknown> = {}) => {
    setMessage("");
    try {
      const res = await fetch("/api/pharmacy-platform/media", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Sablin-Session-Kind": "admin",
        },
        body: JSON.stringify({ mediaId, action, ...extra }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Action média impossible.");
      setMessage(`Action enregistrée : ${data.media.title} — ${data.media.validationStatus}.`);
      await loadMedia();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Action média impossible.");
    }
  };

  const deleteMedia = async (mediaId: string) => {
    setMessage("");
    try {
      const res = await fetch(`/api/pharmacy-platform/media?mediaId=${encodeURIComponent(mediaId)}`, {
        method: "DELETE",
        headers: { "X-Sablin-Session-Kind": "admin" },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Suppression impossible.");
      setMessage("Média supprimé de la fiche.");
      await loadMedia();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Suppression impossible.");
    }
  };

  return (
    <Card className="border-brand/20 bg-white p-4 shadow-card">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="font-extrabold text-foreground">Charger photos, locaux et documents</h3>
          <p className="mt-1 text-sm font-medium text-muted-foreground">{helper ?? "L’admin peut publier les images publiques validées et conserver les documents confidentiels en admin uniquement."}</p>
        </div>
        <StatusBadge label="Upload autorisé admin" />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <select value={type} onChange={(e) => setType(e.target.value)} className="h-10 rounded-lg border border-border bg-white px-3 text-sm font-bold text-foreground">
          {PHARMACY_IMAGE_FIELDS.map((item) => <option key={item.type} value={item.type}>{item.label}</option>)}
        </select>
        <select value={visibility} onChange={(e) => setVisibility(e.target.value)} className="h-10 rounded-lg border border-border bg-white px-3 text-sm font-bold text-foreground">
          <option value="public">Public validé</option>
          <option value="internal">Interne</option>
          <option value="admin_only">Admin uniquement</option>
        </select>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre du fichier" />
        <Input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_140px]">
        <Input value={altText} onChange={(e) => setAltText(e.target.value)} placeholder="Texte alternatif public" />
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description ou consigne interne" />
        <Input value={displayOrder} onChange={(e) => setDisplayOrder(e.target.value)} placeholder="Ordre" type="number" />
      </div>
      <label className="mt-3 flex w-fit items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-bold text-foreground">
        <input type="checkbox" checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} />
        Image principale
      </label>
      <Button className="mt-3 bg-brand text-white hover:bg-brand-dark" onClick={upload} disabled={uploading}>{uploading ? "Chargement..." : "Charger le fichier"}</Button>
      {message && <p className="mt-3 rounded-lg border border-border bg-muted/40 p-3 text-sm font-bold text-foreground">{message}</p>}
      <div className="mt-5 border-t border-border pt-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-extrabold text-foreground">Médias synchronisés</p>
            <p className="text-sm font-medium text-muted-foreground">Les images validées et publiques alimentent automatiquement la fiche utilisateur.</p>
          </div>
          <Button variant="outline" size="sm" onClick={loadMedia} disabled={loadingMedia}>{loadingMedia ? "Actualisation..." : "Actualiser"}</Button>
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {media.length === 0 && (
            <Card className="border-border/70 bg-muted/30 p-4 text-sm font-bold text-foreground">Aucun média chargé pour cette pharmacie.</Card>
          )}
          {media.map((item) => (
            <Card key={item.id} className="overflow-hidden border-border/70 bg-white">
              <div className="grid gap-3 p-3 sm:grid-cols-[120px_1fr]">
                <div className="flex h-28 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/30">
                  {item.url.match(/\.(png|jpe?g|webp)$/i) ? (
                    <img src={item.url} alt={item.altText ?? item.title} className="h-full w-full object-cover" />
                  ) : (
                    <span className="px-2 text-center text-xs font-bold text-muted-foreground">Document interne</span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-start gap-2">
                    <h4 className="break-words font-extrabold text-foreground">{item.title}</h4>
                    {item.isPrimary && <StatusBadge label="Image principale" />}
                    {item.isPublic && <StatusBadge label="Visible utilisateur" />}
                  </div>
                  <p className="mt-1 text-sm font-medium text-muted-foreground">{item.description || item.type}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <StatusBadge label={item.validationStatus} />
                    <StatusBadge label={item.visibility === "public" ? "Public" : item.visibility === "admin_only" ? "Admin uniquement" : "Interne"} />
                    {item.containsSensitiveData && <StatusBadge label="Donnée confidentielle" />}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 border-t border-border bg-muted/20 p-3">
                <Button size="sm" onClick={() => mediaAction(item.id, "publish", { visibility: "public" })}>Valider & publier</Button>
                <Button size="sm" variant="outline" onClick={() => mediaAction(item.id, "set-primary")}>Image principale</Button>
                <Button size="sm" variant="outline" onClick={() => mediaAction(item.id, "hide")}>Masquer</Button>
                <Button size="sm" variant="outline" onClick={() => mediaAction(item.id, "archive")}>Archiver</Button>
                <Button size="sm" variant="destructive" onClick={() => deleteMedia(item.id)}>Supprimer</Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Card>
  );
}

function GlobalAdminImports() {
  const [pharmacies, setPharmacies] = useState<AdminPharmacyListRow[]>([]);
  const [pharmacySlug, setPharmacySlug] = useState(adminPharmacies[0]?.slug ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<ImportPreviewData | null>(null);
  const [selectedLineNumbers, setSelectedLineNumbers] = useState<Set<number>>(new Set());

  const loadPharmacies = useCallback(async () => {
    const res = await fetch("/api/pharmacy-platform/pharmacies?accountStatus=all&publicationStatus=all", {
      headers: { "x-sablin-session-kind": "admin" },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(data?.error ?? "Chargement des pharmacies impossible.");
      return;
    }
    const rows = data.pharmacies ?? [];
    setPharmacies(rows);
    if (rows.length && !rows.some((pharmacy: AdminPharmacyListRow) => pharmacy.slug === pharmacySlug)) {
      setPharmacySlug(rows[0].slug);
    }
  }, [pharmacySlug]);

  useEffect(() => {
    void loadPharmacies();
  }, [loadPharmacies]);

  const previewImport = async () => {
    if (!file) {
      setMessage("Choisissez un fichier CSV, XLSX, XLS, Word ou PowerPoint.");
      return;
    }
    setUploading(true);
    setMessage("");
    try {
      const form = new FormData();
      form.set("pharmacySlug", pharmacySlug);
      form.set("file", file);
      const res = await fetch("/api/imports/preview", { method: "POST", headers: { "X-Sablin-Session-Kind": "admin" }, body: form });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Aperçu impossible.");
      const safeLines = safePublishLineNumbers(data);
      setPreview(data);
      setSelectedLineNumbers(safeLines);
      setMessage(
        `Analyse terminée : ${safeLines.size} produit(s) prêt(s) à publier, ${data.unknownMedications} non reconnu(s), ${data.prohibitedRows ?? 0} interdit(s) retiré(s).`
      );
    } catch (error) {
      setPreview(null);
      setSelectedLineNumbers(new Set());
      setMessage(error instanceof Error ? error.message : "Aperçu impossible.");
    } finally {
      setUploading(false);
    }
  };
  const submitImport = async (mode: "auto_publish_safe" | "draft") => {
    if (!file) {
      setMessage("Choisissez un fichier CSV, XLSX, XLS, Word ou PowerPoint.");
      return;
    }
    if (!preview) {
      setMessage("Analysez le fichier avant de valider. Vous pourrez retirer les lignes à ne pas publier.");
      return;
    }
    const rowsToConfirm = preview.confirmableRows ?? [];
    if (!rowsToConfirm.length) {
      setMessage("Aucune ligne analysée à enregistrer.");
      return;
    }
    setUploading(true);
    setMessage("");
    try {
      const res = await fetch("/api/imports/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Sablin-Session-Kind": "admin" },
        body: JSON.stringify({
          pharmacySlug,
          fileName: file.name,
          fileType: file.name.split(".").pop() ?? "CSV",
          rows: rowsToConfirm,
          publishLineNumbers: mode === "draft" ? [] : Array.from(selectedLineNumbers),
          mode,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Import impossible.");
      setMessage(
        mode === "draft"
          ? `Liste enregistrée sans publication : ${data.report.totalRows ?? 0} ligne(s).`
          : `Publication terminée : ${data.report.safePublishedRows ?? 0} produit(s) publié(s), ${data.report.notPublishedRows ?? 0} non publié(s), ${data.report.prohibitedRows ?? 0} interdit(s) retiré(s).`
      );
      setFile(null);
      setSelectedLineNumbers(new Set());
      setPreview(data.report);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Import impossible.");
    } finally {
      setUploading(false);
    }
  };
  const uploadImport = async () => submitImport("auto_publish_safe");
  return (
    <div className="space-y-5">
      <Card className="border-border/70 p-5 shadow-card">
        <Heading level="h2">Imports globaux</Heading>
        <Muted>
          Imports inventaire multi-format : CSV, Excel, Word et PowerPoint. Les lignes sûres et autorisées sont publiées,
          les médicaments interdits sont retirés, et les lignes ambiguës restent non publiées.
        </Muted>
        <div className="mt-4 max-w-xl">
          <Label className="text-xs font-extrabold text-foreground">Pharmacie cible</Label>
          <select value={pharmacySlug} onChange={(e) => setPharmacySlug(e.target.value)} className="mt-2 h-11 w-full rounded-lg border border-border bg-white px-3 text-sm font-bold text-foreground">
            {(pharmacies.length ? pharmacies : adminPharmacies).map((pharmacy) => <option key={pharmacy.slug} value={pharmacy.slug}>{pharmacy.name}</option>)}
          </select>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <Input type="file" accept=".csv,.xls,.xlsx,.docx,.pptx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setPreview(null); setSelectedLineNumbers(new Set()); }} />
          <Button variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={() => downloadImportTemplate(`modele-import-${pharmacySlug}.csv`)}>Télécharger modèle Excel</Button>
          <Button variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={previewImport} disabled={uploading}>{uploading ? "Analyse..." : "Analyser le fichier"}</Button>
          <Button className="bg-brand text-white hover:bg-brand-dark" onClick={uploadImport} disabled={uploading || !preview}>{uploading ? "Publication..." : "Publier les produits autorisés"}</Button>
        </div>
        {message && <p className="mt-3 rounded-lg border border-border bg-white p-3 text-sm font-bold text-foreground">{message}</p>}
        {preview && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Lignes détectées" value={preview.totalRows} badge="Aperçu" />
            <Stat label="Lignes valides" value={preview.validRows} badge="Confirmé" />
            <Stat label="À corriger" value={preview.incompleteRows + preview.invalidRows} badge="À vérifier" />
            <Stat label="Médicaments non reconnus" value={preview.unknownMedications} badge="Validation Admin" />
            <Stat label="Doublons" value={preview.duplicateRows} badge="Conflit" />
            <Stat label="Prix manquants" value={preview.missingPrices} badge="À compléter" />
            <Stat label="Statuts invalides" value={preview.invalidStatuses} badge="Normalisation" />
            <Stat label="Médicaments reconnus" value={preview.recognizedMedications} badge="Référentiel" />
            <Stat label="À publier" value={safePublishLineNumbers(preview).size} badge="Publication" />
            <Stat label="Interdits retirés" value={preview.prohibitedRows ?? 0} badge="Bloqué" />
          </div>
        )}
        {preview?.confirmableRows?.length ? (
          <ImportValidationPanel
            preview={preview}
            selectedLineNumbers={selectedLineNumbers}
            onSelectionChange={setSelectedLineNumbers}
          />
        ) : null}
      </Card>
      <AdminMediaUploadPanel pharmacySlug={pharmacySlug} />
      <WorkflowBoard
        title="Chaîne import → publication"
        description="Les lignes sûres peuvent être publiées automatiquement, les interdits sont retirés et les ambiguës restent en validation admin."
        items={[
          { title: "Import pharmacie", status: "Analyse", owner: "Moteur", detail: "Extraction multi-format, normalisation, doublons et statuts invalides." },
          { title: "Publication contrôlée", status: "Lignes sûres", owner: "Admin", detail: "Validation groupée avec retrait individuel des produits à masquer." },
          { title: "Référentiel", status: "À valider", owner: "Data", detail: "Les médicaments non reconnus créent une demande, pas un doublon automatique." },
          { title: "Marketplace", status: "Synchronisée", owner: "Utilisateur", detail: "Les produits publiés restent protégés par crédits côté utilisateur." },
        ]}
      />
    </div>
  );
}

function Field({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  placeholder?: string;
  type?: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold text-foreground">{label}</Label>
      <Input
        type={type}
        placeholder={placeholder ?? label}
        value={value}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        className="bg-white text-foreground placeholder:text-muted-foreground"
      />
    </div>
  );
}

function selectedPharmacy(slug?: string) {
  return adminPharmacies.find((pharmacy) => pharmacy.slug === slug) ?? adminPharmacies[0];
}

type AdminManagedPharmacy = ReturnType<typeof selectedPharmacy>;

function toManagedPharmacy(fallback: AdminManagedPharmacy, profile?: AdminPharmacyProfileData | null): AdminManagedPharmacy {
  if (!profile) return fallback;
  const duty = profile.isOnDuty ? "De garde" : profile.isOpen247 ? "Ouvert" : fallback.guard;
  return {
    ...fallback,
    slug: profile.slug || fallback.slug,
    name: profile.name || fallback.name,
    commune: profile.commune || fallback.commune,
    district: profile.district || fallback.district,
    status: profile.accountStatus || fallback.status,
    source: profile.creationSource || fallback.source,
    guard: duty,
    quality: profile.dataQuality || fallback.quality,
    manager: profile.managerName || fallback.manager,
    phone: profile.phone || fallback.phone,
    meds: profile.medicationCount ?? fallback.meds,
    updatedAt: profile.lastDataUpdate ? formatDateTime(profile.lastDataUpdate) : fallback.updatedAt,
    operationalStatus: duty,
  };
}

function useAdminPharmacyProfile(pharmacySlug?: string) {
  const fallback = selectedPharmacy(pharmacySlug);
  const [profile, setProfile] = useState<AdminPharmacyProfileData | null>(null);
  const [dashboard, setDashboard] = useState<AdminManagedDashboardSummary>(adminManagedDashboardFallback);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    if (!fallback?.slug) return;
    setLoading(true);
    setMessage("");
    try {
      const headers = { "x-sablin-session-kind": "admin" };
      const [profileRes, dashboardRes] = await Promise.all([
        fetch(`/api/pharmacy-platform/profile?pharmacySlug=${encodeURIComponent(fallback.slug)}`, { headers }),
        fetch(`/api/pharmacy-platform/dashboard-summary?pharmacySlug=${encodeURIComponent(fallback.slug)}`, { headers }),
      ]);
      const profileData = await profileRes.json().catch(() => ({}));
      const dashboardData = await dashboardRes.json().catch(() => ({}));
      if (!profileRes.ok) throw new Error(profileData?.error ?? "Profil pharmacie introuvable.");
      setProfile(profileData.profile ?? null);
      if (dashboardRes.ok) {
        setDashboard({ ...adminManagedDashboardFallback, ...dashboardData });
      } else {
        setDashboard(adminManagedDashboardFallback);
      }
    } catch (error) {
      setProfile(null);
      setDashboard(adminManagedDashboardFallback);
      setMessage(error instanceof Error ? error.message : "Chargement de la pharmacie impossible.");
    } finally {
      setLoading(false);
    }
  }, [fallback]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    fallback,
    profile,
    pharmacy: toManagedPharmacy(fallback, profile),
    dashboard,
    loading,
    message,
    reload: load,
  };
}

function PharmacySelector({ currentSlug }: { currentSlug?: string }) {
  const [rows, setRows] = useState<Array<{ slug: string; name: string; commune?: string | null; accountStatus?: string | null }>>([]);
  const [loading, setLoading] = useState(false);
  const fallbackRows = adminPharmacies.map((pharmacy) => ({
    slug: pharmacy.slug,
    name: pharmacy.name,
    commune: pharmacy.commune,
    accountStatus: pharmacy.status,
  }));
  const options = rows.length ? rows : fallbackRows;
  const activeSlug = options.some((pharmacy) => pharmacy.slug === currentSlug) ? currentSlug : options[0]?.slug;

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch("/api/pharmacy-platform/pharmacies?accountStatus=all&publicationStatus=all", {
      headers: { "x-sablin-session-kind": "admin" },
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (active && ok) setRows(data.pharmacies ?? []);
      })
      .catch(() => {
        if (active) setRows([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="rounded-xl border border-border bg-white p-3">
      <Label className="text-xs font-extrabold text-foreground">Sélectionner une pharmacie à gérer</Label>
      <select
        value={activeSlug}
        onChange={(event) => {
          window.location.href = `/admin/pharmacies/${event.target.value}/dashboard`;
        }}
        className="mt-2 h-10 w-full rounded-lg border border-border bg-white px-3 text-sm font-bold text-foreground outline-none focus:border-brand"
      >
        {options.map((pharmacy) => (
          <option key={pharmacy.slug} value={pharmacy.slug}>
            {pharmacy.name}{pharmacy.accountStatus ? ` · ${pharmacy.accountStatus}` : ""}
          </option>
        ))}
      </select>
      {loading && <p className="mt-1 text-xs font-semibold text-muted-foreground">Chargement base...</p>}
    </div>
  );
}

function AdminShell({ page, pharmacyId, children }: { page: AdminPage; pharmacyId?: string; children: React.ReactNode }) {
  const logout = async () => {
    await fetch("/api/admin-auth/logout", { method: "POST" });
    window.location.href = "/admin/login";
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-4">
            <Logo size={46} />
            <div>
              <Badge className="border-0 bg-brand text-white">Administration SABLIN</Badge>
              <h1 className="mt-1 text-xl font-extrabold text-foreground">Plateforme maître multi-pharmacies</h1>
              <p className="text-sm text-muted-foreground">Toutes pharmacies · Tous utilisateurs · Crédits · Données · Qualité</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <PharmacySelector currentSlug={pharmacyId} />
            <LogoutConfirmDialog onConfirm={logout}>
              <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
                <LogOut className="size-4" /> Déconnexion
              </Button>
            </LogoutConfirmDialog>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[270px_minmax(0,1fr)] lg:px-8">
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <Card className="border-border/70 p-2 shadow-card">
            <nav className="grid gap-1">
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <a key={item.page} href={item.href} className={cn("flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold transition-colors", page === item.page ? "bg-brand text-white" : "text-foreground/75 hover:bg-accent")}>
                    <Icon className="size-4 shrink-0" />
                    {item.label}
                  </a>
                );
              })}
            </nav>
            <div className="mt-3 rounded-lg border border-brand/20 bg-brand-light/50 p-3">
              <p className="text-xs font-extrabold uppercase text-brand-dark">Mode gestion pharmacie</p>
              <p className="mt-1 text-xs font-semibold text-brand-dark">L’admin gère une pharmacie sélectionnée sans créer de session pharmacie.</p>
            </div>
          </Card>
        </aside>
        <main className="min-w-0 space-y-5">
          {children}
        </main>
      </div>
    </div>
  );
}

async function adminLogin(role = "Administrateur SABLIN") {
  await fetch("/api/admin-auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role, demo: true }),
  });
  window.location.href = "/admin/dashboard";
}

function AdminLogin() {
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const restricted = params?.get("restricted") === "admin";
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto grid min-h-screen max-w-5xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:items-center">
        <section>
          <Logo size={60} />
          <p className="mt-6 text-xs font-extrabold uppercase tracking-wide text-brand">Administration SABLIN PHARMA</p>
          <Heading level="h1" className="mt-2 text-3xl sm:text-4xl">Administration SABLIN PHARMA</Heading>
          <Muted className="mt-3">Accès réservé à l’équipe interne. Gestion globale des pharmacies, utilisateurs, crédits et données.</Muted>
          {restricted && <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">Accès réservé à l’administration SABLIN PHARMA.</p>}
        </section>
        <Card className="border-border/70 p-5 shadow-card">
          <Field label="Email administrateur" placeholder="admin@sablinpharma.ci" />
          <div className="mt-3"><Field label="Mot de passe" placeholder="Mot de passe interne" /></div>
          <Button className="mt-4 h-11 w-full bg-brand text-white hover:bg-brand-dark" onClick={() => adminLogin()}>Se connecter</Button>
          <Button variant="outline" className="mt-3 w-full border-brand/30 text-brand-dark hover:bg-brand-light" onClick={() => adminLogin("Super administrateur")}>Démo super administrateur</Button>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, badge }: { label: string; value: string | number; badge: string }) {
  return (
    <Card className="border-border/70 p-4 shadow-card">
      <StatusBadge label={badge} />
      <p className="mt-4 text-2xl font-extrabold text-foreground">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </Card>
  );
}

function Dashboard() {
  const [summary, setSummary] = useState<AdminDashboardSummary>(adminDashboardFallback);
  const [loadingSummary, setLoadingSummary] = useState(true);

  useEffect(() => {
    let active = true;
    setLoadingSummary(true);
    fetch("/api/admin/dashboard-summary", {
      headers: { "x-sablin-session-kind": "admin" },
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (active && ok) setSummary({ ...adminDashboardFallback, ...data });
      })
      .catch(() => {
        if (active) setSummary(adminDashboardFallback);
      })
      .finally(() => {
        if (active) setLoadingSummary(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const stats = [
    ["Nombre total d’utilisateurs", summary.totalUsers, "Actif"],
    ["Utilisateurs actifs", summary.activeUsers, "Actif"],
    ["Utilisateurs avec crédits", summary.usersWithCredits, "Crédits SABLIN"],
    ["Total des crédits vendus", summary.totalCreditsSold.toLocaleString("fr-FR"), "Confirmé"],
    ["Transactions du jour", summary.transactionsToday, "Réussi"],
    ["Nombre total de pharmacies", summary.totalPharmacies, "Toutes pharmacies"],
    ["Pharmacies validées", summary.validatedPharmacies, "Validée"],
    ["Pharmacies en attente", summary.pendingPharmacies, "En attente"],
    ["Pharmacies suspendues", summary.suspendedPharmacies, "Suspendue"],
    ["Médicaments référencés", summary.referencedMedications, "Actif"],
    ["Demandes d’ajout médicament", summary.medicationRequestsPending, "En attente"],
    ["Imports récents", summary.recentImports, "Import réussi"],
    ["Données anciennes", summary.staleData, "Données anciennes"],
    ["Confirmations en attente", summary.pendingConfirmations, "En cours"],
    ["Demandes utilisateurs en attente", summary.pendingUserRequests, "Nouvelle"],
    ["Qualité globale des données", `${summary.dataQualityPercent}%`, "Données à jour"],
  ];

  return (
    <div className="space-y-6">
      <AdminHero
        badge="Administration centrale"
        title="Centre de contrôle SABLIN PHARMA"
        description="Plateforme maître : plusieurs pharmacies, plusieurs utilisateurs, crédits, paiements, marketplace, qualité des données et publication utilisateur depuis une seule base contrôlée."
        icon={LayoutDashboard}
        actions={
          <>
            <Button variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={() => window.location.reload()}>
              <RefreshCw className="size-4" /> Actualiser
            </Button>
            <Button className="bg-brand text-white hover:bg-brand-dark" onClick={() => (window.location.href = "/admin/pharmacies/nouveau")}>Créer une pharmacie</Button>
          </>
        }
      >
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <p className="text-xs font-extrabold uppercase text-muted-foreground">Priorité du jour</p>
            <p className="mt-1 font-bold text-foreground">Valider les pharmacies en attente et publier les lignes sûres des imports.</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <p className="text-xs font-extrabold uppercase text-muted-foreground">Règle sécurité</p>
            <p className="mt-1 font-bold text-foreground">Aucun crédit, pass ou stock visible sans droit confirmé côté serveur.</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <p className="text-xs font-extrabold uppercase text-muted-foreground">Marketplace</p>
            <p className="mt-1 font-bold text-foreground">Images web et descriptions restent bloquées avant validation admin.</p>
          </div>
        </div>
      </AdminHero>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, value, badge]) => (
          <Stat key={String(label)} label={String(label)} value={loadingSummary ? "..." : value} badge={String(badge)} />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionBlock title="Santé exécutive de la plateforme" description="Lecture rapide des quatre piliers de SABLIN PHARMA avant décision opérationnelle.">
          <div className="grid gap-3 md:grid-cols-2">
            {adminExecutivePillars.map((pillar) => (
              <Card key={pillar.title} className="border-border/70 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <StatusBadge label={pillar.status} />
                    <p className="mt-3 font-extrabold text-foreground">{pillar.title}</p>
                  </div>
                  <p className="text-2xl font-extrabold text-brand-dark">{pillar.score}</p>
                </div>
                <p className="mt-2 text-sm font-medium text-muted-foreground">{pillar.detail}</p>
              </Card>
            ))}
          </div>
        </SectionBlock>
        <SectionBlock title="File prioritaire" description="Actions à traiter en premier pour garder les trois plateformes synchronisées.">
          <div className="grid gap-3">
            {adminPriorityQueue.map((item) => (
              <a key={item.title} href={item.href} className="rounded-lg border border-border bg-white p-3 transition-colors hover:border-brand/40">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-extrabold text-foreground">{item.title}</p>
                  <StatusBadge label={item.status} />
                </div>
                <p className="mt-1 text-sm font-bold text-brand-dark">{item.value}</p>
              </a>
            ))}
          </div>
        </SectionBlock>
      </div>
    </div>
  );
}

function PharmaciesList() {
  const [pharmacies, setPharmacies] = useState<AdminPharmacyListRow[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [query, setQuery] = useState("");
  const [commune, setCommune] = useState("");
  const [accountStatus, setAccountStatus] = useState("all");
  const [publicationStatus, setPublicationStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const params = new URLSearchParams({
        q: query,
        commune,
        accountStatus,
        publicationStatus,
      });
      const res = await fetch(`/api/pharmacy-platform/pharmacies?${params}`, { headers: { "x-sablin-session-kind": "admin" } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Chargement des pharmacies impossible.");
      setPharmacies(data.pharmacies ?? []);
      setSummary(data.summary ?? {});
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Chargement des pharmacies impossible.");
    } finally {
      setLoading(false);
    }
  }, [accountStatus, commune, publicationStatus, query]);

  useEffect(() => {
    void load();
  }, [load]);

  const resetFilters = () => {
    setQuery("");
    setCommune("");
    setAccountStatus("all");
    setPublicationStatus("all");
  };

  return (
    <div className="space-y-5">
      <AdminHero
        badge="Multi-pharmacies"
        title="Pharmacies"
        description="Liste globale, validation, suspension, publication, qualité des données et accès au mode gestion pharmacie sans créer de session pharmacie."
        icon={Building2}
        actions={<Button className="bg-brand text-white hover:bg-brand-dark" onClick={() => (window.location.href = "/admin/pharmacies/nouveau")}>Créer une pharmacie</Button>}
      />
      <MetricsGrid
        metrics={[
          { label: "Pharmacies", value: summary.total ?? 0, status: `${summary.visible ?? pharmacies.length} affichée(s)`, icon: Building2 },
          { label: "Validées", value: summary.validated ?? 0, status: "Publication possible", icon: CheckCircle2 },
          { label: "En attente", value: summary.pending ?? 0, status: "Contrôle requis", icon: AlertTriangle },
          { label: "Suspendues", value: summary.suspended ?? 0, status: "Bloquées", icon: LockKeyhole },
          { label: "Publiées", value: summary.published ?? 0, status: "Visible utilisateur", icon: Database },
          { label: "Avec photo publique", value: summary.withPublicMedia ?? 0, status: "Logo/façade validés", icon: ImageIcon },
        ]}
      />
      <Card className="border-border/70 p-5 shadow-card">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_180px_220px_180px_auto_auto]">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Recherche nom, commune, responsable, téléphone" className="bg-white" />
          <Input value={commune} onChange={(event) => setCommune(event.target.value)} placeholder="Commune" className="bg-white" />
          <select value={accountStatus} onChange={(event) => setAccountStatus(event.target.value)} className="h-10 rounded-lg border border-border bg-white px-3 text-sm font-bold text-foreground">
            <option value="all">Tous statuts</option>
            <option value="pending">En attente / incomplète</option>
            {["Validée", "En attente", "En attente de validation", "Refusée", "Suspendue", "Incomplète"].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select value={publicationStatus} onChange={(event) => setPublicationStatus(event.target.value)} className="h-10 rounded-lg border border-border bg-white px-3 text-sm font-bold text-foreground">
            <option value="all">Publication</option>
            {["Publiée", "Non publiée", "Brouillon"].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <Button onClick={load} disabled={loading} className="bg-brand text-white hover:bg-brand-dark">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            Actualiser
          </Button>
          <Button variant="outline" onClick={resetFilters}>Réinitialiser</Button>
        </div>
        {message && <p className="mt-3 rounded-lg border border-border bg-white p-3 text-sm font-bold text-foreground">{message}</p>}
        {loading && <p className="mt-4 rounded-lg border border-border bg-muted/30 p-3 text-sm font-bold text-muted-foreground">Chargement des pharmacies depuis la base...</p>}
      <div className="mt-4 overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[1180px] text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>{["Pharmacie", "Commune", "Responsable", "Téléphone interne", "Validation", "Publication/Garde", "Médicaments", "Photos", "Mise à jour", "Qualité", "Actions"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border bg-white">
            {pharmacies.map((p) => (
              <tr key={p.slug}>
                <td className="px-4 py-3 font-bold text-foreground">{p.name}<p className="text-xs font-normal text-muted-foreground">{p.district}</p></td>
                <td className="px-4 py-3">{p.commune}</td>
                <td className="px-4 py-3">{p.managerName ?? "Responsable à compléter"}</td>
                <td className="px-4 py-3">{p.phone ?? "Téléphone interne absent"}</td>
                <td className="px-4 py-3"><StatusBadge label={p.accountStatus} /></td>
                <td className="px-4 py-3"><div className="flex flex-wrap gap-1"><StatusBadge label={p.publicationStatus} />{p.isOnDuty && <StatusBadge label="De garde" />}{p.isOpen247 && <StatusBadge label="24h/24" />}</div></td>
                <td className="px-4 py-3">{p.medicationCount}</td>
                <td className="px-4 py-3">{p.publicMediaCount} publique(s)</td>
                <td className="px-4 py-3">{formatDateTime(p.lastDataUpdate)}</td>
                <td className="px-4 py-3"><StatusBadge label={p.dataQuality} /></td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" className="bg-brand text-white" onClick={() => (window.location.href = `/admin/pharmacies/${p.slug}/dashboard`)}>Gérer cette pharmacie</Button>
                    <Button size="sm" variant="outline" onClick={() => (window.location.href = `/admin/pharmacies/${p.slug}`)}>Voir détail</Button>
                    {p.accountStatus !== "Validée" && (
                      <ProfessionalActionButton action="validate-pharmacy" label="Valider" pharmacySlug={p.slug} size="sm" variant="outline" className="border-brand/30 text-brand-dark">
                        Valider
                      </ProfessionalActionButton>
                    )}
                    <ProfessionalActionButton action="suspend-pharmacy" label="Suspendre" pharmacySlug={p.slug} size="sm" variant="outline" className="border-red-300 text-red-700">
                      Suspendre
                    </ProfessionalActionButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!loading && pharmacies.length === 0 && <p className="mt-4 rounded-lg border border-dashed border-border p-6 text-center text-sm font-bold text-foreground">Aucune pharmacie ne correspond aux filtres.</p>}
      </Card>
      <WorkflowBoard
        title="Cycle de contrôle pharmacie"
        description="Une pharmacie ne devient visible côté utilisateur qu’après validation et publication contrôlée."
        items={[
          { title: "Inscription ou création admin", status: "En attente", owner: "Admin", detail: "Vérifier identité, responsable, téléphone, commune, quartier et adresse." },
          { title: "Photos et documents", status: "À vérifier", owner: "Qualité", detail: "Publier uniquement logo/façade/couverture validés, garder les documents internes côté admin." },
          { title: "Horaires et garde", status: "Synchronisation", owner: "Pharmacie", detail: "Alimente pharmacies ouvertes et pharmacies de garde côté utilisateur." },
          { title: "Publication utilisateur", status: "Validée", owner: "Admin", detail: "Seules les pharmacies validées et non suspendues sont publiées." },
        ]}
      />
    </div>
  );
}

const createPharmacyModes = [
  { id: "fiche", label: "Créer seulement la fiche pharmacie" },
  { id: "account", label: "Créer la fiche + créer un compte pharmacie" },
  { id: "managed", label: "Créer la fiche + gérer les données lui-même" },
  { id: "invite", label: "Créer la fiche + envoyer une invitation à la pharmacie" },
] as const;

type CreatePharmacyForm = {
  name: string;
  managerName: string;
  managerRole: string;
  phone: string;
  whatsapp: string;
  email: string;
  commune: string;
  district: string;
  address: string;
  authorizationNumber: string;
  latitude: string;
  longitude: string;
  landmark: string;
  coverageZone: string;
  imageUrl: string;
  hoursWeekday: string;
  hoursSaturday: string;
  hoursSunday: string;
  specialHoursMessage: string;
  isOnDuty: string;
  dutyPeriod: string;
  servicesCsv: string;
  internalNotes: string;
  mode: (typeof createPharmacyModes)[number]["id"];
};

const emptyCreatePharmacyForm: CreatePharmacyForm = {
  name: "",
  managerName: "",
  managerRole: "",
  phone: "",
  whatsapp: "",
  email: "",
  commune: "",
  district: "",
  address: "",
  authorizationNumber: "",
  latitude: "",
  longitude: "",
  landmark: "",
  coverageZone: "",
  imageUrl: "",
  hoursWeekday: "08:00 - 22:00",
  hoursSaturday: "08:00 - 20:00",
  hoursSunday: "09:00 - 13:00",
  specialHoursMessage: "",
  isOnDuty: "false",
  dutyPeriod: "",
  servicesCsv: "paiement mobile, conseil pharmaceutique, parapharmacie",
  internalNotes: "",
  mode: "fiche",
};

function CreatePharmacy() {
  const [form, setForm] = useState<CreatePharmacyForm>(emptyCreatePharmacyForm);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");

  const update = (key: keyof CreatePharmacyForm) => (value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = async () => {
    setMessage("");
    const required = [
      ["name", "Nom de la pharmacie"],
      ["managerName", "Nom du pharmacien responsable"],
      ["managerRole", "Fonction du responsable"],
      ["phone", "Téléphone professionnel"],
      ["commune", "Commune"],
      ["district", "Quartier"],
      ["address", "Adresse complète"],
    ] as const;
    const missing = required.filter(([key]) => !form[key].trim()).map(([, label]) => label);
    if (missing.length) {
      setMessage(`Champs obligatoires manquants : ${missing.join(", ")}.`);
      return;
    }

    setCreating(true);
    try {
      const selectedMode = createPharmacyModes.find((mode) => mode.id === form.mode)?.label ?? createPharmacyModes[0].label;
      const res = await fetch("/api/pharmacy-platform/pharmacies", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Sablin-Session-Kind": "admin" },
        body: JSON.stringify({
          name: form.name,
          managerName: form.managerName,
          managerRole: form.managerRole,
          phone: form.phone,
          whatsapp: form.whatsapp || form.phone,
          email: form.email,
          commune: form.commune,
          district: form.district,
          quartier: form.district,
          address: form.address,
          authorizationNumber: form.authorizationNumber,
          latitude: form.latitude ? Number(form.latitude) : undefined,
          longitude: form.longitude ? Number(form.longitude) : undefined,
          landmark: form.landmark,
          coverageZone: form.coverageZone,
          imageUrl: form.imageUrl,
          hoursWeekday: form.hoursWeekday,
          hoursSaturday: form.hoursSaturday,
          hoursSunday: form.hoursSunday,
          specialHoursMessage: form.specialHoursMessage,
          isOnDuty: form.isOnDuty === "true",
          dutyPeriod: form.dutyPeriod,
          servicesCsv: form.servicesCsv,
          creationSource: "Création administrateur",
          accountStatus: "En attente de validation",
          publishProvisional: false,
          internalNotes: `${selectedMode}. ${form.internalNotes}`.trim(),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Création impossible.");
      setMessage(`Pharmacie créée : ${data.pharmacy.name}. Statut : En attente de validation. Elle ne sera publiée côté utilisateur qu’après validation admin.`);
      setForm(emptyCreatePharmacyForm);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Création impossible.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card className="border-border/70 p-5 shadow-card">
        <Heading level="h2">Créer une pharmacie</Heading>
        <Muted>Création centrale depuis Admin : données publiques contrôlées, données internes protégées, publication après validation.</Muted>
        <div className="mt-4">
          <ProfileSteps />
        </div>
      </Card>
      <SectionBlock title="Étape 1 : informations générales" description="Champs minimums pour créer une fiche pharmacie fiable.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Nom de la pharmacie" value={form.name} onChange={update("name")} />
          <Field label="Nom du pharmacien responsable" value={form.managerName} onChange={update("managerName")} />
          <Field label="Fonction du responsable" value={form.managerRole} onChange={update("managerRole")} />
          <Field label="Téléphone professionnel" value={form.phone} onChange={update("phone")} />
          <Field label="WhatsApp professionnel" value={form.whatsapp} onChange={update("whatsapp")} />
          <Field label="Email professionnel" value={form.email} onChange={update("email")} />
          <Field label="Commune" value={form.commune} onChange={update("commune")} />
          <Field label="Quartier" value={form.district} onChange={update("district")} />
          <Field label="Adresse complète" value={form.address} onChange={update("address")} />
          <Field label="Numéro d’autorisation / agrément" value={form.authorizationNumber} onChange={update("authorizationNumber")} />
        </div>
      </SectionBlock>
      <SectionBlock title="Étape 2 : localisation" description="Ces informations alimentent distance, itinéraire, pharmacies proches et recherche par commune.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Point GPS latitude" value={form.latitude} onChange={update("latitude")} />
          <Field label="Point GPS longitude" value={form.longitude} onChange={update("longitude")} />
          <Field label="Repère connu" value={form.landmark} onChange={update("landmark")} />
          <Field label="Zone de couverture" value={form.coverageZone} onChange={update("coverageZone")} />
        </div>
      </SectionBlock>
      <SectionBlock title="Étape 3 : photos & documents" description="Les documents d’autorisation restent admin uniquement.">
        <Field label="URL image publique initiale" placeholder="Logo, façade ou couverture validée" value={form.imageUrl} onChange={update("imageUrl")} />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {PHARMACY_IMAGE_FIELDS.map((image) => (
            <Card key={image.label} className="border-border/70 p-3">
              <p className="font-bold text-foreground">{image.label}</p>
              <p className="text-sm text-muted-foreground">{image.usage}</p>
              <div className="mt-2"><StatusBadge label={image.visibility} /></div>
            </Card>
          ))}
        </div>
      </SectionBlock>
      <SectionBlock title="Étape 4 : horaires, garde et services" description="Les horaires alimentent les pharmacies ouvertes et de garde côté utilisateur.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Horaires semaine" value={form.hoursWeekday} onChange={update("hoursWeekday")} />
          <Field label="Horaires samedi" value={form.hoursSaturday} onChange={update("hoursSaturday")} />
          <Field label="Horaires dimanche" value={form.hoursSunday} onChange={update("hoursSunday")} />
          <Field label="Période de garde" value={form.dutyPeriod} onChange={update("dutyPeriod")} />
          <label className="text-sm font-semibold text-foreground">
            Statut de garde
            <select value={form.isOnDuty} onChange={(event) => update("isOnDuty")(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-border bg-white px-3 text-sm font-bold text-foreground">
              <option value="false">Pas de garde</option>
              <option value="true">De garde</option>
            </select>
          </label>
          <Field label="Message horaires spécial" value={form.specialHoursMessage} onChange={update("specialHoursMessage")} />
          <Field label="Services disponibles" value={form.servicesCsv} onChange={update("servicesCsv")} />
        </div>
        <div className="mt-4"><PillList items={PHARMACY_SERVICES} /></div>
      </SectionBlock>
      <SectionBlock title="Étape 5 : médicaments et publication" description="Le stock exact reste interne. Le public voit uniquement Disponible, Stock faible, Rupture ou À confirmer.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <Card className="border-border/70 p-4">
            <p className="font-extrabold text-foreground">Après création</p>
            <p className="mt-1 text-sm font-medium text-muted-foreground">Ajoutez les médicaments depuis le mode gestion pharmacie ou importez un inventaire Excel/CSV.</p>
          </Card>
          <Card className="border-border/70 p-4">
            <p className="font-extrabold text-foreground">Publication contrôlée</p>
            <p className="mt-1 text-sm font-medium text-muted-foreground">Les médicaments interdits sont retirés automatiquement. Les lignes ambiguës restent en validation Admin.</p>
          </Card>
          <Card className="border-border/70 p-4">
            <p className="font-extrabold text-foreground">Côté utilisateur</p>
            <p className="mt-1 text-sm font-medium text-muted-foreground">Disponibilités, prix détaillés et liste des médicaments restent verrouillés par crédits.</p>
          </Card>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">{PUBLIC_AVAILABILITY_STATUSES.map((s) => <StatusBadge key={s} label={s} />)}{DATA_SOURCES.map((s) => <StatusBadge key={s} label={s} />)}{RELIABILITY_LEVELS.map((s) => <StatusBadge key={s} label={s} />)}</div>
      </SectionBlock>
      <SectionBlock title="Étape 6 : validation admin" description="Choisir la source, le statut et le mode de création.">
        <div className="flex flex-wrap gap-2">{PHARMACY_ACCOUNT_STATUSES.map((s) => <StatusBadge key={s} label={s} />)}</div>
        <div className="mt-3 flex flex-wrap gap-2">{PHARMACY_CREATION_SOURCES.map((s) => <StatusBadge key={s} label={s} />)}</div>
        <Textarea className="mt-4" value={form.internalNotes} onChange={(event) => update("internalNotes")(event.target.value)} placeholder="Note interne, motif de validation, refus ou suspension..." />
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {createPharmacyModes.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setForm((current) => ({ ...current, mode: item.id }))}
              className={cn(
                "rounded-xl border bg-white p-4 text-left font-bold text-foreground hover:border-brand/40",
                form.mode === item.id ? "border-brand bg-brand-light/50 text-brand-dark" : "border-border"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <Button className="mt-5 bg-brand text-white hover:bg-brand-dark" onClick={submit} disabled={creating}>{creating ? "Création..." : "Créer la pharmacie"}</Button>
        {message && <p className="mt-4 rounded-xl border border-border bg-white p-4 text-sm font-bold text-foreground">{message}</p>}
      </SectionBlock>
    </div>
  );
}

function PharmacyDetail({ pharmacyId }: { pharmacyId?: string }) {
  const { pharmacy, profile, dashboard, loading, message, reload } = useAdminPharmacyProfile(pharmacyId);
  const actions = [
    { label: "Statut de validation", action: "validate-pharmacy" },
    { label: "Qualité des données", action: "mark-data-quality", payload: { dataQuality: "Données à jour" } },
    { label: "Horaires", action: "schedule-save" },
    { label: "Garde", action: "toggle-duty" },
    { label: "Documents justificatifs", action: "review-documents" },
    { label: "Notes internes", action: "update-internal-note" },
    { label: "Créer accès pharmacie", action: "create-pharmacy-account" },
    { label: "Publier ou retirer côté utilisateur", action: "publish-pharmacy" },
    { label: "Motif de refus", action: "refuse-pharmacy" },
    { label: "Motif de suspension", action: "suspend-pharmacy" },
    { label: "Score qualité des données", action: "mark-data-quality", payload: { dataQuality: "Données à jour" } },
  ];
  return (
    <div className="space-y-5">
      <Card className="border-border/70 p-5 shadow-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap gap-2"><StatusBadge label={pharmacy.status} /><StatusBadge label={pharmacy.quality} /><StatusBadge label={pharmacy.source} /></div>
            <Heading level="h2" className="mt-3">{pharmacy.name}</Heading>
            <Muted>{pharmacy.commune} · {pharmacy.district} · Responsable : {pharmacy.manager}</Muted>
          </div>
          <Button className="bg-brand text-white hover:bg-brand-dark" onClick={() => (window.location.href = `/admin/pharmacies/${pharmacy.slug}/dashboard`)}>Gérer comme cette pharmacie</Button>
        </div>
        {loading && <p className="mt-4 rounded-lg border border-border bg-muted/30 p-3 text-sm font-bold text-muted-foreground">Chargement du profil depuis la base...</p>}
        {message && <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-800">{message}</p>}
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Médicaments" value={dashboard.medicationCount || pharmacy.meds} badge="Données pharmacie" />
          <Stat label="Dernière mise à jour" value={dashboard.lastDataUpdateLabel || pharmacy.updatedAt} badge={pharmacy.quality} />
          <Stat label="Demandes reçues" value={dashboard.receivedRequests} badge="En cours" />
          <Stat label="Confirmations" value={dashboard.pendingConfirmations} badge="En attente" />
          <Stat label="Photos publiques chargées" value={profile?.mediaCount ?? 0} badge="Photos" />
          <Stat label="Score complétude" value={`${profile?.completenessScore ?? dashboard.dataQualityPercent}%`} badge="Qualité" />
        </div>
      </Card>
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border/70 p-5 shadow-card">
          <Heading level="h3">Informations générales et actions administratives</Heading>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {[
              ["Téléphone interne", profile?.phone ?? pharmacy.phone],
              ["WhatsApp interne", profile?.whatsapp ?? "Non renseigné"],
              ["Email professionnel", profile?.professionalEmail ?? "Non renseigné"],
              ["Adresse complète", profile?.address ?? "Adresse à compléter"],
              ["GPS", profile?.latitude && profile?.longitude ? `${profile.latitude}, ${profile.longitude}` : "GPS à compléter"],
              ["Publication", profile?.publicationStatus ?? "Non publiée"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-xs font-extrabold uppercase text-muted-foreground">{label}</p>
                <p className="mt-1 break-words text-sm font-bold text-foreground">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {actions.map((item) => (
              <ProfessionalActionButton
                key={item.label}
                action={item.action}
                label={item.label}
                pharmacySlug={pharmacy.slug}
                payload={item.payload}
                onSuccess={() => void reload()}
                variant="outline"
                className="justify-start border-brand/30 text-brand-dark hover:bg-brand-light"
              >
                {item.label}
              </ProfessionalActionButton>
            ))}
          </div>
        </Card>
        <Card className="border-border/70 p-5 shadow-card">
          <Heading level="h3">Modules de cette pharmacie</Heading>
          <div className="mt-4 grid gap-2">
            {managementNav.map((item) => <a key={item.mode} className="rounded-lg border border-border bg-white px-3 py-2 text-sm font-bold text-foreground hover:border-brand/40" href={item.href(pharmacy.slug)}>{item.label}</a>)}
          </div>
        </Card>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <SectionBlock title="Données publiques validables" description="Ces informations peuvent apparaître côté utilisateur après contrôle.">
          <PillList items={PUBLIC_PHARMACY_DATA} />
        </SectionBlock>
        <SectionBlock title="Données internes protégées" description="Ces informations restent côté pharmacie et admin, jamais gratuites côté utilisateur.">
          <PillList items={INTERNAL_PHARMACY_DATA} />
        </SectionBlock>
      </div>
      <SectionBlock title="Alimentation de la plateforme utilisateur" description="Règles de publication applicables uniquement aux pharmacies validées.">
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {USER_VISIBLE_MAPPING.map(([source, target]) => (
            <div key={source} className="rounded-lg border border-border bg-white p-3">
              <p className="text-sm font-extrabold text-foreground">{source}</p>
              <p className="text-xs font-semibold text-muted-foreground">{target}</p>
            </div>
          ))}
        </div>
      </SectionBlock>
      <AdminMediaUploadPanel pharmacySlug={pharmacy.slug} helper="Chargez ici les photos publiques validées, les photos des locaux ou les documents admin de cette pharmacie." />
    </div>
  );
}

function ModeBanner({ pharmacy, mode }: { pharmacy: AdminManagedPharmacy; mode: AdminPharmacyMode }) {
  return (
    <Card className="border-brand/20 bg-brand-light/50 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap gap-2"><StatusBadge label="Mode gestion pharmacie" /><StatusBadge label={pharmacy.status} /><StatusBadge label={pharmacy.quality} /></div>
          <h2 className="mt-2 text-xl font-extrabold text-foreground">{pharmacy.name}</h2>
          <p className="text-sm font-semibold text-brand-dark">Admin actif sur {mode}. Aucune session pharmacie n’est créée.</p>
        </div>
        <Button variant="outline" className="border-brand/30 text-brand-dark hover:bg-white" onClick={() => (window.location.href = `/admin/pharmacies/${pharmacy.slug}`)}>Retour détail pharmacie</Button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {managementNav.map((item) => <a key={item.mode} href={item.href(pharmacy.slug)} className={cn("rounded-full border px-3 py-1.5 text-xs font-extrabold", item.mode === mode ? "border-brand bg-brand text-white" : "border-brand/30 bg-white text-brand-dark")}>{item.label}</a>)}
      </div>
    </Card>
  );
}

function AdminPharmacyModeView({ pharmacyId, mode }: { pharmacyId?: string; mode: AdminPharmacyMode }) {
  const { pharmacy, dashboard, loading, message } = useAdminPharmacyProfile(pharmacyId);
  return (
    <div className="space-y-5">
      <ModeBanner pharmacy={pharmacy} mode={mode} />
      {mode === "dashboard" && (
        <AdminManagedPharmacyDashboard
          pharmacy={pharmacy}
          dashboard={dashboard}
          loading={loading}
          message={message}
        />
      )}
      {mode === "medicaments" && <AdminMedicationManagement pharmacySlug={pharmacy.slug} />}
      {mode === "import-inventaire" && <AdminImportForPharmacy pharmacySlug={pharmacy.slug} pharmacyName={pharmacy.name} />}
      {mode === "synchronisation-inventaire" && (
        <div className="space-y-5">
          <InventorySyncPanel kind="admin" pharmacySlug={pharmacy.slug} />
        </div>
      )}
      {mode === "demandes" && <ProfessionalRequestsPanel kind="admin" pharmacySlug={pharmacy.slug} />}
      {mode === "confirmations" && <AdminPharmacyConfirmationsPanel pharmacy={pharmacy} />}
      {mode === "horaires-garde" && <ScheduleAdmin pharmacySlug={pharmacy.slug} />}
      {mode === "profil" && <PharmacyAdminProfilePanel pharmacy={pharmacy} />}
      {mode === "photos" && (
        <AdminMediaUploadPanel
          pharmacySlug={pharmacy.slug}
          helper="Chargez et contrôlez les images publiques de cette pharmacie. Les documents d’autorisation restent visibles uniquement par l’administration."
        />
      )}
      {mode === "equipe" && <AdminPharmacyTeamPanel pharmacySlug={pharmacy.slug} pharmacyName={pharmacy.name} />}
      {mode === "historique" && <AdminPharmacyHistoryPanel pharmacy={pharmacy} />}
    </div>
  );
}

function AdminManagedPharmacyDashboard({
  pharmacy,
  dashboard,
  loading,
  message,
}: {
  pharmacy: AdminManagedPharmacy;
  dashboard: AdminManagedDashboardSummary;
  loading: boolean;
  message: string;
}) {
  return (
    <div className="space-y-5">
      {message && <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">{message}</p>}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Médicaments de cette pharmacie" value={loading ? "..." : dashboard.medicationCount || pharmacy.meds} badge="Données pharmacie" />
        <Stat label="Disponibilités à mettre à jour" value={loading ? "..." : dashboard.staleAvailabilityCount} badge="À vérifier" />
        <Stat label="Demandes reçues" value={loading ? "..." : dashboard.receivedRequests} badge="Nouvelle" />
        <Stat label="Confirmations en attente" value={loading ? "..." : dashboard.pendingConfirmations} badge="En cours" />
        <Stat label="Demandes en cours" value={loading ? "..." : dashboard.pendingRequests} badge="Traitement" />
        <Stat label="Prix à vérifier" value={loading ? "..." : dashboard.priceToCheck} badge="Prix indicatifs" />
        <Stat label="Statut de garde" value={loading ? "..." : dashboard.dutyStatus} badge={dashboard.dutyStatus === "Actif" ? "De garde" : pharmacy.guard} />
        <Stat label="Qualité des données" value={loading ? "..." : `${dashboard.dataQualityPercent}%`} badge={pharmacy.quality} />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/70 p-5 shadow-card">
          <Heading level="h3">Priorités opérationnelles</Heading>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {[
              ["Disponibilités anciennes", `${dashboard.staleAvailabilityCount} ligne(s) à corriger`, "Ouvrir les médicaments"],
              ["Confirmations utilisateurs", `${dashboard.pendingConfirmations} demande(s) à traiter`, "Ouvrir confirmations"],
              ["Prix indicatifs", `${dashboard.priceToCheck} prix à contrôler`, "Corriger les prix"],
              ["Dernière mise à jour", dashboard.lastDataUpdateLabel, "Voir historique"],
            ].map(([title, detail, action]) => (
              <div key={title} className="rounded-xl border border-border bg-white p-4">
                <p className="font-extrabold text-foreground">{title}</p>
                <p className="mt-1 text-sm font-semibold text-muted-foreground">{detail}</p>
                <p className="mt-3 text-xs font-extrabold uppercase text-brand-dark">{action}</p>
              </div>
            ))}
          </div>
        </Card>
        <ControlChecklist
          title="Synchronisation utilisateur"
          items={[
            "Pharmacie validée avant publication côté utilisateur",
            "Contacts et listes médicaments toujours verrouillés par crédits",
            "Données anciennes affichées comme À confirmer après déblocage",
            "Chaque action admin est journalisée dans l’historique",
          ]}
        />
      </div>
    </div>
  );
}

function PharmacyAdminProfilePanel({ pharmacy }: { pharmacy: AdminManagedPharmacy }) {
  const [profile, setProfile] = useState<AdminPharmacyProfileData | null>(null);
  const [profileForm, setProfileForm] = useState<Record<string, string>>({
    name: "",
    managerName: "",
    managerRole: "",
    phone: "",
    whatsapp: "",
    professionalEmail: "",
    authorizationNumber: "",
    commune: "",
    district: "",
    address: "",
    latitude: "",
    longitude: "",
    landmark: "",
    coverageZone: "",
    description: "",
  });
  const [services, setServices] = useState<string[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [message, setMessage] = useState("");

  const updateProfileField = (key: string, value: string) => {
    setProfileForm((current) => ({ ...current, [key]: value }));
  };

  const loadProfile = useCallback(async () => {
    setLoadingProfile(true);
    setMessage("");
    try {
      const res = await fetch(`/api/pharmacy-platform/profile?pharmacySlug=${encodeURIComponent(pharmacy.slug)}`, {
        headers: { "X-Sablin-Session-Kind": "admin" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Chargement du profil impossible.");
      const loaded = data.profile as AdminPharmacyProfileData;
      setProfile(loaded);
      setServices(loaded.services?.length ? loaded.services : []);
      setProfileForm({
        name: loaded.name ?? "",
        managerName: loaded.managerName ?? "",
        managerRole: loaded.managerRole ?? "",
        phone: loaded.phone ?? "",
        whatsapp: loaded.whatsapp ?? "",
        professionalEmail: loaded.professionalEmail ?? "",
        authorizationNumber: loaded.authorizationNumber ?? "",
        commune: loaded.commune ?? "",
        district: loaded.district ?? "",
        address: loaded.address ?? "",
        latitude: String(loaded.latitude ?? ""),
        longitude: String(loaded.longitude ?? ""),
        landmark: loaded.landmark ?? "",
        coverageZone: loaded.coverageZone ?? "",
        description: loaded.description ?? "",
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Chargement du profil impossible.");
    } finally {
      setLoadingProfile(false);
    }
  }, [pharmacy.slug]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const toggleService = (service: string) => {
    setServices((current) => (current.includes(service) ? current.filter((item) => item !== service) : [...current, service]));
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    setMessage("");
    try {
      const res = await fetch("/api/pharmacy-platform/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Sablin-Session-Kind": "admin" },
        body: JSON.stringify({ pharmacySlug: pharmacy.slug, ...profileForm, services }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Enregistrement impossible.");
      setProfile(data.profile);
      setMessage("Profil pharmacie enregistré, journalisé et synchronisable côté utilisateur après validation.");
      await loadProfile();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Enregistrement impossible.");
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card className="border-border/70 p-5 shadow-card">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge label={profile?.accountStatus ?? pharmacy.status} />
              <StatusBadge label={profile?.dataQuality ?? pharmacy.quality} />
              <StatusBadge label={profile?.creationSource ?? pharmacy.source} />
              <StatusBadge label="Contact verrouillé côté utilisateur" />
            </div>
            <Heading level="h2" className="mt-4">Profil contrôlé : {profile?.name ?? pharmacy.name}</Heading>
            <Muted className="mt-2">L’Admin modifie ici les données publiques et internes de cette pharmacie sans créer de session pharmacie. Les contacts restent verrouillés côté utilisateur.</Muted>
          </div>
          <Button variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={() => void loadProfile()} disabled={loadingProfile}>
            {loadingProfile ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            Actualiser
          </Button>
        </div>
        {message && <p className="mt-3 rounded-lg border border-border bg-white p-3 text-sm font-bold text-foreground">{message}</p>}
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <Stat label="Score complétude profil" value={loadingProfile ? "..." : `${profile?.completenessScore ?? 0}%`} badge="Dossier pharmacie" />
          <Stat label="Photos chargées" value={loadingProfile ? "..." : profile?.mediaCount ?? 0} badge="Photos" />
          <Stat label="Services actifs" value={services.length} badge="Profil utilisateur" />
          <Stat label="Médicaments rattachés" value={loadingProfile ? "..." : profile?.medicationCount ?? pharmacy.meds} badge="Inventaire" />
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/70 p-5 shadow-card">
          <h3 className="text-base font-extrabold text-foreground">Identification officielle</h3>
          <p className="mt-1 text-sm font-medium text-muted-foreground">Ces données alimentent la fiche utilisateur après validation. Les contacts restent protégés par crédits.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Field label="Nom de la pharmacie" placeholder="Pharmacie Sainte Marie Cocody" value={profileForm.name} onChange={(value) => updateProfileField("name", value)} />
            <Field label="Nom du pharmacien responsable" placeholder="Dr Awa N’Guessan" value={profileForm.managerName} onChange={(value) => updateProfileField("managerName", value)} />
            <Field label="Fonction du responsable" placeholder="Pharmacien responsable" value={profileForm.managerRole} onChange={(value) => updateProfileField("managerRole", value)} />
            <Field label="Téléphone professionnel interne" placeholder="+225 07 00 00 00 00" value={profileForm.phone} onChange={(value) => updateProfileField("phone", value)} />
            <Field label="WhatsApp professionnel interne" placeholder="+225 05 00 00 00 00" value={profileForm.whatsapp} onChange={(value) => updateProfileField("whatsapp", value)} />
            <Field label="Email professionnel" placeholder="contact@pharmacie.ci" value={profileForm.professionalEmail} onChange={(value) => updateProfileField("professionalEmail", value)} />
            <Field label="Numéro d’autorisation / agrément" placeholder="AGR-CI-..." value={profileForm.authorizationNumber} onChange={(value) => updateProfileField("authorizationNumber", value)} />
            <Field label="Description courte" placeholder="Pharmacie de proximité à Cocody." value={profileForm.description} onChange={(value) => updateProfileField("description", value)} />
          </div>
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
            Même renseignés ici, le téléphone, WhatsApp et l’e-mail direct ne sont jamais affichés gratuitement côté utilisateur.
          </p>
        </Card>

        <Card className="border-border/70 p-5 shadow-card">
          <h3 className="text-base font-extrabold text-foreground">Localisation & repères</h3>
          <p className="mt-1 text-sm font-medium text-muted-foreground">Ces informations alimentent les recherches par commune, les pharmacies proches et les itinéraires.</p>
          <div className="mt-4 grid gap-3">
            <Field label="Commune" placeholder="Cocody" value={profileForm.commune} onChange={(value) => updateProfileField("commune", value)} />
            <Field label="Quartier" placeholder="Riviera 2" value={profileForm.district} onChange={(value) => updateProfileField("district", value)} />
            <Field label="Adresse complète" placeholder="Près de la station Total" value={profileForm.address} onChange={(value) => updateProfileField("address", value)} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Latitude GPS" placeholder="5.3599" value={profileForm.latitude} onChange={(value) => updateProfileField("latitude", value)} />
              <Field label="Longitude GPS" placeholder="-3.9876" value={profileForm.longitude} onChange={(value) => updateProfileField("longitude", value)} />
            </div>
            <Field label="Repère connu" placeholder="En face du supermarché" value={profileForm.landmark} onChange={(value) => updateProfileField("landmark", value)} />
            <Field label="Zone de couverture" placeholder="Riviera, M’Badon, Angré" value={profileForm.coverageZone} onChange={(value) => updateProfileField("coverageZone", value)} />
          </div>
        </Card>
      </div>

      <Card className="border-border/70 p-5 shadow-card">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-extrabold text-foreground">Services proposés</h3>
            <p className="text-sm font-medium text-muted-foreground">Ces services aident au filtrage côté utilisateur sans créer de vente en ligne.</p>
          </div>
          <StatusBadge label="Information générale" />
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {PHARMACY_SERVICES.map((service) => (
            <label key={service} className="flex min-h-12 items-start gap-2 rounded-lg border border-border bg-white p-3 text-sm font-bold text-foreground">
              <input type="checkbox" checked={services.includes(service)} onChange={() => toggleService(service)} className="mt-0.5 size-4 accent-brand" />
              <span>{service}</span>
            </label>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={saveProfile} disabled={savingProfile} className="w-full bg-brand text-white hover:bg-brand-dark sm:w-auto">
            {savingProfile ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
            Enregistrer le profil
          </Button>
          <ProfessionalActionButton action="validate-pharmacy" label="Valider la fiche" pharmacySlug={pharmacy.slug} payload={{ status: "Validée" }} onSuccess={() => void loadProfile()} className="bg-brand text-white hover:bg-brand-dark">
            Valider la fiche
          </ProfessionalActionButton>
          <ProfessionalActionButton action="suspend-pharmacy" label="Suspendre" pharmacySlug={pharmacy.slug} payload={{ status: "Suspendue" }} onSuccess={() => void loadProfile()} variant="outline">
            Suspendre
          </ProfessionalActionButton>
        </div>
      </Card>

      <AdminMediaUploadPanel pharmacySlug={pharmacy.slug} helper="Ajoutez les photos publiques du profil ou les documents internes. Les images publiques validées alimentent la fiche utilisateur." />
      <ControlChecklist
        title="Publication utilisateur"
        items={[
          "Pharmacie validée avant affichage public",
          "Téléphone et WhatsApp verrouillés par crédits",
          "Photos publiques propres et sans document confidentiel",
          "Horaires et garde synchronisés avec l’accueil utilisateur",
        ]}
      />
    </div>
  );
}

type AdminProfessionalPharmacyInfo = {
  id: string;
  name: string;
  slug: string;
  commune?: string | null;
  district?: string | null;
  accountStatus?: string | null;
};

type AdminProfessionalMember = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role: string;
  permissions: string[];
  status: string;
  accountStatus: string;
  lastLoginAt?: string | null;
  pharmacy?: AdminProfessionalPharmacyInfo | null;
};

type AdminProfessionalInvitation = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role: string;
  permissions: string[];
  status: string;
  expiresAt: string;
  createdAt: string;
  pharmacy?: AdminProfessionalPharmacyInfo | null;
};

function AdminPharmacyTeamPanel({ pharmacySlug, pharmacyName }: { pharmacySlug: string; pharmacyName: string }) {
  const [members, setMembers] = useState<AdminProfessionalMember[]>([]);
  const [invitations, setInvitations] = useState<AdminProfessionalInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadTeam = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/professional/team?pharmacySlug=${encodeURIComponent(pharmacySlug)}`, {
        headers: { "x-sablin-session-kind": "admin" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Chargement des comptes impossible.");
      setMembers(data.members ?? []);
      setInvitations(data.invitations ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Chargement des comptes impossible.");
    } finally {
      setLoading(false);
    }
  }, [pharmacySlug]);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  const updateMemberStatus = async (member: AdminProfessionalMember, status: "Actif" | "Suspendu" | "Révoqué") => {
    const res = await fetch("/api/professional/team", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-sablin-session-kind": "admin" },
      body: JSON.stringify({ membershipId: member.id, role: member.role, permissions: member.permissions, status }),
    });
    const data = await res.json().catch(() => ({}));
    setMessage(res.ok ? "Accès professionnel mis à jour." : data?.error ?? "Action impossible.");
    await loadTeam();
  };

  return (
    <Card className="border-border/70 p-5 shadow-card">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Heading level="h2">Équipe de {pharmacyName}</Heading>
          <Muted className="mt-2">L’Admin contrôle les accès rattachés à cette pharmacie sans mélanger les sessions.</Muted>
        </div>
        <ProfessionalActionButton action="create-pharmacy-account" label="Créer un accès" pharmacySlug={pharmacySlug} payload={{ role: "PHARMACY_EMPLOYEE" }} className="bg-brand text-white hover:bg-brand-dark">
          Créer un accès
        </ProfessionalActionButton>
      </div>
      <div className="mt-4 grid gap-3">
        {loading && <Card className="border-border/70 p-4 text-sm font-bold text-muted-foreground">Chargement des accès de cette pharmacie...</Card>}
        {!loading && members.length === 0 && <Card className="border-dashed border-border p-4 text-sm font-bold text-foreground">Aucun compte rattaché pour le moment.</Card>}
        {members.map((row) => (
          <div key={row.id} className="rounded-xl border border-border bg-white p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap gap-2">
                  <StatusBadge label={row.status} />
                  <StatusBadge label={row.accountStatus} />
                </div>
                <p className="mt-3 break-words font-extrabold text-foreground">{row.name}</p>
                <p className="text-sm font-semibold text-muted-foreground">{row.role} · {row.email ?? row.phone ?? "Contact non renseigné"}</p>
                <p className="mt-1 text-xs font-bold text-muted-foreground">Dernière connexion : {formatDateTime(row.lastLoginAt)}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(row.permissions.length ? row.permissions.slice(0, 6) : ["Permissions héritées du rôle"]).map((permission) => (
                    <StatusBadge key={permission} label={professionalPermissionLabel(permission)} />
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={() => updateMemberStatus(row, row.status === "Suspendu" ? "Actif" : "Suspendu")}>
                  {row.status === "Suspendu" ? "Réactiver" : "Suspendre"}
                </Button>
                <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-50" onClick={() => updateMemberStatus(row, "Révoqué")}>
                  Révoquer
                </Button>
              </div>
            </div>
          </div>
        ))}
        {invitations.length > 0 && (
          <div className="rounded-xl border border-border bg-white p-4">
            <p className="font-extrabold text-foreground">Invitations en attente</p>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="rounded-lg border border-border bg-white p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-foreground">{invitation.name}</p>
                      <p className="text-xs font-semibold text-muted-foreground">{invitation.role} · Expire : {formatDateTime(invitation.expiresAt)}</p>
                    </div>
                    <StatusBadge label={invitation.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {message && <p className="rounded-xl border border-border bg-white p-3 text-sm font-bold text-foreground">{message}</p>}
      </div>
    </Card>
  );
}

function AdminPharmacyConfirmationsPanel({ pharmacy }: { pharmacy: AdminManagedPharmacy }) {
  const [filter, setFilter] = useState("Tous");
  const [query, setQuery] = useState("");
  const [requests, setRequests] = useState<ProfessionalRequestItem[]>([]);
  const [stats, setStats] = useState<RequestStats>({});
  const [responses, setResponses] = useState<Record<string, { availability: string; price: string; note: string }>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ pharmacySlug: pharmacy.slug, workflow: "confirmations" });
    if (filter !== "Tous") params.set("status", filter);
    if (query.trim()) params.set("q", query.trim());
    try {
      const res = await fetch(`/api/pharmacy-platform/user-requests?${params}`, { headers: { "X-Sablin-Session-Kind": "admin" } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Chargement des confirmations impossible.");
      setRequests(data.requests ?? []);
      setStats(data.stats ?? {});
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Chargement des confirmations impossible.");
    } finally {
      setLoading(false);
    }
  }, [filter, pharmacy.slug, query]);

  useEffect(() => {
    load();
  }, [load]);

  const respond = async (request: ProfessionalRequestItem, mode: "availability" | "price" | "rupture" | "full") => {
    const response = responses[request.reference] ?? { availability: "À confirmer", price: "", note: "" };
    const availabilityStatus = mode === "rupture" ? "Rupture" : response.availability;
    const responseMessage = response.note.trim() || "Réponse supervisée par l’administration SABLIN après confirmation avec la pharmacie.";
    try {
      const res = await fetch("/api/pharmacy-platform/user-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Sablin-Session-Kind": "admin" },
        body: JSON.stringify({
          reference: request.reference,
          pharmacySlug: pharmacy.slug,
          action: "respond",
          availabilityStatus,
          confirmedPrice: response.price ? Number(response.price) : null,
          responseMessage,
          updateInventory: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Réponse impossible.");
      setMessage(`Confirmation ${request.reference} traitée et synchronisée avec ${pharmacy.name}.`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Réponse impossible.");
    }
  };

  return (
    <div className="space-y-5">
      <Card className="border-border/70 p-5 shadow-card">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              <StatusBadge label="Supervision admin" />
              <StatusBadge label={pharmacy.name} />
            </div>
            <Heading level="h2" className="mt-3">Confirmations supervisées</Heading>
            <Muted className="mt-1">L’Admin peut traiter ou assister les confirmations de cette pharmacie sans créer de session pharmacie. Chaque réponse met à jour l’historique et peut fiabiliser l’inventaire publié.</Muted>
          </div>
          <div className="grid w-full gap-2 sm:grid-cols-[1fr_180px_auto] lg:max-w-2xl">
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Référence, médicament, message..." className="bg-white" />
            <select value={filter} onChange={(event) => setFilter(event.target.value)} className="h-10 rounded-lg border border-border bg-white px-3 text-sm font-bold text-foreground">
              <option value="Tous">Tous les statuts</option>
              {REQUEST_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <Button variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={load}>Actualiser</Button>
          </div>
        </div>
        {message && <p className="mt-3 rounded-lg border border-border bg-white p-3 text-sm font-bold text-foreground">{message}</p>}
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Confirmations" value={stats.total ?? requests.length} badge="Toutes" />
        <Stat label="À traiter" value={(stats.new ?? 0) + (stats.inProgress ?? 0)} badge="En cours" />
        <Stat label="Priorité haute" value={stats.highPriority ?? 0} badge="Priorité" />
        <Stat label="Répondues" value={stats.answered ?? 0} badge="Synchronisé" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {loading && <Card className="border-border/70 p-5 text-sm font-bold text-muted-foreground">Chargement des confirmations réelles...</Card>}
        {!loading && requests.length === 0 && (
          <Card className="border-dashed border-border p-8 text-center text-sm font-bold text-foreground">
            Aucune confirmation dans ce filtre. Les futures demandes utilisateur de cette pharmacie apparaîtront ici.
          </Card>
        )}
        {requests.map((item) => {
          const latest = item.responses?.[0];
          const response = responses[item.reference] ?? {
            availability: latest?.availabilityStatus ?? "À confirmer",
            price: latest?.confirmedPrice ? String(latest.confirmedPrice) : "",
            note: latest?.responseMessage ?? "",
          };
          return (
            <Card key={item.id} className="border-border/70 p-4 shadow-card">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge label={item.status} />
                    <StatusBadge label={item.priority} />
                    <StatusBadge label={`${item.creditCost} crédit${item.creditCost > 1 ? "s" : ""}`} />
                  </div>
                  <h3 className="mt-3 break-words text-lg font-extrabold text-foreground">{item.medication?.name ?? item.serviceName}</h3>
                  <p className="text-sm font-medium text-muted-foreground">
                    {[item.medication?.dosage ?? item.dosage, item.medication?.form ?? item.form].filter(Boolean).join(" · ") || "Information libre"} · Échéance : {formatDateTime(item.expiresAt)}
                  </p>
                  <p className="mt-1 text-xs font-bold text-muted-foreground">{item.reference} · Utilisateur : {item.user?.name ?? "Référence anonymisée"}</p>
                </div>
                <Price amount={item.fcfaEquivalent} size="sm" variant="brand" />
              </div>
              {item.userMessage && <p className="mt-4 rounded-lg border border-border bg-muted/30 p-3 text-sm font-semibold text-foreground">{item.userMessage}</p>}
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Prix indicatif confirmé</Label>
                  <Input value={response.price} onChange={(event) => setResponses((current) => ({ ...current, [item.reference]: { ...response, price: event.target.value } }))} inputMode="numeric" className="bg-white" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Disponibilité confirmée</Label>
                  <select value={response.availability} onChange={(event) => setResponses((current) => ({ ...current, [item.reference]: { ...response, availability: event.target.value } }))} className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm font-bold text-foreground">
                    {PUBLIC_AVAILABILITY_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </div>
              </div>
              <Textarea value={response.note} onChange={(event) => setResponses((current) => ({ ...current, [item.reference]: { ...response, note: event.target.value } }))} className="mt-3 min-h-20 bg-white" placeholder="Note admin ou réponse confirmée avec la pharmacie." />
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <Button className="bg-brand text-white hover:bg-brand-dark" onClick={() => respond(item, "availability")}>Confirmer disponible</Button>
                <Button variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={() => respond(item, "price")}>Confirmer prix</Button>
                <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50" onClick={() => respond(item, "rupture")}>Confirmer rupture</Button>
                <Button variant="outline" onClick={() => respond(item, "full")}>Répondre & synchroniser</Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function AdminPharmacyHistoryPanel({ pharmacy }: { pharmacy: AdminManagedPharmacy }) {
  const [filter, setFilter] = useState("Tous");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [stats, setStats] = useState<{ total?: number; success?: number; review?: number; imports?: number }>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ pharmacySlug: pharmacy.slug });
    if (filter === "Réussi" || filter === "À vérifier") params.set("status", filter.toLowerCase() === "réussi" ? "réussi" : "à vérifier");
    if (filter === "Import pharmacie" || filter === "Demande utilisateur") params.set("source", filter);
    if (query.trim()) params.set("q", query.trim());
    try {
      const res = await fetch(`/api/pharmacy-platform/history?${params}`, { headers: { "X-Sablin-Session-Kind": "admin" } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Chargement de l’historique impossible.");
      setRows(data.rows ?? []);
      setStats(data.stats ?? {});
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Chargement de l’historique impossible.");
    } finally {
      setLoading(false);
    }
  }, [filter, pharmacy.slug, query]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-5">
      <Card className="border-border/70 p-5 shadow-card">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              <StatusBadge label="Historique audité" />
              <StatusBadge label={pharmacy.name} />
            </div>
            <Heading level="h2" className="mt-3">Historique de cette pharmacie</Heading>
            <Muted className="mt-1">Vue admin consolidée des actions pharmacie, corrections administrateur, imports, publications, validations et audits.</Muted>
          </div>
          <div className="flex w-full flex-wrap gap-2 lg:max-w-3xl lg:justify-end">
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Action, auteur, commentaire..." className="h-9 w-full bg-white sm:w-72" />
            {["Tous", "Réussi", "À vérifier", "Import pharmacie", "Demande utilisateur"].map((item) => (
              <Button key={item} size="sm" variant={filter === item ? "default" : "outline"} className={filter === item ? "bg-brand text-white hover:bg-brand-dark" : "border-brand/30 text-brand-dark hover:bg-brand-light"} onClick={() => setFilter(item)}>
                {item}
              </Button>
            ))}
            <Button size="sm" variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={load}>Actualiser</Button>
          </div>
        </div>
        {message && <p className="mt-3 rounded-lg border border-border bg-white p-3 text-sm font-bold text-foreground">{message}</p>}
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Actions tracées" value={stats.total ?? rows.length} badge="Historique" />
        <Stat label="Réussies" value={stats.success ?? 0} badge="Réussi" />
        <Stat label="À vérifier" value={stats.review ?? 0} badge="À vérifier" />
        <Stat label="Imports" value={stats.imports ?? 0} badge="Import" />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-white">
        <div className="hidden grid-cols-[150px_1fr_150px_170px_1fr_1fr_110px] gap-0 bg-muted/40 px-4 py-3 text-xs font-extrabold uppercase text-muted-foreground lg:grid">
          <span>Date</span><span>Action</span><span>Auteur</span><span>Source</span><span>Avant</span><span>Après</span><span>Statut</span>
        </div>
        <div className="divide-y divide-border">
          {loading && <div className="p-4 text-sm font-bold text-muted-foreground">Chargement de l’historique réel...</div>}
          {!loading && rows.length === 0 && <div className="p-8 text-center text-sm font-bold text-foreground">Aucune action journalisée pour cette pharmacie dans ce filtre.</div>}
          {rows.map((item) => (
            <div key={item.id} className="grid gap-3 p-4 text-sm lg:grid-cols-[150px_1fr_150px_170px_1fr_1fr_110px] lg:items-center">
              <p className="font-bold text-foreground">{formatDateTime(item.date)}</p>
              <div>
                <p className="font-extrabold text-foreground">{item.action}</p>
                {item.message && <p className="mt-1 text-xs font-semibold text-muted-foreground">{item.message}</p>}
              </div>
              <p className="text-muted-foreground">{item.author}</p>
              <StatusBadge label={item.source} />
              <p className="break-words text-muted-foreground">{stringifyCell(item.oldValue)}</p>
              <p className="break-words font-bold text-foreground">{stringifyCell(item.newValue)}</p>
              <StatusBadge label={item.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminMedicationManagement({ pharmacySlug }: { pharmacySlug: string }) {
  const [inventory, setInventory] = useState<AdminPharmacyInventoryItem[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadInventory = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`/api/pharmacy-platform/inventory?pharmacySlug=${encodeURIComponent(pharmacySlug)}`, {
        headers: { "x-sablin-session-kind": "admin" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Chargement de l’inventaire impossible.");
      setInventory(data.inventory ?? []);
    } catch (error) {
      setInventory([]);
      setMessage(error instanceof Error ? error.message : "Chargement de l’inventaire impossible.");
    } finally {
      setLoading(false);
    }
  }, [pharmacySlug]);

  useEffect(() => {
    void loadInventory();
  }, [loadInventory]);

  const sources = useMemo(() => [...new Set(inventory.map((item) => item.dataSource).filter(Boolean))].sort(), [inventory]);
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return inventory.filter((item) => {
      const searchable = `${item.medication} ${item.dci} ${item.dosage} ${item.form} ${item.category} ${item.dataSource}`.toLowerCase();
      return (
        (!q || searchable.includes(q)) &&
        (statusFilter === "all" || item.publicStatus === statusFilter || item.privateStatus === statusFilter) &&
        (sourceFilter === "all" || item.dataSource === sourceFilter)
      );
    });
  }, [inventory, query, sourceFilter, statusFilter]);
  const stats = useMemo(() => ({
    total: inventory.length,
    visible: inventory.filter((item) => item.publicStatus !== "À confirmer").length,
    toVerify: inventory.filter((item) => item.publicStatus === "À confirmer" || item.reliabilityLevel !== "Confirmé").length,
    old: inventory.filter((item) => item.reliabilityLevel === "Ancien" || item.dataSource === "Donnée ancienne").length,
  }), [inventory]);

  return (
    <div className="space-y-4">
      <Card className="border-border/70 p-5 shadow-card">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Heading level="h2">Médicaments de la pharmacie sélectionnée</Heading>
            <Muted>L’admin corrige l’inventaire réel de cette pharmacie. Les changements passent par l’API et alimentent la marketplace utilisateur selon les règles de publication.</Muted>
          </div>
          <Button variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={loadInventory} disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            Actualiser
          </Button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Inventaire réel" value={loading ? "..." : stats.total} badge="Base commune" />
          <Stat label="Publiables" value={loading ? "..." : stats.visible} badge="Utilisateur" />
          <Stat label="À vérifier" value={loading ? "..." : stats.toVerify} badge="Contrôle" />
          <Stat label="Données anciennes" value={loading ? "..." : stats.old} badge="Qualité" />
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[1.3fr_220px_220px_auto]">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher nom, DCI, forme, source..." className="bg-white" />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-lg border border-border bg-white px-3 text-sm font-bold text-foreground">
            <option value="all">Tous statuts</option>
            {PUBLIC_AVAILABILITY_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)} className="h-10 rounded-lg border border-border bg-white px-3 text-sm font-bold text-foreground">
            <option value="all">Toutes sources</option>
            {sources.map((source) => <option key={source} value={source}>{source}</option>)}
          </select>
          <Button variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={() => { setQuery(""); setStatusFilter("all"); setSourceFilter("all"); }}>
            Réinitialiser
          </Button>
        </div>
        {message && <p className="mt-3 rounded-lg border border-border bg-white p-3 text-sm font-bold text-foreground">{message}</p>}
      </Card>

      <Card className="border-border/70 p-0 shadow-card">
        {loading && <p className="p-4 text-sm font-bold text-muted-foreground">Chargement de l’inventaire réel...</p>}
        {!loading && rows.length === 0 && <p className="p-4 text-sm font-bold text-foreground">Aucun médicament ne correspond aux filtres.</p>}
        <div className="hidden overflow-x-auto rounded-xl border-border lg:block">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr>{["Médicament", "Prix indicatif", "Statut public", "Interne", "Source", "Fiabilité", "Dernière modification", "Actions admin"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {rows.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-3"><p className="font-bold text-foreground">{m.medication}</p><p className="text-xs text-muted-foreground">{m.dci} · {m.form} · {m.dosage}</p></td>
                  <td className="px-4 py-3"><Price amount={m.price} size="sm" variant="brand" /></td>
                  <td className="px-4 py-3"><StatusBadge label={m.publicStatus} /></td>
                  <td className="px-4 py-3 text-muted-foreground">Quantité interne : {m.internalQuantity ?? "Non renseignée"}. Non publiée.</td>
                  <td className="px-4 py-3">{m.dataSource}</td>
                  <td className="px-4 py-3"><StatusBadge label={m.reliabilityLevel} /></td>
                  <td className="px-4 py-3">{formatDateTime(m.lastUpdatedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <ProfessionalActionButton action="quick-availability" label="Corriger" pharmacySlug={pharmacySlug} entityType="pharmacy-medication" entityId={m.id} payload={{ availabilityStatus: "À confirmer", reliabilityLevel: "À vérifier", dataSource: "Saisie administrateur" }} onSuccess={() => void loadInventory()} size="sm" variant="outline">
                        Corriger
                      </ProfessionalActionButton>
                      <ProfessionalActionButton action="mark-inventory-verified" label="Marquer vérifié" pharmacySlug={pharmacySlug} entityType="pharmacy-medication" entityId={m.id} payload={{ availabilityStatus: m.publicStatus, reliabilityLevel: "Confirmé", dataSource: "Saisie administrateur" }} onSuccess={() => void loadInventory()} size="sm" className="bg-brand text-white">
                        Marquer vérifié
                      </ProfessionalActionButton>
                      <ProfessionalActionButton action="publish-inventory" label="Publier" pharmacySlug={pharmacySlug} entityType="pharmacy-medication" entityId={m.id} payload={{ availabilityStatus: m.publicStatus, reliabilityLevel: m.reliabilityLevel, dataSource: "Saisie administrateur" }} onSuccess={() => void loadInventory()} size="sm" variant="outline">
                        Publier
                      </ProfessionalActionButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid gap-3 p-4 lg:hidden">
          {rows.map((m) => (
            <Card key={m.id} className="border-border/70 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-extrabold text-foreground">{m.medication}</p>
                  <p className="text-xs font-bold text-muted-foreground">{m.dci} · {m.dosage} · {m.form}</p>
                </div>
                <StatusBadge label={m.publicStatus} />
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-muted/20 p-3"><p className="text-xs font-bold text-muted-foreground">Prix indicatif</p><Price amount={m.price} size="sm" variant="brand" /></div>
                <div className="rounded-lg border border-border bg-muted/20 p-3"><p className="text-xs font-bold text-muted-foreground">Fiabilité</p><StatusBadge label={m.reliabilityLevel} /></div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <ProfessionalActionButton action="quick-availability" label="Corriger" pharmacySlug={pharmacySlug} entityType="pharmacy-medication" entityId={m.id} payload={{ availabilityStatus: "À confirmer", reliabilityLevel: "À vérifier", dataSource: "Saisie administrateur" }} onSuccess={() => void loadInventory()} size="sm" variant="outline">Corriger</ProfessionalActionButton>
                <ProfessionalActionButton action="mark-inventory-verified" label="Vérifier" pharmacySlug={pharmacySlug} entityType="pharmacy-medication" entityId={m.id} payload={{ availabilityStatus: m.publicStatus, reliabilityLevel: "Confirmé", dataSource: "Saisie administrateur" }} onSuccess={() => void loadInventory()} size="sm" className="bg-brand text-white">Vérifier</ProfessionalActionButton>
              </div>
            </Card>
          ))}
        </div>
      </Card>
      <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
        Côté utilisateur : “Prix indicatif, à confirmer auprès de la pharmacie.” Si la fiabilité est Ancien, À vérifier ou Incomplet, le statut public devient “À confirmer”.
      </p>
    </div>
  );
}

function AdminImportForPharmacy({ pharmacySlug, pharmacyName }: { pharmacySlug: string; pharmacyName: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<ImportPreviewData | null>(null);
  const [selectedLineNumbers, setSelectedLineNumbers] = useState<Set<number>>(new Set());

  const previewImport = async () => {
    if (!file) {
      setMessage("Choisissez un fichier CSV, XLSX, XLS, Word ou PowerPoint.");
      return;
    }
    setUploading(true);
    setMessage("");
    try {
      const form = new FormData();
      form.set("pharmacySlug", pharmacySlug);
      form.set("file", file);
      const res = await fetch("/api/imports/preview", { method: "POST", headers: { "X-Sablin-Session-Kind": "admin" }, body: form });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Analyse impossible.");
      const safeLines = safePublishLineNumbers(data);
      setPreview(data);
      setSelectedLineNumbers(safeLines);
      setMessage(
        `Analyse terminée pour ${pharmacyName} : ${safeLines.size} produit(s) prêt(s), ${data.unknownMedications} non reconnu(s), ${data.prohibitedRows ?? 0} interdit(s) retiré(s).`
      );
    } catch (error) {
      setPreview(null);
      setSelectedLineNumbers(new Set());
      setMessage(error instanceof Error ? error.message : "Analyse impossible.");
    } finally {
      setUploading(false);
    }
  };

  const submitImport = async (mode: "auto_publish_safe" | "draft") => {
    if (!file) {
      setMessage("Choisissez un fichier CSV, XLSX, XLS, Word ou PowerPoint.");
      return;
    }
    if (!preview) {
      setMessage("Analysez le fichier avant validation. Vous pourrez retirer les lignes à ne pas afficher.");
      return;
    }
    const rowsToConfirm = preview.confirmableRows ?? [];
    if (!rowsToConfirm.length) {
      setMessage("Aucune ligne analysée à enregistrer.");
      return;
    }
    setUploading(true);
    setMessage("");
    try {
      const res = await fetch("/api/imports/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Sablin-Session-Kind": "admin" },
        body: JSON.stringify({
          pharmacySlug,
          fileName: file.name,
          fileType: file.name.split(".").pop() ?? "CSV",
          rows: rowsToConfirm,
          publishLineNumbers: mode === "draft" ? [] : Array.from(selectedLineNumbers),
          mode,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Validation impossible.");
      setMessage(
        mode === "draft"
          ? `Liste enregistrée sans publication : ${data.report.totalRows ?? 0} ligne(s).`
          : `Publication contrôlée terminée : ${data.report.safePublishedRows ?? 0} produit(s) publié(s), ${data.report.notPublishedRows ?? 0} non publié(s), ${data.report.prohibitedRows ?? 0} interdit(s) retiré(s).`
      );
      setFile(null);
      setSelectedLineNumbers(new Set());
      setPreview(data.report);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Validation impossible.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="border-border/70 p-5 shadow-card">
      <Heading level="h2">Import inventaire pour {pharmacyName}</Heading>
      <Muted>L’admin analyse le fichier, retire les lignes à ne pas afficher, publie les produits sûrs et garde les cas ambigus en validation.</Muted>
      <div className="mt-4">
        <AdminMediaUploadPanel pharmacySlug={pharmacySlug} helper="Chargez les photos des locaux ou documents liés à cette pharmacie sélectionnée." />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
        <Input type="file" accept=".csv,.xls,.xlsx,.docx,.pptx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setPreview(null); setSelectedLineNumbers(new Set()); }} />
        <Button variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={() => downloadImportTemplate(`modele-import-${pharmacySlug}.csv`)}>
          Télécharger modèle Excel
        </Button>
        <Button variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={previewImport} disabled={uploading}>{uploading ? "Analyse..." : "Analyser le fichier"}</Button>
        <Button className="bg-brand text-white hover:bg-brand-dark" onClick={() => submitImport("auto_publish_safe")} disabled={uploading || !preview}>{uploading ? "Publication..." : "Publier les produits autorisés"}</Button>
      </div>
      {message && <p className="mt-3 rounded-lg border border-border bg-white p-3 text-sm font-bold text-foreground">{message}</p>}
      {preview && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Lignes détectées" value={preview.totalRows} badge="Aperçu" />
          <Stat label="Lignes valides" value={preview.validRows} badge="Confirmé" />
          <Stat label="À corriger" value={preview.incompleteRows + preview.invalidRows} badge="À vérifier" />
          <Stat label="Médicaments non reconnus" value={preview.unknownMedications} badge="Validation Admin" />
          <Stat label="Doublons" value={preview.duplicateRows} badge="Conflit" />
          <Stat label="Prix manquants" value={preview.missingPrices} badge="À compléter" />
          <Stat label="Statuts invalides" value={preview.invalidStatuses} badge="Normalisation" />
          <Stat label="Médicaments reconnus" value={preview.recognizedMedications} badge="Référentiel" />
          <Stat label="À publier" value={safePublishLineNumbers(preview).size} badge="Publication" />
          <Stat label="Interdits retirés" value={preview.prohibitedRows ?? 0} badge="Bloqué" />
        </div>
      )}
      {preview?.confirmableRows?.length ? (
        <div className="mt-4">
          <ImportValidationPanel
            preview={preview}
            selectedLineNumbers={selectedLineNumbers}
            onSelectionChange={setSelectedLineNumbers}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button className="bg-brand text-white hover:bg-brand-dark" onClick={() => submitImport("auto_publish_safe")} disabled={uploading}>
              Publier la sélection sûre
            </Button>
            <Button variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={() => submitImport("draft")} disabled={uploading}>
              Enregistrer sans publication
            </Button>
          </div>
        </div>
      ) : null}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Forcer correspondance", "force-import-match"],
          ["Créer demande référentiel", "create-referential-request"],
          ["Corriger doublons", "fix-duplicates"],
          ["Marquer fiable", "mark-reliable"],
        ].map(([label, action]) => (
          <ProfessionalActionButton key={label} action={action} label={label} pharmacySlug={pharmacySlug} variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light">
            {label}
          </ProfessionalActionButton>
        ))}
      </div>
      <SectionBlock title="Colonnes import Excel/CSV" description="L’admin peut corriger avant validation et publication.">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {IMPORT_TEMPLATE_COLUMNS.map((column) => <div key={column} className="rounded-lg border border-border bg-white p-3 text-sm font-bold text-foreground">{column}</div>)}
        </div>
      </SectionBlock>
    </Card>
  );
}

function ScheduleAdmin({ pharmacySlug }: { pharmacySlug: string }) {
  const [schedule, setSchedule] = useState<Record<string, AdminDaySchedule>>(adminDefaultSchedule);
  const [dutyEnabled, setDutyEnabled] = useState(false);
  const [dutyStart, setDutyStart] = useState("2026-06-19T20:00");
  const [dutyEnd, setDutyEnd] = useState("2026-06-20T08:00");
  const [exceptionalClosureStart, setExceptionalClosureStart] = useState("");
  const [exceptionalClosureEnd, setExceptionalClosureEnd] = useState("");
  const [exceptionalOpeningMessage, setExceptionalOpeningMessage] = useState("");
  const [specialMessage, setSpecialMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadSchedule = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pharmacy-platform/schedule?pharmacySlug=${encodeURIComponent(pharmacySlug)}`, {
        headers: { "X-Sablin-Session-Kind": "admin" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Chargement des horaires impossible.");
      setSchedule({ ...adminDefaultSchedule, ...(data.schedule ?? {}) });
      setDutyEnabled(Boolean(data.duty?.enabled));
      setDutyStart(toDateTimeInput(data.duty?.start, "2026-06-19T20:00"));
      setDutyEnd(toDateTimeInput(data.duty?.end, "2026-06-20T08:00"));
      setExceptionalClosureStart(toDateTimeInput(data.exceptions?.closureStart));
      setExceptionalClosureEnd(toDateTimeInput(data.exceptions?.closureEnd));
      setExceptionalOpeningMessage(data.exceptions?.openingMessage || "");
      setSpecialMessage(data.duty?.message || "");
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Chargement des horaires impossible.");
    } finally {
      setLoading(false);
    }
  }, [pharmacySlug]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  const updateDay = (dayKey: string, patch: Partial<AdminDaySchedule>) => {
    setSchedule((current) => ({
      ...current,
      [dayKey]: {
        ...current[dayKey],
        ...patch,
      },
    }));
  };

  const saveSchedule = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/pharmacy-platform/schedule?pharmacySlug=${encodeURIComponent(pharmacySlug)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Sablin-Session-Kind": "admin" },
        body: JSON.stringify({
          schedule,
          dutyEnabled,
          dutyStart,
          dutyEnd,
          specialMessage,
          exceptionalClosureStart,
          exceptionalClosureEnd,
          exceptionalOpeningMessage,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Enregistrement impossible.");
      setSchedule({ ...adminDefaultSchedule, ...(data.schedule ?? {}) });
      setDutyEnabled(Boolean(data.duty?.enabled));
      setDutyStart(toDateTimeInput(data.duty?.start, dutyStart));
      setDutyEnd(toDateTimeInput(data.duty?.end, dutyEnd));
      setExceptionalClosureStart(toDateTimeInput(data.exceptions?.closureStart));
      setExceptionalClosureEnd(toDateTimeInput(data.exceptions?.closureEnd));
      setExceptionalOpeningMessage(data.exceptions?.openingMessage || "");
      setSpecialMessage(data.duty?.message || specialMessage);
      setMessage(data?.message ?? "Horaires et garde enregistrés comme administrateur.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card className="border-border/70 p-5 shadow-card">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Heading level="h2">Horaires & garde de la pharmacie sélectionnée</Heading>
            <Muted className="mt-1">Mode gestion pharmacie : l’admin corrige les horaires, garde et exceptions qui alimentent directement les pages utilisateur.</Muted>
          </div>
          <div className="flex flex-wrap gap-2">{PHARMACY_OPERATION_STATUSES.map((s) => <StatusBadge key={s} label={s} />)}</div>
        </div>
        {message && <p className="mt-3 rounded-lg border border-border bg-white p-3 text-sm font-bold text-foreground">{message}</p>}
      </Card>

      <Card className="border-border/70 p-5 shadow-card">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-extrabold text-foreground">Planning hebdomadaire</h3>
            <p className="text-sm font-medium text-muted-foreground">Chaque modification est journalisée avec la source “Saisie administrateur”.</p>
          </div>
          {loading ? <StatusBadge label="Chargement" /> : <StatusBadge label="Données à jour" />}
        </div>
        <div className="mt-4 space-y-3">
          {ADMIN_WEEK_DAYS.map((day) => {
            const item = schedule[day.key];
            return (
              <div key={day.key} className="rounded-xl border border-border bg-white p-4">
                <div className="grid gap-3 lg:grid-cols-[118px_160px_1fr_1fr_1fr_1fr_150px] lg:items-end">
                  <label className="flex min-h-10 items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 text-sm font-extrabold text-foreground">
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={(event) => updateDay(day.key, { enabled: event.target.checked, status: event.target.checked ? "Ouvert" : "Fermé" })}
                      className="size-4 accent-brand"
                    />
                    {day.label}
                  </label>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">Statut public</Label>
                    <select
                      value={item.status}
                      onChange={(event) => updateDay(day.key, { status: event.target.value, enabled: event.target.value !== "Fermé" })}
                      className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm font-bold text-foreground"
                    >
                      {PHARMACY_OPERATION_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </div>
                  {[
                    ["Ouverture", "open"],
                    ["Fermeture", "close"],
                    ["Début pause", "breakStart"],
                    ["Fin pause", "breakEnd"],
                  ].map(([label, key]) => (
                    <div key={key} className="space-y-1.5">
                      <Label className="text-xs font-bold text-foreground">{label}</Label>
                      <Input
                        type="time"
                        value={String(item[key as keyof AdminDaySchedule] ?? "")}
                        onChange={(event) => updateDay(day.key, { [key]: event.target.value })}
                        className="bg-white"
                      />
                    </div>
                  ))}
                  <div className="flex lg:justify-end"><StatusBadge label={item.enabled ? item.status : "Fermé"} /></div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="border-border/70 p-5 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-foreground">Garde et exceptions</h3>
            <p className="text-sm font-medium text-muted-foreground">Ces informations pilotent “pharmacies de garde”, “ouvert/fermé” et les messages de prudence côté utilisateur.</p>
          </div>
          <StatusBadge label={dutyEnabled ? "De garde" : "Fermé"} />
        </div>
        <label className="mt-4 flex items-center gap-3 rounded-xl border border-brand/20 bg-brand-light/50 p-3 text-sm font-extrabold text-brand-dark">
          <input type="checkbox" checked={dutyEnabled} onChange={(event) => setDutyEnabled(event.target.checked)} className="size-4 accent-brand" />
          Activer le statut pharmacie de garde
        </label>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label className="text-xs font-bold text-foreground">Début de garde</Label><Input type="datetime-local" value={dutyStart} onChange={(event) => setDutyStart(event.target.value)} className="bg-white" /></div>
          <div className="space-y-1.5"><Label className="text-xs font-bold text-foreground">Fin de garde</Label><Input type="datetime-local" value={dutyEnd} onChange={(event) => setDutyEnd(event.target.value)} className="bg-white" /></div>
          <div className="space-y-1.5"><Label className="text-xs font-bold text-foreground">Début fermeture exceptionnelle</Label><Input type="datetime-local" value={exceptionalClosureStart} onChange={(event) => setExceptionalClosureStart(event.target.value)} className="bg-white" /></div>
          <div className="space-y-1.5"><Label className="text-xs font-bold text-foreground">Fin fermeture exceptionnelle</Label><Input type="datetime-local" value={exceptionalClosureEnd} onChange={(event) => setExceptionalClosureEnd(event.target.value)} className="bg-white" /></div>
        </div>
        <Label className="mt-4 block text-xs font-bold text-foreground">Ouverture exceptionnelle ou précision horaire</Label>
        <Textarea value={exceptionalOpeningMessage} onChange={(event) => setExceptionalOpeningMessage(event.target.value)} className="mt-2 min-h-20 bg-white" />
        <Label className="mt-4 block text-xs font-bold text-foreground">Message spécial public si validé</Label>
        <Textarea value={specialMessage} onChange={(event) => setSpecialMessage(event.target.value)} className="mt-2 min-h-24 bg-white" />
        <Button onClick={saveSchedule} disabled={saving || loading} className="mt-4 w-full bg-brand text-white hover:bg-brand-dark sm:w-auto">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <CalendarClock className="size-4" />}
          Enregistrer comme admin
        </Button>
      </Card>
    </div>
  );
}

function Reference() {
  const [medications, setMedications] = useState<AdminMedicationReferenceRow[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [verificationStatus, setVerificationStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    genericName: "",
    dosage: "",
    form: "",
    category: "Autres",
    packSize: "",
    manufacturer: "",
    avgPrice: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const params = new URLSearchParams({
        scope: "admin",
        q: query,
        status,
        verificationStatus,
      });
      const res = await fetch(`/api/medications?${params}`, { headers: { "x-sablin-session-kind": "admin" } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Chargement du référentiel impossible.");
      setMedications(data.medications ?? []);
      setSummary(data.summary ?? {});
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Chargement du référentiel impossible.");
    } finally {
      setLoading(false);
    }
  }, [query, status, verificationStatus]);

  useEffect(() => {
    void load();
  }, [load]);

  const createMedication = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/medications", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-sablin-session-kind": "admin" },
        body: JSON.stringify({
          ...form,
          avgPrice: Number(form.avgPrice || 0),
          verificationStatus: "Validé",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Ajout impossible.");
      setMessage("Médicament ajouté au référentiel et audité.");
      setForm({ name: "", genericName: "", dosage: "", form: "", category: "Autres", packSize: "", manufacturer: "", avgPrice: "" });
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ajout impossible.");
    } finally {
      setSaving(false);
    }
  };

  const disableMedication = async (id: string) => {
    const res = await fetch("/api/medications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-sablin-session-kind": "admin" },
      body: JSON.stringify({ id, action: "disable" }),
    });
    const data = await res.json().catch(() => ({}));
    setMessage(res.ok ? "Médicament désactivé dans le référentiel." : data?.error ?? "Désactivation impossible.");
    if (res.ok) await load();
  };

  return (
    <div className="space-y-5">
      <AdminHero
        badge="Référentiel central"
        title="Référentiel médicaments"
        description="Base officielle utilisée par les imports, le moteur marketplace, les ordonnances et les recherches utilisateur. Les pharmacies ne modifient jamais ce référentiel directement."
        icon={Pill}
      />
      <MetricsGrid
        metrics={[
          { label: "Médicaments actifs", value: summary.active ?? 0, status: `${summary.visible ?? medications.length} affichés`, icon: Pill },
          { label: "Publiés / validés", value: summary.published ?? 0, status: "Marketplace", icon: CheckCircle2 },
          { label: "À vérifier", value: summary.toVerify ?? 0, status: "Contrôle", icon: AlertTriangle },
          { label: "Demandes à traiter", value: summary.requestsPending ?? 0, status: "Validation admin", icon: ClipboardList },
          { label: "Désactivés", value: summary.inactive ?? 0, status: "Contrôle", icon: LockKeyhole },
        ]}
      />
      <Card className="border-border/70 p-5 shadow-card">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_180px_220px_auto]">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nom, DCI, dosage, forme, fabricant..." className="bg-white" />
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-lg border border-border bg-white px-3 text-sm font-bold text-foreground">
            <option value="all">Tous statuts</option>
            <option value="Actif">Actif</option>
            <option value="Inactif">Inactif</option>
          </select>
          <select value={verificationStatus} onChange={(event) => setVerificationStatus(event.target.value)} className="h-10 rounded-lg border border-border bg-white px-3 text-sm font-bold text-foreground">
            <option value="all">Toute vérification</option>
            {["À vérifier", "Validé", "Publié", "Archivé", "Conflit"].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <Button onClick={load} disabled={loading} className="bg-brand text-white hover:bg-brand-dark">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            Actualiser
          </Button>
        </div>
      </Card>
      <Card className="border-border/70 p-5 shadow-card">
        <Heading level="h3">Ajouter au référentiel</Heading>
        <Muted>Les pharmacies ne modifient pas ce référentiel. Les ajouts Admin sont tracés et peuvent ensuite alimenter les imports, la marketplace et les ordonnances.</Muted>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Nom commercial" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} />
          <Field label="DCI" value={form.genericName} onChange={(value) => setForm((current) => ({ ...current, genericName: value }))} />
          <Field label="Dosage" value={form.dosage} onChange={(value) => setForm((current) => ({ ...current, dosage: value }))} />
          <Field label="Forme" value={form.form} onChange={(value) => setForm((current) => ({ ...current, form: value }))} />
          <Field label="Catégorie" value={form.category} onChange={(value) => setForm((current) => ({ ...current, category: value }))} />
          <Field label="Conditionnement" value={form.packSize} onChange={(value) => setForm((current) => ({ ...current, packSize: value }))} />
          <Field label="Fabricant" value={form.manufacturer} onChange={(value) => setForm((current) => ({ ...current, manufacturer: value }))} />
          <Field label="Prix indicatif interne" value={form.avgPrice} onChange={(value) => setForm((current) => ({ ...current, avgPrice: value }))} />
        </div>
        <Button onClick={createMedication} disabled={saving} className="mt-4 bg-brand text-white hover:bg-brand-dark">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Pill className="size-4" />}
          Ajouter au référentiel
        </Button>
        {message && <p className="mt-3 rounded-lg border border-border bg-white p-3 text-sm font-bold text-foreground">{message}</p>}
      </Card>
      <div className="grid gap-3 md:grid-cols-2">
        {loading && <Card className="border-border/70 p-4 text-sm font-bold text-muted-foreground">Chargement du référentiel...</Card>}
        {!loading && medications.length === 0 && <Card className="border-dashed border-border p-4 text-sm font-bold text-foreground">Aucun médicament ne correspond aux filtres.</Card>}
        {medications.map((m) => (
          <Card key={m.id} className="border-border/70 p-4 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge label={m.status} />
                  <StatusBadge label={m.verificationStatus} />
                  <StatusBadge label={`${m.counts.pharmacies} pharmacie(s)`} />
                </div>
                <p className="mt-3 font-bold text-foreground">{m.name}</p>
                <p className="text-sm text-muted-foreground">{m.genericName} · {m.dosage} · {m.form} · {m.category?.name ?? "Catégorie à vérifier"}</p>
                <p className="mt-1 text-xs font-semibold text-muted-foreground">Images : {m.counts.images} · Alias : {m.counts.aliases} · Prix indicatif interne : {formatFcfa(m.avgPrice)}</p>
              </div>
              <Badge className="border border-border bg-white text-foreground">Marketplace</Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <ProfessionalActionButton action="reference-update" label="Modifier" entityType="medication-reference" entityId={m.name} size="sm" variant="outline">
                Modifier
              </ProfessionalActionButton>
              <Button size="sm" variant="outline" className="border-red-300 text-red-700" onClick={() => disableMedication(m.id)}>
                Désactiver
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

type ProhibitedMedicationTermView = {
  id: string;
  name: string;
  normalizedName: string;
  reason?: string | null;
  active: boolean;
  createdBy?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  disabledAt?: string | null;
  disabledBy?: string | null;
};

function ProhibitedMedicationsAdmin() {
  const [terms, setTerms] = useState<ProhibitedMedicationTermView[]>([]);
  const [summary, setSummary] = useState({ total: 0, active: 0, inactive: 0, blockedImportRows: 0, visible: 0 });
  const [recentActions, setRecentActions] = useState<Array<{ id: string; label: string; status: string; actorRole?: string | null; message?: string | null; createdAt: string }>>([]);
  const [name, setName] = useState("");
  const [reason, setReason] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ includeInactive: "true", status: statusFilter });
    if (query.trim()) params.set("q", query.trim());
    const res = await fetch(`/api/admin/prohibited-medications?${params}`, {
      headers: { "X-Sablin-Session-Kind": "admin" },
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok) {
      setTerms(json.terms ?? []);
      setSummary(json.summary ?? { total: 0, active: 0, inactive: 0, blockedImportRows: 0, visible: 0 });
      setRecentActions(json.recentActions ?? []);
    } else {
      setMessage(json.error ?? "Chargement impossible.");
    }
  }, [query, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const addTerm = async () => {
    if (!name.trim()) {
      setMessage("Renseignez le nom du médicament à bloquer.");
      return;
    }
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/admin/prohibited-medications", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Sablin-Session-Kind": "admin" },
      body: JSON.stringify({ name, reason }),
    });
    const json = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setMessage(json.error ?? "Ajout impossible.");
      return;
    }
    setName("");
    setReason("");
    setMessage("Règle ajoutée. Ce médicament sera retiré automatiquement des publications pharmacie.");
    await load();
  };

  const updateTerm = async (id: string, action: "disable" | "enable") => {
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/admin/prohibited-medications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "X-Sablin-Session-Kind": "admin" },
      body: JSON.stringify({ id, action }),
    });
    const json = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setMessage(json.error ?? "Mise à jour impossible.");
      return;
    }
    setMessage(action === "enable" ? "Règle réactivée." : "Règle désactivée.");
    await load();
  };

  const activeTerms = terms.filter((term) => term.active);
  const inactiveTerms = terms.filter((term) => !term.active);

  return (
    <div className="space-y-5">
      <Card className="border-border/70 p-5 shadow-card">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Heading level="h2">Médicaments interdits</Heading>
            <Muted>
              Cette liste bloque automatiquement les produits sensibles ou interdits lors des imports pharmacie.
              Les pharmacies publient librement les produits autorisés, mais ces noms sont retirés sans intervention manuelle.
            </Muted>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className="w-fit border-0 bg-brand text-white">{summary.active} active(s)</Badge>
            <StatusBadge label={`${summary.blockedImportRows} ligne(s) bloquée(s)`} />
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nom du médicament à bloquer"
            className="bg-white"
          />
          <Input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Motif interne, optionnel"
            className="bg-white"
          />
          <Button className="bg-brand text-white hover:bg-brand-dark" onClick={addTerm} disabled={loading}>
            Ajouter
          </Button>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_220px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") load();
              }}
              placeholder="Rechercher une règle, un motif ou un nom normalisé"
              className="bg-white pl-9"
            />
          </div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-lg border border-border bg-white px-3 text-sm font-bold text-foreground">
            <option value="all">Toutes les règles</option>
            <option value="active">Actives uniquement</option>
            <option value="inactive">Désactivées uniquement</option>
          </select>
          <Button variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={load} disabled={loading}>
            <Filter className="size-4" /> Filtrer
          </Button>
        </div>
        {message && <p className="mt-3 rounded-lg border border-border bg-white p-3 text-sm font-bold text-foreground">{message}</p>}
      </Card>

      <MetricsGrid
        metrics={[
          { label: "Règles totales", value: summary.total, status: "Référentiel interdit", icon: ShieldCheck },
          { label: "Règles actives", value: summary.active, status: "Blocage actif", icon: LockKeyhole },
          { label: "Règles désactivées", value: summary.inactive, status: "Historisées", icon: History },
          { label: "Lignes import retirées", value: summary.blockedImportRows, status: "Publication contrôlée", icon: FileCheck2 },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <SectionBlock
          title="Règles actives"
          description="Ces médicaments sont retirés automatiquement des imports et ne peuvent pas alimenter la marketplace utilisateur."
        >
          <div className="grid gap-3 md:grid-cols-2">
            {activeTerms.map((term) => (
              <Card key={term.id} className="border-border/70 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <StatusBadge label="Blocage actif" />
                    <p className="mt-3 font-extrabold text-foreground">{term.name}</p>
                    <p className="text-xs font-semibold text-muted-foreground">Nom normalisé : {term.normalizedName}</p>
                    <p className="mt-1 text-xs font-semibold text-muted-foreground">Créé : {formatDateTime(term.createdAt)} · {term.createdBy ?? "Administration"}</p>
                  </div>
                  <Button
                    variant="outline"
                    className="border-red-200 text-red-700 hover:bg-red-50"
                    onClick={() => updateTerm(term.id, "disable")}
                    disabled={loading}
                  >
                    Désactiver
                  </Button>
                </div>
                {term.reason && <p className="mt-3 rounded-lg border border-border bg-muted/30 p-3 text-sm font-semibold text-foreground">{term.reason}</p>}
              </Card>
            ))}
            {!activeTerms.length && (
              <Card className="border-dashed border-border p-6 text-sm font-bold text-foreground">
                Aucun médicament interdit actif.
              </Card>
            )}
          </div>
        </SectionBlock>

        <SectionBlock title="Règles désactivées" description="Elles ne bloquent plus les imports, mais restent historisées.">
          <div className="grid gap-3">
            {inactiveTerms.slice(0, 8).map((term) => (
              <Card key={term.id} className="border-border/70 p-3">
                <StatusBadge label="Désactivée" />
                <p className="mt-2 text-sm font-extrabold text-foreground">{term.name}</p>
                <p className="text-xs font-semibold text-muted-foreground">{term.disabledAt ? formatDateTime(term.disabledAt) : "Date non renseignée"} · {term.disabledBy ?? "Administration"}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 border-brand/30 text-brand-dark hover:bg-brand-light"
                  onClick={() => updateTerm(term.id, "enable")}
                  disabled={loading}
                >
                  Réactiver
                </Button>
              </Card>
            ))}
            {!inactiveTerms.length && <p className="text-sm font-semibold text-muted-foreground">Aucune règle désactivée.</p>}
          </div>
        </SectionBlock>
      </div>

      <SectionBlock title="Audit des règles interdites" description="Chaque ajout, désactivation ou réactivation est journalisé côté Admin.">
        <ResponsiveTable
          headers={["Date", "Action", "Rôle", "Statut", "Message"]}
          rows={
            recentActions.length
              ? recentActions.map((action) => [
                  formatDateTime(action.createdAt),
                  <span key="label" className="font-bold text-foreground">{action.label}</span>,
                  action.actorRole ?? "Admin",
                  <StatusBadge key="status" label={action.status} />,
                  action.message ?? "Action enregistrée",
                ])
              : [["-", "Aucune action récente", "-", "-", ""]]
          }
        />
      </SectionBlock>
    </div>
  );
}

type EnrichmentData = {
  rows?: Array<{
    id: string;
    lineNumber: number;
    matchScore: number;
    matchLevel: string;
    status: string;
    originalJson: string;
    normalizedJson: string;
    pharmacy?: { name: string; slug: string };
    enrichmentRequired?: boolean;
    medication?: { id: string; name: string; slug: string; dosage: string; form: string } | null;
  }>;
  jobs?: Array<{ id: string; status: string; provider: string; query: string; confidenceScore: number }>;
  candidates?: Array<{
    id: string;
    candidateType: string;
    score: number;
    status: string;
    licenseType?: string | null;
    sourceName?: string | null;
    sourceUrl?: string | null;
    imageUrl?: string | null;
    job?: { medicationId?: string | null; medication?: { id: string; name: string } | null } | null;
    proposedMedication?: { name: string; dosage: string; form: string } | null;
  }>;
  images?: Array<{
    id: string;
    url: string;
    sourceUrl?: string | null;
    confidenceScore?: number;
    sourceName: string;
    licenseType: string;
    validationStatus: string;
    imageType: string;
    isPlaceholder: boolean;
    commercialUseAllowed?: boolean;
    medication: { id: string; name: string; dosage: string; form: string };
  }>;
  descriptions?: Array<{
    id: string;
    shortText: string;
    sourceName: string;
    validationStatus: string;
    medication: { name: string };
  }>;
  providers?: Array<{ id: string; name: string; providerType: string; active: boolean; priority: number; lastErrorMessage?: string | null }>;
  externalEnrichment?: {
    externalEnrichmentEnabled: boolean;
    googleApiConfigured: boolean;
    googleSearchEngineConfigured: boolean;
    braveApiConfigured?: boolean;
    openverseEnabled?: boolean;
    imageSearchProvider?: "auto" | "google" | "brave" | "openverse" | "internal";
    activeProviders?: string[];
    providerStatus: "active" | "disabled" | "misconfigured";
    mode: "google_web" | "internal_fallback";
    modeLabel: string;
    reason: string;
    dailyLimit: number;
    confidenceThreshold: number;
    lastTest?: { status: string; at: string | null; message: string };
    lastError?: string | null;
    lastErrorAt?: string | null;
    adminMessage?: string;
  };
};

function EnrichmentAdmin({ licenseOnly = false }: { licenseOnly?: boolean }) {
  const [data, setData] = useState<EnrichmentData>({});
  const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    const res = await fetch("/api/medication-enrichment", { headers: { "X-Sablin-Session-Kind": "admin" } });
    const json = await res.json().catch(() => ({}));
    if (res.ok) setData(json);
    else setMessage(json.error ?? "Chargement impossible.");
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const action = async (payload: Record<string, unknown>) => {
    setMessage("");
    const res = await fetch("/api/medication-enrichment", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "X-Sablin-Session-Kind": "admin" },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) setMessage(json.error ?? "Action impossible.");
    else {
      setMessage("Action enregistrée et historisée.");
      await load();
    }
  };

  return (
    <div className="space-y-5">
      <Card className="border-border/70 p-5 shadow-card">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Heading level="h2">{licenseOnly ? "Sources et licences des images" : "Enrichissement médicaments"}</Heading>
            <Muted>Validation administrative obligatoire pour les images web, licences inconnues, descriptions médicales et correspondances ambiguës.</Muted>
          </div>
          <Button variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={load}>Actualiser</Button>
        </div>
        {message && <p className="mt-3 rounded-lg border border-border bg-white p-3 text-sm font-bold text-foreground">{message}</p>}
      </Card>

      {!licenseOnly && (
        <div className="grid gap-3 lg:grid-cols-2">
          {(data.rows ?? []).slice(0, 12).map((row) => (
            <Card key={row.id} className="border-border/70 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <StatusBadge label={row.matchLevel} />
                  <p className="mt-2 font-extrabold text-foreground">Ligne {row.lineNumber} · Score {row.matchScore}/100</p>
                  <p className="text-sm text-muted-foreground">{row.pharmacy?.name ?? "Pharmacie"} → {row.medication?.name ?? "Aucune correspondance"}</p>
                </div>
                <StatusBadge label={row.status} />
              </div>
            </Card>
          ))}
        </div>
      )}

      {!licenseOnly && (
        <SectionBlock title="Correspondances à confirmer" description="Un nom similaire ne suffit jamais : dosage et forme doivent correspondre.">
          <div className="grid gap-3 md:grid-cols-2">
            {(data.candidates ?? []).filter((item) => item.candidateType === "medication_match").slice(0, 10).map((candidate) => (
              <Card key={candidate.id} className="border-border/70 p-4">
                <StatusBadge label={candidate.status} />
                <p className="mt-2 font-bold text-foreground">{candidate.proposedMedication?.name ?? "Médicament proposé"}</p>
                <p className="text-sm text-muted-foreground">{candidate.proposedMedication?.dosage} · {candidate.proposedMedication?.form} · Score {candidate.score}/100</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => action({ action: "validate-match", candidateId: candidate.id })}>Valider correspondance</Button>
                  <Button size="sm" variant="outline" onClick={() => action({ action: "refuse-candidate", candidateId: candidate.id })}>Refuser</Button>
                </div>
              </Card>
            ))}
          </div>
        </SectionBlock>
      )}

      <SectionBlock title="Images candidates et licences" description="Une image sans licence vérifiée reste non publiée.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(data.images ?? []).slice(0, 12).map((image) => (
            <Card key={image.id} className="overflow-hidden border-border/70">
              <div className="h-36 bg-muted/30">
                <img src={image.url} alt={image.medication.name} className="h-full w-full object-cover" />
              </div>
              <div className="p-4">
                <div className="flex flex-wrap gap-2"><StatusBadge label={image.validationStatus} /><StatusBadge label={image.licenseType} /></div>
                <p className="mt-2 font-bold text-foreground">{image.medication.name}</p>
                <p className="text-sm text-muted-foreground">{image.sourceName} · {image.imageType}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => action({ action: "publish-image", imageId: image.id, isPrimary: true, commercialUseAllowed: true })}>Publier image</Button>
                  <Button size="sm" variant="outline" onClick={() => action({ action: "validate-image", imageId: image.id })}>Valider licence</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </SectionBlock>

      {!licenseOnly && (
        <SectionBlock title="Descriptions à valider" description="Aucune information médicale générée librement ne doit être publiée sans source.">
          <div className="grid gap-3 md:grid-cols-2">
            {(data.descriptions ?? []).slice(0, 8).map((description) => (
              <Card key={description.id} className="border-border/70 p-4">
                <StatusBadge label={description.validationStatus} />
                <p className="mt-2 font-bold text-foreground">{description.medication.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{description.shortText}</p>
                <p className="mt-2 text-xs font-bold text-brand-dark">Source : {description.sourceName}</p>
                <Button size="sm" className="mt-3" onClick={() => action({ action: "publish-description", descriptionId: description.id })}>Publier description</Button>
              </Card>
            ))}
          </div>
        </SectionBlock>
      )}

      <SectionBlock title="Fournisseurs configurables" description="Les clés API restent côté serveur. Les fournisseurs externes peuvent rester désactivés sans bloquer la plateforme.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(data.providers ?? []).map((provider) => (
            <Card key={provider.id} className="border-border/70 p-4">
              <StatusBadge label={provider.active ? "Actif" : "Inactif"} />
              <p className="mt-2 font-bold text-foreground">{provider.name}</p>
              <p className="text-sm text-muted-foreground">{provider.providerType} · priorité {provider.priority}</p>
            </Card>
          ))}
        </div>
      </SectionBlock>
    </div>
  );
}

function ExternalEnrichmentStatusCard({
  status,
  onRefresh,
  onTest,
  onRelaunch,
}: {
  status?: EnrichmentData["externalEnrichment"];
  onRefresh: () => void;
  onTest: () => void;
  onRelaunch: () => void;
}) {
  const enabled = status?.providerStatus === "active";
  const modeLabel = status?.modeLabel ?? "Fallback interne";
  const activeProviders = status?.activeProviders?.length ? status.activeProviders.join(", ") : "Aucun fournisseur externe";
  return (
    <Card className="border-border/70 bg-white p-5 shadow-card">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Badge className={cn("border-0 text-white", enabled ? "bg-brand" : "bg-amber-600")}>
            État de l’enrichissement externe
          </Badge>
          <Heading level="h3" className="mt-3">Recherche images côté serveur</Heading>
          <Muted>
            {status?.adminMessage ??
              "L’enrichissement externe est prêt côté serveur. La chaîne peut utiliser Google si autorisé, Brave si une clé est configurée, puis Openverse/Wikimedia avec validation admin."}
          </Muted>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={onRefresh}>Actualiser</Button>
          <Button variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={onTest}>Tester la configuration</Button>
          <Button className="bg-brand text-white hover:bg-brand-dark" onClick={onRelaunch}>Relancer l’enrichissement</Button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <p className="text-xs font-bold uppercase text-muted-foreground">Enrichissement externe</p>
          <p className="mt-1 font-extrabold text-foreground">{enabled ? "Activé" : "Désactivé"}</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <p className="text-xs font-bold uppercase text-muted-foreground">Google API Key</p>
          <p className="mt-1 font-extrabold text-foreground">{status?.googleApiConfigured ? "Configurée" : "Manquante"}</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <p className="text-xs font-bold uppercase text-muted-foreground">Google Search Engine ID</p>
          <p className="mt-1 font-extrabold text-foreground">{status?.googleSearchEngineConfigured ? "Configuré" : "Manquant"}</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <p className="text-xs font-bold uppercase text-muted-foreground">Mode actuel</p>
          <p className="mt-1 font-extrabold text-foreground">{modeLabel}</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <p className="text-xs font-bold uppercase text-muted-foreground">Fournisseur demandé</p>
          <p className="mt-1 font-extrabold text-foreground">{status?.imageSearchProvider ?? "auto"}</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <p className="text-xs font-bold uppercase text-muted-foreground">Brave Search</p>
          <p className="mt-1 font-extrabold text-foreground">{status?.braveApiConfigured ? "Configuré" : "Non configuré"}</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <p className="text-xs font-bold uppercase text-muted-foreground">Openverse/Wikimedia</p>
          <p className="mt-1 font-extrabold text-foreground">{status?.openverseEnabled ? "Activé" : "Désactivé"}</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <p className="text-xs font-bold uppercase text-muted-foreground">Chaîne active</p>
          <p className="mt-1 font-extrabold text-foreground">{activeProviders}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-white p-3">
          <p className="text-xs font-bold uppercase text-muted-foreground">Dernier test</p>
          <p className="mt-1 text-sm font-bold text-foreground">{status?.lastTest?.message ?? "Non exécuté."}</p>
          {status?.lastTest?.at && <p className="mt-1 text-xs text-muted-foreground">{new Date(status.lastTest.at).toLocaleString("fr-FR")}</p>}
        </div>
        <div className="rounded-lg border border-border bg-white p-3">
          <p className="text-xs font-bold uppercase text-muted-foreground">Dernière erreur</p>
          <p className="mt-1 text-sm font-bold text-foreground">{status?.lastError || status?.reason || "Aucune erreur."}</p>
        </div>
      </div>
    </Card>
  );
}

function MarketplaceEngineAdmin() {
  const [data, setData] = useState<EnrichmentData>({});
  const [jobs, setJobs] = useState<Array<{ id: string; status: string; query: string; confidenceScore: number; candidates?: unknown[]; medication?: { name: string } | null }>>([]);
  const [tab, setTab] = useState("Imports récents");
  const [message, setMessage] = useState("");
  const tabs = [
    "Imports récents",
    "Produits reconnus",
    "Produits à enrichir",
    "Images candidates",
    "Descriptions à valider",
    "Produits sans image",
    "Produits prêts à publier",
  ];

  const load = useCallback(async () => {
    const [enrichmentRes, jobsRes] = await Promise.all([
      fetch("/api/medication-enrichment", { headers: { "X-Sablin-Session-Kind": "admin" } }),
      fetch("/api/enrichment/jobs", { headers: { "X-Sablin-Session-Kind": "admin" } }),
    ]);
    const enrichmentJson = await enrichmentRes.json().catch(() => ({}));
    const jobsJson = await jobsRes.json().catch(() => ({}));
    if (enrichmentRes.ok) setData(enrichmentJson);
    if (jobsRes.ok) setJobs(jobsJson.jobs ?? []);
    if (!enrichmentRes.ok || !jobsRes.ok) setMessage(enrichmentJson.error ?? jobsJson.error ?? "Chargement moteur impossible.");
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const startEnrichment = async () => {
    setMessage("");
    const importRowIds = (data.rows ?? [])
      .filter((row) => row.medication?.id || row.matchScore >= 60)
      .slice(0, 20)
      .map((row) => row.id);
    const medicationIds = (data.rows ?? [])
      .map((row) => row.medication?.id)
      .filter(Boolean);
    const res = await fetch("/api/enrichment/start", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Sablin-Session-Kind": "admin" },
      body: JSON.stringify({ importRowIds, medicationIds }),
    });
    const json = await res.json().catch(() => ({}));
    setMessage(res.ok ? `${json.count ?? 0} job(s) d’enrichissement lancé(s).` : json.error ?? "Lancement impossible.");
    if (res.ok) await load();
  };

  const postAction = async (url: string, payload: Record<string, unknown>, success: string) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Sablin-Session-Kind": "admin" },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    setMessage(res.ok ? success : json.error ?? "Action impossible.");
    if (res.ok) await load();
  };

  const patchEnrichmentAction = async (payload: Record<string, unknown>, success: string) => {
    const res = await fetch("/api/medication-enrichment", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "X-Sablin-Session-Kind": "admin" },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    setMessage(res.ok ? success : json.error ?? "Action impossible.");
    if (res.ok) await load();
  };

  const testExternalConfig = async () => {
    const res = await fetch("/api/enrichment/config", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Sablin-Session-Kind": "admin" },
      body: JSON.stringify({ action: "test" }),
    });
    const json = await res.json().catch(() => ({}));
    setMessage(res.ok ? json.message ?? "Configuration testée." : json.error ?? "Test impossible.");
    if (json.status) setData((current) => ({ ...current, externalEnrichment: json.status }));
    await load();
  };

  const rows = data.rows ?? [];
  const candidates = data.candidates ?? [];
  const images = data.images ?? [];
  const descriptions = data.descriptions ?? [];
  const recognizedRows = rows.filter((row) => row.medication && row.matchScore >= 80);
  const enrichRows = rows.filter((row) => row.enrichmentRequired || row.matchScore < 80);
  const imageCandidates = candidates.filter((candidate) => candidate.candidateType === "image");
  const productsWithoutImage = rows.filter((row) => row.medication && !images.some((image) => image.medication.name === row.medication?.name));
  const readyToPublish = rows.filter((row) => row.medication && row.matchScore >= 95);

  return (
    <div className="space-y-5">
      <Card className="border-border/70 p-5 shadow-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Badge className="border-0 bg-brand text-white">Moteur Marketplace & Enrichissement</Badge>
            <Heading level="h2" className="mt-3">Marketplace médicaments sans vente directe</Heading>
            <Muted>Import CSV, Excel, Word et PowerPoint, normalisation, référentiel, images, descriptions, licence et publication contrôlée côté utilisateur.</Muted>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={load}>Actualiser</Button>
            <Button className="bg-brand text-white hover:bg-brand-dark" onClick={startEnrichment}>Lancer enrichissement</Button>
          </div>
        </div>
        {message && <p className="mt-3 rounded-lg border border-border bg-white p-3 text-sm font-bold text-foreground">{message}</p>}
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Lignes importées" value={rows.length} badge="Imports" />
          <Stat label="Produits reconnus" value={recognizedRows.length} badge="Référentiel" />
          <Stat label="Jobs enrichissement" value={jobs.length} badge="Asynchrone" />
          <Stat label="Images à valider" value={images.filter((image) => image.validationStatus !== "Publiée").length + imageCandidates.length} badge="Licence" />
          <Stat label="Descriptions" value={descriptions.length} badge="Validation" />
          <Stat label="Sans image" value={productsWithoutImage.length} badge="Placeholder" />
          <Stat label="Prêts à publier" value={readyToPublish.length} badge="Publication" />
          <Stat label="Règle publique" value="0 vente" badge="Information" />
        </div>
      </Card>

      <ExternalEnrichmentStatusCard
        status={data.externalEnrichment}
        onRefresh={load}
        onTest={testExternalConfig}
        onRelaunch={startEnrichment}
      />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={cn(
              "shrink-0 rounded-lg border px-3 py-2 text-xs font-extrabold",
              tab === item ? "border-brand bg-brand text-white" : "border-border bg-white text-foreground"
            )}
          >
            {item}
          </button>
        ))}
      </div>

      {tab === "Imports récents" && (
        <SectionBlock title="Imports récents" description="Chaque ligne garde sa valeur originale, sa valeur normalisée, sa source et son score de confiance.">
          <div className="grid gap-3 md:grid-cols-2">
            {rows.slice(0, 12).map((row) => (
              <Card key={row.id} className="border-border/70 p-4">
                <div className="flex flex-wrap gap-2"><StatusBadge label={row.matchLevel} /><StatusBadge label={row.status} /></div>
                <p className="mt-2 font-bold text-foreground">Ligne {row.lineNumber} · Score {row.matchScore}/100</p>
                <p className="text-sm text-muted-foreground">{row.pharmacy?.name ?? "Pharmacie"} · {row.medication?.name ?? "À valider dans le référentiel"}</p>
              </Card>
            ))}
          </div>
        </SectionBlock>
      )}

      {tab === "Produits reconnus" && (
        <SectionBlock title="Produits reconnus" description="Les correspondances exactes peuvent alimenter la marketplace après contrôle des données pharmacie.">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {recognizedRows.slice(0, 12).map((row) => (
              <Card key={row.id} className="border-border/70 p-4">
                <StatusBadge label="Reconnu" />
                <p className="mt-2 font-bold text-foreground">{row.medication?.name}</p>
                <p className="text-sm text-muted-foreground">{row.medication?.dosage} · {row.medication?.form} · Score {row.matchScore}/100</p>
              </Card>
            ))}
          </div>
        </SectionBlock>
      )}

      {tab === "Produits à enrichir" && (
        <SectionBlock title="Produits à enrichir" description="Les cas ambigus restent en validation individuelle.">
          <div className="grid gap-3 md:grid-cols-2">
            {enrichRows.slice(0, 12).map((row) => (
              <Card key={row.id} className="border-border/70 p-4">
                <StatusBadge label={row.matchLevel} />
                <p className="mt-2 font-bold text-foreground">{row.medication?.name ?? "Produit non reconnu"}</p>
                <p className="text-sm text-muted-foreground">Score {row.matchScore}/100 · publication bloquée avant validation.</p>
              </Card>
            ))}
          </div>
        </SectionBlock>
      )}

      {tab === "Images candidates" && (
        <SectionBlock title="Images candidates" description="Une image web avec licence inconnue ne doit pas être publiée côté utilisateur.">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {images.slice(0, 12).map((image) => (
              <Card key={image.id} className="overflow-hidden border-border/70">
                <div className="h-36 bg-muted/30"><img src={image.url} alt={image.medication.name} className="h-full w-full object-cover" /></div>
                <div className="p-4">
                  <div className="flex flex-wrap gap-2"><StatusBadge label={image.validationStatus} /><StatusBadge label={image.licenseType} /></div>
                  <p className="mt-2 font-bold text-foreground">{image.medication.name}</p>
                  <p className="text-sm text-muted-foreground">{image.sourceName} · {image.imageType}</p>
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <p>Score : {image.confidenceScore ?? 0}/100</p>
                    <p>Licence : {image.commercialUseAllowed ? "Usage autorisé" : "À vérifier"}</p>
                    {image.sourceUrl && (
                      <a href={image.sourceUrl} target="_blank" rel="noreferrer" className="block break-words font-bold text-brand-dark">
                        Source image
                      </a>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => postAction("/api/enrichment/validate-image", { imageId: image.id, commercialUseAllowed: true }, "Image validée.")}>Valider licence</Button>
                    <Button size="sm" className="bg-brand text-white" onClick={() => postAction("/api/enrichment/publish", { imageId: image.id }, "Image publiée.")}>Publier</Button>
                    <Button size="sm" variant="outline" className="border-red-300 text-red-700" onClick={() => postAction("/api/enrichment/reject-image", { imageId: image.id }, "Image refusée.")}>Refuser</Button>
                    <Button size="sm" variant="outline" onClick={() => patchEnrichmentAction({ action: "use-placeholder", medicationId: image.medication.id }, "Placeholder SABLIN PHARMA utilisé.")}>Utiliser placeholder</Button>
                  </div>
                </div>
              </Card>
            ))}
            {imageCandidates.slice(0, 12).map((candidate) => (
              <Card key={candidate.id} className="overflow-hidden border-border/70">
                <div className="h-36 bg-muted/30">
                  {candidate.imageUrl ? (
                    <img src={candidate.imageUrl} alt={candidate.sourceName ?? "Image candidate"} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center p-4 text-center text-sm font-bold text-muted-foreground">Image du produit non disponible</div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex flex-wrap gap-2"><StatusBadge label={candidate.status} /><StatusBadge label={candidate.licenseType ?? "Licence à confirmer"} /></div>
                  <p className="mt-2 font-bold text-foreground">{candidate.sourceName ?? "Source web"}</p>
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <p>Score : {candidate.score}/100</p>
                    <p>Statut validation : À vérifier</p>
                    {candidate.sourceUrl && (
                      <a href={candidate.sourceUrl} target="_blank" rel="noreferrer" className="block break-words font-bold text-brand-dark">
                        URL source
                      </a>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" className="bg-brand text-white" onClick={() => patchEnrichmentAction({ action: "promote-image-candidate", candidateId: candidate.id }, "Image candidate préparée pour validation.")}>Préparer validation</Button>
                    <Button size="sm" variant="outline" className="border-red-300 text-red-700" onClick={() => postAction("/api/enrichment/reject-image", { candidateId: candidate.id }, "Image candidate refusée.")}>Refuser</Button>
                    <Button size="sm" variant="outline" onClick={() => patchEnrichmentAction({ action: "use-placeholder", candidateId: candidate.id }, "Placeholder SABLIN PHARMA utilisé.")}>Utiliser placeholder</Button>
                  </div>
                </div>
              </Card>
            ))}
            {!images.length && !imageCandidates.length && (
              <Card className="border-border/70 p-5 text-sm font-bold text-muted-foreground">
                Aucun candidat image à traiter. Les produits sans image fiable utilisent le placeholder SABLIN PHARMA.
              </Card>
            )}
          </div>
        </SectionBlock>
      )}

      {tab === "Descriptions à valider" && (
        <SectionBlock title="Descriptions à valider" description="Descriptions neutres, sans posologie personnalisée ni promesse médicale.">
          <div className="grid gap-3 md:grid-cols-2">
            {descriptions.slice(0, 10).map((description) => (
              <Card key={description.id} className="border-border/70 p-4">
                <StatusBadge label={description.validationStatus} />
                <p className="mt-2 font-bold text-foreground">{description.medication.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{description.shortText}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => postAction("/api/enrichment/validate-description", { descriptionId: description.id }, "Description validée.")}>Valider</Button>
                  <Button size="sm" className="bg-brand text-white" onClick={() => postAction("/api/enrichment/publish", { descriptionId: description.id }, "Description publiée.")}>Publier</Button>
                </div>
              </Card>
            ))}
          </div>
        </SectionBlock>
      )}

      {(tab === "Produits sans image" || tab === "Produits prêts à publier") && (
        <SectionBlock title={tab} description="Les produits sans image fiable utilisent un placeholder SABLIN PHARMA propre et transparent.">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {(tab === "Produits sans image" ? productsWithoutImage : readyToPublish).slice(0, 12).map((row) => (
              <Card key={row.id} className="border-border/70 p-4">
                <StatusBadge label={tab === "Produits sans image" ? "Placeholder" : "Prêt à publier"} />
                <p className="mt-2 font-bold text-foreground">{row.medication?.name ?? "Produit"}</p>
                <p className="text-sm text-muted-foreground">Score {row.matchScore}/100 · {row.medication?.dosage} · {row.medication?.form}</p>
                {row.medication?.id && (
                  <Button size="sm" className="mt-3 bg-brand text-white" onClick={() => postAction("/api/enrichment/publish", { medicationId: row.medication?.id }, "Produit publié.")}>
                    Publier produit
                  </Button>
                )}
              </Card>
            ))}
          </div>
        </SectionBlock>
      )}
    </div>
  );
}

function UsersList() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [summary, setSummary] = useState<AdminUsersSummary>(emptyAdminUsersSummary);
  const [query, setQuery] = useState("");
  const [commune, setCommune] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const params = new URLSearchParams({ limit: "80" });
      if (query.trim()) params.set("q", query.trim());
      if (commune.trim()) params.set("commune", commune.trim());
      const res = await fetch(`/api/admin/users?${params}`, { headers: { "x-sablin-session-kind": "admin" } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Chargement des utilisateurs impossible.");
      setUsers(data.users ?? []);
      setSummary({ ...emptyAdminUsersSummary, ...(data.summary ?? {}) });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Chargement des utilisateurs impossible.");
    } finally {
      setLoading(false);
    }
  }, [commune, query]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-5">
      <AdminHero
        badge="Grand public"
        title="Utilisateurs"
        description="Suivi des comptes clients, crédits SABLIN, ordonnances, contacts débloqués, Pass Ordonnance Unique et actions support sans jamais exposer de mot de passe."
        icon={Users}
      />
      <MetricsGrid
        metrics={[
          { label: "Utilisateurs suivis", value: summary.totalUsers, status: `${summary.listedUsers} affichés`, icon: Users },
          { label: "Avec crédits", value: summary.usersWithCredits, status: "Crédits SABLIN", icon: WalletCards },
          { label: "Solde insuffisant", value: summary.zeroCreditUsers, status: "À accompagner", icon: AlertTriangle },
          { label: "Transactions visibles", value: summary.totalTransactionsVisible, status: "Serveur", icon: ClipboardList },
        ]}
      />
      <Card className="border-border/70 p-5 shadow-card">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nom, téléphone, e-mail ou commune" className="bg-white pl-9" />
          </div>
          <Input value={commune} onChange={(event) => setCommune(event.target.value)} placeholder="Commune" className="bg-white" />
          <Button onClick={load} disabled={loading} className="bg-brand text-white hover:bg-brand-dark">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            Actualiser
          </Button>
        </div>
        {message && <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-800">{message}</p>}
        <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>{["Nom", "Téléphone", "Email", "Commune", "Solde", "Transactions", "Demandes", "Pass", "Statut", "Dernière activité", "Action"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border bg-white">
            {loading && (
              <tr><td colSpan={11} className="px-4 py-6 text-center font-bold text-muted-foreground">Chargement des utilisateurs réels...</td></tr>
            )}
            {!loading && users.length === 0 && (
              <tr><td colSpan={11} className="px-4 py-8 text-center font-bold text-foreground">Aucun utilisateur trouvé pour ces filtres.</td></tr>
            )}
            {!loading && users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3 font-bold">{user.name}</td>
                <td className="px-4 py-3">{user.phone ?? "Non renseigné"}</td>
                <td className="px-4 py-3">{user.email ?? "Non renseigné"}</td>
                <td className="px-4 py-3">{user.commune ?? "Non renseignée"}</td>
                <td className="px-4 py-3">{user.credits} crédits</td>
                <td className="px-4 py-3">{user.counts.transactions}</td>
                <td className="px-4 py-3">{user.counts.requests}</td>
                <td className="px-4 py-3"><StatusBadge label={user.passStatus} /></td>
                <td className="px-4 py-3"><StatusBadge label={user.status} /></td>
                <td className="px-4 py-3">{formatDateTime(user.lastActivity)}</td>
                <td className="px-4 py-3"><Button size="sm" className="bg-brand text-white" onClick={() => (window.location.href = `/admin/utilisateurs/${user.id}`)}>Voir détail</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </Card>
      <ActionQueue
        title="File support utilisateurs"
        items={[
          { title: "Soldes insuffisants", detail: `${summary.zeroCreditUsers} comptes sans crédit doivent voir des invitations claires à recharger.`, status: "Support" },
          { title: "Demandes ouvertes", detail: `${summary.pendingRequests} demandes utilisateurs sont encore en cours côté pharmacies.`, status: "Demandes" },
          { title: "Transactions du jour", detail: `${summary.transactionsToday} mouvements de crédits ont été enregistrés aujourd’hui.`, status: "Crédits" },
          { title: "Pass suivis", detail: `${summary.totalPassVisible} Pass Ordonnance Unique visibles dans la sélection courante.`, status: "Pass Ordonnance Unique" },
        ]}
      />
    </div>
  );
}

function Transactions() {
  const [rows, setRows] = useState<AdminTransactionRow[]>([]);
  const [summary, setSummary] = useState<AdminTransactionsSummary>(emptyAdminTransactionsSummary);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (query.trim()) params.set("q", query.trim());
      if (status !== "all") params.set("status", status);
      if (type !== "all") params.set("type", type);
      const res = await fetch(`/api/admin/transactions?${params}`, { headers: { "x-sablin-session-kind": "admin" } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Chargement des transactions impossible.");
      setRows(data.rows ?? []);
      setSummary({ ...emptyAdminTransactionsSummary, ...(data.summary ?? {}) });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Chargement des transactions impossible.");
    } finally {
      setLoading(false);
    }
  }, [query, status, type]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-5">
      <AdminHero
        badge="Comptabilité crédits"
        title="Crédits & transactions"
        description="Lecture globale des recharges, crédits utilisés, Pass Ordonnance Unique, contacts débloqués et corrections support. Le solde reste calculé côté serveur."
        icon={WalletCards}
      />
      <MetricsGrid
        metrics={[
          { label: "Crédits vendus", value: summary.creditsSold, status: formatFcfa(summary.creditsSoldFcfa), icon: WalletCards },
          { label: "Crédits utilisés", value: summary.creditsDebited, status: formatFcfa(summary.creditsDebitedFcfa), icon: Activity },
          { label: "Net crédits serveur", value: summary.netCredits, status: "Recharges - débits", icon: Database },
          { label: "Transactions du jour", value: summary.todayTransactions, status: "Serveur", icon: CheckCircle2 },
          { label: "Paiements confirmés", value: summary.successfulPayments, status: `${summary.pendingPayments} en attente`, icon: ShieldCheck },
          { label: "Pass actifs", value: summary.activePassCount, status: `${summary.passCount} achetés`, icon: FileCheck2 },
          { label: "Utilisateurs concernés", value: summary.usersImpacted, status: `${summary.totalMovements} mouvements`, icon: Users },
          { label: "Anomalies", value: summary.failedPayments + summary.suspiciousPayments, status: "À vérifier", icon: AlertTriangle },
        ]}
      />
      <Card className="border-border/70 p-5 shadow-card">
        <div className="grid gap-3 xl:grid-cols-[1fr_180px_180px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Référence, utilisateur, prestataire ou description" className="bg-white pl-9" />
          </div>
          <select value={type} onChange={(event) => setType(event.target.value)} className="h-10 rounded-lg border border-border bg-white px-3 text-sm font-bold text-foreground">
            <option value="all">Tous types</option>
            <option value="recharge">Recharges</option>
            <option value="debit">Débits crédits</option>
            <option value="pass">Pass Ordonnance</option>
          </select>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-lg border border-border bg-white px-3 text-sm font-bold text-foreground">
            <option value="all">Tous statuts</option>
            <option value="réussi">Réussi</option>
            <option value="échoué">Échoué</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="PENDING">PENDING</option>
            <option value="SUSPICIOUS">SUSPICIOUS</option>
          </select>
          <Button onClick={load} disabled={loading} className="bg-brand text-white hover:bg-brand-dark">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            Actualiser
          </Button>
        </div>
        {message && <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-800">{message}</p>}
        {loading && <p className="mt-4 rounded-lg border border-border bg-muted/30 p-3 text-sm font-bold text-muted-foreground">Chargement des mouvements serveur...</p>}
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <Card className="border-border/70 p-4">
            <p className="text-sm font-extrabold text-foreground">Règle comptable</p>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">1 crédit = 100 FCFA. Les crédits affichés proviennent des transactions serveur, jamais du navigateur.</p>
          </Card>
          <Card className="border-border/70 p-4">
            <p className="text-sm font-extrabold text-foreground">Pass Ordonnance Unique</p>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">{summary.activePassCount} pass actif(s) ou lié(s). Un pass utilisé ou expiré ne débloque plus une nouvelle ordonnance.</p>
          </Card>
          <Card className="border-border/70 p-4">
            <p className="text-sm font-extrabold text-foreground">Paiements à surveiller</p>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">{summary.pendingPayments} paiement(s) en attente de confirmation officielle, {summary.suspiciousPayments} suspect(s).</p>
          </Card>
        </div>
        <ResponsiveTable
          headers={["Action", "Utilisateur", "Montant", "Crédits", "Solde avant", "Solde après", "Statut", "Référence", "Actions"]}
          rows={rows.map((row) => [
            <span key="action" className="font-bold text-foreground">{row.action}</span>,
            row.user,
            formatFcfa(row.amountFcfa),
            `${row.credits > 0 ? "+" : ""}${row.credits}`,
            row.balanceBefore ?? "Paiement",
            row.balanceAfter ?? "Vérification",
            <StatusBadge key="status" label={row.status} />,
            <span key="ref" className="break-all font-mono text-xs font-bold">{row.reference}</span>,
            <ProfessionalActionButton key="btn" action="refund-transaction" label="Analyser" entityType={row.source} entityId={row.reference} size="sm" variant="outline">Analyser</ProfessionalActionButton>,
          ])}
        />
        {!loading && rows.length === 0 && <p className="mt-4 rounded-lg border border-dashed border-border p-6 text-center text-sm font-bold text-foreground">Aucune transaction trouvée pour ces filtres.</p>}
      </Card>
    </div>
  );
}

function UserDetail({ userId }: { userId?: string }) {
  const [user, setUser] = useState<AdminUserRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    if (!userId) {
      setMessage("Utilisateur introuvable.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const params = new URLSearchParams({ userId, limit: "1" });
      const res = await fetch(`/api/admin/users?${params}`, { headers: { "x-sablin-session-kind": "admin" } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Chargement du dossier utilisateur impossible.");
      setUser(data.user ?? null);
      if (!data.user) setMessage("Utilisateur introuvable dans la base.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Chargement du dossier utilisateur impossible.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <Card className="border-border/70 p-6 text-sm font-bold text-muted-foreground shadow-card">
        Chargement du dossier utilisateur réel...
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="border-border/70 p-6 shadow-card">
        <Heading level="h2">Utilisateur introuvable</Heading>
        <Muted className="mt-2">{message || "Aucun compte ne correspond à cet identifiant."}</Muted>
        <Button className="mt-4 bg-brand text-white hover:bg-brand-dark" onClick={() => (window.location.href = "/admin/utilisateurs")}>Retour aux utilisateurs</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <AdminHero
        badge={user.status}
        title={user.name}
        description={`${user.phone ?? "Téléphone non renseigné"} · ${user.email ?? "E-mail non renseigné"} · ${user.commune ?? "Commune non renseignée"}. Actions support sans mot de passe en clair.`}
        icon={Users}
        actions={
          <ProfessionalActionButton action="user-block-toggle" label="Bloquer ou débloquer" entityType="user" entityId={user.id} variant="outline" className="border-red-300 text-red-700">
            Bloquer ou débloquer
          </ProfessionalActionButton>
        }
      />
      <MetricsGrid
        metrics={[
          { label: "Solde crédits", value: `${user.credits} crédits`, status: "Crédits SABLIN", icon: WalletCards },
          { label: "Transactions", value: user.counts.transactions, status: "Historique serveur", icon: History },
          { label: "Demandes", value: user.counts.requests, status: "Pharmacies", icon: ClipboardList },
          { label: "Dernière activité", value: formatDateTime(user.lastActivity), status: user.passStatus, icon: Activity },
        ]}
      />
      {message && <p className="rounded-lg border border-border bg-white p-3 text-sm font-bold text-foreground">{message}</p>}
      <div className="grid gap-5 xl:grid-cols-2">
        <SectionBlock title="Transactions crédits" description="Débits, recharges, Pass et corrections visibles depuis la base.">
          <div className="grid gap-3">
            {user.recent.transactions.length === 0 && <p className="text-sm font-bold text-muted-foreground">Aucune transaction récente.</p>}
            {user.recent.transactions.map((item) => (
              <Card key={item.id} className="border-border/70 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-extrabold text-foreground">{item.description}</p>
                    <p className="text-xs font-bold text-muted-foreground">{formatDateTime(item.createdAt)} · {item.reference ?? "Sans référence"}</p>
                  </div>
                  <StatusBadge label={item.status} />
                </div>
                <p className="mt-2 text-sm font-bold text-foreground">
                  {item.amount > 0 ? "+" : ""}{item.amount} crédits · {formatFcfa(item.fcfaEquivalent)} · solde {item.balanceBefore} → {item.balanceAfter}
                </p>
              </Card>
            ))}
          </div>
        </SectionBlock>

        <SectionBlock title="Paiements et Pass Ordonnance Unique" description="Aucun Pass ne doit être actif sans paiement confirmé côté serveur.">
          <div className="grid gap-3">
            {[...user.recent.payments, ...user.recent.passOrdonnances].length === 0 && <p className="text-sm font-bold text-muted-foreground">Aucun paiement ou pass récent.</p>}
            {user.recent.payments.map((item) => (
              <Card key={item.id} className="border-border/70 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-extrabold text-foreground">{item.productType === "pass_ordonnance" ? "Pass Ordonnance Unique" : "Recharge crédits"}</p>
                    <p className="text-xs font-bold text-muted-foreground">{item.reference} · {item.provider}</p>
                  </div>
                  <div className="flex flex-wrap gap-2"><StatusBadge label={item.status} /><StatusBadge label={item.riskStatus} /></div>
                </div>
                <p className="mt-2 text-sm font-bold text-foreground">{formatFcfa(item.amount)} · {formatDateTime(item.createdAt)}</p>
              </Card>
            ))}
            {user.recent.passOrdonnances.map((item) => (
              <Card key={item.id} className="border-border/70 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-extrabold text-foreground">Pass Ordonnance Unique</p>
                    <p className="text-xs font-bold text-muted-foreground">{item.paymentReference ?? "Référence non renseignée"} · {formatFcfa(item.price)}</p>
                  </div>
                  <StatusBadge label={item.status} />
                </div>
                <p className="mt-2 text-sm font-medium text-muted-foreground">Ordonnance : {item.ordonnanceId ?? "Non liée"} · Utilisé : {formatDateTime(item.usedAt)}</p>
              </Card>
            ))}
          </div>
        </SectionBlock>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <SectionBlock title="Demandes pharmacies" description="Conseils, confirmations, contacts ou demandes liées à ordonnance.">
          <div className="grid gap-3">
            {user.recent.requests.length === 0 && <p className="text-sm font-bold text-muted-foreground">Aucune demande récente.</p>}
            {user.recent.requests.map((item) => (
              <Card key={item.id} className="border-border/70 p-4">
                <StatusBadge label={item.status} />
                <p className="mt-2 font-extrabold text-foreground">{item.serviceName}</p>
                <p className="text-xs font-bold text-muted-foreground">{item.reference} · {item.creditCost} crédit(s) · {formatDateTime(item.createdAt)}</p>
              </Card>
            ))}
          </div>
        </SectionBlock>
        <SectionBlock title="Contacts débloqués" description="Accès temporaires aux contacts pharmacies, jamais gratuits.">
          <div className="grid gap-3">
            {user.recent.contacts.length === 0 && <p className="text-sm font-bold text-muted-foreground">Aucun contact débloqué récemment.</p>}
            {user.recent.contacts.map((item) => (
              <Card key={item.id} className="border-border/70 p-4">
                <StatusBadge label={item.status} />
                <p className="mt-2 font-extrabold text-foreground">{item.unlockType}</p>
                <p className="text-xs font-bold text-muted-foreground">{item.creditCost} crédit(s) · expire {formatDateTime(item.expiresAt)}</p>
              </Card>
            ))}
          </div>
        </SectionBlock>
        <SectionBlock title="Favoris et historique" description="Signaux utiles au support et à l’amélioration de l’expérience utilisateur.">
          <div className="grid gap-3">
            {[...user.recent.favorites, ...user.recent.history].length === 0 && <p className="text-sm font-bold text-muted-foreground">Aucun signal récent.</p>}
            {user.recent.favorites.map((item) => (
              <Card key={item.id} className="border-border/70 p-4">
                <StatusBadge label={item.kind} />
                <p className="mt-2 font-extrabold text-foreground">{item.label}</p>
                <p className="text-xs font-bold text-muted-foreground">Favori · {formatDateTime(item.createdAt)}</p>
              </Card>
            ))}
            {user.recent.history.map((item) => (
              <Card key={item.id} className="border-border/70 p-4">
                <StatusBadge label={item.kind} />
                <p className="mt-2 font-extrabold text-foreground">{item.label}</p>
                <p className="text-xs font-bold text-muted-foreground">Historique · {formatDateTime(item.createdAt)}</p>
              </Card>
            ))}
          </div>
        </SectionBlock>
      </div>
    </div>
  );
}

type AdminPaymentRow = {
  reference: string;
  providerReference?: string | null;
  user: string;
  userContact?: string | null;
  amount: number;
  currency?: string;
  method?: string;
  productType: string;
  expectedCredits: number;
  provider: string;
  status: string;
  statusLabel: string;
  riskStatus: string;
  riskScore?: number;
  riskReasons?: string | null;
  webhookSignatureValid?: boolean;
  createdAt: string;
  expiresAt?: string | null;
  processedAt?: string | null;
  verifiedAt?: string | null;
  refundedAt?: string | null;
  manualReviewReason?: string | null;
  manualValidatedBy?: string | null;
  manualValidatedAt?: string | null;
};

type PaymentFraudAlert = {
  id: string;
  title: string;
  message: string;
  type: string;
  status: string;
  createdAt: string;
};

type PaymentFraudAudit = {
  id: string;
  action: string;
  entityId?: string | null;
  actorName?: string | null;
  actorRole?: string | null;
  result: string;
  comment?: string | null;
  createdAt: string;
};

type AdminAdministratorRow = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role: string;
  permissions: string[];
  status: string;
  mustResetPassword: boolean;
  twoFactorEnabled: boolean;
  twoFactorRecommended: boolean;
  sessionVersion: number;
  lastLoginAt?: string | null;
  lastPasswordChangeAt?: string | null;
  suspendedReason?: string | null;
  internalNotes?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
  counts: {
    sessions: number;
    auditLogs: number;
    passwordResets: number;
  };
};

type AdminAdministratorsSummary = {
  total: number;
  active: number;
  pending: number;
  suspended: number;
  superAdmins: number;
  mustResetPassword: number;
  twoFactorEnabled: number;
  visibleRows: number;
};

type AdminPharmacyListRow = {
  id: string;
  slug: string;
  name: string;
  commune: string;
  district?: string | null;
  managerName?: string | null;
  phone?: string | null;
  accountStatus: string;
  publicationStatus: string;
  dataQuality: string;
  isOnDuty: boolean;
  isOpen247: boolean;
  hoursWeekday?: string | null;
  hoursSaturday?: string | null;
  hoursSunday?: string | null;
  lastDataUpdate?: string | null;
  medicationCount: number;
  requestCount: number;
  teamCount: number;
  publicMediaCount: number;
};

type AdminPharmacyProfileData = {
  id: string;
  slug: string;
  name: string;
  managerName?: string | null;
  managerRole?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  professionalEmail?: string | null;
  authorizationNumber?: string | null;
  commune?: string | null;
  district?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  landmark?: string | null;
  coverageZone?: string | null;
  description?: string | null;
  accountStatus?: string | null;
  publicationStatus?: string | null;
  creationSource?: string | null;
  dataQuality?: string | null;
  isOnDuty?: boolean | null;
  isOpen247?: boolean | null;
  services?: string[];
  mediaCount?: number;
  medicationCount?: number;
  completenessScore?: number;
  lastDataUpdate?: string | null;
  internalNotes?: string | null;
};

type AdminPharmacyInventoryItem = {
  id: string;
  pharmacy: string;
  medication: string;
  dci: string;
  dosage: string;
  form: string;
  category: string;
  price: number;
  internalQuantity?: number | null;
  privateStatus: string;
  publicStatus: string;
  dataSource: string;
  reliabilityLevel: string;
  lastUpdatedAt: string;
  remark?: string | null;
};

type AdminMedicationReferenceRow = {
  id: string;
  name: string;
  slug: string;
  genericName: string;
  dosage: string;
  form: string;
  packSize: string;
  packaging?: string | null;
  manufacturer?: string | null;
  barcode?: string | null;
  category?: { name: string; slug: string } | null;
  status: string;
  verificationStatus: string;
  confidenceLevel: number;
  requiresRx: boolean;
  avgPrice: number;
  verifiedAt?: string | null;
  verifiedBy?: string | null;
  createdAt: string;
  counts: {
    pharmacies: number;
    addRequests: number;
    images: number;
    aliases: number;
  };
};

type AdminMedicationAddRequestRow = {
  id: string;
  proposedName: string;
  genericName?: string | null;
  dosage?: string | null;
  form?: string | null;
  packaging?: string | null;
  manufacturer?: string | null;
  remark?: string | null;
  status: string;
  createdByRole: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  pharmacy?: { name: string; slug: string; commune: string; district?: string | null } | null;
  medication?: { name: string; slug: string } | null;
};

function PaymentsFraud() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [payments, setPayments] = useState<AdminPaymentRow[]>([]);
  const [alerts, setAlerts] = useState<PaymentFraudAlert[]>([]);
  const [audits, setAudits] = useState<PaymentFraudAudit[]>([]);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: filter,
        status: statusFilter,
        risk: riskFilter,
        provider: providerFilter,
        productType: productFilter,
      });
      const res = await fetch(`/api/admin/payments-fraud?${params}`, { headers: { "x-sablin-session-kind": "admin" } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Chargement impossible");
      setSummary(data.summary ?? {});
      setPayments(data.rows ?? []);
      setAlerts(data.alerts ?? []);
      setAudits(data.audits ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [filter, productFilter, providerFilter, riskFilter, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const action = async (endpoint: string, body: Record<string, unknown>, method = "POST") => {
    setMessage("");
    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json", "x-sablin-session-kind": "admin" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setMessage(res.ok ? "Action enregistrée." : data.error ?? data.message ?? "Action refusée.");
    await load();
  };

  const cards = [
    ["Paiements totaux", summary.total ?? 0, "Tous statuts"],
    ["Aujourd’hui", summary.today ?? 0, "Journalier"],
    ["Confirmés", summary.success ?? 0, "SUCCESS"],
    ["En attente", summary.pending ?? 0, "À vérifier"],
    ["Échoués", summary.failed ?? 0, "Bloqués"],
    ["Expirés", summary.expired ?? 0, "Sans crédit"],
    ["Suspects", summary.suspicious ?? 0, "Fraude"],
    ["Vérification manuelle", summary.manualReview ?? 0, "Finance"],
    ["Remboursés", summary.refunded ?? 0, "Contrôle"],
    ["Contestés", summary.chargeback ?? 0, "Litige"],
  ];

  const resetFilters = () => {
    setFilter("");
    setStatusFilter("all");
    setRiskFilter("all");
    setProviderFilter("all");
    setProductFilter("all");
  };

  return (
    <div className="space-y-5">
      <Card className="border-border/70 p-5 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Heading level="h2">Paiements & Fraudes</Heading>
            <Muted>
              Supervision des intentions, webhooks, statuts prestataires, risques, remboursements et validations manuelles.
              Aucun crédit ni Pass n’est activé sans statut SUCCESS côté serveur.
            </Muted>
          </div>
          <Button className="bg-brand text-white hover:bg-brand-dark" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
            Actualiser
          </Button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(([label, value, badge]) => (
            <Stat key={label} label={String(label)} value={value} badge={String(badge)} />
          ))}
        </div>
        <div className="mt-4 rounded-lg border border-warning/30 bg-warning-light px-3 py-2 text-sm font-medium text-warning-foreground">
          Les captures d’écran ne valident jamais un paiement. Toute validation manuelle exige un rôle FINANCE_ADMIN ou SUPER_ADMIN, un motif et la saisie “VALIDER”.
        </div>
      </Card>

      <Card className="border-border/70 p-5 shadow-card">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.3fr_.8fr_.8fr_.8fr_.9fr_auto]">
          <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filtrer par référence, utilisateur, statut, risque..." />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-lg border border-border bg-white px-3 text-sm font-bold text-foreground">
            <option value="all">Tous les statuts</option>
            <option value="INITIATED">Paiement initié</option>
            <option value="PENDING">En attente</option>
            <option value="PROCESSING">En cours</option>
            <option value="SUCCESS">Confirmé</option>
            <option value="FAILED">Échoué</option>
            <option value="CANCELLED">Annulé</option>
            <option value="EXPIRED">Expiré</option>
            <option value="REJECTED">Rejeté</option>
            <option value="SUSPICIOUS">Suspect</option>
            <option value="REFUNDED">Remboursé</option>
            <option value="CHARGEBACK">Contesté</option>
            <option value="MANUAL_REVIEW">Vérification manuelle</option>
          </select>
          <select value={riskFilter} onChange={(event) => setRiskFilter(event.target.value)} className="h-10 rounded-lg border border-border bg-white px-3 text-sm font-bold text-foreground">
            <option value="all">Tous les risques</option>
            <option value="Normal">Normal</option>
            <option value="À surveiller">À surveiller</option>
            <option value="Suspect">Suspect</option>
            <option value="Bloqué">Bloqué</option>
          </select>
          <select value={providerFilter} onChange={(event) => setProviderFilter(event.target.value)} className="h-10 rounded-lg border border-border bg-white px-3 text-sm font-bold text-foreground">
            <option value="all">Tous les prestataires</option>
            <option value="paydunya">PayDunya</option>
            <option value="wave">Wave</option>
            <option value="orange">Orange Money</option>
            <option value="mtn">MTN Money</option>
            <option value="moov">Moov Money</option>
          </select>
          <select value={productFilter} onChange={(event) => setProductFilter(event.target.value)} className="h-10 rounded-lg border border-border bg-white px-3 text-sm font-bold text-foreground">
            <option value="all">Tous les achats</option>
            <option value="credit_pack">Recharge crédits</option>
            <option value="pass_ordonnance">Pass Ordonnance Unique</option>
            <option value="legacy">Ancien paiement</option>
          </select>
          <Button variant="outline" onClick={resetFilters}>Réinitialiser</Button>
        </div>
        {message && (
          <div className="mt-3 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm font-semibold text-foreground">
            {message}
          </div>
        )}
        <div className="mt-4 grid gap-3 xl:grid-cols-[1.2fr_.8fr]">
          <Card className="border-border/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-extrabold text-foreground">Alertes paiement actives</p>
                <p className="text-xs font-semibold text-muted-foreground">Webhooks invalides, montants incohérents, références suspectes et revues manuelles.</p>
              </div>
              <StatusBadge label={`${alerts.length} alerte(s)`} />
            </div>
            <div className="mt-3 grid gap-2">
              {alerts.slice(0, 4).map((alert) => (
                <div key={alert.id} className="rounded-lg border border-border bg-white p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-bold text-foreground">{alert.title}</p>
                    <StatusBadge label={alert.type} />
                  </div>
                  <p className="mt-1 text-xs font-semibold text-muted-foreground">{alert.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(alert.createdAt)}</p>
                </div>
              ))}
              {alerts.length === 0 && <p className="text-sm font-semibold text-muted-foreground">Aucune alerte paiement active.</p>}
            </div>
          </Card>
          <Card className="border-border/70 p-4">
            <p className="text-sm font-extrabold text-foreground">Règles de sécurité appliquées</p>
            <div className="mt-3 grid gap-2 text-xs font-semibold text-muted-foreground">
              <p>1. Le frontend ne valide jamais un paiement.</p>
              <p>2. Seul le statut serveur SUCCESS ajoute des crédits ou active un Pass.</p>
              <p>3. Les webhooks répétés restent idempotents.</p>
              <p>4. Les remboursements exigent un rôle finance ou super admin.</p>
            </div>
          </Card>
        </div>
        <div className="mt-4 grid gap-3">
          {payments.map((payment) => (
            <Card key={payment.reference} className="border-border/70 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words font-mono text-sm font-extrabold text-foreground">{payment.reference}</p>
                  <p className="text-sm text-muted-foreground">
                    {payment.user} · {payment.provider.toUpperCase()} · {payment.amount.toLocaleString("fr-FR")} FCFA
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {payment.productType === "pass_ordonnance" ? "Pass Ordonnance Unique" : `${payment.expectedCredits} crédits`} ·
                    Réf. prestataire : {payment.providerReference ?? "En attente"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Créé le {formatDateTime(payment.createdAt)}
                    {payment.expiresAt ? ` · Expire le ${formatDateTime(payment.expiresAt)}` : ""}
                    {payment.verifiedAt ? ` · Vérifié le ${formatDateTime(payment.verifiedAt)}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <StatusBadge label={payment.statusLabel} />
                  <StatusBadge label={payment.riskStatus} />
                  <StatusBadge label={`Risque ${payment.riskScore ?? 0}`} />
                  <StatusBadge label={payment.webhookSignatureValid ? "Webhook signé" : "Webhook non confirmé"} />
                </div>
              </div>
              {(payment.riskReasons || payment.manualReviewReason) && (
                <p className="mt-3 rounded-lg bg-danger-light px-3 py-2 text-xs font-semibold text-danger">
                  {payment.riskReasons ?? payment.manualReviewReason}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => action("/api/payments/reconcile", { reference: payment.reference })}>
                  Vérifier prestataire
                </Button>
                <Button size="sm" variant="outline" onClick={() => action("/api/payments/manual-review", { reference: payment.reference, reason: "Analyse manuelle demandée depuis le tableau anti-fraude." })}>
                  Revue manuelle
                </Button>
                <Button size="sm" variant="outline" onClick={() => action("/api/admin/payments-fraud", { reference: payment.reference, action: "mark_suspicious", reason: "Anomalie signalée depuis le centre Paiements & fraudes." }, "PATCH")}>
                  Marquer suspect
                </Button>
                <Button size="sm" variant="outline" onClick={() => action("/api/payments/refund", { reference: payment.reference, reason: "Remboursement demandé depuis Paiements & Fraudes." })}>
                  Rembourser
                </Button>
              </div>
            </Card>
          ))}
          {!loading && payments.length === 0 && (
            <Card className="border-border/70 p-6 text-center">
              <p className="font-bold text-foreground">Aucun paiement trouvé</p>
              <p className="text-sm text-muted-foreground">Modifiez vos filtres ou actualisez la réconciliation.</p>
            </Card>
          )}
        </div>
      </Card>

      <Card className="border-border/70 p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <Heading level="h3">Audit paiement récent</Heading>
            <Muted>Dernières actions sensibles liées aux paiements, sans secret ni clé API dans les journaux.</Muted>
          </div>
          <StatusBadge label={`${audits.length} trace(s)`} />
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {audits.map((item) => (
            <Card key={item.id} className="border-border/70 p-4">
              <div className="flex flex-wrap justify-between gap-2">
                <p className="font-bold text-foreground">{item.action}</p>
                <StatusBadge label={item.result} />
              </div>
              <p className="mt-1 text-xs font-semibold text-muted-foreground">
                {item.entityId ?? "Paiement"} · {item.actorName ?? "Système"} · {item.actorRole ?? "Serveur"}
              </p>
              {item.comment && <p className="mt-2 text-xs text-muted-foreground">{item.comment}</p>}
              <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(item.createdAt)}</p>
            </Card>
          ))}
          {audits.length === 0 && <p className="text-sm font-semibold text-muted-foreground">Aucune action paiement récente.</p>}
        </div>
      </Card>
    </div>
  );
}

function ProfessionalAccounts() {
  const [members, setMembers] = useState<AdminProfessionalMember[]>([]);
  const [invitations, setInvitations] = useState<AdminProfessionalInvitation[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/professional/team?scope=all", {
        headers: { "x-sablin-session-kind": "admin" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Chargement des comptes professionnels impossible.");
      setMembers(data.members ?? []);
      setInvitations(data.invitations ?? []);
      setSummary(data.summary ?? {});
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Chargement des comptes professionnels impossible.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const updateMemberStatus = async (member: AdminProfessionalMember, status: "Actif" | "Suspendu" | "Révoqué") => {
    const res = await fetch("/api/professional/team", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-sablin-session-kind": "admin" },
      body: JSON.stringify({ membershipId: member.id, role: member.role, permissions: member.permissions, status }),
    });
    const data = await res.json().catch(() => ({}));
    setMessage(res.ok ? "Compte professionnel mis à jour et journalisé." : data?.error ?? "Action impossible.");
    await loadAccounts();
  };

  const updateInvitation = async (invitationId: string, status: "Annulée" | "Renvoyée") => {
    const res = await fetch("/api/professional/team", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-sablin-session-kind": "admin" },
      body: JSON.stringify({ invitationId, status }),
    });
    const data = await res.json().catch(() => ({}));
    setMessage(res.ok ? "Invitation professionnelle mise à jour." : data?.error ?? "Action impossible.");
    await loadAccounts();
  };

  const visibleMembers = members.filter((member) => {
    const haystack = [
      member.name,
      member.email,
      member.phone,
      member.role,
      member.status,
      member.accountStatus,
      member.pharmacy?.name,
      member.pharmacy?.slug,
      member.pharmacy?.commune,
      member.pharmacy?.district,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const matchesQuery = !query.trim() || haystack.includes(query.trim().toLowerCase());
    const matchesStatus = statusFilter === "Tous" || member.status === statusFilter || member.accountStatus === statusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <div className="space-y-5">
      <AdminHero
        badge="Accès professionnels"
        title="Comptes professionnels"
        description="Gestion centralisée des comptes pharmacie, rôles, rattachements, permissions et sessions. Une pharmacie ne voit jamais les comptes d’une autre pharmacie."
        icon={UserCog}
      />
      <MetricsGrid
        metrics={[
          { label: "Comptes pro", value: summary.totalMembers ?? members.length, status: "Tous espaces", icon: UserCog },
          { label: "Actifs", value: summary.activeMembers ?? members.filter((row) => row.status === "Actif").length, status: "Session autorisée", icon: CheckCircle2 },
          { label: "En attente", value: summary.pendingInvitations ?? invitations.filter((row) => ["En attente", "Renvoyée"].includes(row.status)).length, status: "Invitation", icon: Bell },
          { label: "Suspendus", value: summary.suspendedMembers ?? members.filter((row) => row.status === "Suspendu").length, status: "Bloqué", icon: LockKeyhole },
        ]}
      />
      <Card className="border-border/70 bg-white p-4 shadow-card">
        <div className="flex flex-wrap items-center gap-2">
          <SlidersHorizontal className="size-4 text-brand-dark" />
          <p className="text-sm font-extrabold text-foreground">Filtres dynamiques</p>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_220px]">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nom, e-mail, téléphone, rôle ou pharmacie" className="bg-white text-foreground" />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm font-bold text-foreground">
            {["Tous", "Actif", "Suspendu", "Révoqué", "ACTIVE", "SUSPENDED", "PENDING"].map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={() => { setQuery(""); setStatusFilter("Tous"); }}>Réinitialiser</Button>
          <Button className="bg-brand text-white hover:bg-brand-dark" onClick={loadAccounts}>Actualiser</Button>
        </div>
      </Card>
      <div className="grid gap-3 md:grid-cols-2">
        {loading && <Card className="border-border/70 p-4 text-sm font-bold text-muted-foreground">Chargement des comptes professionnels...</Card>}
        {!loading && visibleMembers.length === 0 && <Card className="border-dashed border-border p-4 text-sm font-bold text-foreground">Aucun compte professionnel ne correspond aux filtres.</Card>}
        {visibleMembers.map((row) => (
          <Card key={row.id} className="border-border/70 p-4 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-extrabold text-foreground">{row.name}</p>
                <p className="text-sm font-medium text-muted-foreground">{row.role} · {row.pharmacy?.name ?? "Pharmacie non renseignée"}</p>
                <p className="mt-1 text-xs font-semibold text-muted-foreground">{row.email ?? row.phone ?? "Contact non renseigné"}</p>
                <p className="text-xs font-semibold text-muted-foreground">Dernière connexion : {formatDateTime(row.lastLoginAt)}</p>
              </div>
              <div className="flex flex-wrap gap-2"><StatusBadge label={row.status} /><StatusBadge label={row.accountStatus} /></div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(row.permissions.length ? row.permissions.slice(0, 7) : ["Permissions héritées du rôle"]).map((permission) => (
                <StatusBadge key={permission} label={professionalPermissionLabel(permission)} />
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={() => updateMemberStatus(row, row.status === "Suspendu" ? "Actif" : "Suspendu")}>
                {row.status === "Suspendu" ? "Réactiver" : "Suspendre"}
              </Button>
              <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-50" onClick={() => updateMemberStatus(row, "Révoqué")}>Révoquer</Button>
              {row.pharmacy?.slug && (
                <Button size="sm" variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={() => { window.location.href = `/admin/pharmacies/${row.pharmacy?.slug}/equipe`; }}>
                  Gérer la pharmacie
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
      {invitations.length > 0 && (
        <SectionBlock title="Invitations professionnelles" description="Les invitations restent liées à une pharmacie précise et expirent automatiquement.">
          <div className="grid gap-3 md:grid-cols-2">
            {invitations.slice(0, 12).map((invitation) => (
              <Card key={invitation.id} className="border-border/70 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-extrabold text-foreground">{invitation.name}</p>
                    <p className="text-sm font-medium text-muted-foreground">{invitation.role} · {invitation.pharmacy?.name ?? "Pharmacie non renseignée"}</p>
                    <p className="text-xs font-semibold text-muted-foreground">{invitation.email ?? invitation.phone ?? "Contact non renseigné"} · Expire : {formatDateTime(invitation.expiresAt)}</p>
                  </div>
                  <StatusBadge label={invitation.status} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={() => updateInvitation(invitation.id, "Renvoyée")}>Renvoyer</Button>
                  <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-50" onClick={() => updateInvitation(invitation.id, "Annulée")}>Annuler</Button>
                </div>
              </Card>
            ))}
          </div>
        </SectionBlock>
      )}
      {message && <p className="rounded-xl border border-border bg-white p-3 text-sm font-bold text-foreground">{message}</p>}
      <SectionBlock title="Matrice des permissions" description="Séparation stricte entre espace pharmacie, administration globale, données, support et finance.">
        <ResponsiveTable
          headers={["Rôle", "Pharmacies", "Utilisateurs", "Paiements", "Portée"]}
          rows={adminPermissionMatrix.map((row) => row.map((cell) => <span key={cell} className="font-semibold text-foreground">{cell}</span>))}
        />
      </SectionBlock>
    </div>
  );
}

function Administrators() {
  const [rows, setRows] = useState<AdminAdministratorRow[]>([]);
  const [audits, setAudits] = useState<PaymentFraudAudit[]>([]);
  const [summary, setSummary] = useState<AdminAdministratorsSummary>({
    total: 0,
    active: 0,
    pending: 0,
    suspended: 0,
    superAdmins: 0,
    mustResetPassword: 0,
    twoFactorEnabled: 0,
    visibleRows: 0,
  });
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [role, setRole] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "SUPPORT_ADMIN",
    internalNotes: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ q: query, status, role });
      const res = await fetch(`/api/admin/administrators?${params}`, { headers: { "x-sablin-session-kind": "admin" } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Chargement des administrateurs impossible.");
      setRows(data.rows ?? []);
      setAudits(data.audits ?? []);
      setSummary((current) => ({ ...current, ...(data.summary ?? {}) }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Chargement des administrateurs impossible.");
    } finally {
      setLoading(false);
    }
  }, [query, role, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const createAdministrator = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/administrators", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-sablin-session-kind": "admin" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Création impossible.");
      setMessage(data.message ?? "Compte administrateur créé.");
      setForm({ name: "", email: "", phone: "", role: "SUPPORT_ADMIN", internalNotes: "" });
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Création impossible.");
    } finally {
      setSaving(false);
    }
  };

  const updateAdministrator = async (account: AdminAdministratorRow, action: string, reason?: string) => {
    const res = await fetch("/api/admin/administrators", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-sablin-session-kind": "admin" },
      body: JSON.stringify({ accountId: account.id, action, reason: reason ?? `Action ${action} depuis Administrateurs.` }),
    });
    const data = await res.json().catch(() => ({}));
    setMessage(res.ok ? "Action administrateur enregistrée et auditée." : data?.error ?? "Action refusée.");
    await load();
  };

  return (
    <div className="space-y-5">
      <AdminHero
        badge="Équipe interne"
        title="Administrateurs"
        description="Création interne uniquement. Aucun administrateur ne peut s’inscrire publiquement, et les mots de passe ne sont jamais affichés en clair."
        icon={ShieldCheck}
      />
      <MetricsGrid
        metrics={[
          { label: "Administrateurs", value: summary.total, status: `${summary.visibleRows} affiché(s)`, icon: ShieldCheck },
          { label: "Actifs", value: summary.active, status: "Accès autorisé", icon: CheckCircle2 },
          { label: "En attente", value: summary.pending, status: "Mot de passe à définir", icon: Bell },
          { label: "Suspendus/Bloqués", value: summary.suspended, status: "Accès refusé", icon: LockKeyhole },
          { label: "Super admins", value: summary.superAdmins, status: "Actions sensibles", icon: UserCog },
          { label: "2FA activé", value: summary.twoFactorEnabled, status: `${summary.mustResetPassword} reset requis`, icon: ShieldCheck },
        ]}
      />
      <Card className="border-border/70 p-5 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Heading level="h3">Créer un accès administrateur</Heading>
            <Muted>Le compte est créé en attente, sans mot de passe visible. L’admin définit son mot de passe via un lien email sécurisé.</Muted>
          </div>
          <StatusBadge label="Super admin uniquement" />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <Field label="Nom administrateur" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} />
          <Field label="Email professionnel" type="email" value={form.email} onChange={(value) => setForm((current) => ({ ...current, email: value }))} />
          <Field label="Téléphone optionnel" value={form.phone} onChange={(value) => setForm((current) => ({ ...current, phone: value }))} />
          <label className="text-sm font-semibold text-foreground">
            Rôle
            <select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))} className="mt-2 h-10 w-full rounded-lg border border-border bg-white px-3 text-sm font-bold text-foreground">
              {["SUPPORT_ADMIN", "DATA_ADMIN", "PHARMACY_ADMIN", "FINANCE_ADMIN", "ADMIN", "SUPER_ADMIN"].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <Field label="Note interne" value={form.internalNotes} onChange={(value) => setForm((current) => ({ ...current, internalNotes: value }))} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={createAdministrator} disabled={saving} className="bg-brand text-white hover:bg-brand-dark">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
            Créer administrateur
          </Button>
          <Button variant="outline" onClick={() => setForm({ name: "", email: "", phone: "", role: "SUPPORT_ADMIN", internalNotes: "" })}>Réinitialiser</Button>
        </div>
        {message && <p className="mt-3 rounded-lg border border-border bg-white p-3 text-sm font-bold text-foreground">{message}</p>}
      </Card>

      <Card className="border-border/70 p-5 shadow-card">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_220px_220px_auto]">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nom, email, téléphone, rôle ou note interne" className="bg-white" />
          <select value={role} onChange={(event) => setRole(event.target.value)} className="h-10 rounded-lg border border-border bg-white px-3 text-sm font-bold text-foreground">
            <option value="all">Tous les rôles</option>
            {["ADMIN", "DATA_ADMIN", "PHARMACY_ADMIN", "FINANCE_ADMIN", "SUPPORT_ADMIN", "SUPER_ADMIN"].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-lg border border-border bg-white px-3 text-sm font-bold text-foreground">
            <option value="all">Tous les statuts</option>
            {["ACTIVE", "PENDING", "SUSPENDED", "BLOCKED", "ARCHIVED"].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <Button onClick={load} disabled={loading} className="bg-brand text-white hover:bg-brand-dark">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            Actualiser
          </Button>
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {loading && <Card className="border-border/70 p-4 text-sm font-bold text-muted-foreground">Chargement des comptes administrateurs...</Card>}
        {!loading && rows.length === 0 && <Card className="border-dashed border-border p-6 text-center text-sm font-bold text-foreground">Aucun administrateur ne correspond aux filtres.</Card>}
        {rows.map((row) => (
          <Card key={row.id} className="border-border/70 p-4 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-extrabold text-foreground">{row.name}</p>
                <p className="break-words text-sm font-medium text-muted-foreground">{row.email ?? row.phone ?? "Contact non renseigné"} · {row.role}</p>
                <p className="text-xs font-semibold text-muted-foreground">Dernière connexion : {formatDateTime(row.lastLoginAt)} · Sessions : {row.counts.sessions}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge label={row.status} />
                {row.mustResetPassword && <StatusBadge label="Mot de passe à définir" />}
                <StatusBadge label={row.twoFactorEnabled ? "2FA actif" : "2FA recommandé"} />
              </div>
            </div>
            {row.suspendedReason && <p className="mt-3 rounded-lg bg-danger-light px-3 py-2 text-xs font-semibold text-danger">{row.suspendedReason}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              {row.permissions.slice(0, 8).map((permission) => <StatusBadge key={permission} label={permission} />)}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => updateAdministrator(row, row.status === "ACTIVE" ? "suspend" : "activate", row.status === "ACTIVE" ? "Suspension demandée depuis la console Administrateurs." : "Réactivation demandée depuis la console Administrateurs.")}>
                {row.status === "ACTIVE" ? "Suspendre" : "Réactiver"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => updateAdministrator(row, "revoke_sessions", "Révocation des sessions actives depuis la console Administrateurs.")}>
                Révoquer sessions
              </Button>
              <Button size="sm" variant="outline" onClick={() => updateAdministrator(row, "block", "Blocage de sécurité demandé depuis la console Administrateurs.")}>
                Bloquer
              </Button>
            </div>
          </Card>
        ))}
      </div>
      <SectionBlock title="Audit administrateurs" description="Création, suspension, blocage et révocation de sessions sont journalisés côté serveur.">
        <div className="grid gap-3 lg:grid-cols-2">
          {audits.map((item) => (
            <Card key={item.id} className="border-border/70 p-4">
              <div className="flex flex-wrap justify-between gap-2">
                <p className="font-bold text-foreground">{item.action}</p>
                <StatusBadge label={item.result} />
              </div>
              <p className="mt-1 text-xs font-semibold text-muted-foreground">{item.actorName ?? "Système"} · {item.actorRole ?? "Serveur"} · {formatDateTime(item.createdAt)}</p>
              {item.comment && <p className="mt-2 text-xs text-muted-foreground">{item.comment}</p>}
            </Card>
          ))}
          {audits.length === 0 && <p className="text-sm font-semibold text-muted-foreground">Aucune action administrateur récente.</p>}
        </div>
      </SectionBlock>
      <ControlChecklist title="Sécurité administrateur" items={["Accès réservé à l’équipe interne", "Pas de section publique d’inscription admin", "Révocation de session journalisée", "Permissions sensibles séparées par rôle"]} />
    </div>
  );
}

type DataQualityRow = {
  id: string;
  name: string;
  slug: string;
  commune: string;
  district: string;
  accountStatus: string;
  publicationStatus: string;
  dataQuality: string;
  storedDataQuality: string;
  qualityScore: number;
  computedScore: number;
  creationSource: string;
  lastDataUpdate?: string | null;
  isOnDuty: boolean;
  totalMedications: number;
  staleMedications: number;
  toConfirmMedications: number;
  missingPrices: number;
  pendingRequests: number;
  publicMedia: number;
  missingGps: boolean;
  missingHours: boolean;
};

type DataQualityMetrics = {
  oldData?: number;
  toConfirm?: number;
  missingPrices?: number;
  staleAvailability?: number;
  missingHours?: number;
  missingGps?: number;
  nonValidated?: number;
  pendingRequests?: number;
  averageScore?: number;
};

function Quality() {
  const [rows, setRows] = useState<DataQualityRow[]>([]);
  const [metrics, setMetrics] = useState<DataQualityMetrics>({});
  const [query, setQuery] = useState("");
  const [commune, setCommune] = useState("");
  const [status, setStatus] = useState("");
  const [quality, setQuality] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadQuality = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (commune) params.set("commune", commune);
      if (status) params.set("status", status);
      if (quality) params.set("quality", quality);
      const res = await fetch(`/api/admin/data-quality?${params.toString()}`, {
        headers: { "x-sablin-session-kind": "admin" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Chargement qualité impossible.");
      setRows(data.rows ?? []);
      setMetrics(data.metrics ?? {});
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Chargement qualité impossible.");
    } finally {
      setLoading(false);
    }
  }, [commune, quality, query, status]);

  useEffect(() => {
    loadQuality();
  }, [loadQuality]);

  const markVerified = async (row: DataQualityRow) => {
    const res = await fetch("/api/pharmacy-platform/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-sablin-session-kind": "admin" },
      body: JSON.stringify({
        action: "mark-data-quality",
        label: "Marquer données vérifiées",
        pharmacySlug: row.slug,
        dataQuality: "Données à jour",
        details: {
          previousQuality: row.dataQuality,
          computedScore: row.computedScore,
        },
      }),
    });
    const data = await res.json().catch(() => ({}));
    setMessage(res.ok ? "Qualité mise à jour et action journalisée." : data?.error ?? "Action qualité impossible.");
    if (res.ok) await loadQuality();
  };

  const resetFilters = () => {
    setQuery("");
    setCommune("");
    setStatus("");
    setQuality("");
  };

  return (
    <div className="space-y-5">
      <AdminHero
        badge="Fiabilité"
        title="Qualité des données"
        description="Surveillance des disponibilités, prix indicatifs, horaires, GPS, sources, fiabilité et publication. Les données anciennes ou incomplètes deviennent À confirmer côté utilisateur."
        icon={Database}
      />
      <Card className="border-border/70 bg-white p-4 shadow-card">
        <div className="flex flex-wrap items-center gap-2">
          <SlidersHorizontal className="size-4 text-brand-dark" />
          <p className="text-sm font-extrabold text-foreground">Filtres qualité</p>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pharmacie, responsable, commune..." className="bg-white text-foreground" />
          <select value={commune} onChange={(event) => setCommune(event.target.value)} className="h-10 rounded-lg border border-border bg-white px-3 text-sm font-bold text-foreground">
            <option value="">Toutes communes</option>
            {["Cocody", "Yopougon", "Marcory", "Plateau", "Abobo", "Treichville", "Bingerville", "Koumassi"].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-lg border border-border bg-white px-3 text-sm font-bold text-foreground">
            <option value="">Tous statuts</option>
            {["Validée", "En attente de validation", "Incomplète", "Suspendue", "Refusée"].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select value={quality} onChange={(event) => setQuality(event.target.value)} className="h-10 rounded-lg border border-border bg-white px-3 text-sm font-bold text-foreground">
            <option value="">Toutes qualités</option>
            {["Données à jour", "Données anciennes", "Données incomplètes", "Disponibilités à confirmer", "Prix non renseignés", "Demandes en attente", "Validation requise"].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button className="bg-brand text-white hover:bg-brand-dark" onClick={loadQuality}>Appliquer</Button>
          <Button variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={resetFilters}>Réinitialiser</Button>
        </div>
      </Card>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Score moyen" value={`${metrics.averageScore ?? 0}%`} badge="Qualité globale" />
        <Stat label="Pharmacies avec données anciennes" value={metrics.oldData ?? 0} badge="Données anciennes" />
        <Stat label="Médicaments à confirmer" value={metrics.toConfirm ?? 0} badge="À confirmer" />
        <Stat label="Prix manquants" value={metrics.missingPrices ?? 0} badge="Prix non renseignés" />
        <Stat label="Disponibilités non mises à jour" value={metrics.staleAvailability ?? 0} badge="À vérifier" />
        <Stat label="Pharmacies sans horaires" value={metrics.missingHours ?? 0} badge="Incomplet" />
        <Stat label="Pharmacies sans GPS" value={metrics.missingGps ?? 0} badge="Incomplet" />
        <Stat label="Demandes en attente" value={metrics.pendingRequests ?? 0} badge="Demandes" />
      </div>
      <SectionBlock title="Sources et fiabilité" description="Ces valeurs contrôlent ce qui peut être publié côté utilisateur.">
        <div className="flex flex-wrap gap-2">{RELIABILITY_LEVELS.map((item) => <StatusBadge key={item} label={item} />)}{DATA_SOURCES.map((item) => <StatusBadge key={item} label={item} />)}</div>
      </SectionBlock>
      <SectionBlock title="Actions qualité prioritaires" description="Chaque correction est calculée côté serveur puis journalisée.">
        {message && <p className="mb-3 rounded-lg border border-border bg-white p-3 text-sm font-bold text-foreground">{message}</p>}
        {loading ? (
          <Card className="border-border/70 p-4 text-sm font-bold text-muted-foreground">Chargement des contrôles qualité...</Card>
        ) : rows.length === 0 ? (
          <Card className="border-dashed border-border p-4 text-sm font-bold text-foreground">Aucune anomalie ne correspond aux filtres.</Card>
        ) : (
          <div className="grid gap-3">
            {rows.map((row) => (
              <Card key={row.id} className="border-border/70 bg-white p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge label={row.dataQuality} />
                      <StatusBadge label={row.accountStatus} />
                      <StatusBadge label={`${row.computedScore}%`} />
                    </div>
                    <p className="mt-3 break-words font-extrabold text-foreground">{row.name}</p>
                    <p className="text-sm font-medium text-muted-foreground">{row.commune} · {row.district} · Source : {row.creationSource}</p>
                    <p className="mt-1 text-xs font-semibold text-muted-foreground">Dernière mise à jour : {formatDateTime(row.lastDataUpdate)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={() => { window.location.href = `/admin/pharmacies/${row.slug}`; }}>
                      Dossier
                    </Button>
                    <Button size="sm" className="bg-brand text-white hover:bg-brand-dark" onClick={() => markVerified(row)}>
                      Marquer vérifié
                    </Button>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  <Stat label="Médicaments" value={row.totalMedications} badge="Inventaire" />
                  <Stat label="À confirmer" value={row.toConfirmMedications} badge="Disponibilité" />
                  <Stat label="Prix à revoir" value={row.missingPrices} badge="Prix" />
                  <Stat label="Demandes ouvertes" value={row.pendingRequests} badge="Demandes" />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {row.missingHours && <StatusBadge label="Horaires incomplets" />}
                  {row.missingGps && <StatusBadge label="GPS manquant" />}
                  {row.publicMedia <= 0 && <StatusBadge label="Photo publique manquante" />}
                  {row.isOnDuty && <StatusBadge label="De garde" />}
                </div>
              </Card>
            ))}
          </div>
        )}
      </SectionBlock>
    </div>
  );
}

type AdminValidationPharmacy = {
  id: string;
  name: string;
  slug: string;
  commune: string;
  district?: string | null;
  managerName?: string | null;
  managerRole?: string | null;
  professionalEmail?: string | null;
  phone?: string | null;
  creationSource: string;
  accountStatus: string;
  publicationStatus: string;
  dataQuality: string;
  qualityScore: number;
  medicationCount: number;
  requestCount?: number;
  teamCount?: number;
  publicMediaCount?: number;
  adminOnlyMediaCount?: number;
  lastDataUpdate?: string | null;
};

const adminValidationSummaryFallback = { total: 0, pending: 0, validated: 0, refused: 0, suspended: 0, incomplete: 0, published: 0, withPublicMedia: 0, visible: 0 };

function PharmacyValidationsAdmin() {
  const [pharmacies, setPharmacies] = useState<AdminValidationPharmacy[]>([]);
  const [summary, setSummary] = useState(adminValidationSummaryFallback);
  const [recentActions, setRecentActions] = useState<Array<{ id: string; label: string; status: string; actorRole?: string | null; message?: string | null; pharmacySlug?: string | null; createdAt: string }>>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ accountStatus: statusFilter });
    if (query.trim()) params.set("q", query.trim());
    try {
      const res = await fetch(`/api/pharmacy-platform/pharmacies?${params}`, {
        headers: { "X-Sablin-Session-Kind": "admin" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Chargement des validations impossible.");
      setPharmacies(data.pharmacies ?? []);
      setSummary(data.summary ?? adminValidationSummaryFallback);
      setRecentActions(data.recentActions ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Chargement des validations impossible.");
    } finally {
      setLoading(false);
    }
  }, [query, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-5">
      <AdminHero
        badge="Publication contrôlée"
        title="Validations pharmacies"
        description="Contrôlez les inscriptions, documents, images publiques, horaires, garde et qualité avant publication côté utilisateur."
        icon={ShieldCheck}
        actions={
          <>
            <Button variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={load} disabled={loading}>
              <RefreshCw className="size-4" /> Actualiser
            </Button>
            <Button className="bg-brand text-white hover:bg-brand-dark" onClick={() => (window.location.href = "/admin/pharmacies/nouveau")}>Créer une pharmacie</Button>
          </>
        }
      />
      <Card className="border-border/70 p-4 shadow-card">
        <div className="grid gap-3 lg:grid-cols-[1fr_240px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") load();
              }}
              placeholder="Rechercher pharmacie, commune, responsable ou téléphone"
              className="bg-white pl-9"
            />
          </div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-lg border border-border bg-white px-3 text-sm font-bold text-foreground">
            <option value="pending">À valider / incomplet</option>
            <option value="all">Toutes les pharmacies</option>
            <option value="En attente de validation">En attente</option>
            <option value="Incomplète">Incomplète</option>
            <option value="Validée">Validée</option>
            <option value="Refusée">Refusée</option>
            <option value="Suspendue">Suspendue</option>
          </select>
          <Button variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={load} disabled={loading}>
            <Filter className="size-4" /> Filtrer
          </Button>
        </div>
        {message && <p className="mt-3 rounded-lg border border-border bg-white p-3 text-sm font-bold text-foreground">{message}</p>}
      </Card>
      <MetricsGrid
        metrics={[
          { label: "À valider", value: summary.pending + summary.incomplete, status: "En attente", icon: AlertTriangle },
          { label: "Validées", value: summary.validated, status: "Validée", icon: CheckCircle2 },
          { label: "Suspendues / refusées", value: summary.suspended + summary.refused, status: "Bloqué", icon: ShieldCheck },
          { label: "Avec photo publique", value: summary.withPublicMedia, status: "Images publiques", icon: ImageIcon },
        ]}
      />
      <div className="grid gap-3 md:grid-cols-2">
        {pharmacies.map((pharmacy) => (
          <Card key={pharmacy.slug} className="border-border/70 p-4 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge label={pharmacy.accountStatus} />
                  <StatusBadge label={pharmacy.publicationStatus} />
                  <StatusBadge label={pharmacy.dataQuality} />
                </div>
                <p className="mt-3 font-extrabold text-foreground">{pharmacy.name}</p>
                <p className="text-sm font-medium text-muted-foreground">{pharmacy.commune} · {pharmacy.district ?? "Quartier non renseigné"} · {pharmacy.managerName ?? "Responsable non renseigné"}</p>
                <p className="mt-1 text-xs font-semibold text-muted-foreground">Source : {pharmacy.creationSource} · score qualité : {pharmacy.qualityScore}% · mise à jour : {formatDateTime(pharmacy.lastDataUpdate)}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => (window.location.href = `/admin/pharmacies/${pharmacy.slug}`)}>Dossier</Button>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-4">
              <MiniValidationInfo label="Médicaments" value={pharmacy.medicationCount} />
              <MiniValidationInfo label="Photos publiques" value={pharmacy.publicMediaCount ?? 0} />
              <MiniValidationInfo label="Docs internes" value={pharmacy.adminOnlyMediaCount ?? 0} />
              <MiniValidationInfo label="Équipe" value={pharmacy.teamCount ?? 0} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <ProfessionalActionButton action="validate-pharmacy" label="Valider" pharmacySlug={pharmacy.slug} size="sm" className="bg-brand text-white hover:bg-brand-dark" onSuccess={load}>Valider</ProfessionalActionButton>
              <ProfessionalActionButton action="refuse-pharmacy" label="Refuser" pharmacySlug={pharmacy.slug} size="sm" variant="outline" className="border-red-300 text-red-700" onSuccess={load}>Refuser</ProfessionalActionButton>
              <ProfessionalActionButton action="review-documents" label="Demander correction" pharmacySlug={pharmacy.slug} size="sm" variant="outline" onSuccess={load}>Demander correction</ProfessionalActionButton>
              <ProfessionalActionButton action="suspend-pharmacy" label="Suspendre" pharmacySlug={pharmacy.slug} size="sm" variant="outline" className="border-red-300 text-red-700" onSuccess={load}>Suspendre</ProfessionalActionButton>
            </div>
          </Card>
        ))}
        {!loading && !pharmacies.length && <Card className="border-border/70 p-6 text-sm font-bold text-muted-foreground">Aucune pharmacie dans ce filtre.</Card>}
      </div>
      <SectionBlock title="Audit validation pharmacie" description="Les décisions de validation, refus, suspension ou correction sont journalisées.">
        <ResponsiveTable
          headers={["Date", "Action", "Pharmacie", "Rôle", "Statut", "Message"]}
          rows={
            recentActions.length
              ? recentActions.map((action) => [
                  formatDateTime(action.createdAt),
                  <span key="label" className="font-bold text-foreground">{action.label}</span>,
                  action.pharmacySlug ?? "Pharmacie",
                  action.actorRole ?? "Admin",
                  <StatusBadge key="status" label={action.status} />,
                  action.message ?? "Action enregistrée",
                ])
              : [["-", "Aucune action récente", "-", "-", "-", ""]]
          }
        />
      </SectionBlock>
      <ControlChecklist title="Checklist validation" items={["Identité et responsable vérifiés", "Photos publiques sans données sensibles", "Documents administratifs gardés admin uniquement", "Horaires et garde renseignés", "Publication bloquée si compte suspendu ou refusé"]} />
    </div>
  );
}

function MiniValidationInfo({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-2">
      <p className="text-xs font-extrabold uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-extrabold text-foreground">{value}</p>
    </div>
  );
}

function MedicationRequestsAdmin() {
  const [requests, setRequests] = useState<AdminMedicationAddRequestRow[]>([]);
  const [reference, setReference] = useState<AdminMedicationReferenceRow[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [selectedMedication, setSelectedMedication] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const params = new URLSearchParams({ q: query, status });
      const [requestsRes, referenceRes] = await Promise.all([
        fetch(`/api/pharmacy-platform/medication-requests?${params}`, { headers: { "x-sablin-session-kind": "admin" } }),
        fetch("/api/medications?scope=admin&limit=250", { headers: { "x-sablin-session-kind": "admin" } }),
      ]);
      const requestsData = await requestsRes.json().catch(() => ({}));
      const referenceData = await referenceRes.json().catch(() => ({}));
      if (!requestsRes.ok) throw new Error(requestsData?.error ?? "Chargement des demandes impossible.");
      if (!referenceRes.ok) throw new Error(referenceData?.error ?? "Chargement du référentiel impossible.");
      setRequests(requestsData.requests ?? []);
      setSummary(requestsData.summary ?? {});
      setReference(referenceData.medications ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Chargement des demandes impossible.");
    } finally {
      setLoading(false);
    }
  }, [query, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateRequest = async (row: AdminMedicationAddRequestRow, nextStatus: string) => {
    setSavingId(row.id);
    setMessage("");
    try {
      const medicationId = selectedMedication[row.id] || row.medication?.slug || "";
      const selected = reference.find((item) => item.id === selectedMedication[row.id] || item.slug === selectedMedication[row.id]);
      const res = await fetch("/api/pharmacy-platform/medication-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-sablin-session-kind": "admin" },
        body: JSON.stringify({
          id: row.id,
          status: nextStatus,
          medicationId: selected?.id ?? medicationId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Mise à jour impossible.");
      setMessage(`Demande “${row.proposedName}” mise à jour : ${data.request?.status ?? nextStatus}.`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Mise à jour impossible.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <AdminHero
        badge="Référentiel"
        title="Demandes d’ajout médicament"
        description="Les pharmacies proposent, l’administration valide, fusionne ou refuse. Aucun doublon n’est créé automatiquement."
        icon={Pill}
      />
      <MetricsGrid
        metrics={[
          { label: "Demandes", value: summary.total ?? requests.length, status: `${summary.visible ?? requests.length} visibles`, icon: ClipboardList },
          { label: "En attente", value: summary.pending ?? 0, status: "À traiter", icon: AlertTriangle },
          { label: "En analyse", value: summary.analysis ?? 0, status: "Contrôle", icon: Search },
          { label: "Fusionnées", value: summary.merged ?? 0, status: "Alias ajouté", icon: CheckCircle2 },
        ]}
      />
      <Card className="border-border/70 bg-white p-4 shadow-card">
        <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nom proposé, DCI, pharmacie, dosage..." className="bg-white" />
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-lg border border-border bg-white px-3 text-sm font-bold text-foreground">
            <option value="all">Tous les statuts</option>
            {["En attente", "En analyse", "Validée", "Refusée", "Fusionnée avec un médicament existant"].map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <Button onClick={load} disabled={loading} className="bg-brand text-white hover:bg-brand-dark">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            Actualiser
          </Button>
        </div>
        {message && <p className="mt-3 rounded-lg border border-border bg-muted/30 p-3 text-sm font-bold text-foreground">{message}</p>}
      </Card>
      <div className="grid gap-3 md:grid-cols-2">
        {loading && <Card className="border-border/70 p-4 text-sm font-bold text-muted-foreground">Chargement des demandes...</Card>}
        {!loading && requests.length === 0 && (
          <Card className="border-dashed border-border p-4">
            <p className="font-extrabold text-foreground">Aucune demande à afficher.</p>
            <p className="mt-1 text-sm font-medium text-muted-foreground">Les propositions envoyées par les pharmacies apparaîtront ici pour validation, fusion ou refus.</p>
          </Card>
        )}
        {requests.map((row) => (
          <Card key={row.id} className="border-border/70 p-4 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <StatusBadge label={row.status} />
                <p className="mt-3 break-words font-extrabold text-foreground">{row.proposedName}</p>
                <p className="text-sm font-medium text-muted-foreground">
                  {row.pharmacy?.name ?? "Pharmacie non rattachée"} · {[row.genericName, row.dosage, row.form].filter(Boolean).join(" · ") || "Informations à compléter"}
                </p>
                <p className="mt-1 text-xs font-semibold text-muted-foreground">
                  Créée par {row.createdByRole} le {formatDateTime(row.createdAt)}
                  {row.reviewedAt ? ` · revue par ${row.reviewedBy ?? "Admin"} le ${formatDateTime(row.reviewedAt)}` : ""}
                </p>
                {row.remark && <p className="mt-2 rounded-lg bg-muted/30 p-2 text-xs font-semibold text-foreground">{row.remark}</p>}
              </div>
              <Badge className="border border-border bg-white text-foreground">{row.medication?.name ?? "Non associé"}</Badge>
            </div>
            <div className="mt-3 grid gap-2">
              <select
                value={selectedMedication[row.id] ?? ""}
                onChange={(event) => setSelectedMedication((current) => ({ ...current, [row.id]: event.target.value }))}
                className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm font-bold text-foreground"
              >
                <option value="">Associer à un médicament existant si nécessaire</option>
                {reference.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} · {item.genericName} · {item.dosage} · {item.form}
                  </option>
                ))}
              </select>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" disabled={savingId === row.id} onClick={() => updateRequest(row, "En analyse")}>
                  Analyser
                </Button>
                <Button size="sm" disabled={savingId === row.id} onClick={() => updateRequest(row, "Validée")} className="bg-brand text-white hover:bg-brand-dark">
                  {savingId === row.id ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                  Valider
                </Button>
                <Button size="sm" variant="outline" disabled={savingId === row.id || !selectedMedication[row.id]} onClick={() => updateRequest(row, "Fusionnée avec un médicament existant")}>
                  Fusionner
                </Button>
                <Button size="sm" variant="outline" disabled={savingId === row.id} onClick={() => updateRequest(row, "Refusée")} className="border-red-300 text-red-700">
                  Refuser
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AdminSynchronizations() {
  return (
    <div className="space-y-5">
      <AdminHero
        badge="Base commune"
        title="Synchronisations"
        description="Contrôle des flux Admin → Pharmacie → Utilisateur : pharmacies validées, horaires, garde, inventaires, marketplace, prix indicatifs et demandes."
        icon={Database}
      />
      <MetricsGrid
        metrics={[
          { label: "Flux actifs", value: 7, status: "Connectés", icon: Database },
          { label: "Dernière synchro", value: "10:18", status: "Aujourd’hui", icon: RefreshCw },
          { label: "Conflits", value: 2, status: "À résoudre", icon: AlertTriangle },
          { label: "Webhooks", value: 4, status: "Sécurisés", icon: ShieldCheck },
        ]}
      />
      <InventorySyncPanel kind="admin" />
    </div>
  );
}

function AdminUserRequests() {
  return (
    <div className="space-y-5">
      <AdminHero
        badge="Demandes globales"
        title="Demandes utilisateurs"
        description="Supervision des contacts débloqués, appels, WhatsApp, conseils, confirmations, prix et demandes liées aux ordonnances."
        icon={ClipboardList}
      />
      <MetricsGrid
        metrics={[
          { label: "Demandes ouvertes", value: 14, status: "Nouvelle", icon: ClipboardList },
          { label: "Confirmations", value: 6, status: "En cours", icon: CheckCircle2 },
          { label: "Conseils", value: 3, status: "Pharmacie", icon: Users },
          { label: "Ordonnances", value: 5, status: "Pass / crédits", icon: FileCheck2 },
        ]}
      />
      <ProfessionalRequestsPanel kind="admin" />
    </div>
  );
}

function AdminHistory() {
  const [filter, setFilter] = useState("Tous");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [stats, setStats] = useState<{ total?: number; success?: number; review?: number; imports?: number }>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter === "Réussi" || filter === "À vérifier") params.set("status", filter.toLowerCase() === "réussi" ? "réussi" : "à vérifier");
    if (filter === "Import pharmacie" || filter === "Demande utilisateur") params.set("source", filter);
    if (query.trim()) params.set("q", query.trim());
    try {
      const suffix = params.toString() ? `?${params}` : "";
      const res = await fetch(`/api/pharmacy-platform/history${suffix}`, { headers: { "X-Sablin-Session-Kind": "admin" } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Chargement de l’historique global impossible.");
      setRows(data.rows ?? []);
      setStats(data.stats ?? {});
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Chargement de l’historique global impossible.");
    } finally {
      setLoading(false);
    }
  }, [filter, query]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-5">
      <AdminHero
        badge="Audit global"
        title="Historique"
        description="Journal des actions utilisateurs, pharmacies, admins, imports, validations, suspensions, transactions, confirmations et publications."
        icon={History}
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Actions tracées" value={stats.total ?? rows.length} badge="Historique" />
        <Stat label="Réussies" value={stats.success ?? 0} badge="Réussi" />
        <Stat label="À vérifier" value={stats.review ?? 0} badge="Contrôle" />
        <Stat label="Imports" value={stats.imports ?? 0} badge="Inventaire" />
      </div>
      <Card className="border-border/70 p-5 shadow-card">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <Heading level="h2">Journal centralisé</Heading>
            <Muted className="mt-1">Lecture consolidée des actions professionnelles et audits, avec ancienne valeur, nouvelle valeur et source.</Muted>
          </div>
          <div className="flex w-full flex-wrap gap-2 lg:max-w-3xl lg:justify-end">
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Action, auteur, commentaire..." className="h-9 w-full bg-white sm:w-72" />
            {["Tous", "Réussi", "À vérifier", "Import pharmacie", "Demande utilisateur"].map((item) => (
              <Button key={item} size="sm" variant={filter === item ? "default" : "outline"} className={filter === item ? "bg-brand text-white hover:bg-brand-dark" : "border-brand/30 text-brand-dark hover:bg-brand-light"} onClick={() => setFilter(item)}>
                {item}
              </Button>
            ))}
            <Button size="sm" variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={load}>Actualiser</Button>
          </div>
        </div>
        {message && <p className="mt-3 rounded-lg border border-border bg-white p-3 text-sm font-bold text-foreground">{message}</p>}
      </Card>

      <div className="overflow-hidden rounded-xl border border-border bg-white">
        <div className="hidden grid-cols-[150px_1fr_150px_170px_1fr_1fr_110px] gap-0 bg-muted/40 px-4 py-3 text-xs font-extrabold uppercase text-muted-foreground lg:grid">
          <span>Date</span><span>Action</span><span>Auteur</span><span>Source</span><span>Avant</span><span>Après</span><span>Statut</span>
        </div>
        <div className="divide-y divide-border">
          {loading && <div className="p-4 text-sm font-bold text-muted-foreground">Chargement de l’historique global...</div>}
          {!loading && rows.length === 0 && <div className="p-8 text-center text-sm font-bold text-foreground">Aucune action journalisée dans ce filtre.</div>}
          {rows.map((item) => (
            <div key={item.id} className="grid gap-3 p-4 text-sm lg:grid-cols-[150px_1fr_150px_170px_1fr_1fr_110px] lg:items-center">
              <p className="font-bold text-foreground">{formatDateTime(item.date)}</p>
              <div>
                <p className="font-extrabold text-foreground">{item.action}</p>
                {item.message && <p className="mt-1 text-xs font-semibold text-muted-foreground">{item.message}</p>}
              </div>
              <p className="text-muted-foreground">{item.author}</p>
              <StatusBadge label={item.source} />
              <p className="break-words text-muted-foreground">{stringifyCell(item.oldValue)}</p>
              <p className="break-words font-bold text-foreground">{stringifyCell(item.newValue)}</p>
              <StatusBadge label={item.status} />
            </div>
          ))}
        </div>
      </div>
      <Card className="border-border/70 bg-muted/20 p-4">
        <p className="text-sm font-bold text-foreground">Synchronisation : les actions pharmacie, corrections admin, imports et validations alimentent ce journal sans exposer de secrets ni de contacts côté utilisateur.</p>
      </Card>
    </div>
  );
}

function AdminNotifications() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [type, setType] = useState("all");
  const [items, setItems] = useState<AdminSecurityNotification[]>([]);
  const [stats, setStats] = useState<{ total?: number; listed?: number; unread?: number; critical?: number; archived?: number }>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter !== "all") params.set("status", filter);
    if (type !== "all") params.set("type", type);
    if (query.trim()) params.set("q", query.trim());
    try {
      const res = await fetch(`/api/admin/notifications?${params}`, { headers: { "X-Sablin-Session-Kind": "admin" } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Chargement des notifications impossible.");
      setItems(data.notifications ?? []);
      setStats(data.stats ?? {});
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Chargement des notifications impossible.");
    } finally {
      setLoading(false);
    }
  }, [filter, query, type]);

  useEffect(() => {
    load();
  }, [load]);

  const updateNotification = async (notificationId: string, action: "read" | "archive") => {
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Sablin-Session-Kind": "admin" },
        body: JSON.stringify({ notificationId, action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Action impossible.");
      setMessage(action === "archive" ? "Notification archivée." : "Notification marquée comme lue.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Action impossible.");
    }
  };

  return (
    <div className="space-y-5">
      <AdminHero
        badge="Centre d’alertes"
        title="Notifications admin"
        description="Alertes opérationnelles liées aux validations, imports, données anciennes, paiements suspects et publications."
        icon={Bell}
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Notifications" value={stats.total ?? items.length} badge="Plateforme" />
        <Stat label="Affichées" value={stats.listed ?? items.length} badge="Filtre" />
        <Stat label="Non lues" value={stats.unread ?? 0} badge="non_lue" />
        <Stat label="Critiques" value={stats.critical ?? 0} badge="Alerte" />
      </div>
      <Card className="border-border/70 p-5 shadow-card">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <Heading level="h2">Centre d’alertes global</Heading>
            <Muted className="mt-1">Alertes admin, support pharmacie, paiements et qualité sans créer de session pharmacie.</Muted>
          </div>
          <div className="grid w-full gap-2 sm:grid-cols-[1fr_150px_160px_auto] lg:max-w-3xl">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Titre, message, type..." className="bg-white pl-9" />
            </div>
            <select value={filter} onChange={(event) => setFilter(event.target.value)} className="h-10 rounded-lg border border-border bg-white px-3 text-sm font-bold text-foreground">
              <option value="all">Toutes</option>
              <option value="non_lue">Non lues</option>
              <option value="lue">Lues</option>
              <option value="archivée">Archivées</option>
            </select>
            <select value={type} onChange={(event) => setType(event.target.value)} className="h-10 rounded-lg border border-border bg-white px-3 text-sm font-bold text-foreground">
              <option value="all">Tous types</option>
              <option value="support">Support</option>
              <option value="payment_security">Paiements</option>
              <option value="critical">Critique</option>
              <option value="alert">Alerte</option>
            </select>
            <Button variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={load}>Actualiser</Button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <StatusBadge label="Administration SABLIN" />
          <StatusBadge label="Support pharmacie" />
          <StatusBadge label="Paiements & fraudes" />
          <StatusBadge label="Qualité données" />
        </div>
        {message && <p className="mt-3 rounded-lg border border-border bg-white p-3 text-sm font-bold text-foreground">{message}</p>}
      </Card>
      <div className="grid gap-3 md:grid-cols-2">
        {loading && <Card className="border-border/70 p-5 text-sm font-bold text-muted-foreground">Chargement des notifications...</Card>}
        {!loading && items.length === 0 && <Card className="border-dashed border-border p-8 text-center text-sm font-bold text-foreground">Aucune notification réelle dans ce filtre.</Card>}
        {items.map((item) => (
          <Card key={item.id} className="border-border/70 p-4 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap gap-2">
                  <StatusBadge label={item.group ?? item.type} />
                  <StatusBadge label={item.status} />
                  {item.pharmacy && <StatusBadge label={item.pharmacy.accountStatus} />}
                </div>
                <p className="mt-3 font-extrabold text-foreground">{item.title}</p>
                <p className="text-sm font-medium text-muted-foreground">{item.message}</p>
                {item.pharmacy && (
                  <p className="mt-2 text-xs font-bold text-brand-dark">
                    {item.pharmacy.name} · {item.pharmacy.dataQuality}
                  </p>
                )}
                <p className="mt-2 text-xs font-bold text-muted-foreground">{formatDateTime(item.createdAt)}</p>
              </div>
              <Bell className="size-5 text-brand-dark" />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => updateNotification(item.id, "read")}>Marquer lu</Button>
              <Button size="sm" variant="outline" onClick={() => updateNotification(item.id, "archive")}>Archiver</Button>
            </div>
          </Card>
        ))}
      </div>
      <Card className="border-border/70 bg-muted/20 p-4">
        <p className="text-sm font-bold text-foreground">Synchronisation : ces alertes proviennent des espaces pharmacie, de la qualité des données, des imports et de la sécurité. Les documents internes et contacts restent protégés.</p>
      </Card>
    </div>
  );
}

function AdminSettings() {
  const [settings, setSettings] = useState<AdminSettingsData>(adminSettingsFallback);
  const [form, setForm] = useState({
    warningDays: String(adminSettingsFallback.dataFreshness.warningDays),
    staleDays: String(adminSettingsFallback.dataFreshness.staleDays),
    veryStaleDays: String(adminSettingsFallback.dataFreshness.veryStaleDays),
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", {
        headers: { "x-sablin-session-kind": "admin" },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Paramètres Admin indisponibles.");
      const next = { ...adminSettingsFallback, ...data };
      setSettings(next);
      setForm({
        warningDays: String(next.dataFreshness.warningDays),
        staleDays: String(next.dataFreshness.staleDays),
        veryStaleDays: String(next.dataFreshness.veryStaleDays),
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Paramètres Admin indisponibles.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-sablin-session-kind": "admin",
        },
        body: JSON.stringify({
          warningDays: Number(form.warningDays),
          staleDays: Number(form.staleDays),
          veryStaleDays: Number(form.veryStaleDays),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Enregistrement impossible.");
      setSettings({ ...adminSettingsFallback, ...data });
      setMessage(data?.message ?? "Paramètres Admin enregistrés.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  };

  const testEnrichment = async () => {
    setTesting(true);
    setMessage("");
    try {
      const res = await fetch("/api/enrichment/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-sablin-session-kind": "admin",
        },
        body: JSON.stringify({ action: "test" }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Test indisponible pour ce rôle.");
      setMessage(data?.message ?? "Test d’enrichissement terminé.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Test indisponible pour ce rôle.");
    } finally {
      setTesting(false);
    }
  };

  const envCards = [
    ["Base de données", settings.environment.databaseConfigured ? "Configurée" : "Manquante", "Connexion serveur requise pour synchroniser les trois espaces."],
    ["Supabase", settings.environment.supabaseConfigured ? "Configuré" : "Non détecté", "Variables publiques uniquement côté client, clés sensibles côté serveur."],
    ["Secret session", settings.environment.sessionSecretConfigured ? "Configuré" : "Manquant", "Les sessions Admin, Pharmacie et Utilisateur restent séparées."],
    ["PayDunya", settings.environment.paydunyaConfigured ? "Configuré" : "Fallback test", `Mode ${settings.environment.paymentProviderMode}. Le choix du moyen de paiement reste côté PayDunya.`],
    ["Webhook paiement", settings.environment.paymentWebhookConfigured ? "Configuré" : "À configurer", "Aucun crédit n’est ajouté sans confirmation serveur."],
    ["Enrichissement", settings.enrichment.providerStatus === "active" ? "Actif" : "Fallback interne", settings.enrichment.reason],
  ];

  const metrics = [
    { label: "Sessions admin actives", value: settings.security.activeAdminSessions, status: "Sessions séparées", icon: ShieldCheck },
    { label: "Comptes admin", value: settings.security.adminAccounts, status: "Administration", icon: UserCog },
    { label: "Comptes pharmacie", value: settings.security.pharmacyAccounts, status: "Espace Pharmacie", icon: Building2 },
    { label: "Alertes non lues", value: settings.security.unreadAdminNotifications, status: settings.security.criticalAdminNotifications > 0 ? "À traiter" : "Stable", icon: Bell },
  ];

  return (
    <div className="space-y-5">
      <AdminHero
        badge="Paramètres globaux"
        title="Paramètres"
        description="Configuration des règles de sécurité, publication, enrichissement, paiements, crédits, sessions et support interne. La modification de mot de passe admin n’est pas exposée ici."
        icon={Settings}
        actions={
          <>
            <Button variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={load} disabled={loading}>
              <RefreshCw className="size-4" /> Actualiser
            </Button>
            <Button className="bg-brand text-white hover:bg-brand-dark" onClick={save} disabled={saving || !settings.canManage}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />} Enregistrer
            </Button>
          </>
        }
      />

      {message && <Card className="border-border/70 bg-white p-3 text-sm font-bold text-foreground">{message}</Card>}

      <MetricsGrid metrics={metrics} />

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <SectionBlock title="Seuils de fraîcheur des données" description="Seuils globaux audités. Les fiches pharmacie peuvent aussi porter un seuil spécifique quand l’Admin le décide.">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label htmlFor="warningDays">Avertissement</Label>
              <Input
                id="warningDays"
                type="number"
                min={1}
                max={365}
                value={form.warningDays}
                onChange={(event) => setForm((current) => ({ ...current, warningDays: event.target.value }))}
                className="mt-1 bg-white"
              />
            </div>
            <div>
              <Label htmlFor="staleDays">À confirmer</Label>
              <Input
                id="staleDays"
                type="number"
                min={1}
                max={365}
                value={form.staleDays}
                onChange={(event) => setForm((current) => ({ ...current, staleDays: event.target.value }))}
                className="mt-1 bg-white"
              />
            </div>
            <div>
              <Label htmlFor="veryStaleDays">Très ancien</Label>
              <Input
                id="veryStaleDays"
                type="number"
                min={1}
                max={365}
                value={form.veryStaleDays}
                onChange={(event) => setForm((current) => ({ ...current, veryStaleDays: event.target.value }))}
                className="mt-1 bg-white"
              />
            </div>
          </div>
          <div className="mt-4 rounded-lg border border-border bg-muted/20 p-3">
            <p className="text-sm font-bold text-foreground">Dernière mise à jour : {formatDateTime(settings.dataFreshness.updatedAt)}</p>
            <p className="mt-1 text-sm font-medium text-muted-foreground">Par : {settings.dataFreshness.updatedBy ?? "Système"}. Règle : avertissement ≤ à confirmer ≤ très ancien.</p>
            {!settings.canManage && <p className="mt-2 text-sm font-bold text-amber-800">Votre rôle peut consulter ces paramètres, mais seul un super administrateur peut les modifier.</p>}
          </div>
        </SectionBlock>

        <SectionBlock title="État serveur sécurisé" description="Les secrets ne sont jamais exposés : seuls les statuts configuré/manquant sont affichés.">
          <div className="grid gap-3 md:grid-cols-2">
            {envCards.map(([title, status, detail]) => (
              <div key={title} className="rounded-lg border border-border bg-white p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-extrabold text-foreground">{title}</p>
                  <StatusBadge label={status} />
                </div>
                <p className="mt-2 text-sm font-medium text-muted-foreground">{detail}</p>
              </div>
            ))}
          </div>
        </SectionBlock>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionBlock title="État de l’enrichissement externe" description="Google/Web reste côté serveur. Les images externes restent candidates tant qu’un admin ne les valide pas.">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-white p-3">
              <p className="text-xs font-extrabold uppercase text-muted-foreground">Mode actuel</p>
              <p className="mt-2 text-lg font-extrabold text-foreground">{settings.enrichment.modeLabel}</p>
              <p className="mt-1 text-sm font-medium text-muted-foreground">{settings.enrichment.adminMessage}</p>
            </div>
            <div className="rounded-lg border border-border bg-white p-3">
              <p className="text-xs font-extrabold uppercase text-muted-foreground">Fournisseurs</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <StatusBadge label={settings.enrichment.googleApiConfigured && settings.enrichment.googleSearchEngineConfigured ? "Google configuré" : "Google incomplet"} />
                <StatusBadge label={settings.enrichment.braveApiConfigured ? "Brave configuré" : "Brave absent"} />
                <StatusBadge label={settings.enrichment.openverseEnabled ? "Openverse actif" : "Openverse désactivé"} />
              </div>
            </div>
          </div>
          <div className="mt-3 rounded-lg border border-border bg-muted/20 p-3">
            <p className="text-sm font-bold text-foreground">Dernier test : {settings.enrichment.lastTest?.message ?? "Non testé"}</p>
            {settings.enrichment.lastTest?.at && <p className="text-xs font-bold text-muted-foreground">{formatDateTime(settings.enrichment.lastTest.at)}</p>}
            {settings.enrichment.lastError && <p className="mt-1 text-sm font-bold text-red-700">Dernière erreur : {settings.enrichment.lastError}</p>}
          </div>
          <Button variant="outline" className="mt-4 border-brand/30 text-brand-dark hover:bg-brand-light" onClick={testEnrichment} disabled={testing}>
            {testing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />} Tester la configuration
          </Button>
        </SectionBlock>

        <SectionBlock title="Politiques appliquées" description="Garde-fous réellement portés par les routes, sessions et API serveur.">
          <div className="grid gap-3">
            {settings.policies.map((policy) => (
              <div key={policy.title} className="rounded-lg border border-border bg-white p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-extrabold text-foreground">{policy.title}</p>
                  <StatusBadge label={policy.status} />
                </div>
                <p className="mt-2 text-sm font-medium text-muted-foreground">{policy.detail}</p>
              </div>
            ))}
          </div>
        </SectionBlock>
      </div>

      <SectionBlock title="Audit récent des paramètres et actions sensibles" description="Les changements de configuration et actions Admin sont historisés côté serveur.">
        <ResponsiveTable
          headers={["Date", "Action", "Rôle", "Statut", "Message"]}
          rows={
            settings.recentActions.length
              ? settings.recentActions.map((item) => [
                  formatDateTime(item.createdAt),
                  <span key="label" className="font-bold text-foreground">{item.label}</span>,
                  item.actorRole ?? "Admin",
                  <StatusBadge key="status" label={item.status} />,
                  item.message ?? item.action,
                ])
              : [["-", "Aucune action récente", "-", "-", ""]]
          }
        />
      </SectionBlock>
      <ControlChecklist title="Sécurité globale" items={adminRiskControls} />
    </div>
  );
}

function PharmacySpecificPage({ page, pharmacyId }: { page: AdminPage; pharmacyId?: string }) {
  const mode = useMemo<AdminPharmacyMode>(() => {
    if (page === "pharmacy-medicaments") return "medicaments";
    if (page === "pharmacy-import-inventaire") return "import-inventaire";
    if (page === "pharmacy-synchronisation-inventaire") return "synchronisation-inventaire";
    if (page === "pharmacy-demandes") return "demandes";
    if (page === "pharmacy-confirmations") return "confirmations";
    if (page === "pharmacy-horaires-garde") return "horaires-garde";
    if (page === "pharmacy-profil") return "profil";
    if (page === "pharmacy-photos") return "photos";
    if (page === "pharmacy-equipe") return "equipe";
    if (page === "pharmacy-historique") return "historique";
    return "dashboard";
  }, [page]);
  return <AdminPharmacyModeView pharmacyId={pharmacyId} mode={mode} />;
}

export function AdminSpaceView({ page, pharmacyId, userId }: { page: AdminPage; pharmacyId?: string; userId?: string }) {
  if (page === "login") return <AdminLogin />;
  return (
    <AdminShell page={page} pharmacyId={pharmacyId}>
      {page === "dashboard" && <Dashboard />}
      {page === "pharmacies" && <PharmaciesList />}
      {page === "pharmacies-nouveau" && <CreatePharmacy />}
      {page === "pharmacie-detail" && <PharmacyDetail pharmacyId={pharmacyId} />}
      {page.startsWith("pharmacy-") && <PharmacySpecificPage page={page} pharmacyId={pharmacyId} />}
      {page === "validations-pharmacies" && <PharmacyValidationsAdmin />}
      {page === "comptes-professionnels" && <ProfessionalAccounts />}
      {page === "referentiel-medicaments" && <Reference />}
      {page === "medicaments-interdits" && <ProhibitedMedicationsAdmin />}
      {page === "enrichissement-medicaments" && <EnrichmentAdmin />}
      {page === "moteur-marketplace" && <MarketplaceEngineAdmin />}
      {page === "sources-licences-images" && <EnrichmentAdmin licenseOnly />}
      {page === "imports" && <GlobalAdminImports />}
      {page === "synchronisations" && <AdminSynchronizations />}
      {page === "demandes-ajout-medicaments" && <MedicationRequestsAdmin />}
      {page === "utilisateurs" && <UsersList />}
      {page === "utilisateur-detail" && <UserDetail userId={userId} />}
      {page === "credits-transactions" && <Transactions />}
      {page === "payments-fraud" && <PaymentsFraud />}
      {page === "demandes-utilisateurs" && <AdminUserRequests />}
      {page === "qualite-donnees" && <Quality />}
      {page === "historique" && <AdminHistory />}
      {page === "notifications" && <AdminNotifications />}
      {page === "administrateurs" && <Administrators />}
      {page === "parametres" && <AdminSettings />}
    </AdminShell>
  );
}
