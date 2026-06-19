"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileSpreadsheet,
  History,
  KeyRound,
  LayoutDashboard,
  Lock,
  LogOut,
  MessageCircle,
  Pill,
  Search,
  Settings,
  ShieldCheck,
  Upload,
  UserRound,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { InventorySyncPanel } from "@/components/views/inventory-sync-panels";
import { ProfessionalRequestsPanel } from "@/components/views/professional-requests-panel";
import { ProfessionalActionButton } from "@/components/shared/professional-action-button";
import { LogoutConfirmDialog } from "@/components/shared/logout-confirm-dialog";
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
  PHARMACY_PORTAL_MEDICATIONS,
  PHARMACY_PROFILE_STEPS,
  PHARMACY_SERVICES,
  PUBLIC_AVAILABILITY_STATUSES,
  PUBLIC_PHARMACY_DATA,
  RELIABILITY_LEVELS,
  USER_VISIBLE_MAPPING,
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
  const blob = new Blob([`${header}\n${example}\n`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
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

function Field({ label, placeholder, type = "text" }: { label: string; placeholder?: string; type?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold text-foreground">{label}</Label>
      <Input type={type} placeholder={placeholder ?? label} className="bg-white text-foreground placeholder:text-muted-foreground" />
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
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}

async function pharmacyLogin(role = "Pharmacien responsable", status = "Validée") {
  await fetch("/api/pharmacy-auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role, status }),
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
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Médicaments de ma pharmacie" value={128} badge="Données à jour" />
        <Stat label="Disponibilités à mettre à jour" value={18} badge="À confirmer" />
        <Stat label="Demandes reçues" value={6} badge="Nouvelle" />
        <Stat label="Confirmations en attente" value={4} badge="En cours" />
        <Stat label="Statut de garde" value="Actif" badge="De garde" />
        <Stat label="Qualité de mes données" value="86%" badge="Données à jour" />
        <Stat label="Dernière mise à jour" value="10:05" badge="Confirmé" />
        <Stat label="Prix à vérifier" value={7} badge="À vérifier" />
      </div>
      <DataVisibilityBlocks />
      <SectionBlock title="Connexion avec la plateforme utilisateur" description="Seules les données validées et non confidentielles sont publiées côté utilisateur.">
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {USER_VISIBLE_MAPPING.map(([source, target]) => (
            <div key={source} className="rounded-lg border border-border bg-white p-3">
              <p className="text-sm font-extrabold text-foreground">{source}</p>
              <p className="text-xs font-semibold text-muted-foreground">{target}</p>
            </div>
          ))}
        </div>
      </SectionBlock>
    </div>
  );
}

function Medications() {
  const [query, setQuery] = useState("");
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({});
  const [requestName, setRequestName] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const rows = useMemo(() => {
    const q = query.toLowerCase().trim();
    const source = q ? PHARMACY_PORTAL_MEDICATIONS.filter((m) => `${m.name} ${m.dci}`.toLowerCase().includes(q)) : PHARMACY_PORTAL_MEDICATIONS;
    return source.map((item) => ({ ...item, status: statusOverrides[item.name] ?? item.status }));
  }, [query, statusOverrides]);
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
  return (
    <Card className="border-border/70 p-5 shadow-card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Heading level="h2">Médicaments & disponibilités</Heading>
          <Muted>Vous gérez uniquement les données de votre pharmacie.</Muted>
        </div>
        <Button className="bg-brand text-white hover:bg-brand-dark" onClick={() => (window.location.href = "/pharmacie/import-inventaire")}><Upload className="size-4" /> Import inventaire</Button>
      </div>
      <div className="relative mt-4">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher médicament, DCI..." className="pl-9" />
      </div>
      {rows.length === 0 && (
        <Card className="mt-4 border-amber-200 bg-amber-50 p-4">
          <p className="font-extrabold text-amber-900">Médicament non trouvé dans le référentiel</p>
          <p className="mt-1 text-sm font-semibold text-amber-800">La pharmacie ne peut pas publier librement un médicament non validé. Envoyez une demande à l’administration.</p>
          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
            <Input value={requestName} onChange={(event) => setRequestName(event.target.value)} placeholder={query || "Nom proposé"} />
            <Button className="bg-brand text-white hover:bg-brand-dark" onClick={requestReferentialAdd}>Demander l’ajout au référentiel</Button>
          </div>
          {requestMessage && <p className="mt-3 text-sm font-bold text-amber-900">{requestMessage}</p>}
        </Card>
      )}
      <div className="mt-4 overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[880px] text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>{["Médicament", "Prix indicatif", "Statut public", "Interne", "Source", "Fiabilité", "Mise à jour rapide"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border bg-white">
            {rows.map((m) => (
              <tr key={m.name}>
                <td className="px-4 py-3"><p className="font-bold text-foreground">{m.name}</p><p className="text-xs text-muted-foreground">{m.dci} · {m.form} · {m.dosage}</p></td>
                <td className="px-4 py-3"><Price amount={m.price} size="sm" variant="brand" /></td>
                <td className="px-4 py-3"><StatusBadge label={m.status} /></td>
                <td className="px-4 py-3 text-muted-foreground">Quantité interne : {m.internalQuantity}. Non visible côté utilisateur.</td>
                <td className="px-4 py-3 text-muted-foreground">{m.source}</td>
                <td className="px-4 py-3"><StatusBadge label={m.reliability} /></td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {PUBLIC_AVAILABILITY_STATUSES.map((s) => (
                      <ProfessionalActionButton
                        key={s}
                        action="quick-availability"
                        label={s}
                        pharmacySlug={PHARMACY_SESSION_SLUG}
                        medicationName={m.name}
                        payload={{ availabilityStatus: s, reliabilityLevel: s === "À confirmer" ? "À vérifier" : "Confirmé", dataSource: "Saisie pharmacie" }}
                        onSuccess={() => setStatusOverrides((current) => ({ ...current, [m.name]: s }))}
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
  );
}

function ImportInventory() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<{
    totalRows: number;
    validRows: number;
    incompleteRows: number;
    invalidRows: number;
    recognizedMedications: number;
    unknownMedications: number;
    duplicateRows: number;
    missingPrices: number;
    invalidStatuses: number;
  } | null>(null);
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
      setPreview(data);
      setMessage(`Aperçu prêt : ${data.totalRows} ligne(s), ${data.recognizedMedications} reconnue(s), ${data.unknownMedications} à valider.`);
    } catch (error) {
      setPreview(null);
      setMessage(error instanceof Error ? error.message : "Aperçu impossible.");
    } finally {
      setUploading(false);
    }
  };
  const uploadImport = async () => {
    if (!file) {
      setMessage("Choisissez un fichier CSV, Excel, Word ou PowerPoint avant l’import.");
      return;
    }
    setUploading(true);
    setMessage("");
    try {
      const form = new FormData();
      form.set("pharmacySlug", PHARMACY_SESSION_SLUG);
      form.set("file", file);
      const res = await fetch("/api/imports/confirm", { method: "POST", headers: { "X-Sablin-Session-Kind": "pharmacy" }, body: form });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Import impossible.");
      setMessage(`Import ${data.import.status} : ${data.report.validRows} ligne(s) valide(s), ${data.report.invalidRows} ligne(s) à corriger, ${data.report.unknownMedications} médicament(s) non reconnu(s).`);
      setFile(null);
      setPreview(data.report);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Import impossible.");
    } finally {
      setUploading(false);
    }
  };
  return (
    <Card className="border-border/70 p-5 shadow-card">
      <Heading level="h2">Import inventaire pharmacie</Heading>
      <Muted>Vous importez uniquement l’inventaire de votre propre pharmacie. Formats acceptés : CSV, XLSX, XLS lisible, Word DOCX et PowerPoint PPTX.</Muted>
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto]">
        <Input type="file" accept=".csv,.xls,.xlsx,.docx,.pptx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setPreview(null); }} />
        <Button variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={previewImport} disabled={uploading}>{uploading ? "Analyse..." : "Aperçu avant validation"}</Button>
        <Button className="bg-brand text-white hover:bg-brand-dark" onClick={uploadImport} disabled={uploading}>{uploading ? "Import..." : "Valider import"}</Button>
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
        </div>
      )}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Button variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={() => downloadImportTemplate()}>
          Télécharger modèle Excel
        </Button>
        <Button variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={previewImport}>Analyser maintenant</Button>
        <Button variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={uploadImport}>Confirmer la publication contrôlée</Button>
      </div>
      <SectionBlock title="Colonnes du modèle d’import" description="La pharmacie peut corriger les lignes avant publication.">
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

function SimpleCards({ title, items }: { title: string; items: string[] }) {
  return (
    <Card className="border-border/70 p-5 shadow-card">
      <Heading level="h2">{title}</Heading>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {items.map((item, index) => (
          <Card key={item} className="border-border/70 p-4">
            <StatusBadge label={index % 2 === 0 ? "Nouvelle" : "En cours"} />
            <p className="mt-3 font-bold text-foreground">{item}</p>
            <p className="mt-1 text-sm text-muted-foreground">Médicament concerné, date, priorité, réponse, statut et historique restent liés uniquement à votre pharmacie.</p>
            <ProfessionalActionButton action="handle-pharmacy-request" label="Traiter" pharmacySlug={PHARMACY_SESSION_SLUG} payload={{ details: { title, item } }} className="mt-3 w-full bg-brand text-white hover:bg-brand-dark">
              Traiter
            </ProfessionalActionButton>
          </Card>
        ))}
      </div>
    </Card>
  );
}

function Profile() {
  return (
    <div className="space-y-5">
      <Card className="border-border/70 p-5 shadow-card">
        <Heading level="h2">Profil pharmacie</Heading>
        <Muted>Complétez les données publiques et internes qui alimentent SABLIN PHARMA Utilisateur après validation.</Muted>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {["Nom de la pharmacie", "Nom du pharmacien responsable", "Fonction du responsable", "Commune", "Quartier", "Adresse complète", "Téléphone professionnel", "WhatsApp professionnel", "Email professionnel", "Numéro d’autorisation / agrément", "Point GPS latitude", "Point GPS longitude", "Repère connu", "Zone de couverture"].map((field) => <Field key={field} label={field} />)}
        </div>
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">Même renseignés ici, les contacts restent verrouillés côté utilisateur par crédits. Les documents administratifs restent côté admin.</p>
      </Card>
      <ImageRules />
      <SectionBlock title="Services proposés" description="Ces services aident au filtrage côté utilisateur sans créer de vente en ligne.">
        <PillList items={PHARMACY_SERVICES} />
      </SectionBlock>
      <DataVisibilityBlocks />
    </div>
  );
}

function Schedule() {
  return (
    <Card className="border-border/70 p-5 shadow-card">
      <Heading level="h2">Horaires & garde</Heading>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {["Horaires lundi", "Horaires mardi", "Horaires mercredi", "Horaires jeudi", "Horaires vendredi", "Horaires samedi", "Horaires dimanche", "Pause", "Ouverture exceptionnelle", "Fermeture exceptionnelle", "Statut de garde", "Période de garde", "Message spécial"].map((field) => <Field key={field} label={field} />)}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">{["Ouvert", "Fermé", "De garde", "Fermeture exceptionnelle", "Horaires à confirmer"].map((s) => <StatusBadge key={s} label={s} />)}</div>
      <ProfessionalActionButton action="schedule-save" label="Enregistrer" pharmacySlug={PHARMACY_SESSION_SLUG} className="mt-4 bg-brand text-white hover:bg-brand-dark">
        Enregistrer
      </ProfessionalActionButton>
    </Card>
  );
}

function TeamManagement() {
  const members = [
    { name: "Dr Awa N’Guessan", role: "PHARMACY_OWNER", status: "Actif", lastLogin: "Aujourd’hui" },
    { name: "Koffi Yao", role: "PHARMACY_STOCK_MANAGER", status: "Actif", lastLogin: "Hier" },
    { name: "Mariam Coulibaly", role: "PHARMACY_SUPPORT_AGENT", status: "Invité", lastLogin: "Invitation en attente" },
  ];
  return (
    <Card className="border-border/70 p-5 shadow-card">
      <Heading level="h2">Équipe de la pharmacie</Heading>
      <Muted>Invitez des employés, attribuez des rôles et gardez une trace des accès. Le dernier propriétaire actif ne peut pas être supprimé.</Muted>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Field label="Nom de l’employé" />
        <Field label="Email ou téléphone" />
        <Field label="Rôle" placeholder="PHARMACY_EMPLOYEE" />
        <Field label="Permissions" placeholder="inventory.update, requests.respond" />
      </div>
      <ProfessionalActionButton action="team-invite" label="Inviter un employé" pharmacySlug={PHARMACY_SESSION_SLUG} className="mt-4 bg-brand text-white hover:bg-brand-dark">
        Inviter un employé
      </ProfessionalActionButton>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {members.map((member) => (
          <Card key={member.name} className="border-border/70 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-extrabold text-foreground">{member.name}</p>
                <p className="text-sm font-medium text-muted-foreground">{member.role} · Dernière connexion : {member.lastLogin}</p>
              </div>
              <StatusBadge label={member.status} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <ProfessionalActionButton action="team-update-role" label="Modifier rôle" pharmacySlug={PHARMACY_SESSION_SLUG} size="sm" variant="outline">Modifier rôle</ProfessionalActionButton>
              <ProfessionalActionButton action="team-revoke" label="Révoquer accès" pharmacySlug={PHARMACY_SESSION_SLUG} size="sm" variant="outline" className="border-red-300 text-red-700">Révoquer</ProfessionalActionButton>
            </div>
          </Card>
        ))}
      </div>
    </Card>
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
      {page === "synchronisation-inventaire" && <InventorySyncPanel kind="pharmacy" pharmacySlug={PHARMACY_SESSION_SLUG} />}
      {page === "demandes" && <ProfessionalRequestsPanel kind="pharmacy" pharmacySlug={PHARMACY_SESSION_SLUG} />}
      {page === "confirmations" && <SimpleCards title="Confirmations à traiter" items={["Paracétamol 500 mg", "Augmentin", "Ventoline", "Smecta"]} />}
      {page === "conseils" && <SimpleCards title="Conseils pharmacie" items={["Conseil dosage", "Interaction possible", "Orientation vers médecin", "Question ordonnance"]} />}
      {page === "horaires-garde" && <Schedule />}
      {page === "profil" && <Profile />}
      {page === "photos" && <ImageRules />}
      {page === "equipe" && <TeamManagement />}
      {page === "historique" && <SimpleCards title="Historique de ma pharmacie" items={["Modification disponibilité", "Import inventaire", "Changement horaires", "Confirmation traitée"]} />}
      {page === "notifications" && <SimpleCards title="Notifications pharmacie" items={["Nouvelle demande", "Données anciennes", "Import avec erreurs", "Compte validé"]} />}
      {page === "parametres" && <SimpleCards title="Paramètres pharmacie" items={["Modifier mot de passe", "Notifications", "Sécurité", "Support"]} />}
    </PharmacyShell>
  );
}
