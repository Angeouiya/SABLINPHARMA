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
  PHARMACY_PORTAL_MEDICATIONS,
  PHARMACY_PORTAL_PHARMACIES,
  PHARMACY_PROFILE_STEPS,
  PHARMACY_SERVICES,
  PUBLIC_AVAILABILITY_STATUSES,
  PUBLIC_PHARMACY_DATA,
  RELIABILITY_LEVELS,
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
  { mode: "historique", label: "Historique", href: (slug) => `/admin/pharmacies/${slug}/historique` },
];

const adminUsers = [
  { id: "demo-sablin", name: "Demo SABLIN", phone: "+225 07 00 00 00 01", email: "demo@sablinpharma.ci", commune: "Cocody", credits: 10, transactions: 8, prescriptions: 2, status: "Actif", activity: "Aujourd’hui" },
  { id: "utilisateur-yopougon", name: "Awa Koné", phone: "+225 05 12 44 90 10", email: "awa.kone@example.ci", commune: "Yopougon", credits: 0, transactions: 3, prescriptions: 1, status: "Solde insuffisant", activity: "Hier" },
  { id: "utilisateur-marcory", name: "Moussa Traoré", phone: "+225 01 45 88 20 15", email: "moussa.traore@example.ci", commune: "Marcory", credits: 6, transactions: 12, prescriptions: 4, status: "Actif", activity: "17/06/2026" },
];

const adminOperationalWorkflows = [
  { title: "Validation pharmacie", status: "En attente", owner: "Données", detail: "Vérifier identité, photos publiques, documents internes et horaires." },
  { title: "Import inventaire", status: "À vérifier", owner: "Marketplace", detail: "Publier les lignes sûres, retirer les interdits, isoler les ambiguës." },
  { title: "Paiement suspect", status: "Vérification manuelle", owner: "Finance", detail: "Contrôler référence, montant, webhook et idempotence avant toute action." },
  { title: "Images médicaments", status: "Licence à confirmer", owner: "Enrichissement", detail: "Aucune image web non validée ne doit être visible côté utilisateur." },
];

const adminRiskControls = [
  "Routes /admin réservées aux rôles Administrateur SABLIN et Super administrateur",
  "Actions sensibles journalisées dans l’historique professionnel",
  "Pharmacies non validées non publiées côté utilisateur par défaut",
  "Contacts, stocks, prix détaillés et ordonnances verrouillés par crédits côté utilisateur",
  "Paiements non SUCCESS bloqués avant crédit ou Pass Ordonnance Unique",
  "Images web publiées uniquement après validation source/licence",
];

const professionalAccountRows = [
  { name: "Pharmacie Sainte Marie Cocody", role: "PHARMACY_OWNER", scope: "pharmacie-sainte-marie-cocody", status: "Actif", permissions: "Profil, horaires, inventaire, demandes", lastLogin: "Aujourd’hui 09:40", risk: "Normal" },
  { name: "Koffi Yao", role: "PHARMACY_STOCK_MANAGER", scope: "pharmacie-sainte-marie-cocody", status: "Actif", permissions: "Inventaire, import, confirmations", lastLogin: "Hier 18:12", risk: "À surveiller" },
  { name: "Pharmacie Les Palmiers", role: "PHARMACIST_MANAGER", scope: "pharmacie-les-palmiers-yopougon", status: "En attente", permissions: "Accès bloqué avant validation", lastLogin: "Invitation envoyée", risk: "En attente" },
  { name: "Assistant Plateau", role: "PHARMACY_EMPLOYEE", scope: "pharmacie-centrale-plateau", status: "Suspendu", permissions: "Disponibilités uniquement", lastLogin: "Il y a 11 jours", risk: "Suspendu" },
];

const adminPermissionMatrix = [
  ["Super administrateur", "Toutes pharmacies", "Utilisateurs", "Paiements", "Paramètres sensibles"],
  ["Administrateur SABLIN", "Pharmacies, imports, qualité", "Support utilisateur", "Transactions consultables", "Paramètres limités"],
  ["Data admin", "Référentiel, images, imports", "Aucun mot de passe", "Aucun remboursement", "Qualité données"],
  ["Support admin", "Demandes utilisateurs", "Assistance", "Lecture transactions", "Pas de publication directe"],
];

const medicationRequestRows = [
  { medication: "Efferalgan 500 mg", pharmacy: "Pharmacie Sainte Marie Cocody", status: "En attente", confidence: "78%", action: "Fusion proposée" },
  { medication: "Azithromycine 250 mg", pharmacy: "Pharmacie Les Palmiers Yopougon", status: "À vérifier", confidence: "64%", action: "Validation individuelle" },
  { medication: "Paracétamol 500 mg", pharmacy: "Pharmacie Centrale Plateau", status: "Fusionné", confidence: "96%", action: "Alias ajouté" },
];

const adminHistoryRows = [
  { date: "Aujourd’hui 10:42", actor: "Super administrateur", role: "SUPER_ADMIN", action: "Validation pharmacie", entity: "Pharmacie Sainte Marie Cocody", status: "Réussi" },
  { date: "Aujourd’hui 10:18", actor: "Moteur import", role: "Système", action: "Publication lignes sûres", entity: "Import inventaire Cocody", status: "Réussi" },
  { date: "Hier 17:50", actor: "Contrôle données", role: "DATA_ADMIN", action: "Refus image web", entity: "Doliprane 500 mg", status: "Licence inconnue" },
  { date: "Hier 15:22", actor: "Finance", role: "FINANCE_ADMIN", action: "Paiement suspect", entity: "SP-PAY-2026-000128", status: "Vérification manuelle" },
];

