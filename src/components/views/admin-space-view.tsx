"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  Building2,
  CalendarClock,
  ClipboardList,
  Database,
  FileSpreadsheet,
  History,
  LayoutDashboard,
  Loader2,
  LogOut,
  Pill,
  Search,
  Settings,
  ShieldCheck,
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
  selectedConfirmableRows,
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

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
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
      setPreview(data);
      setSelectedLineNumbers(safePublishLineNumbers(data));
      setMessage(`Aperçu prêt : ${data.totalRows} ligne(s), ${data.recognizedMedications} reconnue(s), ${data.unknownMedications} à valider.`);
    } catch (error) {
      setPreview(null);
      setSelectedLineNumbers(new Set());
      setMessage(error instanceof Error ? error.message : "Aperçu impossible.");
    } finally {
      setUploading(false);
    }
  };
  const uploadImport = async () => {
    if (!file) {
      setMessage("Choisissez un fichier CSV, XLSX, XLS, Word ou PowerPoint.");
      return;
    }
    if (!preview) {
      setMessage("Analysez le fichier avant de valider. Vous pourrez retirer les lignes à ne pas publier.");
      return;
    }
    const rowsToConfirm = selectedConfirmableRows(preview, selectedLineNumbers);
    if (!rowsToConfirm.length) {
      setMessage("Aucune ligne sélectionnée. Sélectionnez les lignes sûres ou réintégrez les produits à publier.");
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
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Import impossible.");
      setMessage(`Publication contrôlée : ${data.report.syncPublishedProducts ?? 0} produit(s) publié(s), ${data.report.syncPendingValidation ?? 0} gardé(s) en validation, ${data.report.unknownMedications} non reconnu(s).`);
      setFile(null);
      setSelectedLineNumbers(new Set());
      setPreview(data.report);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Import impossible.");
    } finally {
      setUploading(false);
    }
  };
  return (
    <div className="space-y-5">
      <Card className="border-border/70 p-5 shadow-card">
        <Heading level="h2">Imports globaux</Heading>
        <Muted>Imports inventaire multi-format : CSV, Excel, Word et PowerPoint. Les données non reconnues restent bloquées avant validation Admin.</Muted>
        <div className="mt-4 max-w-xl">
          <Label className="text-xs font-extrabold text-foreground">Pharmacie cible</Label>
          <select value={pharmacySlug} onChange={(e) => setPharmacySlug(e.target.value)} className="mt-2 h-11 w-full rounded-lg border border-border bg-white px-3 text-sm font-bold text-foreground">
            {adminPharmacies.map((pharmacy) => <option key={pharmacy.slug} value={pharmacy.slug}>{pharmacy.name}</option>)}
          </select>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
          <Input type="file" accept=".csv,.xls,.xlsx,.docx,.pptx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setPreview(null); setSelectedLineNumbers(new Set()); }} />
          <Button variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={() => downloadImportTemplate(`modele-import-${pharmacySlug}.csv`)}>Télécharger modèle Excel</Button>
          <Button variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={previewImport} disabled={uploading}>{uploading ? "Analyse..." : "Aperçu avant validation"}</Button>
          <Button className="bg-brand text-white hover:bg-brand-dark" onClick={uploadImport} disabled={uploading || !preview}>{uploading ? "Import..." : "Valider la sélection"}</Button>
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
      <SimpleAdmin title="Imports inventaire et contrôles" items={["Import pharmacie Cocody", "Import admin Plateau", "Import avec erreurs", "Import corrigé", "Médicaments non reconnus", "Prix manquants", "Statuts invalides"]} />
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
    body: JSON.stringify({ role }),
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
      <Card className="border-border/70 p-5 shadow-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Heading level="h2">Centre de contrôle SABLIN PHARMA</Heading>
            <Muted>Plateforme maître : plusieurs pharmacies, plusieurs utilisateurs, une seule base de données contrôlée.</Muted>
          </div>
          <Button className="bg-brand text-white hover:bg-brand-dark" onClick={() => (window.location.href = "/admin/pharmacies/nouveau")}>Créer une pharmacie</Button>
        </div>
      </Card>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, value, badge]) => (
          <Stat key={String(label)} label={String(label)} value={loadingSummary ? "..." : value} badge={String(badge)} />
        ))}
      </div>
    </div>
  );
}

