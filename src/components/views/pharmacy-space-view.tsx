"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive,
  Bell,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  Filter,
  FileSpreadsheet,
  History,
  KeyRound,
  LayoutDashboard,
  Lock,
  LogOut,
  Loader2,
  Mail,
  MessageCircle,
  Pill,
  RefreshCw,
  Save,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Upload,
  UserPlus,
  UserRound,
  Users,
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
  PHARMACY_IMAGE_FIELDS,
  PHARMACY_OPERATION_STATUSES,
  PHARMACY_PROFILE_STEPS,
  PHARMACY_SERVICES,
  PUBLIC_AVAILABILITY_STATUSES,
  PUBLIC_PHARMACY_DATA,
  REQUEST_STATUSES,
  RELIABILITY_LEVELS,
} from "@/lib/pharmacy-platform";

export type PharmacyPage =
  | "login"
  | "inscription"
  | "dashboard"
  | "profil"
  | "photos"
  | "medicaments"
  | "medicaments-ajouter"
  | "import-inventaire"
  | "enrichissement-inventaire"
  | "synchronisation-inventaire"
  | "demandes"
  | "confirmations"
  | "conseils"
  | "horaires-garde"
  | "equipe"
  | "historique"
  | "notifications"
  | "parametres"
  | "validation-en-attente"
  | "compte-suspendu";

const navItems: { page: PharmacyPage; label: string; icon: typeof LayoutDashboard; href: string }[] = [
  { page: "dashboard", label: "Tableau de bord", icon: LayoutDashboard, href: "/pharmacie/dashboard" },
  { page: "medicaments", label: "Mes médicaments", icon: Pill, href: "/pharmacie/medicaments" },
  { page: "import-inventaire", label: "Import inventaire", icon: FileSpreadsheet, href: "/pharmacie/import-inventaire" },
  { page: "enrichissement-inventaire", label: "Enrichissement", icon: ShieldCheck, href: "/pharmacie/enrichissement-inventaire" },
  { page: "synchronisation-inventaire", label: "Synchronisation", icon: ShieldCheck, href: "/pharmacie/synchronisation-inventaire" },
  { page: "demandes", label: "Demandes", icon: MessageCircle, href: "/pharmacie/demandes" },
  { page: "confirmations", label: "Confirmations", icon: ClipboardCheck, href: "/pharmacie/confirmations" },
  { page: "conseils", label: "Conseils", icon: ShieldCheck, href: "/pharmacie/conseils" },
  { page: "horaires-garde", label: "Horaires & garde", icon: CalendarClock, href: "/pharmacie/horaires-garde" },
  { page: "profil", label: "Profil pharmacie", icon: UserRound, href: "/pharmacie/profil" },
  { page: "equipe", label: "Équipe", icon: KeyRound, href: "/pharmacie/equipe" },
  { page: "historique", label: "Historique", icon: History, href: "/pharmacie/historique" },
  { page: "notifications", label: "Notifications", icon: Bell, href: "/pharmacie/notifications" },
  { page: "parametres", label: "Paramètres", icon: Settings, href: "/pharmacie/parametres" },
];

const PHARMACY_SESSION_SLUG = "pharmacie-sainte-marie-cocody";