const adminNotificationRows = [
  { title: "Pharmacie en attente", detail: "Une inscription pharmacie attend validation avant publication.", status: "En attente" },
  { title: "Import avec erreurs", detail: "Des statuts invalides ont été isolés avant publication marketplace.", status: "À vérifier" },
  { title: "Données anciennes", detail: "Trois pharmacies doivent mettre à jour horaires ou disponibilités.", status: "Données anciennes" },
  { title: "Paiement suspect", detail: "Un montant reçu ne correspond pas à un pack officiel.", status: "Suspect" },
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
  const [pharmacySlug, setPharmacySlug] = useState(adminPharmacies[0]?.slug ?? "");
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
            {adminPharmacies.map((pharmacy) => <option key={pharmacy.slug} value={pharmacy.slug}>{pharmacy.name}</option>)}
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
  value,
  onChange,
}: {
  label: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold text-foreground">{label}</Label>
      <Input
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

function PharmacySelector({ currentSlug }: { currentSlug?: string }) {
  const active = selectedPharmacy(currentSlug);
  return (
    <div className="rounded-xl border border-border bg-white p-3">
      <Label className="text-xs font-extrabold text-foreground">Sélectionner une pharmacie à gérer</Label>
      <select
        value={active.slug}
        onChange={(event) => {
          window.location.href = `/admin/pharmacies/${event.target.value}/dashboard`;
        }}
        className="mt-2 h-10 w-full rounded-lg border border-border bg-white px-3 text-sm font-bold text-foreground outline-none focus:border-brand"
      >
        {adminPharmacies.map((pharmacy) => (
          <option key={pharmacy.slug} value={pharmacy.slug}>
            {pharmacy.name}
          </option>
        ))}
      </select>
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
        <main className="min-w-0">{children}</main>
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
      <WorkflowBoard
        title="Pilotage opérationnel"
        description="Vue rapide des chantiers qui impactent directement l’espace utilisateur, pharmacie et marketplace."
        items={adminOperationalWorkflows}
      />
      <ControlChecklist title="Garde-fous de production" items={adminRiskControls} />
    </div>
  );
}

function PharmaciesList() {
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
          { label: "Pharmacies", value: adminPharmacies.length, status: "Toutes pharmacies", icon: Building2 },
          { label: "Validées", value: adminPharmacies.filter((p) => p.status === "Validée").length, status: "Publication possible", icon: CheckCircle2 },
          { label: "En attente", value: adminPharmacies.filter((p) => p.status !== "Validée").length, status: "Contrôle requis", icon: AlertTriangle },
          { label: "Données anciennes", value: adminPharmacies.filter((p) => p.quality.includes("ancienne") || p.updatedAt.includes("jours")).length, status: "À mettre à jour", icon: CalendarClock },
        ]}
      />
      <AdminFilterPanel filters={["Recherche nom, commune, responsable", "Commune", "Validation", "Ouvert / garde", "Qualité / mise à jour"]} />
      <Card className="border-border/70 p-5 shadow-card">
      <div className="mt-4 overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[1180px] text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>{["Pharmacie", "Commune", "Responsable", "Téléphone interne", "Validation", "Ouvert/Garde", "Médicaments", "Mise à jour", "Qualité", "Actions"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border bg-white">
            {adminPharmacies.map((p) => (
              <tr key={p.slug}>
                <td className="px-4 py-3 font-bold text-foreground">{p.name}<p className="text-xs font-normal text-muted-foreground">{p.district}</p></td>
                <td className="px-4 py-3">{p.commune}</td>
                <td className="px-4 py-3">{p.manager}</td>
                <td className="px-4 py-3">{p.phone}</td>
                <td className="px-4 py-3"><StatusBadge label={p.status} /></td>
                <td className="px-4 py-3"><div className="flex flex-wrap gap-1"><StatusBadge label={p.operationalStatus} /><StatusBadge label={p.guard} /></div></td>
                <td className="px-4 py-3">{p.meds}</td>
                <td className="px-4 py-3">{p.updatedAt}</td>
                <td className="px-4 py-3"><StatusBadge label={p.quality} /></td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" className="bg-brand text-white" onClick={() => (window.location.href = `/admin/pharmacies/${p.slug}/dashboard`)}>Gérer cette pharmacie</Button>
                    <Button size="sm" variant="outline" onClick={() => (window.location.href = `/admin/pharmacies/${p.slug}`)}>Voir détail</Button>
                    {p.status !== "Validée" && (
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
          {["Horaires lundi", "Horaires mardi", "Horaires mercredi", "Horaires jeudi", "Horaires vendredi", "Horaires samedi", "Horaires dimanche", "Période de garde"].map((field) => <Field key={field} label={field} />)}
        </div>
        <div className="mt-4"><PillList items={PHARMACY_SERVICES} /></div>
      </SectionBlock>
      <SectionBlock title="Étape 5 : médicaments et publication" description="Le stock exact reste interne. Le public voit uniquement Disponible, Stock faible, Rupture ou À confirmer.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {["Nom commercial", "DCI", "Dosage", "Forme", "Catégorie", "Prix indicatif", "Quantité interne", "Seuil stock faible", "Remarque"].map((field) => <Field key={field} label={field} />)}
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
  const pharmacy = selectedPharmacy(pharmacyId);
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
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Médicaments" value={pharmacy.meds} badge="Données pharmacie" />
          <Stat label="Dernière mise à jour" value={pharmacy.updatedAt} badge={pharmacy.quality} />
          <Stat label="Demandes reçues" value={11} badge="En cours" />
          <Stat label="Confirmations" value={4} badge="En attente" />
        </div>
      </Card>
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border/70 p-5 shadow-card">
          <Heading level="h3">Informations générales et actions administratives</Heading>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {actions.map((item) => (
              <ProfessionalActionButton
                key={item.label}
                action={item.action}
                label={item.label}
                pharmacySlug={pharmacy.slug}
                payload={item.payload}
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

function ModeBanner({ pharmacy, mode }: { pharmacy: ReturnType<typeof selectedPharmacy>; mode: AdminPharmacyMode }) {
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
  const pharmacy = selectedPharmacy(pharmacyId);
  return (
    <div className="space-y-5">
      <ModeBanner pharmacy={pharmacy} mode={mode} />
      {mode === "dashboard" && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Médicaments de cette pharmacie" value={pharmacy.meds} badge="Données pharmacie" />
          <Stat label="Disponibilités à confirmer" value={18} badge="À vérifier" />
          <Stat label="Demandes reçues" value={9} badge="Nouvelle" />
          <Stat label="Qualité des données" value="86%" badge={pharmacy.quality} />
        </div>
      )}
      {mode === "medicaments" && <AdminMedicationManagement pharmacySlug={pharmacy.slug} />}
      {mode === "import-inventaire" && <AdminImportForPharmacy pharmacy={pharmacy.name} />}
      {mode === "synchronisation-inventaire" && <InventorySyncPanel kind="admin" pharmacySlug={pharmacy.slug} />}
      {mode === "demandes" && <ProfessionalRequestsPanel kind="admin" pharmacySlug={pharmacy.slug} />}
      {mode === "confirmations" && <SimpleAdmin title="Confirmations supervisées" items={["Paracétamol 500 mg", "Augmentin", "Ventoline", "Confirmer prix"]} pharmacySlug={pharmacy.slug} />}
      {mode === "horaires-garde" && <ScheduleAdmin pharmacySlug={pharmacy.slug} />}
      {mode === "historique" && <SimpleAdmin title="Historique de cette pharmacie" items={["Modification par pharmacie", "Correction admin", "Import inventaire", "Validation donnée"]} pharmacySlug={pharmacy.slug} />}
    </div>
  );
}

function AdminMedicationManagement({ pharmacySlug }: { pharmacySlug: string }) {
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({});
  const rows = PHARMACY_PORTAL_MEDICATIONS.map((item) => ({ ...item, status: statusOverrides[item.name] ?? item.status }));
  return (
    <Card className="border-border/70 p-5 shadow-card">
      <Heading level="h2">Médicaments de la pharmacie sélectionnée</Heading>
      <Muted>L’admin peut corriger, vérifier, changer la source, la fiabilité et publier côté utilisateur.</Muted>
      <div className="mt-4 overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>{["Médicament", "Prix indicatif", "Statut public", "Interne", "Source", "Fiabilité", "Dernière modification", "Actions admin"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border bg-white">
            {rows.map((m) => (
              <tr key={m.name}>
                <td className="px-4 py-3"><p className="font-bold text-foreground">{m.name}</p><p className="text-xs text-muted-foreground">{m.dci} · {m.form} · {m.dosage}</p></td>
                <td className="px-4 py-3"><Price amount={m.price} size="sm" variant="brand" /></td>
                <td className="px-4 py-3"><StatusBadge label={m.status} /></td>
                <td className="px-4 py-3 text-muted-foreground">Quantité interne : {m.internalQuantity}. Non publiée.</td>
                <td className="px-4 py-3">{m.source}</td>
                <td className="px-4 py-3"><StatusBadge label={m.reliability} /></td>
                <td className="px-4 py-3">Auteur : pharmacie · {m.updatedAt}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <ProfessionalActionButton action="quick-availability" label="Corriger" pharmacySlug={pharmacySlug} medicationName={m.name} payload={{ availabilityStatus: "À confirmer", reliabilityLevel: "À vérifier", dataSource: "Saisie administrateur" }} onSuccess={() => setStatusOverrides((current) => ({ ...current, [m.name]: "À confirmer" }))} size="sm" variant="outline">
                      Corriger
                    </ProfessionalActionButton>
                    <ProfessionalActionButton action="mark-inventory-verified" label="Marquer vérifié" pharmacySlug={pharmacySlug} medicationName={m.name} payload={{ availabilityStatus: m.status, reliabilityLevel: "Confirmé", dataSource: "Saisie administrateur" }} onSuccess={() => setStatusOverrides((current) => ({ ...current, [m.name]: m.status }))} size="sm" className="bg-brand text-white">
                      Marquer vérifié
                    </ProfessionalActionButton>
                    <ProfessionalActionButton action="publish-inventory" label="Publier/retirer" pharmacySlug={pharmacySlug} medicationName={m.name} payload={{ availabilityStatus: m.status, reliabilityLevel: m.reliability, dataSource: "Saisie administrateur" }} onSuccess={() => setStatusOverrides((current) => ({ ...current, [m.name]: m.status }))} size="sm" variant="outline">
                      Publier/retirer
                    </ProfessionalActionButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
        Côté utilisateur : “Prix indicatif, à confirmer auprès de la pharmacie.” Si la fiabilité est Ancien, À vérifier ou Incomplet, le statut public devient “À confirmer”.
      </p>
    </Card>
  );
}

function AdminImportForPharmacy({ pharmacy }: { pharmacy: string }) {
  const target = adminPharmacies.find((item) => item.name === pharmacy) ?? adminPharmacies[0];
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const uploadImport = async () => {
    if (!file) {
      setMessage("Choisissez un fichier CSV, XLS ou XLSX avant l’import.");
      return;
    }
    setUploading(true);
    setMessage("");
    try {
      const form = new FormData();
      form.set("pharmacySlug", target.slug);
      form.set("file", file);
      const res = await fetch("/api/pharmacy-platform/imports", { method: "POST", headers: { "X-Sablin-Session-Kind": "admin" }, body: form });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Import impossible.");
      setMessage(`Import ${data.import.status} : ${data.report.validRows} ligne(s) valide(s), ${data.report.invalidRows} ligne(s) à vérifier, ${data.report.unknownMedications} médicament(s) non reconnu(s).`);
      setFile(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Import impossible.");
    } finally {
      setUploading(false);
    }
  };
  return (
    <Card className="border-border/70 p-5 shadow-card">
      <Heading level="h2">Import inventaire pour {pharmacy}</Heading>
      <Muted>L’admin peut importer, corriger, forcer une correspondance médicament et publier la donnée.</Muted>
      <div className="mt-4">
        <AdminMediaUploadPanel pharmacySlug={target.slug} helper="Chargez les photos des locaux ou documents liés à cette pharmacie sélectionnée." />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
        <Input type="file" accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
        <Button className="bg-brand text-white hover:bg-brand-dark" onClick={uploadImport} disabled={uploading}>{uploading ? "Import..." : "Importer fichier"}</Button>
      </div>
      {message && <p className="mt-3 rounded-lg border border-border bg-white p-3 text-sm font-bold text-foreground">{message}</p>}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Button variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={() => downloadImportTemplate(`modele-import-${target.slug}.csv`)}>
          Télécharger modèle Excel
        </Button>
        {[
          ["Forcer correspondance", "force-import-match"],
          ["Valider import", "import-validate"],
          ["Créer demande référentiel", "create-referential-request"],
          ["Corriger doublons", "fix-duplicates"],
          ["Marquer fiable", "mark-reliable"],
          ["Publier côté utilisateur", "publish-import"],
        ].map(([label, action]) => (
          <ProfessionalActionButton key={label} action={action} label={label} pharmacySlug={target.slug} variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light">
            {label}
          </ProfessionalActionButton>
        ))}
      </div>
      <SectionBlock title="Colonnes import Excel/CSV" description="L’admin peut corriger avant validation et publication.">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {IMPORT_TEMPLATE_COLUMNS.map((column) => <div key={column} className="rounded-lg border border-border bg-white p-3 text-sm font-bold text-foreground">{column}</div>)}
        </div>
      </SectionBlock>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {["Lignes valides", "Lignes en erreur", "Médicaments reconnus", "Médicaments non reconnus", "Doublons", "Prix manquants", "Statuts invalides", "Import corrigé"].map((item, index) => <Stat key={item} label={item} value={index % 2 ? 7 : 42} badge={index % 2 ? "À vérifier" : "Confirmé"} />)}
      </div>
    </Card>
  );
}

function ScheduleAdmin({ pharmacySlug }: { pharmacySlug: string }) {
  return (
    <Card className="border-border/70 p-5 shadow-card">
      <Heading level="h2">Horaires & garde de la pharmacie sélectionnée</Heading>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {["Horaires lundi", "Horaires mardi", "Horaires mercredi", "Horaires jeudi", "Horaires vendredi", "Horaires samedi", "Horaires dimanche", "Pause", "Ouverture exceptionnelle", "Fermeture exceptionnelle", "Statut de garde", "Période de garde", "Message spécial"].map((field) => <Field key={field} label={field} />)}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">{["Ouvert", "Fermé", "De garde", "Fermeture exceptionnelle", "Horaires à confirmer"].map((s) => <StatusBadge key={s} label={s} />)}</div>
      <ProfessionalActionButton action="schedule-save" label="Enregistrer comme admin" pharmacySlug={pharmacySlug} className="mt-4 bg-brand text-white hover:bg-brand-dark">
        Enregistrer comme admin
      </ProfessionalActionButton>
    </Card>
  );
}

function Reference() {
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
          { label: "Médicaments actifs", value: PHARMACY_PORTAL_MEDICATIONS.length, status: "Référentiel", icon: Pill },
          { label: "Demandes à traiter", value: medicationRequestRows.filter((row) => row.status !== "Fusionné").length, status: "Validation admin", icon: ClipboardList },
          { label: "Aliases contrôlés", value: 18, status: "Anti-doublon", icon: FileCheck2 },
          { label: "Désactivations", value: 2, status: "Contrôle", icon: LockKeyhole },
        ]}
      />
      <AdminFilterPanel filters={["Nom commercial ou DCI", "Dosage", "Forme", "Catégorie", "Statut référentiel"]} />
      <Card className="border-border/70 p-5 shadow-card">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <Field label="Nom commercial" />
          <Field label="DCI" />
          <Field label="Dosage" />
          <Field label="Forme" />
          <Field label="Catégorie" />
        </div>
        <ProfessionalActionButton action="reference-update" label="Ajouter au référentiel" entityType="medication-reference" className="mt-4 bg-brand text-white hover:bg-brand-dark">
          Ajouter au référentiel
        </ProfessionalActionButton>
      </Card>
      <div className="grid gap-3 md:grid-cols-2">
        {PHARMACY_PORTAL_MEDICATIONS.map((m) => (
          <Card key={m.name} className="border-border/70 p-4 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <StatusBadge label="Actif" />
                <p className="mt-3 font-bold text-foreground">{m.name}</p>
                <p className="text-sm text-muted-foreground">{m.dci} · {m.dosage} · {m.form} · {m.category}</p>
              </div>
              <Badge className="border border-border bg-white text-foreground">Marketplace</Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <ProfessionalActionButton action="reference-update" label="Modifier" entityType="medication-reference" entityId={m.name} size="sm" variant="outline">
                Modifier
              </ProfessionalActionButton>
              <ProfessionalActionButton action="reference-disable" label="Désactiver" entityType="medication-reference" entityId={m.name} size="sm" variant="outline" className="border-red-300 text-red-700">
                Désactiver
              </ProfessionalActionButton>
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
  createdAt: string;
  disabledAt?: string | null;
};

function ProhibitedMedicationsAdmin() {
  const [terms, setTerms] = useState<ProhibitedMedicationTermView[]>([]);
  const [name, setName] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/prohibited-medications?includeInactive=true", {
      headers: { "X-Sablin-Session-Kind": "admin" },
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok) setTerms(json.terms ?? []);
    else setMessage(json.error ?? "Chargement impossible.");
  }, []);

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

  const disableTerm = async (id: string) => {
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/admin/prohibited-medications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "X-Sablin-Session-Kind": "admin" },
      body: JSON.stringify({ id }),
    });
    const json = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setMessage(json.error ?? "Désactivation impossible.");
      return;
    }
    setMessage("Règle désactivée.");
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
          <Badge className="w-fit border-0 bg-brand text-white">{activeTerms.length} règle(s) active(s)</Badge>
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
        {message && <p className="mt-3 rounded-lg border border-border bg-white p-3 text-sm font-bold text-foreground">{message}</p>}
      </Card>

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
                  </div>
                  <Button
                    variant="outline"
                    className="border-red-200 text-red-700 hover:bg-red-50"
                    onClick={() => disableTerm(term.id)}
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
                <p className="text-xs font-semibold text-muted-foreground">{term.disabledAt ? formatDateTime(term.disabledAt) : "Date non renseignée"}</p>
              </Card>
            ))}
            {!inactiveTerms.length && <p className="text-sm font-semibold text-muted-foreground">Aucune règle désactivée.</p>}
          </div>
        </SectionBlock>
      </div>
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
          { label: "Utilisateurs suivis", value: adminUsers.length, status: "Actifs et support", icon: Users },
          { label: "Avec crédits", value: adminUsers.filter((u) => u.credits > 0).length, status: "Crédits SABLIN", icon: WalletCards },
          { label: "Solde insuffisant", value: adminUsers.filter((u) => u.credits === 0).length, status: "À accompagner", icon: AlertTriangle },
          { label: "Ordonnances", value: adminUsers.reduce((sum, user) => sum + user.prescriptions, 0), status: "Pass / crédits", icon: ClipboardList },
        ]}
      />
      <AdminFilterPanel filters={["Recherche utilisateur, téléphone, e-mail", "Commune", "Solde crédits", "Activité", "Statut compte"]} />
      <Card className="border-border/70 p-5 shadow-card">
        <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>{["Nom", "Téléphone", "Email", "Commune", "Solde", "Transactions", "Ordonnances", "Statut", "Dernière activité", "Action"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border bg-white">
            {adminUsers.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3 font-bold">{user.name}</td>
                <td className="px-4 py-3">{user.phone}</td>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3">{user.commune}</td>
                <td className="px-4 py-3">{user.credits} crédits</td>
                <td className="px-4 py-3">{user.transactions}</td>
                <td className="px-4 py-3">{user.prescriptions}</td>
                <td className="px-4 py-3"><StatusBadge label={user.status} /></td>
                <td className="px-4 py-3">{user.activity}</td>
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
          { title: "Solde insuffisant", detail: "Aider l’utilisateur à recharger ou comprendre les crédits SABLIN.", status: "Support" },
          { title: "Paiement en vérification", detail: "Vérifier le statut serveur avant tout crédit ou Pass.", status: "Paiement" },
          { title: "Contact pharmacie débloqué", detail: "Contrôler la transaction et l’accès temporaire si besoin.", status: "Crédits" },
          { title: "Ordonnance bloquée", detail: "Confirmer crédit suffisant ou Pass Ordonnance Unique actif.", status: "Restriction" },
        ]}
      />
    </div>
  );
}

function Transactions() {
  const rows = [
    { action: "Recharge crédits", user: "Demo SABLIN", amount: "500 FCFA", credits: "+6", before: "4", after: "10", status: "Réussi", ref: "SP-PAY-2026-000101" },
    { action: "Achat Pass Ordonnance Unique", user: "Awa Koné", amount: "500 FCFA", credits: "Pass", before: "0", after: "0", status: "Confirmé", ref: "SP-PAY-2026-000102" },
    { action: "Contact débloqué", user: "Moussa Traoré", amount: "100 FCFA", credits: "-1", before: "7", after: "6", status: "Réussi", ref: "SP-CRD-2026-000103" },
    { action: "Paiement échoué", user: "Awa Koné", amount: "1 000 FCFA", credits: "0", before: "0", after: "0", status: "Échoué", ref: "SP-PAY-2026-000104" },
    { action: "Remboursement support", user: "Demo SABLIN", amount: "200 FCFA", credits: "-2", before: "12", after: "10", status: "Vérification manuelle", ref: "SP-RFD-2026-000105" },
  ];
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
          { label: "Crédits vendus", value: "47", status: "Confirmé", icon: WalletCards },
          { label: "Recharges", value: "12", status: "SUCCESS", icon: CheckCircle2 },
          { label: "Pass achetés", value: "4", status: "500 FCFA", icon: FileCheck2 },
          { label: "Anomalies", value: "1", status: "À vérifier", icon: AlertTriangle },
        ]}
      />
      <AdminFilterPanel filters={["Référence", "Utilisateur", "Type d’action", "Statut", "Date"]} />
      <Card className="border-border/70 p-5 shadow-card">
        <ResponsiveTable
          headers={["Action", "Utilisateur", "Montant", "Crédits", "Solde avant", "Solde après", "Statut", "Référence", "Actions"]}
          rows={rows.map((row) => [
            <span key="action" className="font-bold text-foreground">{row.action}</span>,
            row.user,
            row.amount,
            row.credits,
            row.before,
            row.after,
            <StatusBadge key="status" label={row.status} />,
            <span key="ref" className="font-mono text-xs font-bold">{row.ref}</span>,
            <ProfessionalActionButton key="btn" action="refund-transaction" label="Analyser" entityType="transaction" entityId={row.ref} size="sm" variant="outline">Analyser</ProfessionalActionButton>,
          ])}
        />
      </Card>
    </div>
  );
}