function PharmaciesList() {
  return (
    <Card className="border-border/70 p-5 shadow-card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Heading level="h2">Pharmacies</Heading>
          <Muted>Liste globale, validation, suspension, qualité et accès au mode gestion pharmacie.</Muted>
        </div>
        <Button className="bg-brand text-white hover:bg-brand-dark" onClick={() => (window.location.href = "/admin/pharmacies/nouveau")}>Créer une pharmacie</Button>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-5">
        <div className="relative md:col-span-2"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Recherche nom, commune, responsable..." className="pl-9" /></div>
        <Input placeholder="Commune" />
        <Input placeholder="Validation" />
        <Input placeholder="Qualité / mise à jour" />
      </div>
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
    <Card className="border-border/70 p-5 shadow-card">
      <Heading level="h2">Référentiel médicaments</Heading>
      <Muted>Seul l’Admin peut ajouter, modifier ou désactiver un médicament référentiel.</Muted>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {PHARMACY_PORTAL_MEDICATIONS.map((m) => (
          <Card key={m.name} className="border-border/70 p-4">
            <p className="font-bold text-foreground">{m.name}</p>
            <p className="text-sm text-muted-foreground">{m.dci} · {m.dosage} · {m.form} · {m.category}</p>
            <div className="mt-3 flex gap-2">
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
    </Card>
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
  return (
    <Card className="border-border/70 bg-white p-5 shadow-card">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Badge className={cn("border-0 text-white", enabled ? "bg-brand" : "bg-amber-600")}>
            État de l’enrichissement externe
          </Badge>
          <Heading level="h3" className="mt-3">Google/Web côté serveur</Heading>
          <Muted>
            {status?.adminMessage ??
              "L’enrichissement Google/Web est prêt côté serveur, mais il fonctionne actuellement en mode fallback interne/placeholder. Configurez GOOGLE_SEARCH_API_KEY, GOOGLE_SEARCH_ENGINE_ID et ENABLE_EXTERNAL_ENRICHMENT=true pour activer les recherches externes."}
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
    <Card className="border-border/70 p-5 shadow-card">
      <Heading level="h2">Utilisateurs</Heading>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <div className="relative md:col-span-2"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Recherche utilisateur, téléphone, commune..." className="pl-9" /></div>
        <Input placeholder="Filtre crédits" />
        <Input placeholder="Filtre activité" />
      </div>
      <div className="mt-4 overflow-x-auto rounded-xl border border-border">
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
  );
}

function UserDetail({ userId }: { userId?: string }) {
  const user = adminUsers.find((item) => item.id === userId) ?? adminUsers[0];
  return (
    <div className="space-y-5">
      <Card className="border-border/70 p-5 shadow-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <StatusBadge label={user.status} />
            <Heading level="h2" className="mt-3">{user.name}</Heading>
            <Muted>{user.phone} · {user.email} · {user.commune}</Muted>
          </div>
          <ProfessionalActionButton action="user-block-toggle" label="Bloquer ou débloquer" entityType="user" entityId={user.id} variant="outline" className="border-red-300 text-red-700">
            Bloquer ou débloquer
          </ProfessionalActionButton>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Solde crédits" value={`${user.credits} crédits`} badge="Crédits SABLIN" />
          <Stat label="Transactions" value={user.transactions} badge="Historique" />
          <Stat label="Ordonnances" value={user.prescriptions} badge="Pass Ordonnance Unique" />
          <Stat label="Dernière activité" value={user.activity} badge="Actif" />
        </div>
      </Card>
      <SimpleAdmin title="Détail utilisateur" items={["Historique transactions", "Ordonnances", "Pharmacies consultées", "Contacts débloqués", "Pass acheté/utilisé/expiré", "Notifications", "Actions support", "Note interne"]} />
    </div>
  );
}

function Transactions() {
  const rows = ["Recharge crédits", "Achat Pass Ordonnance Unique", "Contact débloqué", "Confirmation disponibilité", "Paiement échoué", "Remboursement support"];
  return (
    <Card className="border-border/70 p-5 shadow-card">
      <Heading level="h2">Crédits & transactions</Heading>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {rows.map((row, index) => <Card key={row} className="border-border/70 p-4"><StatusBadge label={index === 4 ? "Échoué" : "Réussi"} /><p className="mt-3 font-bold text-foreground">{row}</p><p className="text-sm text-muted-foreground">Utilisateur · {index + 1} crédit(s) · 100 FCFA · Solde avant/après · Référence SB-{index + 101}</p></Card>)}
      </div>
    </Card>
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
  const rows = [
    { name: "Pharmacie Sainte Marie Cocody", role: "PHARMACY_OWNER", scope: "pharmacie-sainte-marie-cocody", status: "Actif" },
    { name: "Koffi Yao", role: "PHARMACY_STOCK_MANAGER", scope: "pharmacie-sainte-marie-cocody", status: "Actif" },
    { name: "Pharmacie Les Palmiers", role: "PHARMACIST_MANAGER", scope: "pharmacie-les-palmiers-yopougon", status: "En attente" },
  ];
  return (
    <Card className="border-border/70 p-5 shadow-card">
      <Heading level="h2">Comptes professionnels</Heading>
      <Muted>Gestion centralisée des comptes pharmacie, rôles, rattachements et sessions. Une pharmacie ne voit jamais les comptes d’une autre pharmacie.</Muted>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <Input placeholder="Recherche nom, email, téléphone" />
        <Input placeholder="Rôle" />
        <Input placeholder="Statut" />
        <Input placeholder="Pharmacie rattachée" />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {rows.map((row) => (
          <Card key={`${row.name}-${row.role}`} className="border-border/70 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-extrabold text-foreground">{row.name}</p>
                <p className="text-sm font-medium text-muted-foreground">{row.role} · {row.scope}</p>
              </div>
              <StatusBadge label={row.status} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <ProfessionalActionButton action="professional-role-update" label="Modifier rôle" entityType="professional-account" entityId={row.name} size="sm" variant="outline">Modifier rôle</ProfessionalActionButton>
              <ProfessionalActionButton action="professional-session-revoke" label="Révoquer session" entityType="professional-account" entityId={row.name} size="sm" variant="outline">Révoquer session</ProfessionalActionButton>
              <ProfessionalActionButton action="professional-suspend" label="Suspendre" entityType="professional-account" entityId={row.name} size="sm" variant="outline" className="border-red-300 text-red-700">Suspendre</ProfessionalActionButton>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
}

function Administrators() {
  const rows = [
    { name: "Équipe SABLIN PHARMA", role: "SUPER_ADMIN", status: "Actif", activity: "Aujourd’hui" },
    { name: "Contrôle données", role: "DATA_ADMIN", status: "Actif", activity: "Hier" },
    { name: "Support SABLIN", role: "SUPPORT_ADMIN", status: "En attente", activity: "Invitation envoyée" },
  ];
  return (
    <Card className="border-border/70 p-5 shadow-card">
      <Heading level="h2">Administrateurs</Heading>
      <Muted>Création interne uniquement. Aucun administrateur ne peut s’inscrire publiquement.</Muted>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <Field label="Nom administrateur" />
        <Field label="Email professionnel" />
        <Field label="Rôle" placeholder="DATA_ADMIN, SUPPORT_ADMIN..." />
        <Field label="Permissions" placeholder="admin.pharmacies.read" />
      </div>
      <ProfessionalActionButton action="admin-create" label="Créer administrateur" entityType="admin-account" className="mt-4 bg-brand text-white hover:bg-brand-dark">
        Créer administrateur
      </ProfessionalActionButton>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {rows.map((row) => (
          <Card key={row.name} className="border-border/70 p-4">
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
    </Card>
  );
}

function Quality() {
  return (
    <Card className="border-border/70 p-5 shadow-card">
      <Heading level="h2">Qualité des données</Heading>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <Input placeholder="Pharmacie" />
        <Input placeholder="Commune" />
        <Input placeholder="Source de donnée" />
        <Input placeholder="Fiabilité" />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {["Pharmacies avec données anciennes", "Médicaments à confirmer", "Prix manquants", "Disponibilités non mises à jour", "Pharmacies sans horaires", "Pharmacies sans GPS", "Pharmacies non validées", "Demandes en attente"].map((item, index) => <Stat key={item} label={item} value={index + 3} badge={index % 2 ? "À vérifier" : "Données anciennes"} />)}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">{RELIABILITY_LEVELS.map((item) => <StatusBadge key={item} label={item} />)}{DATA_SOURCES.map((item) => <StatusBadge key={item} label={item} />)}</div>
    </Card>
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
      {page === "validations-pharmacies" && <SimpleAdmin title="Validations pharmacies" items={["Pharmacie Les Palmiers Yopougon", "Pharmacie Marcory Résidentiel", "Pharmacie Koumassi Nouveau Marché"]} />}
      {page === "comptes-professionnels" && <ProfessionalAccounts />}
      {page === "referentiel-medicaments" && <Reference />}
      {page === "enrichissement-medicaments" && <EnrichmentAdmin />}
      {page === "moteur-marketplace" && <MarketplaceEngineAdmin />}
      {page === "sources-licences-images" && <EnrichmentAdmin licenseOnly />}
      {page === "imports" && <GlobalAdminImports />}
      {page === "synchronisations" && <InventorySyncPanel kind="admin" />}
      {page === "demandes-ajout-medicaments" && <SimpleAdmin title="Demandes d’ajout médicament" items={["Proposition Efferalgan", "Proposition Azithromycine", "Fusion avec Paracétamol"]} />}
      {page === "utilisateurs" && <UsersList />}
      {page === "utilisateur-detail" && <UserDetail userId={userId} />}
      {page === "credits-transactions" && <Transactions />}
      {page === "payments-fraud" && <PaymentsFraud />}
      {page === "demandes-utilisateurs" && <ProfessionalRequestsPanel kind="admin" />}
      {page === "qualite-donnees" && <Quality />}
      {page === "historique" && <SimpleAdmin title="Historique global" items={["Action utilisateur", "Action pharmacie", "Action admin", "Import", "Validation", "Suspension", "Transaction"]} />}
      {page === "notifications" && <SimpleAdmin title="Notifications admin" items={["Pharmacie en attente", "Import avec erreurs", "Données anciennes"]} />}
      {page === "administrateurs" && <Administrators />}
      {page === "parametres" && <SimpleAdmin title="Paramètres admin" items={["Sécurité", "Rôles administrateurs", "Paramètres globaux", "Support interne"]} />}
    </AdminShell>
  );
}