type PharmacyDashboardSummary = {
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

const pharmacyDashboardFallback: PharmacyDashboardSummary = {
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

const pharmacyDailyActions = [
  { title: "Mettre à jour les disponibilités", status: "Priorité", detail: "Vérifiez les médicaments anciens ou à confirmer avant la publication utilisateur.", href: "/pharmacie/medicaments" },
  { title: "Traiter les confirmations", status: "En attente", detail: "Répondez aux demandes de disponibilité, prix ou confirmation complète.", href: "/pharmacie/confirmations" },
  { title: "Contrôler les horaires et la garde", status: "Aujourd’hui", detail: "Assurez-vous que les horaires et le statut de garde sont exacts.", href: "/pharmacie/horaires-garde" },
  { title: "Importer un inventaire", status: "Synchronisation", detail: "Chargez un fichier CSV, Excel, Word ou PowerPoint puis publiez les produits autorisés.", href: "/pharmacie/import-inventaire" },
];

const WEEK_DAYS = [
  { key: "monday", label: "Lundi" },
  { key: "tuesday", label: "Mardi" },
  { key: "wednesday", label: "Mercredi" },
  { key: "thursday", label: "Jeudi" },
  { key: "friday", label: "Vendredi" },
  { key: "saturday", label: "Samedi" },
  { key: "sunday", label: "Dimanche" },
] as const;

type DaySchedule = {
  enabled: boolean;
  open: string;
  close: string;
  breakStart: string;
  breakEnd: string;
  status: string;
};

const defaultSchedule: Record<string, DaySchedule> = Object.fromEntries(
  WEEK_DAYS.map((day, index) => [
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
) as Record<string, DaySchedule>;

function toDateTimeInput(value: unknown, fallback = "") {
  if (!value) return fallback;
  const raw = String(value);
  return raw.includes("T") ? raw.slice(0, 16) : fallback;
}

const teamPermissions = [
  { key: "pharmacy.inventory.update", label: "Modifier les médicaments" },
  { key: "pharmacy.inventory.import", label: "Importer l’inventaire" },
  { key: "pharmacy.schedule.update", label: "Modifier les horaires" },
  { key: "pharmacy.requests.respond", label: "Répondre aux demandes" },
  { key: "pharmacy.profile.update", label: "Modifier le profil" },
  { key: "pharmacy.history.read", label: "Voir l’historique" },
] as const;

function permissionLabel(permission: string) {
  return teamPermissions.find((item) => item.key === permission)?.label ?? permission;
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

type PharmacyNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  status: string;
  createdAt: string;
};

type TeamMember = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role: string;
  permissions: string[];
  status: string;
  accountStatus: string;
  lastLoginAt?: string | null;
};

type TeamInvitation = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role: string;
  permissions: string[];
  status: string;
  expiresAt: string;
  createdAt: string;
};

type PharmacyWorkspaceSettings = {
  autoPublishSafeInventory: boolean;
  requireManagerReviewForImages: boolean;
  dailyOperationsDigest: boolean;
  allowAdminAssistance: boolean;
  publicProfileChecklist: boolean;
  reminderFrequency: string;
  preferredSupportChannel: string;
  supportPriority: string;
  supportTopic: string;
  supportMessage: string;
};

type PharmacySettingsSnapshot = {
  pharmacy?: {
    name: string;
    accountStatus: string;
    publicationStatus: string;
    dataQuality: string;
    qualityScore: number;
    mediaCount: number;
    medicationCount: number;
    requestCount: number;
    teamCount: number;
    lastDataUpdate?: string | null;
  };
  security?: {
    role?: string | null;
    permissions?: string[];
    activeSessions?: number;
    sessionExpiresAt?: number | null;
  };
  workspaceSettings?: PharmacyWorkspaceSettings;
  recentActions?: Array<{ id: string; label: string; action: string; status: string; createdAt: string }>;
};

type PharmacyProfileData = {
  name: string;
  managerName?: string | null;
  managerRole?: string | null;
  phone: string;
  whatsapp?: string | null;
  professionalEmail?: string | null;
  authorizationNumber?: string | null;
  commune: string;
  district?: string | null;
  address: string;
  latitude: number;
  longitude: number;
  landmark?: string | null;
  coverageZone?: string | null;
  description?: string | null;
  accountStatus: string;
  dataQuality: string;
  services: string[];
  mediaCount: number;
  medicationCount: number;
  completenessScore: number;
};

type PharmacyInventoryItem = {
  id: string;
  pharmacy: string;
  medication: string;
  dci: string;
  dosage: string;
  form: string;
  category: string;
  price: number;
  internalQuantity: number | null;
  privateStatus: string;
  publicStatus: string;
  dataSource: string;
  reliabilityLevel: string;
  lastUpdatedAt: string;
  remark?: string | null;
};

function formatDateTime(value?: string | Date | null) {
  if (!value) return "Non renseigné";
  return new Intl.DateTimeFormat("fr-CI", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function stringifyCell(value: unknown) {
  if (value === null || value === undefined || value === "") return "Non renseigné";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return "Valeur complexe";
  }
}

function downloadImportTemplate(fileName = "modele-import-ma-pharmacie.csv") {
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
  const blob = new Blob([`\uFEFFsep=;\n${header}\n${example}\n`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  try {
    link.href = url;
    link.download = fileName;
    link.rel = "noopener";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
  } finally {
    link.remove();
    URL.revokeObjectURL(url);
  }
}

function statusClass(label: string) {
  const value = label.toLowerCase();
  if (value.includes("disponible") || value.includes("valid") || value.includes("confirm") || value.includes("ouvert") || value.includes("à jour")) return "bg-success-light text-success";
  if (value.includes("faible") || value.includes("attente") || value.includes("vérifier") || value.includes("ancien") || value.includes("incomplet")) return "bg-amber-100 text-amber-800";
  if (value.includes("rupture") || value.includes("suspend") || value.includes("fermé") || value.includes("expir")) return "bg-danger-light text-danger";
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
};

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

function Stat({ label, value, badge }: { label: string; value: string | number; badge?: string }) {
  return (
    <Card className="border-border/70 p-4 shadow-card">
      {badge && <StatusBadge label={badge} />}
      <p className="mt-4 text-2xl font-extrabold text-foreground">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </Card>
  );
}

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

function DashboardHero({
  title,
  description,
  badge,
  icon: Icon = LayoutDashboard,
  children,
}: {
  title: string;
  description: string;
  badge: string;
  icon?: typeof LayoutDashboard;
  children?: React.ReactNode;
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
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={() => window.location.reload()}>
            Actualiser
          </Button>
          <Button className="bg-brand text-white hover:bg-brand-dark" onClick={() => (window.location.href = "/pharmacie/import-inventaire")}>
            <Upload className="size-4" /> Importer
          </Button>
        </div>
      </div>
      {children && <div className="mt-5">{children}</div>}
    </Card>
  );
}

function DashboardMetric({
  label,
  value,
  badge,
  icon: Icon = CheckCircle2,
}: {
  label: string;
  value: string | number;
  badge: string;
  icon?: typeof CheckCircle2;
}) {
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
      <div className="mt-3"><StatusBadge label={badge} /></div>
    </Card>
  );
}

function DailyActionBoard() {
  return (
    <SectionBlock title="Actions prioritaires du jour" description="Les actions qui améliorent immédiatement la fiabilité côté utilisateur.">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {pharmacyDailyActions.map((item) => (
          <a key={item.title} href={item.href} className="rounded-xl border border-border bg-white p-4 transition-colors hover:border-brand/40">
            <StatusBadge label={item.status} />
            <p className="mt-3 font-extrabold text-foreground">{item.title}</p>
            <p className="mt-1 text-sm font-medium text-muted-foreground">{item.detail}</p>
          </a>
        ))}
      </div>
    </SectionBlock>
  );
}

function DataVisibilityBlocks() {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <SectionBlock title="Données publiques" description="Ces données alimentent directement la plateforme utilisateur.">
        <PillList items={PUBLIC_PHARMACY_DATA} />
      </SectionBlock>
      <SectionBlock title="Données internes" description="Visibles uniquement par la pharmacie et l’administration SABLIN.">
        <PillList items={INTERNAL_PHARMACY_DATA} />
      </SectionBlock>
    </div>
  );
}

function StepCards() {
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

function ImageRules() {
  return (
    <SectionBlock title="Photos & images" description="Les images publiques doivent être propres, nettes, sans ordonnance, sans visage patient et sans document confidentiel.">
      <MediaUploadPanel
        pharmacySlug={PHARMACY_SESSION_SLUG}
        allowAdminOnly={false}
        helper="Vos photos sont enregistrées immédiatement, puis publiées côté utilisateur après validation SABLIN PHARMA."
      />
      <div className="grid gap-3 md:grid-cols-2">
        {PHARMACY_IMAGE_FIELDS.map((image) => (
          <Card key={image.label} className="border-border/70 p-3">
            <p className="font-bold text-foreground">{image.label}</p>
            <p className="mt-1 text-sm text-muted-foreground">{image.usage}</p>
            <div className="mt-2"><StatusBadge label={image.visibility} /></div>
          </Card>
        ))}
      </div>
    </SectionBlock>
  );
}

function MediaUploadPanel({ pharmacySlug, allowAdminOnly, helper }: { pharmacySlug: string; allowAdminOnly: boolean; helper: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState("facade");
  const [visibility, setVisibility] = useState("public");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [altText, setAltText] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [media, setMedia] = useState<PharmacyMediaItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const loadMedia = useCallback(async () => {
    if (!pharmacySlug) return;
    setLoadingMedia(true);
    try {
      const res = await fetch(`/api/pharmacy-platform/media?pharmacySlug=${encodeURIComponent(pharmacySlug)}`, {
        headers: { "X-Sablin-Session-Kind": "pharmacy" },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Chargement des photos impossible.");
      setMedia(data.media ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Chargement des photos impossible.");
    } finally {
      setLoadingMedia(false);
    }
  }, [pharmacySlug]);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  const upload = async () => {
    if (!file) {
      setMessage("Choisissez une image avant de charger.");
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
      form.set("usage", type === "cover" ? "Profil pharmacie" : "Fiche pharmacie");
      form.set("isPrimary", isPrimary ? "true" : "false");
      const res = await fetch("/api/pharmacy-platform/media/upload", { method: "POST", headers: { "X-Sablin-Session-Kind": "pharmacy" }, body: form });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Chargement impossible.");
      setMessage("Fichier chargé avec succès. Publication utilisateur après validation.");
      setFile(null);
      setTitle("");
      setDescription("");
      setAltText("");
      setIsPrimary(false);
      await loadMedia();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Chargement impossible.");
    } finally {
      setUploading(false);
    }
  };

  const mediaAction = async (mediaId: string, action: string) => {
    setMessage("");
    try {
      const res = await fetch("/api/pharmacy-platform/media", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Sablin-Session-Kind": "pharmacy",
        },
        body: JSON.stringify({ mediaId, action }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Action impossible.");
      setMessage(`Action enregistrée : ${data.media.title} — ${data.media.validationStatus}.`);
      await loadMedia();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Action impossible.");
    }
  };

  const deleteMedia = async (mediaId: string) => {
    setMessage("");
    try {
      const res = await fetch(`/api/pharmacy-platform/media?mediaId=${encodeURIComponent(mediaId)}`, {
        method: "DELETE",
        headers: { "X-Sablin-Session-Kind": "pharmacy" },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Suppression impossible.");
      setMessage("Photo retirée de votre espace.");
      await loadMedia();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Suppression impossible.");
    }
  };

  return (
    <Card className="mb-4 border-brand/20 bg-white p-4">
      <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="font-extrabold text-foreground">Charger une photo de la pharmacie</p>
          <p className="mt-1 text-sm font-medium text-muted-foreground">{helper}</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <select value={type} onChange={(e) => setType(e.target.value)} className="h-10 rounded-lg border border-border bg-white px-3 text-sm font-bold text-foreground">
            {PHARMACY_IMAGE_FIELDS.filter((item) => allowAdminOnly || item.type !== "authorization_document").map((item) => <option key={item.type} value={item.type}>{item.label}</option>)}
          </select>
          <select value={visibility} onChange={(e) => setVisibility(e.target.value)} className="h-10 rounded-lg border border-border bg-white px-3 text-sm font-bold text-foreground">
            <option value="public">Public après validation</option>
            <option value="internal">Interne pharmacie</option>
            {allowAdminOnly && <option value="admin_only">Admin uniquement</option>}
          </select>
        </div>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre de l’image" />
        <Input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <Button className="bg-brand text-white hover:bg-brand-dark" onClick={upload} disabled={uploading}>{uploading ? "Chargement..." : "Charger"}</Button>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <Input value={altText} onChange={(e) => setAltText(e.target.value)} placeholder="Texte alternatif public" />
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description courte" />
      </div>
      <label className="mt-3 flex w-fit items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-bold text-foreground">
        <input type="checkbox" checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} />
        Proposer comme image principale
      </label>
      {message && <p className="mt-3 rounded-lg border border-border bg-muted/40 p-3 text-sm font-bold text-foreground">{message}</p>}
      <div className="mt-5 border-t border-border pt-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-extrabold text-foreground">Mes photos chargées</p>
            <p className="text-sm font-medium text-muted-foreground">Les photos publiques passent par une validation SABLIN PHARMA avant affichage utilisateur.</p>
          </div>
          <Button variant="outline" size="sm" onClick={loadMedia} disabled={loadingMedia}>{loadingMedia ? "Actualisation..." : "Actualiser"}</Button>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {media.length === 0 && (
            <Card className="border-border/70 bg-muted/30 p-4 text-sm font-bold text-foreground">Aucune photo chargée pour le moment.</Card>
          )}
          {media.map((item) => (
            <Card key={item.id} className="overflow-hidden border-border/70 bg-white">
              <div className="h-36 overflow-hidden border-b border-border bg-muted/30">
                <img src={item.url} alt={item.altText ?? item.title} className="h-full w-full object-cover" />
              </div>
              <div className="p-3">
                <div className="flex flex-wrap items-start gap-2">
                  <h4 className="break-words font-extrabold text-foreground">{item.title}</h4>
                  {item.isPrimary && <StatusBadge label="Image principale" />}
                  {item.isPublic && <StatusBadge label="Visible utilisateur" />}
                </div>
                <p className="mt-1 text-sm font-medium text-muted-foreground">{item.description || item.type}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <StatusBadge label={item.validationStatus} />
                  <StatusBadge label={item.visibility === "public" ? "Public demandé" : "Interne pharmacie"} />
                </div>
                {item.rejectedReason && <p className="mt-2 rounded-lg bg-danger-light p-2 text-xs font-bold text-danger">{item.rejectedReason}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => mediaAction(item.id, "archive")}>Archiver</Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteMedia(item.id)}>Supprimer</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Card>
  );
}

function PharmacyShell({ page, children }: { page: PharmacyPage; children: React.ReactNode }) {
  const logout = async () => {
    await fetch("/api/pharmacy-auth/logout", { method: "POST" });
    window.location.href = "/pharmacie/login";
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-4">
            <Logo size={46} />
            <div>
              <Badge className="border-0 bg-brand-light text-brand-dark">Espace Pharmacie</Badge>
              <h1 className="mt-1 text-xl font-extrabold text-foreground">Pharmacie Sainte Marie Cocody</h1>
              <p className="text-sm text-muted-foreground">Statut : Ouvert · De garde · Données de ma pharmacie uniquement</p>
            </div>
          </div>
          <LogoutConfirmDialog onConfirm={logout}>
            <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
              <LogOut className="size-4" /> Déconnexion
            </Button>
          </LogoutConfirmDialog>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[250px_minmax(0,1fr)] lg:px-8">
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <Card className="border-border/70 p-2 shadow-card">
            <nav className="grid gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.page}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold transition-colors",
                      page === item.page ? "bg-brand text-white" : "text-foreground/75 hover:bg-accent"
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    {item.label}
                  </a>
                );
              })}
            </nav>
          </Card>
        </aside>
        <main className="min-w-0 space-y-5">
          {children}
        </main>
      </div>
    </div>
  );
}

async function pharmacyLogin(role = "Pharmacien responsable", status = "Validée") {
  await fetch("/api/pharmacy-auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role, status, demo: true }),
  });
  window.location.href = "/pharmacie/dashboard";
}

function PharmacyLogin() {
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const restricted = params?.get("restricted") === "pharmacy";
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto grid min-h-screen max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:items-center">
        <section>
          <Logo size={60} />
          <p className="mt-6 text-xs font-extrabold uppercase tracking-wide text-brand">SABLIN PHARMA Pharmacie</p>
          <Heading level="h1" className="mt-2 text-3xl sm:text-4xl">Connexion pharmacie</Heading>
          <Muted className="mt-3 max-w-xl">Gérez vos disponibilités, horaires, gardes et demandes utilisateurs.</Muted>
          {restricted && (
            <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
              Accès réservé aux pharmacies partenaires.
            </p>
          )}
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {["Session séparée de l’utilisateur", "Accès limité à votre pharmacie", "Contacts publics toujours verrouillés", "Publication après validation"].map((item) => (
              <Card key={item} className="border-border/70 p-4">
                <Lock className="size-5 text-brand" />
                <p className="mt-2 text-sm font-bold text-foreground">{item}</p>
              </Card>
            ))}
          </div>
        </section>
        <Card className="border-border/70 p-5 shadow-card">
          <div className="space-y-4">
            <Field label="Email ou téléphone professionnel" placeholder="pharmacie@sablin.ci" />
            <Field label="Mot de passe" type="password" placeholder="Votre mot de passe" />
            <Button className="h-11 w-full bg-brand text-white hover:bg-brand-dark" onClick={() => pharmacyLogin()}>
              Se connecter
            </Button>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={() => pharmacyLogin("Employé pharmacie")}>Démo employé</Button>
              <Button variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-50" onClick={() => pharmacyLogin("Pharmacien responsable", "En attente de validation")}>Démo en attente</Button>
            </div>
            <a href="/professionnel/reinitialiser-mot-de-passe" className="block text-center text-sm font-bold text-brand-dark">Mot de passe oublié ?</a>
            <a href="/pharmacie/inscription" className="block text-center text-sm font-bold text-brand-dark">Inscrire ma pharmacie</a>
          </div>
        </Card>
      </div>
    </div>
  );
}

function PharmacyRegistration() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Logo size={54} />
        <Heading level="h1" className="mt-6">Inscrire ma pharmacie</Heading>
        <Muted className="mt-2">L’inscription crée une session pharmacie en attente de validation, sans publication côté utilisateur.</Muted>
        <div className="mt-6">
          <StepCards />
        </div>
        <Card className="mt-6 border-border/70 p-5 shadow-card">
          <Heading level="h2">Étape 1 : informations générales</Heading>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Nom de la pharmacie" />
            <Field label="Nom du pharmacien responsable" />
            <Field label="Fonction du responsable" />
            <Field label="Téléphone professionnel" />
            <Field label="WhatsApp professionnel" />
            <Field label="Email professionnel" />
            <Field label="Commune" />
            <Field label="Quartier" />
            <Field label="Adresse complète" />
            <Field label="Point GPS latitude" />
            <Field label="Point GPS longitude" />
            <Field label="Repère connu" />
            <Field label="Zone de couverture" />
            <Field label="Numéro d’autorisation / agrément" />
            <Field label="Logo ou photo de façade" />
            <Field label="Mot de passe" type="password" />
            <Field label="Confirmation du mot de passe" type="password" />
          </div>
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
            L’inscription sera vérifiée par l’équipe SABLIN PHARMA avant publication des données côté utilisateur.
          </p>
          <Button className="mt-4 w-full bg-brand text-white hover:bg-brand-dark" onClick={() => pharmacyLogin("Pharmacien responsable", "En attente de validation")}>Créer mon espace pharmacie</Button>
        </Card>
        <div className="mt-6">
          <DataVisibilityBlocks />
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const pending = params?.get("pending") === "1";
  const [summary, setSummary] = useState<PharmacyDashboardSummary>(pharmacyDashboardFallback);
  const [loadingSummary, setLoadingSummary] = useState(true);

  useEffect(() => {
    let active = true;
    setLoadingSummary(true);
    fetch("/api/pharmacy-platform/dashboard-summary", {
      headers: { "x-sablin-session-kind": "pharmacy" },
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (active && ok) setSummary({ ...pharmacyDashboardFallback, ...data });
      })
      .catch(() => {
        if (active) setSummary(pharmacyDashboardFallback);
      })
      .finally(() => {
        if (active) setLoadingSummary(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      {pending && (
        <Card className="border-amber-200 bg-amber-50 p-5">
          <h2 className="text-xl font-extrabold text-amber-900">Compte en attente de validation</h2>
          <p className="mt-2 text-sm font-semibold text-amber-800">
            Votre compte pharmacie est en cours de validation par l’équipe SABLIN PHARMA. Vous pourrez publier vos données après validation.
          </p>
        </Card>
      )}
      <DashboardHero
        badge="Espace Pharmacie"
        title="Tableau de bord pharmacie"
        description="Console quotidienne pour gérer vos disponibilités, vos horaires, votre garde, vos demandes utilisateurs et la qualité des données publiées par SABLIN PHARMA."
      >
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <p className="text-xs font-extrabold uppercase text-muted-foreground">Priorité immédiate</p>
            <p className="mt-1 font-bold text-foreground">Traiter les confirmations et mettre à jour les disponibilités anciennes.</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <p className="text-xs font-extrabold uppercase text-muted-foreground">Publication utilisateur</p>
            <p className="mt-1 font-bold text-foreground">Seuls les statuts simples et les prix indicatifs validés alimentent la plateforme utilisateur.</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <p className="text-xs font-extrabold uppercase text-muted-foreground">Confidentialité</p>
            <p className="mt-1 font-bold text-foreground">Stock exact, contacts et documents restent protégés hors affichage public gratuit.</p>
          </div>
        </div>
      </DashboardHero>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetric label="Médicaments de ma pharmacie" value={loadingSummary ? "..." : summary.medicationCount} badge="Données à jour" icon={Pill} />
        <DashboardMetric label="Disponibilités à mettre à jour" value={loadingSummary ? "..." : summary.staleAvailabilityCount} badge="À confirmer" icon={CalendarClock} />
        <DashboardMetric label="Demandes reçues" value={loadingSummary ? "..." : summary.receivedRequests} badge="Nouvelle" icon={MessageCircle} />
        <DashboardMetric label="Confirmations en attente" value={loadingSummary ? "..." : summary.pendingConfirmations} badge="En cours" icon={ClipboardCheck} />
        <DashboardMetric label="Statut de garde" value={loadingSummary ? "..." : summary.dutyStatus} badge={summary.dutyStatus === "Actif" ? "De garde" : "Fermé"} icon={CalendarClock} />
        <DashboardMetric label="Qualité de mes données" value={loadingSummary ? "..." : `${summary.dataQualityPercent}%`} badge="Données à jour" icon={ShieldCheck} />
        <DashboardMetric label="Dernière mise à jour" value={loadingSummary ? "..." : summary.lastDataUpdateLabel} badge="Confirmé" icon={CheckCircle2} />
        <DashboardMetric label="Prix à vérifier" value={loadingSummary ? "..." : summary.priceToCheck} badge="À vérifier" icon={FileSpreadsheet} />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <DailyActionBoard />
        <SectionBlock title="État de publication" description="Ce résumé vous montre ce qui influence directement l’affichage utilisateur.">
          <div className="grid gap-3">
            {[
              ["Inventaire", `${loadingSummary ? "..." : summary.medicationCount} médicament(s) suivis`, "Base pharmacie"],
              ["À corriger", `${loadingSummary ? "..." : summary.staleAvailabilityCount + summary.priceToCheck} point(s) à vérifier`, "Qualité"],
              ["Demandes", `${loadingSummary ? "..." : summary.pendingRequests} demande(s) en attente`, "Utilisateur"],
              ["Garde", summary.dutyStatus, summary.dutyStatus === "Actif" ? "Visible garde" : "Non actif"],
            ].map(([title, value, status]) => (
              <div key={title} className="rounded-lg border border-border bg-white p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-extrabold text-foreground">{title}</p>
                  <StatusBadge label={status} />
                </div>
                <p className="mt-1 text-sm font-bold text-brand-dark">{value}</p>
              </div>
            ))}
          </div>
        </SectionBlock>
      </div>
    </div>
  );
}

function Medications() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [reliabilityFilter, setReliabilityFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [inventory, setInventory] = useState<PharmacyInventoryItem[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [requestName, setRequestName] = useState("");
  const [requestMessage, setRequestMessage] = useState("");

  const loadInventory = useCallback(async () => {
    setLoadingInventory(true);
    try {
      const res = await fetch(`/api/pharmacy-platform/inventory?pharmacySlug=${encodeURIComponent(PHARMACY_SESSION_SLUG)}`, {
        headers: { "X-Sablin-Session-Kind": "pharmacy" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Chargement de l’inventaire impossible.");
      setInventory(data.inventory ?? []);
    } catch (error) {
      setRequestMessage(error instanceof Error ? error.message : "Chargement de l’inventaire impossible.");
      setInventory([]);
    } finally {
      setLoadingInventory(false);
    }
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const categories = useMemo(() => [...new Set(inventory.map((item) => item.category).filter(Boolean))].sort(), [inventory]);
  const sources = useMemo(() => [...new Set(inventory.map((item) => item.dataSource).filter(Boolean))].sort(), [inventory]);
  const rows = useMemo(() => {
    const q = query.toLowerCase().trim();
    return inventory.filter((item) => {
      const searchable = `${item.medication} ${item.dci} ${item.dosage} ${item.form} ${item.category} ${item.dataSource}`.toLowerCase();
      return (
        (!q || searchable.includes(q)) &&
        (statusFilter === "all" || item.publicStatus === statusFilter || item.privateStatus === statusFilter) &&
        (categoryFilter === "all" || item.category === categoryFilter) &&
        (reliabilityFilter === "all" || item.reliabilityLevel === reliabilityFilter) &&
        (sourceFilter === "all" || item.dataSource === sourceFilter)
      );
    });
  }, [categoryFilter, inventory, query, reliabilityFilter, sourceFilter, statusFilter]);
  const stats = useMemo(() => ({
    total: inventory.length,
    visible: inventory.filter((item) => item.publicStatus !== "À confirmer").length,
    toConfirm: inventory.filter((item) => item.publicStatus === "À confirmer" || item.reliabilityLevel !== "Confirmé").length,
    stale: inventory.filter((item) => item.dataSource === "Donnée ancienne" || item.reliabilityLevel === "Ancien").length,
  }), [inventory]);
  const requestReferentialAdd = async () => {
    const proposedName = requestName.trim() || query.trim();
    if (!proposedName) {
      setRequestMessage("Renseignez le nom du médicament à proposer.");
      return;
    }
    try {
      const res = await fetch("/api/pharmacy-platform/medication-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Sablin-Session-Kind": "pharmacy" },
        body: JSON.stringify({ pharmacySlug: PHARMACY_SESSION_SLUG, proposedName, remark: "Demande depuis l’espace pharmacie" }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Demande impossible.");
      setRequestMessage("Demande envoyée à l’administration SABLIN PHARMA. Publication après validation uniquement.");
      setRequestName("");
    } catch (error) {
      setRequestMessage(error instanceof Error ? error.message : "Demande impossible.");
    }
  };
  const clearFilters = () => {
    setQuery("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setReliabilityFilter("all");
    setSourceFilter("all");
  };
  return (
    <div className="space-y-5">
      <Card className="border-border/70 p-5 shadow-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Heading level="h2">Médicaments & disponibilités</Heading>
            <Muted>Inventaire réel de votre pharmacie, synchronisé avec les imports, les validations et la marketplace utilisateur.</Muted>
          </div>
          <Button className="bg-brand text-white hover:bg-brand-dark" onClick={() => (window.location.href = "/pharmacie/import-inventaire")}><Upload className="size-4" /> Import inventaire</Button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Inventaire réel" value={loadingInventory ? "..." : stats.total} badge="Base de données" />
          <Stat label="Publiables après contrôle" value={loadingInventory ? "..." : stats.visible} badge="Marketplace" />
          <Stat label="À confirmer" value={loadingInventory ? "..." : stats.toConfirm} badge="Validation" />
          <Stat label="Données anciennes" value={loadingInventory ? "..." : stats.stale} badge="Qualité" />
        </div>

        <div className="mt-4 rounded-xl border border-border bg-white p-3">
          <div className="grid gap-3 lg:grid-cols-[1.4fr_repeat(4,0.8fr)_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher médicament, DCI, catégorie..." className="pl-9" />
            </div>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-lg border border-border bg-white px-3 text-sm font-bold text-foreground">
              <option value="all">Tous les statuts</option>
              {PUBLIC_AVAILABILITY_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="h-10 rounded-lg border border-border bg-white px-3 text-sm font-bold text-foreground">
              <option value="all">Toutes catégories</option>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <select value={reliabilityFilter} onChange={(event) => setReliabilityFilter(event.target.value)} className="h-10 rounded-lg border border-border bg-white px-3 text-sm font-bold text-foreground">
              <option value="all">Toute fiabilité</option>
              {RELIABILITY_LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
            </select>
            <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)} className="h-10 rounded-lg border border-border bg-white px-3 text-sm font-bold text-foreground">
              <option value="all">Toutes sources</option>
              {sources.map((source) => <option key={source} value={source}>{source}</option>)}
            </select>
            <Button variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={clearFilters}>
              <Filter className="size-4" /> Réinitialiser
            </Button>
          </div>
        </div>

        {requestMessage && <p className="mt-3 rounded-lg border border-border bg-white p-3 text-sm font-bold text-foreground">{requestMessage}</p>}

        {loadingInventory && (
          <Card className="mt-4 border-border/70 p-4 text-sm font-bold text-muted-foreground">Chargement de l’inventaire réel...</Card>
        )}
        {!loadingInventory && rows.length === 0 && (
          <Card className="mt-4 border-amber-200 bg-amber-50 p-4">
            <p className="font-extrabold text-amber-900">Aucun médicament trouvé dans l’inventaire réel</p>
            <p className="mt-1 text-sm font-semibold text-amber-800">Importez un fichier, modifiez vos filtres ou demandez l’ajout d’un médicament au référentiel.</p>
            <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto_auto]">
              <Input value={requestName} onChange={(event) => setRequestName(event.target.value)} placeholder={query || "Nom proposé"} />
              <Button variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={clearFilters}>Voir tout</Button>
              <Button className="bg-brand text-white hover:bg-brand-dark" onClick={requestReferentialAdd}>Demander l’ajout au référentiel</Button>
            </div>
          </Card>
        )}

        <div className="mt-4 grid gap-3 lg:hidden">
          {rows.map((m) => (
            <Card key={m.id} className="border-border/70 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-extrabold text-foreground">{m.medication}</p>
                  <p className="text-xs font-bold text-muted-foreground">{m.dci} · {m.form} · {m.dosage}</p>
                  <p className="mt-1 text-xs font-semibold text-muted-foreground">{m.category} · {formatDateTime(m.lastUpdatedAt)}</p>
                </div>
                <StatusBadge label={m.publicStatus} />
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-muted/20 p-3">
                  <p className="text-xs font-bold text-muted-foreground">Prix indicatif</p>
                  <Price amount={m.price} size="sm" variant="brand" />
                </div>
                <div className="rounded-lg border border-border bg-muted/20 p-3">
                  <p className="text-xs font-bold text-muted-foreground">Quantité interne</p>
                  <p className="text-sm font-extrabold text-foreground">{m.internalQuantity ?? "Non renseignée"}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusBadge label={m.dataSource} />
                <StatusBadge label={m.reliabilityLevel} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {PUBLIC_AVAILABILITY_STATUSES.map((s) => (
                  <ProfessionalActionButton
                    key={s}
                    action="quick-availability"
                    label={s}
                    pharmacySlug={PHARMACY_SESSION_SLUG}
                    medicationName={m.medication}
                    entityId={m.id}
                    entityType="pharmacy-medication"
                    payload={{ availabilityStatus: s, reliabilityLevel: s === "À confirmer" ? "À vérifier" : "Confirmé", dataSource: "Saisie pharmacie" }}
                    onSuccess={() => void loadInventory()}
                    size="sm"
                    variant="outline"
                    className="min-h-10 whitespace-normal border-brand/20 text-xs text-brand-dark"
                  >
                    {s}
                  </ProfessionalActionButton>
                ))}
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-4 hidden overflow-x-auto rounded-xl border border-border lg:block">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr>{["Médicament", "Prix indicatif", "Statut public", "Interne", "Source", "Fiabilité", "Dernière mise à jour", "Mise à jour rapide"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {rows.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-3"><p className="font-bold text-foreground">{m.medication}</p><p className="text-xs text-muted-foreground">{m.dci} · {m.form} · {m.dosage} · {m.category}</p></td>
                  <td className="px-4 py-3"><Price amount={m.price} size="sm" variant="brand" /></td>
                  <td className="px-4 py-3"><StatusBadge label={m.publicStatus} /></td>
                  <td className="px-4 py-3 text-muted-foreground">Quantité interne : {m.internalQuantity ?? "Non renseignée"}. Non visible côté utilisateur.</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.dataSource}</td>
                  <td className="px-4 py-3"><StatusBadge label={m.reliabilityLevel} /></td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDateTime(m.lastUpdatedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {PUBLIC_AVAILABILITY_STATUSES.map((s) => (
                        <ProfessionalActionButton
                          key={s}
                          action="quick-availability"
                          label={s}
                          pharmacySlug={PHARMACY_SESSION_SLUG}
                          medicationName={m.medication}
                          entityId={m.id}
                          entityType="pharmacy-medication"
                          payload={{ availabilityStatus: s, reliabilityLevel: s === "À confirmer" ? "À vérifier" : "Confirmé", dataSource: "Saisie pharmacie" }}
                          onSuccess={() => void loadInventory()}
                          size="sm"
                          variant="outline"
                          className="h-8 border-brand/20 text-xs text-brand-dark"
                        >
                          {s}
                        </ProfessionalActionButton>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
          Prix indicatif, à confirmer auprès de la pharmacie. Le stock exact n’est jamais affiché côté utilisateur.
        </p>
      </Card>
    </div>
  );
}

function ImportInventory() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<ImportPreviewData | null>(null);
  const [selectedLineNumbers, setSelectedLineNumbers] = useState<Set<number>>(new Set());
  const [fileInputKey, setFileInputKey] = useState(0);
  const resetImport = (nextMessage = "Import réinitialisé.") => {
    setFile(null);
    setPreview(null);
    setSelectedLineNumbers(new Set());
    setMessage(nextMessage);
    setFileInputKey((key) => key + 1);
  };
  const previewImport = async () => {
    if (!file) {
      setMessage("Choisissez un fichier CSV, Excel, Word ou PowerPoint avant l’aperçu.");
      return;
    }
    setUploading(true);
    setMessage("");
    try {
      const form = new FormData();
      form.set("pharmacySlug", PHARMACY_SESSION_SLUG);
      form.set("file", file);
      const res = await fetch("/api/imports/preview", { method: "POST", headers: { "X-Sablin-Session-Kind": "pharmacy" }, body: form });
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
  const submitImport = async (mode: "publish_selected" | "draft") => {
    if (!file) {
      setMessage("Choisissez un fichier CSV, Excel, Word ou PowerPoint avant l’import.");
      return;
    }
    if (!preview) {
      setMessage("Analysez le fichier avant de valider. Vous pourrez retirer les produits à ne pas publier.");
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
        headers: { "Content-Type": "application/json", "X-Sablin-Session-Kind": "pharmacy" },
        body: JSON.stringify({
          pharmacySlug: PHARMACY_SESSION_SLUG,
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
      setFileInputKey((key) => key + 1);
      setPreview(data.report);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Import impossible.");
    } finally {
      setUploading(false);
    }
  };
  const uploadImport = async () => submitImport("publish_selected");
  const downloadTemplate = () => {
    downloadImportTemplate();
    setMessage("Modèle d’import téléchargé. Ouvrez-le dans Excel, remplissez les colonnes, puis importez le fichier.");
  };
  return (
    <Card className="border-border/70 p-5 shadow-card">
      <Heading level="h2">Importer mes médicaments</Heading>
      <Muted>
        Ajoutez vos médicaments depuis un fichier Excel, CSV, Word ou PowerPoint. Les produits reconnus et autorisés
        seront publiés automatiquement. Les médicaments interdits sont retirés automatiquement.
      </Muted>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {[
          ["1", "Choisir le fichier", "Importez votre liste avec nom, dosage, forme, prix et statut."],
          ["2", "Vérifier l’analyse", "Le moteur reconnaît les produits, prépare les images et signale les lignes à corriger."],
          ["3", "Publier", "Seuls les produits sûrs et autorisés alimentent la marketplace utilisateur."],
        ].map(([step, title, text]) => (
          <div key={step} className="rounded-xl border border-border bg-white p-4">
            <Badge className="border-0 bg-brand text-white">Étape {step}</Badge>
            <p className="mt-3 text-sm font-extrabold text-foreground">{title}</p>
            <p className="mt-1 text-xs font-semibold leading-relaxed text-muted-foreground">{text}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto]">
        <Input key={fileInputKey} type="file" accept=".csv,.xls,.xlsx,.docx,.pptx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setPreview(null); setSelectedLineNumbers(new Set()); setMessage(""); }} />
        <Button type="button" variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={previewImport} disabled={uploading || !file}>{uploading ? "Analyse..." : "Analyser le fichier"}</Button>
        <Button className="bg-brand text-white hover:bg-brand-dark" onClick={uploadImport} disabled={uploading || !preview}>{uploading ? "Publication..." : "Publier les produits autorisés"}</Button>
      </div>
      {message && <p className="mt-3 rounded-lg border border-border bg-white p-3 text-sm font-bold text-foreground">{message}</p>}
      {preview && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Lignes détectées" value={preview.totalRows} badge="Aperçu" />
          <Stat label="Lignes valides" value={preview.validRows} badge="Confirmé" />
          <Stat label="À corriger" value={preview.incompleteRows + preview.invalidRows} badge="À vérifier" />
          <Stat label="Médicaments non reconnus" value={preview.unknownMedications} badge="Admin" />
          <Stat label="Doublons" value={preview.duplicateRows} badge="Conflit" />
          <Stat label="Prix manquants" value={preview.missingPrices} badge="À compléter" />
          <Stat label="Statuts invalides" value={preview.invalidStatuses} badge="Normalisé" />
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
          onResetSelection={() => setSelectedLineNumbers(safePublishLineNumbers(preview))}
        />
      ) : null}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Button type="button" variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={downloadTemplate}>
          Télécharger modèle Excel
        </Button>
        <Button type="button" variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={previewImport} disabled={uploading || !file}>Analyser maintenant</Button>
        <Button type="button" variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={uploadImport} disabled={uploading || !preview}>Publier les produits autorisés</Button>
        <Button type="button" variant="outline" className="border-border text-foreground hover:bg-muted sm:col-span-3" onClick={() => resetImport()}>
          Réinitialiser l’import
        </Button>
      </div>
      <SectionBlock title="Colonnes recommandées" description="Plus votre fichier est complet, plus la publication automatique est fiable.">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {IMPORT_TEMPLATE_COLUMNS.map((column) => <div key={column} className="rounded-lg border border-border bg-white p-3 text-sm font-bold text-foreground">{column}</div>)}
        </div>
      </SectionBlock>
      {!preview && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {["Lignes valides", "Lignes en erreur", "Médicaments reconnus", "Médicaments non reconnus", "Doublons", "Prix manquants", "Statuts invalides", "Corrections avant validation"].map((item) => (
            <Card key={item} className="border-border/70 p-4">
              <StatusBadge label="Aperçu requis" />
              <p className="mt-3 text-sm font-bold text-foreground">{item}</p>
              <p className="text-xs font-medium text-muted-foreground">Disponible après analyse du fichier.</p>
            </Card>
          ))}
        </div>
      )}
      <p className="mt-4 rounded-xl border border-brand/20 bg-brand-light/50 p-4 text-sm font-semibold text-brand-dark">
        Statuts acceptés : Disponible, Stock faible, Rupture, À confirmer. La quantité interne aide la pharmacie, mais n’est jamais publiée.
      </p>
    </Card>
  );
}

function InventoryEnrichment() {
  const [data, setData] = useState<{
    rows?: Array<{ id: string; lineNumber: number; matchScore: number; matchLevel: string; status: string; medication?: { name: string } | null }>;
    images?: Array<{ id: string; url: string; validationStatus: string; sourceName: string; medication: { name: string } }>;
  }>({});
  const [message, setMessage] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [medicationId, setMedicationId] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/medication-enrichment?pharmacySlug=${PHARMACY_SESSION_SLUG}`, {
      headers: { "X-Sablin-Session-Kind": "pharmacy" },
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok) setData(json);
    else setMessage(json.error ?? "Chargement impossible.");
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const uploadPhoto = async () => {
    if (!photo || !medicationId.trim()) {
      setMessage("Choisissez une photo et renseignez l’identifiant du médicament référentiel.");
      return;
    }
    const form = new FormData();
    form.set("file", photo);
    form.set("pharmacySlug", PHARMACY_SESSION_SLUG);
    form.set("medicationId", medicationId.trim());
    const res = await fetch("/api/medication-enrichment/photo", {
      method: "POST",
      headers: { "X-Sablin-Session-Kind": "pharmacy" },
      body: form,
    });
    const json = await res.json().catch(() => ({}));
    setMessage(res.ok ? json.message : json.error ?? "Envoi impossible.");
    if (res.ok) {
      setPhoto(null);
      setMedicationId("");
      await load();
    }
  };

  return (
    <div className="space-y-5">
      <Card className="border-border/70 p-5 shadow-card">
        <Heading level="h2">Enrichissement de mon inventaire</Heading>
        <Muted>Vos confirmations améliorent le dossier, mais l’administration reste responsable de la validation des images, licences et descriptions globales.</Muted>
        {message && <p className="mt-3 rounded-lg border border-border bg-white p-3 text-sm font-bold text-foreground">{message}</p>}
      </Card>
      <SectionBlock title="Médicaments importés à enrichir" description="Les lignes ambiguës sont transmises à SABLIN PHARMA Admin.">
        <div className="grid gap-3 md:grid-cols-2">
          {(data.rows ?? []).slice(0, 10).map((row) => (
            <Card key={row.id} className="border-border/70 p-4">
              <div className="flex flex-wrap gap-2"><StatusBadge label={row.matchLevel} /><StatusBadge label={row.status} /></div>
              <p className="mt-2 font-bold text-foreground">Ligne {row.lineNumber} · Score {row.matchScore}/100</p>
              <p className="text-sm text-muted-foreground">{row.medication?.name ?? "Médicament à confirmer"}</p>
              <ProfessionalActionButton action="request-enrichment-correction" label="Demander correction" pharmacySlug={PHARMACY_SESSION_SLUG} className="mt-3 bg-brand text-white hover:bg-brand-dark">
                Demander correction
              </ProfessionalActionButton>
            </Card>
          ))}
          {(data.rows ?? []).length === 0 && <Card className="border-border/70 p-4 text-sm font-bold text-foreground">Aucune ligne d’enrichissement pour le moment.</Card>}
        </div>
      </SectionBlock>
      <SectionBlock title="Envoyer une photo réelle de médicament" description="Photo de face, dosage, conditionnement et fabricant visibles. Publication uniquement après validation admin.">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <Input value={medicationId} onChange={(event) => setMedicationId(event.target.value)} placeholder="Identifiant médicament référentiel" />
          <Input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setPhoto(event.target.files?.[0] ?? null)} />
          <Button className="bg-brand text-white hover:bg-brand-dark" onClick={uploadPhoto}>Envoyer photo</Button>
        </div>
      </SectionBlock>
      <SectionBlock title="Photos envoyées" description="Ces photos restent en attente tant que la source et la correspondance ne sont pas validées.">
        <div className="grid gap-3 md:grid-cols-2">
          {(data.images ?? []).slice(0, 6).map((image) => (
            <Card key={image.id} className="overflow-hidden border-border/70">
              <div className="h-36 bg-muted/30"><img src={image.url} alt={image.medication.name} className="h-full w-full object-cover" /></div>
              <div className="p-4">
                <StatusBadge label={image.validationStatus} />
                <p className="mt-2 font-bold text-foreground">{image.medication.name}</p>
                <p className="text-sm text-muted-foreground">Source : {image.sourceName}</p>
              </div>
            </Card>
          ))}
          {(data.images ?? []).length === 0 && <Card className="border-border/70 p-4 text-sm font-bold text-foreground">Aucune photo médicament envoyée.</Card>}
        </div>
      </SectionBlock>
    </div>
  );
}

function ConfirmationCenter() {
  const [filter, setFilter] = useState("Tous");
  const [query, setQuery] = useState("");
  const [requests, setRequests] = useState<ProfessionalRequestItem[]>([]);
  const [stats, setStats] = useState<RequestStats>({});
  const [responses, setResponses] = useState<Record<string, { availability: string; price: string; note: string }>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ pharmacySlug: PHARMACY_SESSION_SLUG, workflow: "confirmations" });
    if (filter !== "Tous") params.set("status", filter);
    if (query.trim()) params.set("q", query.trim());
    try {
      const res = await fetch(`/api/pharmacy-platform/user-requests?${params}`, { headers: { "X-Sablin-Session-Kind": "pharmacy" } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Chargement des confirmations impossible.");
      setRequests(data.requests ?? []);
      setStats(data.stats ?? {});
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Chargement des confirmations impossible.");
    } finally {
      setLoading(false);
    }
  }, [filter, query]);

  useEffect(() => {
    load();
  }, [load]);

  const respond = async (request: ProfessionalRequestItem, kind: "availability" | "price" | "full" | "rupture") => {
    const response = responses[request.reference] ?? { availability: "À confirmer", price: "", note: "" };
    const responseMessage = response.note.trim() || "Réponse confirmée par la pharmacie. Prix indicatif à confirmer auprès de la pharmacie.";
    const availabilityStatus = kind === "rupture" ? "Rupture" : response.availability;
    try {
      const res = await fetch("/api/pharmacy-platform/user-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Sablin-Session-Kind": "pharmacy" },
        body: JSON.stringify({
          reference: request.reference,
          pharmacySlug: PHARMACY_SESSION_SLUG,
          action: "respond",
          responseMessage,
          availabilityStatus,
          confirmedPrice: response.price ? Number(response.price) : null,
          updateInventory: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Réponse impossible.");
      setMessage(`Demande ${request.reference} traitée et synchronisée.`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Réponse impossible.");
    }
  };

  return (
    <div className="space-y-5">
      <Card className="border-border/70 p-5 shadow-card">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Heading level="h2">Confirmations pharmacie</Heading>
            <Muted className="mt-1">Confirmez disponibilité, prix indicatif et remarque avant déplacement. Chaque réponse améliore la donnée côté utilisateur.</Muted>
          </div>
          <div className="grid gap-2 sm:grid-cols-[180px_220px_auto]">
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher demande" className="bg-white" />
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
        <Stat label="Nouvelles confirmations" value={stats.new ?? 0} badge="Nouvelle" />
        <Stat label="À traiter" value={(stats.new ?? 0) + (stats.inProgress ?? 0)} badge="En cours" />
        <Stat label="Priorité haute" value={stats.highPriority ?? 0} badge="Priorité" />
        <Stat label="Synchronisées" value={stats.answered ?? 0} badge="Répondue" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {loading && <Card className="border-border/70 p-5 text-sm font-bold text-muted-foreground">Chargement des confirmations...</Card>}
        {!loading && requests.length === 0 && <Card className="border-dashed border-border p-8 text-center text-sm font-bold text-foreground">Aucune confirmation réelle dans ce filtre.</Card>}
        {requests.map((item) => {
          const latest = item.responses?.[0];
          const response = responses[item.reference] ?? { availability: latest?.availabilityStatus ?? "À confirmer", price: latest?.confirmedPrice ? String(latest.confirmedPrice) : "", note: latest?.responseMessage ?? "" };
          return (
            <Card key={item.id} className="border-border/70 p-4 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap gap-2"><StatusBadge label={item.status} /><StatusBadge label={item.priority} /></div>
                  <h3 className="mt-3 text-lg font-extrabold text-foreground">{item.medication?.name ?? item.serviceName}</h3>
                  <p className="text-sm font-medium text-muted-foreground">{[item.medication?.dosage ?? item.dosage, item.medication?.form ?? item.form].filter(Boolean).join(" · ") || "Information libre"} · Échéance : {formatDateTime(item.expiresAt)}</p>
                  <p className="mt-1 text-xs font-bold text-muted-foreground">{item.reference} · {item.creditCost} crédit{item.creditCost > 1 ? "s" : ""}</p>
                </div>
                <Price amount={item.fcfaEquivalent} size="sm" variant="brand" />
              </div>
              {item.userMessage && <p className="mt-4 rounded-lg border border-border bg-muted/30 p-3 text-sm font-semibold text-foreground">{item.userMessage}</p>}
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Field label="Prix indicatif confirmé" type="number" value={response.price} onChange={(value) => setResponses((current) => ({ ...current, [item.reference]: { ...response, price: value } }))} />
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Disponibilité confirmée</Label>
                  <select value={response.availability} onChange={(event) => setResponses((current) => ({ ...current, [item.reference]: { ...response, availability: event.target.value } }))} className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm font-bold text-foreground">
                    {PUBLIC_AVAILABILITY_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </div>
              </div>
              <Textarea value={response.note} onChange={(event) => setResponses((current) => ({ ...current, [item.reference]: { ...response, note: event.target.value } }))} className="mt-3 min-h-20 bg-white" placeholder="Remarque professionnelle pour l’utilisateur. Exemple : prix indicatif confirmé à 10h30." />
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <Button className="bg-brand text-white hover:bg-brand-dark" onClick={() => respond(item, "availability")}>
                  Confirmer disponible
                </Button>
                <Button variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={() => respond(item, "price")}>
                  Confirmer prix
                </Button>
                <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50" onClick={() => respond(item, "rupture")}>
                  Confirmer rupture
                </Button>
                <Button variant="outline" onClick={() => respond(item, "full")}>
                  Répondre avec remarque
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function AdviceCenter() {
  const [selectedTemplate, setSelectedTemplate] = useState("Les informations fournies sont indicatives et ne remplacent pas une consultation médicale.");
  const [requests, setRequests] = useState<ProfessionalRequestItem[]>([]);
  const [stats, setStats] = useState<RequestStats>({});
  const [filter, setFilter] = useState("Tous");
  const [priority, setPriority] = useState("all");
  const [query, setQuery] = useState("");
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ pharmacySlug: PHARMACY_SESSION_SLUG, workflow: "advice" });
    if (filter !== "Tous") params.set("status", filter);
    if (priority !== "all") params.set("priority", priority);
    if (query.trim()) params.set("q", query.trim());
    try {
      const res = await fetch(`/api/pharmacy-platform/user-requests?${params}`, { headers: { "X-Sablin-Session-Kind": "pharmacy" } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Chargement des conseils impossible.");
      setRequests(data.requests ?? []);
      setStats(data.stats ?? {});
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Chargement des conseils impossible.");
    } finally {
      setLoading(false);
    }
  }, [filter, priority, query]);

  useEffect(() => {
    load();
  }, [load]);

  const sendAdvice = async (request: ProfessionalRequestItem, text: string) => {
    const responseMessage = text.trim();
    if (responseMessage.length < 8) {
      setMessage("Ajoutez une réponse claire avant l’envoi.");
      return;
    }
    try {
      const res = await fetch("/api/pharmacy-platform/user-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Sablin-Session-Kind": "pharmacy" },
        body: JSON.stringify({
          reference: request.reference,
          pharmacySlug: PHARMACY_SESSION_SLUG,
          action: "respond",
          responseMessage,
          availabilityStatus: "À confirmer",
          updateInventory: false,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Envoi impossible.");
      setMessage(`Conseil transmis pour ${request.reference}.`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Envoi impossible.");
    }
  };

  const updateRequestStatus = async (request: ProfessionalRequestItem, action: "mark-received" | "take" | "accept") => {
    try {
      const res = await fetch("/api/pharmacy-platform/user-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Sablin-Session-Kind": "pharmacy" },
        body: JSON.stringify({
          reference: request.reference,
          pharmacySlug: PHARMACY_SESSION_SLUG,
          action,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Action impossible.");
      setMessage(`Demande ${request.reference} mise à jour : ${data.status}.`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Action impossible.");
    }
  };

  return (
    <div className="space-y-5">
      <Card className="border-border/70 p-5 shadow-card">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Heading level="h2">Conseils pharmacie</Heading>
            <Muted className="mt-1">Répondez aux demandes de conseil sans prescription, sans diagnostic et avec prudence professionnelle.</Muted>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge label="Responsabilité pharmacien" />
            <Button variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={load}>
              <RefreshCw className="size-4" /> Actualiser
            </Button>
          </div>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") load();
              }}
              placeholder="Rechercher une référence, un médicament ou un message"
              className="bg-white pl-9"
            />
          </div>
          <select value={filter} onChange={(event) => setFilter(event.target.value)} className="h-10 rounded-lg border border-border bg-white px-3 text-sm font-bold text-foreground">
              <option value="Tous">Tous les statuts</option>
              {REQUEST_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select value={priority} onChange={(event) => setPriority(event.target.value)} className="h-10 rounded-lg border border-border bg-white px-3 text-sm font-bold text-foreground">
            <option value="all">Toutes priorités</option>
            <option value="Haute">Haute</option>
            <option value="Normale">Normale</option>
            <option value="Basse">Basse</option>
          </select>
          <Button className="bg-brand text-white hover:bg-brand-dark" onClick={load}>
            <Filter className="size-4" /> Filtrer
          </Button>
        </div>
        {message && <p className="mt-3 rounded-lg border border-border bg-white p-3 text-sm font-bold text-foreground">{message}</p>}
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
          Les conseils fournis ne remplacent pas une consultation médicale. Le pharmacien reste responsable de ses réponses.
        </p>
      </Card>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Conseils reçus" value={stats.total ?? 0} badge="Conseil" />
        <Stat label="Nouveaux" value={stats.new ?? 0} badge="Nouvelle" />
        <Stat label="En cours" value={stats.inProgress ?? 0} badge="En cours" />
        <Stat label="Répondus" value={stats.answered ?? 0} badge="Répondue" />
        <Stat label="Priorité haute" value={stats.highPriority ?? 0} badge="Haute" />
        <Stat label="Expirés / annulés" value={stats.expired ?? 0} badge="À traiter" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3">
          {loading && <Card className="border-border/70 p-5 text-sm font-bold text-muted-foreground">Chargement des conseils...</Card>}
          {!loading && requests.length === 0 && <Card className="border-dashed border-border p-8 text-center text-sm font-bold text-foreground">Aucune demande de conseil réelle dans ce filtre.</Card>}
          {requests.map((item) => {
            const draft = responses[item.reference] ?? selectedTemplate;
            return (
            <Card key={item.id} className="border-border/70 p-4 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap gap-2"><StatusBadge label={item.status} /><StatusBadge label={item.priority} /><StatusBadge label={`${item.creditCost} crédits`} /></div>
                  <h3 className="mt-3 font-extrabold text-foreground">{item.serviceName}</h3>
                  <p className="text-sm font-medium text-muted-foreground">{item.user?.name ?? "Utilisateur"} · {item.medication?.name ?? "Question libre"} · {formatDateTime(item.createdAt)}</p>
                  <p className="mt-1 text-xs font-bold text-muted-foreground">Référence : {item.reference} · Expire : {formatDateTime(item.expiresAt)}</p>
                </div>
                <MessageCircle className="size-5 text-brand" />
              </div>
              {item.userMessage && <p className="mt-4 rounded-lg border border-border bg-muted/30 p-3 text-sm font-semibold text-foreground">{item.userMessage}</p>}
              {item.responses?.[0] && (
                <div className="mt-3 rounded-lg border border-brand/20 bg-brand-light/40 p-3 text-sm">
                  <p className="font-extrabold text-brand-dark">Dernière réponse envoyée</p>
                  <p className="mt-1 font-medium text-foreground">{item.responses[0].responseMessage}</p>
                  <p className="mt-1 text-xs font-bold text-muted-foreground">{formatDateTime(item.responses[0].createdAt)}</p>
                </div>
              )}
              <Textarea className="mt-4 min-h-24 bg-white" value={draft} onChange={(event) => setResponses((current) => ({ ...current, [item.reference]: event.target.value }))} />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={() => updateRequestStatus(item, "mark-received")}>
                  Marquer reçue
                </Button>
                <Button variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={() => updateRequestStatus(item, "take")}>
                  Prendre en charge
                </Button>
                <Button className="bg-brand text-white hover:bg-brand-dark" onClick={() => sendAdvice(item, draft)}>
                  <Send className="size-4" /> Envoyer conseil
                </Button>
                <Button variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-50" onClick={() => sendAdvice(item, "Orientation vers un professionnel de santé recommandée. Les informations fournies ne remplacent pas une consultation médicale.")}>
                  Orienter médecin
                </Button>
              </div>
            </Card>
            );
          })}
        </div>
        <SectionBlock title="Modèles de réponse sûrs" description="Utilisez des formulations neutres, courtes et prudentes.">
          <div className="grid gap-2">
            {[
              "Veuillez confirmer avec le pharmacien sur place avant tout achat.",
              "SABLIN PHARMA ne remplace pas un professionnel de santé.",
              "Si les symptômes persistent, consultez un médecin.",
              "Le prix indiqué reste indicatif et peut varier.",
              "Cette réponse est une orientation générale et ne constitue pas une prescription.",
            ].map((template) => (
              <button key={template} type="button" onClick={() => setSelectedTemplate(template)} className="rounded-lg border border-border bg-white p-3 text-left text-sm font-bold text-foreground hover:border-brand/40">
                {template}
              </button>
            ))}
          </div>
        </SectionBlock>
        <SectionBlock title="Workflow conseillé" description="Un conseil utilisateur doit rester court, sûr et historisé.">
          <div className="grid gap-2 text-sm font-semibold text-foreground">
            {[
              "Lire la demande et vérifier le médicament concerné.",
              "Marquer reçue puis prendre en charge si une réponse est possible.",
              "Utiliser un modèle prudent ou rédiger une réponse validée par le pharmacien.",
              "Orienter vers un professionnel de santé si la question dépasse le cadre de conseil.",
            ].map((step) => (
              <div key={step} className="flex gap-2 rounded-lg border border-border bg-muted/20 p-3">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand" />
                <span>{step}</span>
              </div>
            ))}
          </div>
        </SectionBlock>
      </div>
    </div>
  );
}

function HistoryCenter() {
  const [filter, setFilter] = useState("Tous");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [stats, setStats] = useState<{ total?: number; success?: number; review?: number; imports?: number }>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ pharmacySlug: PHARMACY_SESSION_SLUG });
    if (filter === "Réussi" || filter === "À vérifier") params.set("status", filter.toLowerCase() === "réussi" ? "réussi" : "à vérifier");
    if (filter === "Import pharmacie" || filter === "Demande utilisateur") params.set("source", filter);
    if (query.trim()) params.set("q", query.trim());
    try {
      const res = await fetch(`/api/pharmacy-platform/history?${params}`, { headers: { "X-Sablin-Session-Kind": "pharmacy" } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Chargement de l’historique impossible.");
      setRows(data.rows ?? []);
      setStats(data.stats ?? {});
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Chargement de l’historique impossible.");
    } finally {
      setLoading(false);
    }
  }, [filter, query]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-5">
      <Card className="border-border/70 p-5 shadow-card">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Heading level="h2">Historique de ma pharmacie</Heading>
            <Muted>Chaque modification sensible est historisée avec auteur, source, ancienne valeur, nouvelle valeur et statut.</Muted>
          </div>
          <div className="flex flex-wrap gap-2">
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher dans l’historique" className="h-9 w-full bg-white sm:w-64" />
            {["Tous", "Réussi", "À vérifier", "Import pharmacie", "Demande utilisateur"].map((item) => (
              <Button key={item} size="sm" variant={filter === item ? "default" : "outline"} className={filter === item ? "bg-brand text-white hover:bg-brand-dark" : "border-brand/30 text-brand-dark hover:bg-brand-light"} onClick={() => setFilter(item)}>
                <Filter className="size-4" /> {item}
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
        <Stat label="Imports" value={stats.imports ?? 0} badge="Import pharmacie" />
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-white">
        <div className="hidden grid-cols-[150px_1fr_150px_170px_1fr_1fr_110px] gap-0 bg-muted/40 px-4 py-3 text-xs font-extrabold uppercase text-muted-foreground lg:grid">
          <span>Date</span><span>Action</span><span>Auteur</span><span>Source</span><span>Ancienne valeur</span><span>Nouvelle valeur</span><span>Statut</span>
        </div>
        <div className="divide-y divide-border">
          {loading && <div className="p-4 text-sm font-bold text-muted-foreground">Chargement de l’historique réel...</div>}
          {!loading && rows.length === 0 && <div className="p-8 text-center text-sm font-bold text-foreground">Aucune action journalisée dans ce filtre.</div>}
          {rows.map((item) => (
            <div key={item.id} className="grid gap-3 p-4 text-sm lg:grid-cols-[150px_1fr_150px_170px_1fr_1fr_110px] lg:items-center">
              <p className="font-bold text-foreground">{formatDateTime(item.date)}</p>
              <p className="font-extrabold text-foreground">{item.action}</p>
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

function NotificationsCenter() {
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [platformEnabled, setPlatformEnabled] = useState(true);
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [filter, setFilter] = useState("all");
  const [items, setItems] = useState<PharmacyNotification[]>([]);
  const [stats, setStats] = useState<{ total?: number; unread?: number; critical?: number; archived?: number }>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ pharmacySlug: PHARMACY_SESSION_SLUG });
    if (filter !== "all") params.set("status", filter);
    try {
      const res = await fetch(`/api/pharmacy-platform/notifications?${params}`, { headers: { "X-Sablin-Session-Kind": "pharmacy" } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Chargement des notifications impossible.");
      setItems(data.notifications ?? []);
      setStats(data.stats ?? {});
      setPlatformEnabled(Boolean(data.preferences?.platformEnabled ?? true));
      setEmailEnabled(Boolean(data.preferences?.emailEnabled ?? true));
      setCriticalOnly(Boolean(data.preferences?.criticalOnly ?? false));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Chargement des notifications impossible.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const savePreferences = async () => {
    try {
      const res = await fetch("/api/pharmacy-platform/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Sablin-Session-Kind": "pharmacy" },
        body: JSON.stringify({ pharmacySlug: PHARMACY_SESSION_SLUG, emailEnabled, platformEnabled, criticalOnly }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Enregistrement impossible.");
      setMessage("Préférences notifications enregistrées.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Enregistrement impossible.");
    }
  };

  const updateNotification = async (notificationId: string, action: "read" | "archive") => {
    try {
      const res = await fetch("/api/pharmacy-platform/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Sablin-Session-Kind": "pharmacy" },
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
      <Card className="border-border/70 p-5 shadow-card">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Heading level="h2">Notifications pharmacie</Heading>
            <Muted className="mt-1">Suivez les demandes, confirmations, imports, données anciennes et alertes de sécurité de votre pharmacie.</Muted>
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={filter} onChange={(event) => setFilter(event.target.value)} className="h-10 rounded-lg border border-border bg-white px-3 text-sm font-bold text-foreground">
              <option value="all">Toutes</option>
              <option value="non_lue">Non lues</option>
              <option value="lue">Lues</option>
              <option value="archivée">Archivées</option>
            </select>
            <Button variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={load}>Actualiser</Button>
          </div>
        </div>
        {message && <p className="mt-3 rounded-lg border border-border bg-white p-3 text-sm font-bold text-foreground">{message}</p>}
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Notifications" value={stats.total ?? items.length} badge="Plateforme" />
          <Stat label="Non lues" value={stats.unread ?? 0} badge="non_lue" />
          <Stat label="Critiques" value={stats.critical ?? 0} badge="Alerte" />
          <Stat label="Archivées" value={stats.archived ?? 0} badge="archivée" />
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <label className="rounded-xl border border-border bg-white p-4">
            <input type="checkbox" checked={platformEnabled} onChange={(event) => setPlatformEnabled(event.target.checked)} className="mr-2" />
            <span className="font-bold text-foreground">Notifications plateforme</span>
            <p className="mt-1 text-sm text-muted-foreground">Visible dans l’espace pharmacie.</p>
          </label>
          <label className="rounded-xl border border-border bg-white p-4">
            <input type="checkbox" checked={emailEnabled} onChange={(event) => setEmailEnabled(event.target.checked)} className="mr-2" />
            <span className="font-bold text-foreground">Alertes e-mail</span>
            <p className="mt-1 text-sm text-muted-foreground">Pour demandes et sécurité.</p>
          </label>
          <label className="rounded-xl border border-border bg-white p-4">
            <input type="checkbox" checked={criticalOnly} onChange={(event) => setCriticalOnly(event.target.checked)} className="mr-2" />
            <span className="font-bold text-foreground">Urgences uniquement</span>
            <p className="mt-1 text-sm text-muted-foreground">Réduit les notifications secondaires.</p>
          </label>
        </div>
        <Button onClick={savePreferences} className="mt-4 bg-brand text-white hover:bg-brand-dark">
          <Save className="size-4" /> Enregistrer les préférences
        </Button>
      </Card>
      <div className="grid gap-3 md:grid-cols-2">
        {loading && <Card className="border-border/70 p-5 text-sm font-bold text-muted-foreground">Chargement des notifications...</Card>}
        {!loading && items.length === 0 && <Card className="border-dashed border-border p-8 text-center text-sm font-bold text-foreground">Aucune notification réelle dans ce filtre.</Card>}
        {items.map((item) => (
          <Card key={item.id} className="border-border/70 p-4 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap gap-2"><StatusBadge label={item.type} /><StatusBadge label={item.status} /></div>
                <h3 className="mt-3 font-extrabold text-foreground">{item.title}</h3>
                <p className="mt-1 text-sm font-medium text-muted-foreground">{item.message}</p>
                <p className="mt-2 text-xs font-bold text-muted-foreground">{formatDateTime(item.createdAt)}</p>
              </div>
              <Bell className="size-5 text-brand" />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => updateNotification(item.id, "read")}>
                <Eye className="size-4" /> Marquer lu
              </Button>
              <Button size="sm" variant="outline" onClick={() => updateNotification(item.id, "archive")}>
                <Archive className="size-4" /> Archiver
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Profile() {
  const [profile, setProfile] = useState<PharmacyProfileData | null>(null);
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
  const [services, setServices] = useState<string[]>(["Pharmacie de garde", "Paiement mobile", "Conseil pharmaceutique"]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [message, setMessage] = useState("");

  const updateProfileField = (key: string, value: string) => {
    setProfileForm((current) => ({ ...current, [key]: value }));
  };

  const loadProfile = useCallback(async () => {
    setLoadingProfile(true);
    try {
      const res = await fetch(`/api/pharmacy-platform/profile?pharmacySlug=${encodeURIComponent(PHARMACY_SESSION_SLUG)}`, {
        headers: { "X-Sablin-Session-Kind": "pharmacy" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Chargement du profil impossible.");
      const loaded = data.profile as PharmacyProfileData;
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
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const toggleService = (service: string) => {
    setServices((current) => (current.includes(service) ? current.filter((item) => item !== service) : [...current, service]));
  };

  const saveProfile = async () => {
    try {
      const res = await fetch("/api/pharmacy-platform/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Sablin-Session-Kind": "pharmacy" },
        body: JSON.stringify({ pharmacySlug: PHARMACY_SESSION_SLUG, ...profileForm, services }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Enregistrement impossible.");
      setProfile(data.profile);
      setMessage("Profil pharmacie enregistré et journalisé.");
      await loadProfile();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Enregistrement impossible.");
    }
  };

  return (
    <div className="space-y-5">
      <Card className="border-border/70 p-5 shadow-card">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Heading level="h2">Profil pharmacie</Heading>
            <Muted className="mt-1">Complétez les données publiques et internes qui alimentent SABLIN PHARMA Utilisateur après validation.</Muted>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge label={profile?.accountStatus ?? "Chargement"} />
            <StatusBadge label={profile?.dataQuality ?? "Données à vérifier"} />
            <StatusBadge label="Contact verrouillé côté utilisateur" />
          </div>
        </div>
        {message && <p className="mt-3 rounded-lg border border-border bg-white p-3 text-sm font-bold text-foreground">{message}</p>}
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Score complétude profil" value={loadingProfile ? "..." : `${profile?.completenessScore ?? 0}%`} badge="Dossier pharmacie" />
          <Stat label="Photos chargées" value={loadingProfile ? "..." : profile?.mediaCount ?? 0} badge="Validation requise" />
          <Stat label="Services actifs" value={services.length} badge="Profil utilisateur" />
          <Stat label="Médicaments rattachés" value={loadingProfile ? "..." : profile?.medicationCount ?? 0} badge="Inventaire" />
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/70 p-5 shadow-card">
          <h3 className="text-base font-extrabold text-foreground">Identification officielle</h3>
          <p className="mt-1 text-sm font-medium text-muted-foreground">Ces données créent la fiche officielle. Les contacts restent protégés par crédits côté utilisateur.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Field label="Nom de la pharmacie" placeholder="Pharmacie Sainte Marie Cocody" value={profileForm.name} onChange={(value) => updateProfileField("name", value)} />
            <Field label="Nom du pharmacien responsable" placeholder="Dr Awa N’Guessan" value={profileForm.managerName} onChange={(value) => updateProfileField("managerName", value)} />
            <Field label="Fonction du responsable" placeholder="Pharmacien responsable" value={profileForm.managerRole} onChange={(value) => updateProfileField("managerRole", value)} />
            <Field label="Téléphone professionnel" placeholder="+225 07 00 00 00 00" value={profileForm.phone} onChange={(value) => updateProfileField("phone", value)} />
            <Field label="WhatsApp professionnel" placeholder="+225 05 00 00 00 00" value={profileForm.whatsapp} onChange={(value) => updateProfileField("whatsapp", value)} />
            <Field label="Email professionnel" placeholder="contact@pharmacie.ci" value={profileForm.professionalEmail} onChange={(value) => updateProfileField("professionalEmail", value)} />
            <Field label="Numéro d’autorisation / agrément" placeholder="AGR-CI-..." value={profileForm.authorizationNumber} onChange={(value) => updateProfileField("authorizationNumber", value)} />
            <Field label="Description courte" placeholder="Pharmacie de proximité à Cocody." value={profileForm.description} onChange={(value) => updateProfileField("description", value)} />
          </div>
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
            Même renseignés ici, le téléphone, WhatsApp et l’email direct ne sont jamais affichés gratuitement côté utilisateur.
          </p>
        </Card>

        <Card className="border-border/70 p-5 shadow-card">
          <h3 className="text-base font-extrabold text-foreground">Localisation & repères</h3>
          <p className="mt-1 text-sm font-medium text-muted-foreground">Ces informations alimentent les pharmacies proches, par commune et les itinéraires.</p>
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
        <Button onClick={saveProfile} className="mt-4 w-full bg-brand text-white hover:bg-brand-dark sm:w-auto">
          <Save className="size-4" /> Enregistrer le profil
        </Button>
      </Card>

      <ImageRules />
      <DataVisibilityBlocks />
    </div>
  );
}

function Schedule() {
  const [schedule, setSchedule] = useState<Record<string, DaySchedule>>(defaultSchedule);
  const [dutyEnabled, setDutyEnabled] = useState(true);
  const [dutyStart, setDutyStart] = useState("2026-06-19T20:00");
  const [dutyEnd, setDutyEnd] = useState("2026-06-20T08:00");
  const [exceptionalClosureStart, setExceptionalClosureStart] = useState("");
  const [exceptionalClosureEnd, setExceptionalClosureEnd] = useState("");
  const [exceptionalOpeningMessage, setExceptionalOpeningMessage] = useState("");
  const [specialMessage, setSpecialMessage] = useState("Pharmacie de garde cette nuit. Confirmez avant tout déplacement.");
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [message, setMessage] = useState("");

  const loadSchedule = useCallback(async () => {
    setLoadingSchedule(true);
    try {
      const res = await fetch(`/api/pharmacy-platform/schedule?pharmacySlug=${encodeURIComponent(PHARMACY_SESSION_SLUG)}`, {
        headers: { "X-Sablin-Session-Kind": "pharmacy" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Chargement des horaires impossible.");
      setSchedule({ ...defaultSchedule, ...(data.schedule ?? {}) });
      setDutyEnabled(Boolean(data.duty?.enabled));
      setDutyStart(toDateTimeInput(data.duty?.start, "2026-06-19T20:00"));
      setDutyEnd(toDateTimeInput(data.duty?.end, "2026-06-20T08:00"));
      setExceptionalClosureStart(toDateTimeInput(data.exceptions?.closureStart));
      setExceptionalClosureEnd(toDateTimeInput(data.exceptions?.closureEnd));
      setExceptionalOpeningMessage(data.exceptions?.openingMessage || "");
      setSpecialMessage(data.duty?.message || "");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Chargement des horaires impossible.");
    } finally {
      setLoadingSchedule(false);
    }
  }, []);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  const updateDay = (dayKey: string, patch: Partial<DaySchedule>) => {
    setSchedule((current) => ({
      ...current,
      [dayKey]: {
        ...current[dayKey],
        ...patch,
      },
    }));
  };

  const saveSchedule = async () => {
    setSavingSchedule(true);
    try {
      const res = await fetch(`/api/pharmacy-platform/schedule?pharmacySlug=${encodeURIComponent(PHARMACY_SESSION_SLUG)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Sablin-Session-Kind": "pharmacy" },
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
      setSchedule({ ...defaultSchedule, ...(data.schedule ?? {}) });
      setDutyEnabled(Boolean(data.duty?.enabled));
      setDutyStart(toDateTimeInput(data.duty?.start, dutyStart));
      setDutyEnd(toDateTimeInput(data.duty?.end, dutyEnd));
      setExceptionalClosureStart(toDateTimeInput(data.exceptions?.closureStart));
      setExceptionalClosureEnd(toDateTimeInput(data.exceptions?.closureEnd));
      setExceptionalOpeningMessage(data.exceptions?.openingMessage || "");
      setSpecialMessage(data.duty?.message || specialMessage);
      setMessage(data?.message ?? "Horaires, garde et exceptions synchronisés.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Enregistrement impossible.");
    } finally {
      setSavingSchedule(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card className="border-border/70 p-5 shadow-card">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Heading level="h2">Horaires & garde</Heading>
            <Muted className="mt-1">Configurez les jours, heures, pauses, gardes et exceptions qui alimentent les pharmacies ouvertes ou de garde côté utilisateur.</Muted>
          </div>
          <div className="flex flex-wrap gap-2">
            {PHARMACY_OPERATION_STATUSES.map((status) => <StatusBadge key={status} label={status} />)}
          </div>
        </div>
        {message && <p className="mt-3 rounded-lg border border-border bg-white p-3 text-sm font-bold text-foreground">{message}</p>}
      </Card>

      <Card className="border-border/70 p-5 shadow-card">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-extrabold text-foreground">Planning hebdomadaire</h3>
            <p className="text-sm font-medium text-muted-foreground">Chaque ligne reste lisible sur mobile et se transforme en grille complète sur ordinateur.</p>
          </div>
          <StatusBadge label="Synchronisé utilisateur après validation" />
        </div>
        {loadingSchedule && <p className="mt-4 rounded-lg border border-border bg-muted/30 p-3 text-sm font-bold text-muted-foreground">Chargement du planning enregistré...</p>}
        <div className="mt-4 space-y-3">
          {WEEK_DAYS.map((day) => {
            const item = schedule[day.key];
            return (
              <Card key={day.key} className="border-border/70 bg-white p-4">
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
                  <Field label="Ouverture" type="time" value={item.open} onChange={(value) => updateDay(day.key, { open: value })} />
                  <Field label="Fermeture" type="time" value={item.close} onChange={(value) => updateDay(day.key, { close: value })} />
                  <Field label="Début pause" type="time" value={item.breakStart} onChange={(value) => updateDay(day.key, { breakStart: value })} />
                  <Field label="Fin pause" type="time" value={item.breakEnd} onChange={(value) => updateDay(day.key, { breakEnd: value })} />
                  <div className="flex lg:justify-end">
                    <StatusBadge label={item.enabled ? item.status : "Fermé"} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <Card className="border-border/70 p-5 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-foreground">Garde, exceptions et message spécial</h3>
              <p className="text-sm font-medium text-muted-foreground">Les gardes alimentent directement les pharmacies de garde. Les exceptions évitent les mauvaises orientations.</p>
            </div>
            <StatusBadge label={dutyEnabled ? "De garde" : "Fermé"} />
          </div>
          <label className="mt-4 flex items-center gap-3 rounded-xl border border-brand/20 bg-brand-light/50 p-3 text-sm font-extrabold text-brand-dark">
            <input type="checkbox" checked={dutyEnabled} onChange={(event) => setDutyEnabled(event.target.checked)} className="size-4 accent-brand" />
            Activer le statut pharmacie de garde
          </label>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Début de garde" type="datetime-local" value={dutyStart} onChange={setDutyStart} />
            <Field label="Fin de garde" type="datetime-local" value={dutyEnd} onChange={setDutyEnd} />
            <Field label="Début fermeture exceptionnelle" type="datetime-local" value={exceptionalClosureStart} onChange={setExceptionalClosureStart} />
            <Field label="Fin fermeture exceptionnelle" type="datetime-local" value={exceptionalClosureEnd} onChange={setExceptionalClosureEnd} />
          </div>
          <Label className="mt-4 block text-xs font-bold text-foreground">Ouverture exceptionnelle ou précision horaire</Label>
          <Textarea
            value={exceptionalOpeningMessage}
            onChange={(event) => setExceptionalOpeningMessage(event.target.value)}
            className="mt-2 min-h-20 bg-white"
            placeholder="Exemple : ouverture exceptionnelle dimanche 08:00 - 14:00, service limité au comptoir."
          />
          <Label className="mt-4 block text-xs font-bold text-foreground">Message spécial visible si validé</Label>
          <Textarea value={specialMessage} onChange={(event) => setSpecialMessage(event.target.value)} className="mt-2 min-h-24 bg-white" />
          <Button
            onClick={saveSchedule}
            disabled={savingSchedule || loadingSchedule}
            className="mt-4 w-full bg-brand text-white hover:bg-brand-dark sm:w-auto"
          >
            {savingSchedule ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Enregistrer horaires, garde et exceptions
          </Button>
        </Card>

        <SectionBlock title="Règles de publication" description="Ce qui est publié côté utilisateur reste contrôlé.">
          <div className="grid gap-3">
            {[
              ["Ouvert / fermé", "Calculé depuis les horaires et exceptions validées."],
              ["De garde", "Affiché si la période de garde est active et vérifiée."],
              ["Horaires à confirmer", "Utilisé si les données sont anciennes ou incohérentes."],
              ["Message spécial", "Visible uniquement s’il est utile, clair et non confidentiel."],
            ].map(([title, text]) => (
              <div key={title} className="rounded-lg border border-border bg-white p-3">
                <p className="font-extrabold text-foreground">{title}</p>
                <p className="text-sm font-medium text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </SectionBlock>
      </div>
    </div>
  );
}

function TeamManagement() {
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [role, setRole] = useState("PHARMACY_EMPLOYEE");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(["pharmacy.inventory.update", "pharmacy.requests.respond", "pharmacy.history.read"]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState("PHARMACY_EMPLOYEE");
  const [editPermissions, setEditPermissions] = useState<string[]>([]);

  const loadTeam = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/professional/team?pharmacySlug=${encodeURIComponent(PHARMACY_SESSION_SLUG)}`, {
        headers: { "X-Sablin-Session-Kind": "pharmacy" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Chargement de l’équipe impossible.");
      setMembers(data.members ?? []);
      setInvitations(data.invitations ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Chargement de l’équipe impossible.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  const togglePermission = (permission: string) => {
    setSelectedPermissions((current) =>
      current.includes(permission) ? current.filter((item) => item !== permission) : [...current, permission]
    );
  };

  const toggleEditPermission = (permission: string) => {
    setEditPermissions((current) =>
      current.includes(permission) ? current.filter((item) => item !== permission) : [...current, permission]
    );
  };

  const beginEditMember = (member: TeamMember) => {
    setEditingMemberId(member.id);
    setEditRole(member.role);
    setEditPermissions(member.permissions.length ? member.permissions : []);
    setMessage("");
  };

  const inviteMember = async () => {
    setMessage("");
    const isEmail = identifier.includes("@");
    try {
      const res = await fetch("/api/professional/team", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Sablin-Session-Kind": "pharmacy" },
        body: JSON.stringify({
          pharmacySlug: PHARMACY_SESSION_SLUG,
          name,
          email: isEmail ? identifier : "",
          phone: isEmail ? "" : identifier,
          role,
          permissions: selectedPermissions,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Invitation impossible.");
      setMessage(`Invitation créée. Jeton temporaire : ${data.activationTokenPreview ?? "envoyé par canal sécurisé"}`);
      setName("");
      setIdentifier("");
      setSelectedPermissions(["pharmacy.inventory.update", "pharmacy.requests.respond", "pharmacy.history.read"]);
      await loadTeam();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Invitation impossible.");
    }
  };

  const updateMember = async (member: TeamMember, nextStatus?: string, nextRole = member.role, nextPermissions = member.permissions) => {
    try {
      const res = await fetch("/api/professional/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Sablin-Session-Kind": "pharmacy" },
        body: JSON.stringify({
          membershipId: member.id,
          role: nextRole,
          permissions: nextPermissions,
          status: nextStatus ?? member.status,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Modification impossible.");
      setMessage(nextStatus === "Révoqué" ? "Accès révoqué et journalisé." : "Rôle et permissions mis à jour.");
      setEditingMemberId(null);
      await loadTeam();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Modification impossible.");
    }
  };

  const updateInvitation = async (invitationId: string, status: "Annulée" | "Renvoyée") => {
    try {
      const res = await fetch("/api/professional/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Sablin-Session-Kind": "pharmacy" },
        body: JSON.stringify({ invitationId, status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Mise à jour de l’invitation impossible.");
      setMessage(status === "Renvoyée" ? "Invitation renvoyée avec un nouveau délai." : "Invitation annulée.");
      await loadTeam();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Mise à jour de l’invitation impossible.");
    }
  };

  return (
    <div className="space-y-5">
      <Card className="border-border/70 p-5 shadow-card">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Heading level="h2">Équipe de la pharmacie</Heading>
            <Muted className="mt-1">Invitez les employés, attribuez des permissions précises et gardez une trace des accès sans exposer les données d’autres pharmacies.</Muted>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge label="Accès limité à ma pharmacie" />
            <StatusBadge label="Session pharmacie séparée" />
          </div>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-border/70 p-5 shadow-card">
          <h3 className="text-base font-extrabold text-foreground">Inviter un membre</h3>
          <p className="mt-1 text-sm font-medium text-muted-foreground">L’employé recevra un accès limité. Il choisira son mot de passe via un lien temporaire.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Nom de l’employé" placeholder="Exemple : Aminata Koné" value={name} onChange={setName} />
            <Field label="Email ou téléphone" placeholder="email@pharmacie.ci ou +225..." value={identifier} onChange={setIdentifier} />
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-bold text-foreground">Rôle</Label>
              <select value={role} onChange={(event) => setRole(event.target.value)} className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm font-bold text-foreground">
                <option value="PHARMACY_OWNER">Pharmacien responsable</option>
                <option value="PHARMACIST_MANAGER">Responsable pharmacie</option>
                <option value="PHARMACY_EMPLOYEE">Employé pharmacie</option>
                <option value="PHARMACY_STOCK_MANAGER">Assistant stock</option>
                <option value="PHARMACY_SUPPORT_AGENT">Agent demandes et conseils</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <Label className="text-xs font-bold text-foreground">Permissions</Label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {teamPermissions.map((permission) => (
                <label key={permission.key} className="flex items-start gap-2 rounded-lg border border-border bg-white p-3 text-sm font-bold text-foreground">
                  <input type="checkbox" checked={selectedPermissions.includes(permission.key)} onChange={() => togglePermission(permission.key)} className="mt-0.5 size-4 accent-brand" />
                  <span>{permission.label}</span>
                </label>
              ))}
            </div>
          </div>
          {message && <p className="mt-4 rounded-lg border border-border bg-white p-3 text-sm font-bold text-foreground">{message}</p>}
          <Button onClick={inviteMember} className="mt-4 w-full bg-brand text-white hover:bg-brand-dark sm:w-auto">
            <UserPlus className="size-4" /> Envoyer l’invitation
          </Button>
        </Card>

        <SectionBlock title="Matrice d’accès" description="Les permissions restent internes à cette pharmacie.">
          <div className="grid gap-3">
            {[
              ["Pharmacien responsable", "Peut gérer le profil, les horaires, l’équipe, l’inventaire et les demandes."],
              ["Employé pharmacie", "Peut mettre à jour les disponibilités et répondre aux demandes si autorisé."],
              ["Assistant stock", "Peut importer ou corriger l’inventaire, sans modifier les identifiants."],
              ["Gestionnaire horaires", "Peut ajuster horaires, gardes et exceptions sans accès aux contacts globaux."],
            ].map(([title, text]) => (
              <div key={title} className="rounded-lg border border-border bg-white p-3">
                <p className="font-extrabold text-foreground">{title}</p>
                <p className="text-sm font-medium text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </SectionBlock>
      </div>

      <Card className="border-border/70 p-5 shadow-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-extrabold text-foreground">Membres, invitations et accès</h3>
            <p className="text-sm font-medium text-muted-foreground">Chaque action est journalisée. Le dernier responsable actif reste protégé.</p>
          </div>
          <Users className="size-5 text-brand" />
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {loading && <Card className="border-border/70 p-4 text-sm font-bold text-muted-foreground">Chargement des membres...</Card>}
          {!loading && members.length === 0 && <Card className="border-dashed border-border p-4 text-sm font-bold text-foreground">Aucun membre actif trouvé.</Card>}
          {members.map((member) => (
            <Card key={member.id} className="border-border/70 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-extrabold text-foreground">{member.name}</p>
                  <p className="text-sm font-medium text-muted-foreground">{member.role} · Dernière connexion : {formatDateTime(member.lastLoginAt)}</p>
                  <p className="text-xs font-bold text-muted-foreground">{member.email ?? member.phone ?? "Contact non renseigné"}</p>
                </div>
                <StatusBadge label={member.status} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(member.permissions.length ? member.permissions : ["Permissions héritées du rôle"]).map((permission) => <StatusBadge key={permission} label={permissionLabel(permission)} />)}
              </div>
              {editingMemberId === member.id && (
                <div className="mt-4 rounded-xl border border-brand/20 bg-brand-light/40 p-3">
                  <div className="grid gap-3 sm:grid-cols-[0.85fr_1.15fr]">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-foreground">Rôle mis à jour</Label>
                      <select value={editRole} onChange={(event) => setEditRole(event.target.value)} className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm font-bold text-foreground">
                        <option value="PHARMACY_OWNER">Pharmacien responsable</option>
                        <option value="PHARMACIST_MANAGER">Responsable pharmacie</option>
                        <option value="PHARMACY_EMPLOYEE">Employé pharmacie</option>
                        <option value="PHARMACY_STOCK_MANAGER">Assistant stock</option>
                        <option value="PHARMACY_SUPPORT_AGENT">Agent demandes et conseils</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-foreground">Permissions précises</Label>
                      <div className="mt-2 grid gap-2">
                        {teamPermissions.map((permission) => (
                          <label key={permission.key} className="flex items-start gap-2 rounded-lg border border-border bg-white p-2 text-xs font-bold text-foreground">
                            <input type="checkbox" checked={editPermissions.includes(permission.key)} onChange={() => toggleEditPermission(permission.key)} className="mt-0.5 size-4 accent-brand" />
                            <span>{permission.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" className="bg-brand text-white hover:bg-brand-dark" onClick={() => updateMember(member, member.status, editRole, editPermissions)}>Enregistrer</Button>
                    <Button size="sm" variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={() => setEditingMemberId(null)}>Annuler</Button>
                  </div>
                </div>
              )}
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <Button size="sm" variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={() => beginEditMember(member)}>Modifier rôle</Button>
                <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-50" onClick={() => updateMember(member, "Révoqué")}>Révoquer</Button>
              </div>
            </Card>
          ))}
        </div>
        {invitations.length > 0 && (
          <div className="mt-5 border-t border-border pt-4">
            <h4 className="font-extrabold text-foreground">Invitations en attente</h4>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {invitations.map((invitation) => (
                <Card key={invitation.id} className="border-border/70 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-extrabold text-foreground">{invitation.name}</p>
                      <p className="text-sm font-medium text-muted-foreground">{invitation.role} · Expire : {formatDateTime(invitation.expiresAt)}</p>
                      <p className="text-xs font-bold text-muted-foreground">{invitation.email ?? invitation.phone ?? "Contact non renseigné"}</p>
                    </div>
                    <StatusBadge label={invitation.status} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(invitation.permissions.length ? invitation.permissions : ["Permissions héritées du rôle"]).map((permission) => <StatusBadge key={permission} label={permissionLabel(permission)} />)}
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <Button size="sm" variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={() => updateInvitation(invitation.id, "Renvoyée")}>Renvoyer</Button>
                    <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-50" onClick={() => updateInvitation(invitation.id, "Annulée")}>Annuler</Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
          Les accès équipe ne donnent jamais accès à l’espace Admin, aux autres pharmacies ou aux transactions globales.
        </p>
      </Card>
    </div>
  );
}

function ProfessionalAccountSettings() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [snapshot, setSnapshot] = useState<PharmacySettingsSnapshot | null>(null);
  const [workspaceSettings, setWorkspaceSettings] = useState<PharmacyWorkspaceSettings>({
    autoPublishSafeInventory: true,
    requireManagerReviewForImages: true,
    dailyOperationsDigest: true,
    allowAdminAssistance: true,
    publicProfileChecklist: true,
    reminderFrequency: "daily",
    preferredSupportChannel: "email",
    supportPriority: "normal",
    supportTopic: "Synchronisation des données",
    supportMessage: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingWorkspace, setSavingWorkspace] = useState(false);
  const [sendingSupport, setSendingSupport] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  const loadSettings = useCallback(async () => {
    setLoadingSettings(true);
    try {
      const [accountRes, settingsRes] = await Promise.all([
        fetch("/api/professional/me", { headers: { "x-sablin-session-kind": "pharmacy" } }),
        fetch(`/api/pharmacy-platform/settings?pharmacySlug=${encodeURIComponent(PHARMACY_SESSION_SLUG)}`, {
          headers: { "x-sablin-session-kind": "pharmacy" },
        }),
      ]);
      const [accountData, settingsData] = await Promise.all([
        accountRes.json().catch(() => ({})),
        settingsRes.json().catch(() => ({})),
      ]);
      if (!accountRes.ok) throw new Error(accountData?.error ?? "Session pharmacie introuvable.");
      if (!settingsRes.ok) throw new Error(settingsData?.error ?? "Paramètres pharmacie indisponibles.");
      if (accountData?.account) {
        setName(accountData.account.name ?? "");
        setEmail(accountData.account.email ?? "");
        setPhone(accountData.account.phone ?? "");
      }
      setSnapshot(settingsData);
      if (settingsData.workspaceSettings) {
        setWorkspaceSettings((current) => ({ ...current, ...settingsData.workspaceSettings }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chargement des paramètres impossible.");
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  async function saveIdentifiers() {
    setMessage("");
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/professional/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-sablin-session-kind": "pharmacy" },
        body: JSON.stringify({ name, email, phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Modification impossible.");
      setMessage("Identifiants professionnels mis à jour.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Modification impossible.");
    } finally {
      setSaving(false);
    }
  }

  async function saveWorkspaceSettings() {
    setMessage("");
    setError("");
    setSavingWorkspace(true);
    try {
      const res = await fetch("/api/pharmacy-platform/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-sablin-session-kind": "pharmacy" },
        body: JSON.stringify(workspaceSettings),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Enregistrement des préférences impossible.");
      setWorkspaceSettings((current) => ({ ...current, ...(data.workspaceSettings ?? {}) }));
      setMessage(data?.message ?? "Paramètres pharmacie enregistrés.");
      await loadSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enregistrement des préférences impossible.");
    } finally {
      setSavingWorkspace(false);
    }
  }

  async function sendSupportRequest() {
    setMessage("");
    setError("");
    setSendingSupport(true);
    try {
      const res = await fetch("/api/pharmacy-platform/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-sablin-session-kind": "pharmacy" },
        body: JSON.stringify({
          topic: workspaceSettings.supportTopic,
          priority: workspaceSettings.supportPriority,
          message: workspaceSettings.supportMessage,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Envoi au support impossible.");
      setWorkspaceSettings((current) => ({ ...current, supportMessage: "" }));
      setMessage(data?.message ?? "Demande support envoyée.");
      await loadSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Envoi au support impossible.");
    } finally {
      setSendingSupport(false);
    }
  }

  async function sendResetLink() {
    setMessage("");
    setError("");
    setSendingReset(true);
    try {
      const res = await fetch("/api/professional/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Envoi impossible.");
      setMessage(data?.message ?? "Si le compte existe, un lien a été envoyé.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Envoi impossible.");
    } finally {
      setSendingReset(false);
    }
  }

  const setWorkspaceField = <K extends keyof PharmacyWorkspaceSettings>(key: K, value: PharmacyWorkspaceSettings[K]) => {
    setWorkspaceSettings((current) => ({ ...current, [key]: value }));
  };

  const accountStats = [
    { label: "Médicaments suivis", value: snapshot?.pharmacy?.medicationCount ?? 0, badge: "Inventaire" },
    { label: "Images pharmacie", value: snapshot?.pharmacy?.mediaCount ?? 0, badge: "Photos" },
    { label: "Demandes reçues", value: snapshot?.pharmacy?.requestCount ?? 0, badge: "Demandes" },
    { label: "Membres équipe", value: snapshot?.pharmacy?.teamCount ?? 0, badge: "Équipe" },
  ];

  return (
    <div className="space-y-5">
      <Card className="border-border/70 p-5 shadow-card">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Heading level="h2">Paramètres pharmacie</Heading>
            <Muted className="mt-1">
              Gérez les identifiants, la sécurité, les préférences de publication, les alertes et le support de votre espace pharmacie.
            </Muted>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge label="Espace Pharmacie" />
            <StatusBadge label={snapshot?.pharmacy?.accountStatus ?? "Compte"} />
            <StatusBadge label={snapshot?.pharmacy?.publicationStatus ?? "Publication"} />
          </div>
        </div>
        {loadingSettings && <p className="mt-4 rounded-lg border border-border bg-muted/30 p-3 text-sm font-bold text-muted-foreground">Chargement des paramètres professionnels...</p>}
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {accountStats.map((stat) => <Stat key={stat.label} {...stat} />)}
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <Field label="Nom du compte" value={name} onChange={setName} />
          <Field label="E-mail professionnel" value={email} onChange={setEmail} placeholder="pharmacie@sablin.ci" />
          <Field label="Téléphone professionnel" value={phone} onChange={setPhone} placeholder="+225 07 00 00 00 00" />
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Button className="bg-brand text-white hover:bg-brand-dark" onClick={saveIdentifiers} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
            Enregistrer les identifiants
          </Button>
          <Button variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={sendResetLink} disabled={sendingReset || !email}>
            {sendingReset ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
            Envoyer un lien de mot de passe
          </Button>
        </div>
        {message && <p className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-800">{message}</p>}
        {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">{error}</p>}
      </Card>

      <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <Card className="border-border/70 p-5 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Heading level="h3">Préférences opérationnelles</Heading>
              <Muted className="mt-1">Ces réglages pilotent la publication contrôlée, les rappels, l’assistance admin et la qualité visible côté utilisateur.</Muted>
            </div>
            <StatusBadge label="Synchronisation pharmacie" />
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {([
              ["autoPublishSafeInventory", "Publier automatiquement les lignes sûres", "Les produits reconnus, autorisés et complets peuvent être publiés sans intervention admin."],
              ["requireManagerReviewForImages", "Validation responsable pour les images", "Une image web ou ambiguë reste bloquée tant qu’elle n’est pas validée."],
              ["dailyOperationsDigest", "Résumé quotidien", "Recevoir un rappel sur demandes, confirmations, stocks anciens et imports."],
              ["allowAdminAssistance", "Assistance admin autorisée", "L’administration peut corriger une donnée de votre pharmacie avec audit complet."],
              ["publicProfileChecklist", "Checklist profil public", "Afficher les rappels utiles pour logo, façade, horaires, GPS et services."],
            ] as Array<[keyof PharmacyWorkspaceSettings, string, string]>).map(([key, title, detail]) => (
              <label key={key} className="rounded-xl border border-border bg-white p-4">
                <input
                  type="checkbox"
                  checked={Boolean(workspaceSettings[key as keyof PharmacyWorkspaceSettings])}
                  onChange={(event) => setWorkspaceSettings((current) => ({ ...current, [key]: event.target.checked }))}
                  className="mr-2 size-4 accent-brand"
                />
                <span className="font-extrabold text-foreground">{title}</span>
                <p className="mt-1 text-sm font-medium text-muted-foreground">{detail}</p>
              </label>
            ))}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <Label className="text-xs font-bold text-foreground">Rythme des rappels</Label>
              <select
                value={workspaceSettings.reminderFrequency}
                onChange={(event) => setWorkspaceField("reminderFrequency", event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-border bg-white px-3 text-sm font-bold text-foreground"
              >
                <option value="daily">Chaque jour</option>
                <option value="weekly">Chaque semaine</option>
                <option value="critical-only">Urgences seulement</option>
              </select>
            </div>
            <div>
              <Label className="text-xs font-bold text-foreground">Canal support préféré</Label>
              <select
                value={workspaceSettings.preferredSupportChannel}
                onChange={(event) => setWorkspaceField("preferredSupportChannel", event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-border bg-white px-3 text-sm font-bold text-foreground"
              >
                <option value="email">E-mail</option>
                <option value="phone">Téléphone</option>
                <option value="whatsapp">WhatsApp interne</option>
              </select>
            </div>
            <div>
              <Label className="text-xs font-bold text-foreground">Priorité support</Label>
              <select
                value={workspaceSettings.supportPriority}
                onChange={(event) => setWorkspaceField("supportPriority", event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-border bg-white px-3 text-sm font-bold text-foreground"
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="blocking">Bloquant</option>
              </select>
            </div>
          </div>
          <Button onClick={saveWorkspaceSettings} disabled={savingWorkspace} className="mt-4 w-full bg-brand text-white hover:bg-brand-dark sm:w-auto">
            {savingWorkspace ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Enregistrer les préférences
          </Button>
        </Card>

        <Card className="border-border/70 p-5 shadow-card">
          <Heading level="h3">Sécurité du compte</Heading>
          <div className="mt-4 grid gap-3">
            {[
              ["Rôle", snapshot?.security?.role ?? "Pharmacie"],
              ["Permissions", `${snapshot?.security?.permissions?.length ?? 0} autorisations`],
              ["Sessions actives", `${snapshot?.security?.activeSessions ?? 0}`],
              ["Dernière mise à jour", snapshot?.pharmacy?.lastDataUpdate ? formatDateTime(snapshot.pharmacy.lastDataUpdate) : "Non renseignée"],
            ].map(([label, value]) => (
              <div key={label} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-white p-4">
                <span className="text-sm font-bold text-muted-foreground">{label}</span>
                <span className="text-sm font-extrabold text-foreground">{value}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-3">
            {[
              "Le mot de passe n’est jamais affiché en clair.",
              "Le lien de réinitialisation expire après 30 minutes.",
              "Après changement du mot de passe, les sessions professionnelles sont révoquées.",
              "Une pharmacie ne peut pas accéder aux données d’une autre pharmacie.",
            ].map((item) => (
              <Card key={item} className="border-border/70 p-4">
                <KeyRound className="size-5 text-brand" />
                <p className="mt-2 text-sm font-bold text-foreground">{item}</p>
              </Card>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1fr]">
        <Card className="border-border/70 p-5 shadow-card">
          <Heading level="h3">Support pharmacie</Heading>
          <Muted className="mt-1">Une demande envoyée ici arrive dans l’administration SABLIN PHARMA et reste visible dans l’historique.</Muted>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Sujet" value={workspaceSettings.supportTopic} onChange={(value) => setWorkspaceField("supportTopic", value)} />
            <div>
              <Label className="text-xs font-bold text-foreground">Priorité</Label>
              <select
                value={workspaceSettings.supportPriority}
                onChange={(event) => setWorkspaceField("supportPriority", event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-border bg-white px-3 text-sm font-bold text-foreground"
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="blocking">Bloquant</option>
              </select>
            </div>
          </div>
          <Label className="mt-4 block text-xs font-bold text-foreground">Message au support</Label>
          <Textarea
            value={workspaceSettings.supportMessage}
            onChange={(event) => setWorkspaceField("supportMessage", event.target.value)}
            className="mt-2 min-h-28 bg-white"
            placeholder="Expliquez le blocage, l’import concerné, la donnée à corriger ou l’aide attendue."
          />
          <Button onClick={sendSupportRequest} disabled={sendingSupport || workspaceSettings.supportMessage.trim().length < 12} className="mt-4 w-full bg-brand text-white hover:bg-brand-dark sm:w-auto">
            {sendingSupport ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Envoyer au support
          </Button>
        </Card>

        <Card className="border-border/70 p-5 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Heading level="h3">Dernières actions synchronisées</Heading>
              <Muted className="mt-1">Chaque changement important est journalisé pour la pharmacie et l’administration.</Muted>
            </div>
            <StatusBadge label={snapshot?.pharmacy?.dataQuality ?? "Qualité"} />
          </div>
          <div className="mt-4 grid gap-3">
            {(snapshot?.recentActions ?? []).length === 0 && (
              <Card className="border-dashed border-border p-6 text-center text-sm font-bold text-muted-foreground">
                Aucune action récente enregistrée.
              </Card>
            )}
            {(snapshot?.recentActions ?? []).map((item) => (
              <div key={item.id} className="flex flex-col gap-2 rounded-xl border border-border bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-extrabold text-foreground">{item.label}</p>
                  <p className="text-xs font-bold text-muted-foreground">{formatDateTime(item.createdAt)} · {item.action}</p>
                </div>
                <StatusBadge label={item.status} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function AccountState({ kind }: { kind: "pending" | "suspended" }) {
  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <Card className="mx-auto max-w-2xl border-border/70 p-6 text-center shadow-card">
        <Logo size={54} />
        <StatusBadge label={kind === "pending" ? "En attente" : "Suspendu"} />
        <Heading level="h1" className="mt-4">
          {kind === "pending" ? "Votre pharmacie est en cours de validation" : "Votre espace pharmacie est suspendu"}
        </Heading>
        <Muted className="mt-3">
          {kind === "pending"
            ? "Votre demande d’inscription a bien été reçue. L’équipe SABLIN PHARMA vérifiera les informations avant activation de votre espace."
            : "Votre espace pharmacie est suspendu. Contactez le support SABLIN PHARMA."}
        </Muted>
        <Button className="mt-5 bg-brand text-white hover:bg-brand-dark" onClick={() => (window.location.href = "/pharmacie/parametres")}>Accéder au support</Button>
      </Card>
    </div>
  );
}

export function PharmacySpaceView({ page }: { page: PharmacyPage }) {
  if (page === "login") return <PharmacyLogin />;
  if (page === "inscription") return <PharmacyRegistration />;
  if (page === "validation-en-attente") return <AccountState kind="pending" />;
  if (page === "compte-suspendu") return <AccountState kind="suspended" />;
  return (
    <PharmacyShell page={page}>
      {page === "dashboard" && <Dashboard />}
      {page === "medicaments" && <Medications />}
      {page === "medicaments-ajouter" && <Medications />}
      {page === "import-inventaire" && <ImportInventory />}
      {page === "enrichissement-inventaire" && <InventoryEnrichment />}
      {page === "synchronisation-inventaire" && (
        <div className="space-y-5">
          <InventorySyncPanel kind="pharmacy" pharmacySlug={PHARMACY_SESSION_SLUG} />
        </div>
      )}
      {page === "demandes" && <ProfessionalRequestsPanel kind="pharmacy" pharmacySlug={PHARMACY_SESSION_SLUG} />}
      {page === "confirmations" && <ConfirmationCenter />}
      {page === "conseils" && <AdviceCenter />}
      {page === "horaires-garde" && <Schedule />}
      {page === "profil" && <Profile />}
      {page === "photos" && <ImageRules />}
      {page === "equipe" && <TeamManagement />}
      {page === "historique" && <HistoryCenter />}
      {page === "notifications" && <NotificationsCenter />}
      {page === "parametres" && <ProfessionalAccountSettings />}
    </PharmacyShell>
  );
}