function UserDetail({ userId }: { userId?: string }) {
  const user = adminUsers.find((item) => item.id === userId) ?? adminUsers[0];
  return (
    <div className="space-y-5">
      <AdminHero
        badge={user.status}
        title={user.name}
        description={`${user.phone} · ${user.email} · ${user.commune}. Actions support sans mot de passe en clair.`}
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
          { label: "Transactions", value: user.transactions, status: "Historique", icon: History },
          { label: "Ordonnances", value: user.prescriptions, status: "Pass Ordonnance Unique", icon: ClipboardList },
          { label: "Dernière activité", value: user.activity, status: "Actif", icon: Activity },
        ]}
      />
      <ActionQueue
        title="Dossier utilisateur"
        items={["Historique transactions", "Ordonnances", "Pharmacies consultées", "Contacts débloqués", "Pass acheté/utilisé/expiré", "Notifications", "Actions support", "Note interne"].map((item) => ({
          title: item,
          detail: "Consultation ou action support journalisée côté administration.",
          status: item.includes("Pass") ? "Pass Ordonnance Unique" : "Support",
        }))}
      />
    </div>
  );
}

type AdminPaymentRow = {
  reference: string;
  providerReference?: string | null;
  user: string;
  amount: number;
  productType: string;
  expectedCredits: number;
  provider: string;
  status: string;
  statusLabel: string;
  riskStatus: string;
  riskReasons?: string | null;
  createdAt: string;
  expiresAt?: string | null;
};

function PaymentsFraud() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [payments, setPayments] = useState<AdminPaymentRow[]>([]);
  const [filter, setFilter] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payments/reconcile", { headers: { "x-sablin-session-kind": "admin" } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Chargement impossible");
      setSummary(data.summary ?? {});
      setPayments(data.payments ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const action = async (endpoint: string, body: Record<string, unknown>) => {
    setMessage("");
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-sablin-session-kind": "admin" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setMessage(res.ok ? "Action enregistrée." : data.error ?? data.message ?? "Action refusée.");
    await load();
  };

  const visiblePayments = payments.filter((payment) => {
    const q = filter.toLowerCase().trim();
    if (!q) return true;
    return [payment.reference, payment.user, payment.provider, payment.status, payment.riskStatus]
      .join(" ")
      .toLowerCase()
      .includes(q);
  });

  const cards = [
    ["Paiements totaux", summary.total ?? 0, "Tous statuts"],
    ["Confirmés", summary.success ?? 0, "SUCCESS"],
    ["En attente", summary.pending ?? 0, "À vérifier"],
    ["Échoués", summary.failed ?? 0, "Bloqués"],
    ["Expirés", summary.expired ?? 0, "Sans crédit"],
    ["Suspects", summary.suspicious ?? 0, "Fraude"],
    ["Vérification manuelle", summary.manualReview ?? 0, "Finance"],
  ];

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
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filtrer par référence, utilisateur, statut, risque..." />
          <Button variant="outline" onClick={() => setFilter("")}>Réinitialiser</Button>
        </div>
        {message && (
          <div className="mt-3 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm font-semibold text-foreground">
            {message}
          </div>
        )}
        <div className="mt-4 grid gap-3">
          {visiblePayments.map((payment) => (
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
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <StatusBadge label={payment.statusLabel} />
                  <StatusBadge label={payment.riskStatus} />
                </div>
              </div>
              {payment.riskReasons && (
                <p className="mt-3 rounded-lg bg-danger-light px-3 py-2 text-xs font-semibold text-danger">
                  {payment.riskReasons}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => action("/api/payments/reconcile", { reference: payment.reference })}>
                  Vérifier prestataire
                </Button>
                <Button size="sm" variant="outline" onClick={() => action("/api/payments/manual-review", { reference: payment.reference, reason: "Analyse manuelle demandée depuis le tableau anti-fraude." })}>
                  Revue manuelle
                </Button>
                <Button size="sm" variant="outline" onClick={() => action("/api/payments/refund", { reference: payment.reference, reason: "Remboursement demandé depuis Paiements & Fraudes." })}>
                  Rembourser
                </Button>
              </div>
            </Card>
          ))}
          {!loading && visiblePayments.length === 0 && (
            <Card className="border-border/70 p-6 text-center">
              <p className="font-bold text-foreground">Aucun paiement trouvé</p>
              <p className="text-sm text-muted-foreground">Modifiez vos filtres ou actualisez la réconciliation.</p>
            </Card>
          )}
        </div>
      </Card>
    </div>
  );
}

function ProfessionalAccounts() {
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
          { label: "Comptes pro", value: professionalAccountRows.length, status: "Tous espaces", icon: UserCog },
          { label: "Actifs", value: professionalAccountRows.filter((row) => row.status === "Actif").length, status: "Session autorisée", icon: CheckCircle2 },
          { label: "En attente", value: professionalAccountRows.filter((row) => row.status === "En attente").length, status: "Invitation", icon: Bell },
          { label: "Suspendus", value: professionalAccountRows.filter((row) => row.status === "Suspendu").length, status: "Bloqué", icon: LockKeyhole },
        ]}
      />
      <AdminFilterPanel filters={["Recherche nom, e-mail, téléphone", "Rôle", "Statut", "Pharmacie rattachée", "Risque"]} />
      <div className="grid gap-3 md:grid-cols-2">
        {professionalAccountRows.map((row) => (
          <Card key={`${row.name}-${row.role}`} className="border-border/70 p-4 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-extrabold text-foreground">{row.name}</p>
                <p className="text-sm font-medium text-muted-foreground">{row.role} · {row.scope}</p>
                <p className="mt-1 text-xs font-semibold text-muted-foreground">Permissions : {row.permissions}</p>
                <p className="text-xs font-semibold text-muted-foreground">Dernière connexion : {row.lastLogin}</p>
              </div>
              <div className="flex flex-wrap gap-2"><StatusBadge label={row.status} /><StatusBadge label={row.risk} /></div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <ProfessionalActionButton action="professional-role-update" label="Modifier rôle" entityType="professional-account" entityId={row.name} size="sm" variant="outline">Modifier rôle</ProfessionalActionButton>
              <ProfessionalActionButton action="professional-session-revoke" label="Révoquer session" entityType="professional-account" entityId={row.name} size="sm" variant="outline">Révoquer session</ProfessionalActionButton>
              <ProfessionalActionButton action="professional-suspend" label="Suspendre" entityType="professional-account" entityId={row.name} size="sm" variant="outline" className="border-red-300 text-red-700">Suspendre</ProfessionalActionButton>
            </div>
          </Card>
        ))}
      </div>
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
  const rows = [
    { name: "Équipe SABLIN PHARMA", role: "SUPER_ADMIN", status: "Actif", activity: "Aujourd’hui" },
    { name: "Contrôle données", role: "DATA_ADMIN", status: "Actif", activity: "Hier" },
    { name: "Support SABLIN", role: "SUPPORT_ADMIN", status: "En attente", activity: "Invitation envoyée" },
  ];
  return (
    <div className="space-y-5">
      <AdminHero
        badge="Équipe interne"
        title="Administrateurs"
        description="Création interne uniquement. Aucun administrateur ne peut s’inscrire publiquement, et les mots de passe ne sont jamais affichés en clair."
        icon={ShieldCheck}
      />
      <Card className="border-border/70 p-5 shadow-card">
        <div className="grid gap-3 md:grid-cols-4">
          <Field label="Nom administrateur" />
          <Field label="Email professionnel" />
          <Field label="Rôle" placeholder="DATA_ADMIN, SUPPORT_ADMIN..." />
          <Field label="Permissions" placeholder="admin.pharmacies.read" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <ProfessionalActionButton action="admin-create" label="Créer administrateur" entityType="admin-account" className="bg-brand text-white hover:bg-brand-dark">
            Créer administrateur
          </ProfessionalActionButton>
          <ProfessionalActionButton action="admin-force-password-reset" label="Forcer réinitialisation" entityType="admin-account" variant="outline" className="border-brand/30 text-brand-dark">
            Forcer réinitialisation
          </ProfessionalActionButton>
        </div>
      </Card>
      <div className="grid gap-3 md:grid-cols-2">
        {rows.map((row) => (
          <Card key={row.name} className="border-border/70 p-4 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-extrabold text-foreground">{row.name}</p>
                <p className="text-sm font-medium text-muted-foreground">{row.role} · Activité : {row.activity}</p>
              </div>
              <StatusBadge label={row.status} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <ProfessionalActionButton action="admin-permission-update" label="Permissions" entityType="admin-account" entityId={row.name} size="sm" variant="outline">Permissions</ProfessionalActionButton>
              <ProfessionalActionButton action="admin-session-revoke" label="Révoquer session" entityType="admin-account" entityId={row.name} size="sm" variant="outline">Révoquer session</ProfessionalActionButton>
            </div>
          </Card>
        ))}
      </div>
      <ControlChecklist title="Sécurité administrateur" items={["Accès réservé à l’équipe interne", "Pas de section publique d’inscription admin", "Révocation de session journalisée", "Permissions sensibles séparées par rôle"]} />
    </div>
  );
}

function Quality() {
  return (
    <div className="space-y-5">
      <AdminHero
        badge="Fiabilité"
        title="Qualité des données"
        description="Surveillance des disponibilités, prix indicatifs, horaires, GPS, sources, fiabilité et publication. Les données anciennes ou incomplètes deviennent À confirmer côté utilisateur."
        icon={Database}
      />
      <AdminFilterPanel filters={["Pharmacie", "Commune", "Source de donnée", "Fiabilité", "Dernière mise à jour"]} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {["Pharmacies avec données anciennes", "Médicaments à confirmer", "Prix manquants", "Disponibilités non mises à jour", "Pharmacies sans horaires", "Pharmacies sans GPS", "Pharmacies non validées", "Demandes en attente"].map((item, index) => <Stat key={item} label={item} value={index + 3} badge={index % 2 ? "À vérifier" : "Données anciennes"} />)}
      </div>
      <SectionBlock title="Sources et fiabilité" description="Ces valeurs contrôlent ce qui peut être publié côté utilisateur.">
        <div className="flex flex-wrap gap-2">{RELIABILITY_LEVELS.map((item) => <StatusBadge key={item} label={item} />)}{DATA_SOURCES.map((item) => <StatusBadge key={item} label={item} />)}</div>
      </SectionBlock>
      <ActionQueue
        title="Actions qualité prioritaires"
        action="mark-data-quality"
        items={adminPharmacies.slice(0, 4).map((pharmacy) => ({
          title: pharmacy.name,
          detail: `${pharmacy.commune} · ${pharmacy.updatedAt} · ${pharmacy.quality}`,
          status: pharmacy.quality,
          entityId: pharmacy.slug,
        }))}
      />
    </div>
  );
}

function PharmacyValidationsAdmin() {
  const pending = adminPharmacies.filter((pharmacy) => pharmacy.status !== "Validée");
  return (
    <div className="space-y-5">
      <AdminHero
        badge="Publication contrôlée"
        title="Validations pharmacies"
        description="Contrôlez les inscriptions, documents, images publiques, horaires, garde et qualité avant publication côté utilisateur."
        icon={ShieldCheck}
      />
      <MetricsGrid
        metrics={[
          { label: "À valider", value: pending.length, status: "En attente", icon: AlertTriangle },
          { label: "Photos à vérifier", value: 6, status: "Images publiques", icon: ImageIcon },
          { label: "Documents internes", value: 4, status: "Admin uniquement", icon: FileCheck2 },
          { label: "Prêtes à publier", value: Math.max(0, pending.length - 1), status: "Contrôle OK", icon: CheckCircle2 },
        ]}
      />
      <div className="grid gap-3 md:grid-cols-2">
        {pending.map((pharmacy) => (
          <Card key={pharmacy.slug} className="border-border/70 p-4 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <StatusBadge label={pharmacy.status} />
                <p className="mt-3 font-extrabold text-foreground">{pharmacy.name}</p>
                <p className="text-sm font-medium text-muted-foreground">{pharmacy.commune} · {pharmacy.district} · {pharmacy.manager}</p>
                <p className="mt-1 text-xs font-semibold text-muted-foreground">Source : {pharmacy.source} · qualité : {pharmacy.quality}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => (window.location.href = `/admin/pharmacies/${pharmacy.slug}`)}>Dossier</Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <ProfessionalActionButton action="validate-pharmacy" label="Valider" pharmacySlug={pharmacy.slug} size="sm" className="bg-brand text-white hover:bg-brand-dark">Valider</ProfessionalActionButton>
              <ProfessionalActionButton action="refuse-pharmacy" label="Refuser" pharmacySlug={pharmacy.slug} size="sm" variant="outline" className="border-red-300 text-red-700">Refuser</ProfessionalActionButton>
              <ProfessionalActionButton action="review-documents" label="Demander correction" pharmacySlug={pharmacy.slug} size="sm" variant="outline">Demander correction</ProfessionalActionButton>
            </div>
          </Card>
        ))}
        {!pending.length && <Card className="border-border/70 p-6 text-sm font-bold text-muted-foreground">Aucune pharmacie en attente.</Card>}
      </div>
      <ControlChecklist title="Checklist validation" items={["Identité et responsable vérifiés", "Photos publiques sans données sensibles", "Documents administratifs gardés admin uniquement", "Horaires et garde renseignés", "Publication bloquée si compte suspendu ou refusé"]} />
    </div>
  );
}

function MedicationRequestsAdmin() {
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
          { label: "Demandes", value: medicationRequestRows.length, status: "Référentiel", icon: ClipboardList },
          { label: "En attente", value: medicationRequestRows.filter((row) => row.status === "En attente").length, status: "À traiter", icon: AlertTriangle },
          { label: "À vérifier", value: medicationRequestRows.filter((row) => row.status === "À vérifier").length, status: "Ambigu", icon: Search },
          { label: "Fusionnées", value: medicationRequestRows.filter((row) => row.status === "Fusionné").length, status: "Alias", icon: CheckCircle2 },
        ]}
      />
      <AdminFilterPanel filters={["Nom proposé", "Pharmacie demandeuse", "DCI", "Dosage", "Statut"]} />
      <div className="grid gap-3 md:grid-cols-2">
        {medicationRequestRows.map((row) => (
          <Card key={`${row.medication}-${row.pharmacy}`} className="border-border/70 p-4 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <StatusBadge label={row.status} />
                <p className="mt-3 font-extrabold text-foreground">{row.medication}</p>
                <p className="text-sm font-medium text-muted-foreground">{row.pharmacy} · confiance {row.confidence}</p>
                <p className="mt-1 text-xs font-semibold text-muted-foreground">{row.action}</p>
              </div>
              <Badge className="border border-border bg-white text-foreground">{row.confidence}</Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <ProfessionalActionButton action="reference-update" label="Valider" entityType="medication-request" entityId={row.medication} size="sm" className="bg-brand text-white hover:bg-brand-dark">Valider</ProfessionalActionButton>
              <ProfessionalActionButton action="merge-medication-request" label="Fusionner" entityType="medication-request" entityId={row.medication} size="sm" variant="outline">Fusionner</ProfessionalActionButton>
              <ProfessionalActionButton action="reference-disable" label="Refuser" entityType="medication-request" entityId={row.medication} size="sm" variant="outline" className="border-red-300 text-red-700">Refuser</ProfessionalActionButton>
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
      <WorkflowBoard
        title="Flux synchronisés"
        description="Les données visibles côté utilisateur passent par ces règles de publication."
        items={[
          { title: "Pharmacies validées", status: "Publiées", owner: "Admin", detail: "Seules les fiches validées et non suspendues sont visibles." },
          { title: "Horaires & garde", status: "Temps réel", owner: "Pharmacie", detail: "Alimente pharmacies ouvertes et de garde." },
          { title: "Inventaires", status: "Contrôlé", owner: "Moteur", detail: "Les statuts sensibles restent verrouillés par crédits côté utilisateur." },
          { title: "Images", status: "Licence", owner: "Admin", detail: "Images web publiées seulement après validation source et licence." },
        ]}
      />
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
  return (
    <div className="space-y-5">
      <AdminHero
        badge="Audit global"
        title="Historique"
        description="Journal des actions utilisateurs, pharmacies, admins, imports, validations, suspensions, transactions, confirmations et publications."
        icon={History}
      />
      <AdminFilterPanel filters={["Date", "Auteur", "Rôle", "Action", "Entité", "Statut"]} />
      <Card className="border-border/70 p-5 shadow-card">
        <ResponsiveTable
          headers={["Date", "Auteur", "Rôle", "Action", "Entité", "Statut", "Détail"]}
          rows={adminHistoryRows.map((row) => [
            row.date,
            <span key="actor" className="font-bold text-foreground">{row.actor}</span>,
            row.role,
            row.action,
            row.entity,
            <StatusBadge key="status" label={row.status} />,
            <ProfessionalActionButton key="btn" action="process-admin-card" label="Consulter" entityType="audit-log" entityId={row.entity} size="sm" variant="outline">Consulter</ProfessionalActionButton>,
          ])}
        />
      </Card>
    </div>
  );
}

function AdminNotifications() {
  return (
    <div className="space-y-5">
      <AdminHero
        badge="Centre d’alertes"
        title="Notifications admin"
        description="Alertes opérationnelles liées aux validations, imports, données anciennes, paiements suspects et publications."
        icon={Bell}
      />
      <div className="grid gap-3 md:grid-cols-2">
        {adminNotificationRows.map((item) => (
          <Card key={item.title} className="border-border/70 p-4 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <StatusBadge label={item.status} />
                <p className="mt-3 font-extrabold text-foreground">{item.title}</p>
                <p className="text-sm font-medium text-muted-foreground">{item.detail}</p>
              </div>
              <Bell className="size-5 text-brand-dark" />
            </div>
            <ProfessionalActionButton action="process-admin-card" label="Marquer traité" payload={{ details: item }} size="sm" className="mt-3 bg-brand text-white hover:bg-brand-dark">Marquer traité</ProfessionalActionButton>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AdminSettings() {
  return (
    <div className="space-y-5">
      <AdminHero
        badge="Paramètres globaux"
        title="Paramètres"
        description="Configuration des règles de sécurité, publication, enrichissement, paiements, crédits, sessions et support interne. La modification de mot de passe admin n’est pas exposée ici."
        icon={Settings}
      />
      <div className="grid gap-4 xl:grid-cols-2">
        <SectionBlock title="Règles plateforme" description="Paramètres appliqués aux trois espaces sans les mélanger dans la navigation.">
          <div className="grid gap-3">
            {[
              ["Crédits SABLIN", "1 crédit = 100 FCFA, solde serveur uniquement."],
              ["Pass Ordonnance Unique", "500 FCFA, une seule ordonnance, expiration après comparaison."],
              ["Contacts pharmacie", "Verrouillés par crédits côté API et interface."],
              ["Marketplace", "Information et orientation, aucune vente directe."],
            ].map(([title, detail]) => (
              <div key={title} className="rounded-lg border border-border bg-white p-3">
                <p className="font-extrabold text-foreground">{title}</p>
                <p className="text-sm font-medium text-muted-foreground">{detail}</p>
              </div>
            ))}
          </div>
        </SectionBlock>
        <SectionBlock title="Actions sensibles" description="Chaque action doit être auditée et réservée au bon rôle.">
          <div className="grid gap-2">
            {["Révoquer toutes les sessions admin", "Relancer contrôle enrichissement", "Forcer fallback images", "Exporter audit sécurité"].map((item) => (
              <ProfessionalActionButton key={item} action="process-admin-card" label={item} payload={{ details: { item } }} variant="outline" className="justify-start border-brand/30 text-brand-dark hover:bg-brand-light">
                {item}
              </ProfessionalActionButton>
            ))}
          </div>
        </SectionBlock>
      </div>
      <ControlChecklist title="Sécurité globale" items={adminRiskControls} />
    </div>
  );
}

function SimpleAdmin({ title, items, pharmacySlug }: { title: string; items: string[]; pharmacySlug?: string }) {
  return (
    <Card className="border-border/70 p-5 shadow-card">
      <Heading level="h2">{title}</Heading>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {items.map((item, index) => (
          <Card key={item} className="border-border/70 p-4">
            <StatusBadge label={index % 2 ? "En attente" : "Validée"} />
            <p className="mt-3 font-bold text-foreground">{item}</p>
            <ProfessionalActionButton action="process-admin-card" label="Traiter" pharmacySlug={pharmacySlug} payload={{ details: { title, item } }} className="mt-3 bg-brand text-white hover:bg-brand-dark">
              Traiter
            </ProfessionalActionButton>
          </Card>
        ))}
      </div>
    </Card>
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
