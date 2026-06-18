"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Database,
  FileSpreadsheet,
  History,
  Import,
  KeyRound,
  LayoutDashboard,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  PackageCheck,
  Phone,
  Pill,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Upload,
  UserRound,
  Users,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heading, Muted, Price } from "@/components/ui/typography";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import {
  DATA_SOURCES,
  PHARMACY_ACCOUNT_STATUSES,
  PHARMACY_CREATION_SOURCES,
  PHARMACY_OPERATION_STATUSES,
  PHARMACY_PORTAL_MEDICATIONS,
  PHARMACY_PORTAL_PHARMACIES,
  PHARMACY_ROLES,
  PUBLIC_AVAILABILITY_STATUSES,
  RELIABILITY_LEVELS,
  REQUEST_STATUSES,
} from "@/lib/pharmacy-platform";
import { canAccessPharmacyTab, type PharmacyRole } from "@/lib/pharmacy-access";

type PortalTab =
  | "dashboard"
  | "auth"
  | "admin-create"
  | "inventory"
  | "import"
  | "requests"
  | "confirmations"
  | "advice"
  | "schedule"
  | "profile"
  | "history"
  | "notifications"
  | "settings"
  | "admin";

const tabs: { value: PortalTab; label: string; icon: typeof LayoutDashboard }[] = [
  { value: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { value: "auth", label: "Connexion & inscription", icon: KeyRound },
  { value: "admin-create", label: "Création admin", icon: Building2 },
  { value: "inventory", label: "Médicaments", icon: Pill },
  { value: "import", label: "Import inventaire", icon: FileSpreadsheet },
  { value: "requests", label: "Demandes", icon: MessageCircle },
  { value: "confirmations", label: "Confirmations", icon: ClipboardCheck },
  { value: "advice", label: "Conseils", icon: ShieldCheck },
  { value: "schedule", label: "Horaires & garde", icon: CalendarClock },
  { value: "profile", label: "Profil pharmacie", icon: UserRound },
  { value: "history", label: "Historique", icon: History },
  { value: "notifications", label: "Notifications", icon: Bell },
  { value: "settings", label: "Paramètres", icon: Settings },
  { value: "admin", label: "Administration", icon: Users },
];

const importRows = [
  { file: "inventaire_cocody_juin.xlsx", status: "Import réussi", valid: 128, errors: 0, unknown: 0, author: "Pharmacie Sainte Marie" },
  { file: "stock_yopougon.csv", status: "Médicaments non reconnus", valid: 74, errors: 9, unknown: 6, author: "Admin SABLIN" },
  { file: "plateau_prix.xlsx", status: "Prix manquants", valid: 91, errors: 4, unknown: 0, author: "Pharmacie Centrale" },
  { file: "marcory_stock.csv", status: "Statuts invalides", valid: 52, errors: 7, unknown: 1, author: "Import administrateur" },
  { file: "abobo_corrige.xlsx", status: "Import corrigé", valid: 88, errors: 0, unknown: 0, author: "Super administrateur" },
];

const requests = [
  { type: "Confirmation disponibilité", medication: "Paracétamol 500 mg", ref: "USR-2048", status: "Nouvelle", priority: "Haute", date: "17/06/2026 10:24" },
  { type: "WhatsApp pharmacie", medication: "Augmentin", ref: "USR-1972", status: "En cours", priority: "Normale", date: "17/06/2026 09:41" },
  { type: "Demande liée à une ordonnance", medication: "Amoxicilline + Doliprane", ref: "ORD-3321", status: "Répondue", priority: "Haute", date: "16/06/2026 18:03" },
  { type: "Confirmer prix", medication: "Ventoline", ref: "USR-1888", status: "Expirée", priority: "Basse", date: "15/06/2026 13:20" },
];

const historyRows = [
  { date: "17/06/2026 10:05", action: "Modification disponibilité", author: "Pharmacien responsable", source: "Confirmation WhatsApp", oldValue: "À confirmer", newValue: "Rupture", status: "Confirmé" },
  { date: "17/06/2026 09:20", action: "Ajout médicament", author: "Employé pharmacie", source: "Saisie pharmacie", oldValue: "-", newValue: "Paracétamol 500 mg", status: "Validée" },
  { date: "16/06/2026 17:10", action: "Activation garde", author: "Administrateur SABLIN", source: "Saisie administrateur", oldValue: "Fermé", newValue: "De garde", status: "Réussi" },
  { date: "15/06/2026 11:45", action: "Import inventaire", author: "Admin SABLIN", source: "Import administrateur", oldValue: "74 lignes", newValue: "83 lignes corrigées", status: "Réussi" },
];

const notifications = [
  "Nouvelle demande utilisateur à traiter",
  "Confirmation disponibilité en attente",
  "Import réussi : 128 lignes validées",
  "Import avec erreurs : 9 lignes à corriger",
  "Médicament non reconnu : demande envoyée au référentiel",
  "Données anciennes : mise à jour recommandée",
  "Compte validé par SABLIN PHARMA",
  "Réponse enregistrée avec succès",
];

function toneClass(label: string) {
  const normalized = label.toLowerCase();
  if (normalized.includes("valid") || normalized.includes("confirm") || normalized.includes("disponible") || normalized.includes("ouvert") || normalized.includes("réussi") || normalized.includes("à jour")) {
    return "bg-success-light text-success";
  }
  if (normalized.includes("faible") || normalized.includes("attente") || normalized.includes("cours") || normalized.includes("vérifier") || normalized.includes("ancien") || normalized.includes("incompl") || normalized.includes("non reconnu") || normalized.includes("prix manquants")) {
    return "bg-amber-100 text-amber-800";
  }
  if (normalized.includes("rupture") || normalized.includes("refus") || normalized.includes("suspend") || normalized.includes("expir") || normalized.includes("erreur") || normalized.includes("invalid") || normalized.includes("fermé")) {
    return "bg-danger-light text-danger";
  }
  if (normalized.includes("garde")) {
    return "bg-sky-100 text-sky-800";
  }
  return "bg-muted text-foreground";
}

function StatusBadge({ label }: { label: string }) {
  return <Badge className={cn("max-w-full whitespace-normal border-0 text-center leading-tight break-words", toneClass(label))}>{label}</Badge>;
}

function Field({ label, placeholder, type = "text" }: { label: string; placeholder?: string; type?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold text-foreground">{label}</Label>
      <Input type={type} placeholder={placeholder ?? label} className="bg-white text-foreground placeholder:text-muted-foreground" />
    </div>
  );
}

function SelectField({ label, values }: { label: string; values: readonly string[] }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold text-foreground">{label}</Label>
      <Select>
        <SelectTrigger className="bg-white text-foreground">
          <SelectValue placeholder={values[0]} />
        </SelectTrigger>
        <SelectContent>
          {values.map((value) => (
            <SelectItem key={value} value={value}>{value}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, badge }: { label: string; value: string | number; icon: typeof Pill; badge?: string }) {
  return (
    <Card className="border-border/70 p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-brand-light text-brand">
          <Icon className="size-5" />
        </span>
        {badge && <StatusBadge label={badge} />}
      </div>
      <p className="mt-4 text-2xl font-extrabold text-foreground">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </Card>
  );
}

function SectionCard({ title, icon: Icon, children, action }: { title: string; icon: typeof Pill; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <Card className="border-border/70 p-4 shadow-card sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-brand-light text-brand">
            <Icon className="size-5" />
          </span>
          <h2 className="text-lg font-extrabold text-foreground">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}

function DataTable({ children }: { children: React.ReactNode }) {
  return <div className="overflow-x-auto rounded-xl border border-border bg-white">{children}</div>;
}

function SecurityRule({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-brand-light text-brand">
          <Lock className="size-4" />
        </span>
        <p className="font-extrabold text-foreground">{title}</p>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}

function AuthGate({ onLogin }: { onLogin: (role: PharmacyRole) => void }) {
  return (
    <div className="min-h-screen bg-background">
      <section className="border-b border-border bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div className="min-w-0">
            <Logo size={60} />
            <p className="mt-6 text-xs font-extrabold uppercase tracking-wide text-brand">SABLIN PHARMA Pharmacie</p>
            <Heading level="h1" className="mt-2 text-3xl sm:text-4xl">
              Accès professionnel sécurisé
            </Heading>
            <Muted className="mt-3 max-w-2xl">
              L’espace Pharmacie alimente directement les pages Utilisateur. Les données ne sont publiées qu’après validation, contrôle de fraîcheur et respect des rôles.
            </Muted>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <SecurityRule title="Publication contrôlée" text="Une pharmacie inscrite reste en attente tant que SABLIN PHARMA ne l’a pas validée." />
              <SecurityRule title="Contacts protégés" text="Téléphone, WhatsApp et actions directes restent verrouillés côté utilisateur par crédits SABLIN." />
              <SecurityRule title="Rôles séparés" text="Pharmacie, employé, administrateur et super administrateur n’ont pas les mêmes droits." />
              <SecurityRule title="Données vérifiées" text="Les données anciennes ou incomplètes deviennent automatiquement À confirmer côté utilisateur." />
            </div>
          </div>

          <div className="grid gap-4">
            <Card className="border-border/70 p-5 shadow-card">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-brand text-white">
                  <KeyRound className="size-5" />
                </span>
                <div>
                  <h2 className="text-xl font-extrabold text-foreground">Connexion pharmacie</h2>
                  <p className="text-sm text-muted-foreground">Gérez vos disponibilités, horaires et demandes utilisateurs.</p>
                </div>
              </div>
              <div className="mt-5 grid gap-3">
                <Field label="Email ou téléphone professionnel" placeholder="pharmacie@sablin.ci" />
                <Field label="Mot de passe" type="password" placeholder="Votre mot de passe" />
                <Button className="h-11 w-full bg-brand text-white hover:bg-brand-dark" onClick={() => onLogin("Pharmacien responsable")}>
                  Se connecter
                </Button>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <Button variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={() => onLogin("Employé pharmacie")}>
                  Démo employé
                </Button>
                <Button variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={() => onLogin("Administrateur SABLIN")}>
                  Démo admin
                </Button>
              </div>
              <button className="mt-3 text-sm font-semibold text-brand-dark">Mot de passe oublié ?</button>
            </Card>

            <Card className="border-border/70 p-5 shadow-card">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-brand-light text-brand">
                  <Building2 className="size-5" />
                </span>
                <div>
                  <h2 className="text-xl font-extrabold text-foreground">Inscrire ma pharmacie</h2>
                  <p className="text-sm text-muted-foreground">Compte créé avec le statut En attente de validation.</p>
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Field label="Nom de la pharmacie" />
                <Field label="Pharmacien responsable" />
                <Field label="Email professionnel" />
                <Field label="Téléphone professionnel" />
                <Field label="Commune" />
                <Field label="Quartier" />
              </div>
              <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
                L’inscription sera vérifiée par l’équipe SABLIN PHARMA avant publication des données côté utilisateur.
              </p>
              <Button variant="outline" className="mt-4 w-full border-brand/30 text-brand-dark hover:bg-brand-light">
                Créer mon espace pharmacie
              </Button>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}

export function PharmacyPortalView() {
  const [tab, setTab] = useState<PortalTab>("dashboard");
  const [query, setQuery] = useState("");
  const [activeRole, setActiveRole] = useState<PharmacyRole | null>(null);

  const visibleMedications = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PHARMACY_PORTAL_MEDICATIONS;
    return PHARMACY_PORTAL_MEDICATIONS.filter((m) => [m.name, m.dci, m.category, m.status].some((value) => value.toLowerCase().includes(q)));
  }, [query]);

  const visibleTabs = useMemo(
    () => tabs.filter((item) => canAccessPharmacyTab(activeRole, item.value)),
    [activeRole]
  );

  if (!activeRole) {
    return <AuthGate onLogin={(role) => {
      setActiveRole(role);
      setTab("dashboard");
    }} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <section className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <Logo size={52} />
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-wide text-brand">SABLIN PHARMA Pharmacie</p>
              <Heading level="h1" className="mt-1 text-2xl sm:text-3xl">Espace professionnel pharmacies</Heading>
              <Muted className="mt-1 max-w-3xl">
                Gérez vos disponibilités, horaires, demandes utilisateurs, confirmations et qualité des données sans afficher le stock exact au public.
              </Muted>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="rounded-xl border border-border bg-muted/30 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Session active</p>
              <p className="text-sm font-extrabold text-foreground">{activeRole}</p>
            </div>
            {canAccessPharmacyTab(activeRole, "admin-create") && (
              <Button variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={() => setTab("admin-create")}>
                <Plus className="size-4" /> Créer une pharmacie
              </Button>
            )}
            <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50" onClick={() => {
              setActiveRole(null);
              setTab("dashboard");
            }}>
              Déconnexion
            </Button>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-8">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Card className="border-border/70 p-2 shadow-card">
            <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-1">
              {visibleTabs.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.value}
                    onClick={() => setTab(item.value)}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-bold transition-colors sm:text-sm",
                      tab === item.value ? "bg-brand text-white" : "text-foreground/75 hover:bg-accent"
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Icon className="size-4 shrink-0" />
                      <span>{item.label}</span>
                    </span>
                    <ChevronRight className="hidden size-4 shrink-0 lg:block" />
                  </button>
                );
              })}
            </div>
          </Card>
        </aside>

        <main className="min-w-0">
          {tab === "dashboard" && (
            <div className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard icon={Pill} label="Médicaments enregistrés" value={128} badge="Données à jour" />
                <StatCard icon={PackageCheck} label="Disponibles" value={84} badge="Disponible" />
                <StatCard icon={AlertTriangle} label="Stock faible" value={17} badge="Stock faible" />
                <StatCard icon={XCircle} label="Ruptures" value={9} badge="Rupture" />
                <StatCard icon={Clock} label="À confirmer" value={18} badge="À confirmer" />
                <StatCard icon={MessageCircle} label="Demandes en attente" value={6} badge="Nouvelle demande" />
                <StatCard icon={CalendarClock} label="Statut de garde" value="Actif" badge="De garde" />
                <StatCard icon={Database} label="Qualité des données" value="86%" badge="Données à jour" />
              </div>

              <SectionCard title="Qualité des données" icon={Database}>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {["Données à jour", "Données anciennes", "Données incomplètes", "Disponibilités à confirmer", "Prix non renseignés", "Médicaments sans correspondance référentiel"].map((item) => (
                    <div key={item} className="min-w-0 overflow-hidden rounded-xl border border-border bg-muted/20 p-4">
                      <StatusBadge label={item} />
                      <p className="mt-3 text-sm text-foreground/80">
                        Indicateur suivi par SABLIN PHARMA pour garantir une donnée fiable côté utilisateur.
                      </p>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Messages importants pour les pharmacies" icon={ShieldCheck}>
                <div className="grid gap-3 md:grid-cols-2">
                  {[
                    "Gardez vos disponibilités à jour pour aider les utilisateurs à éviter les déplacements inutiles.",
                    "Les prix sont indicatifs et peuvent être confirmés avant déplacement.",
                    "Le stock exact n’est jamais affiché publiquement.",
                    "Seuls les statuts Disponible, Stock faible, Rupture et À confirmer sont visibles côté utilisateur.",
                  ].map((message) => (
                    <p key={message} className="min-w-0 rounded-xl border border-brand/20 bg-brand-light/50 p-4 text-sm font-semibold text-brand-dark">
                      {message}
                    </p>
                  ))}
                </div>
              </SectionCard>
            </div>
          )}

          {tab === "auth" && (
            <div className="grid gap-6 xl:grid-cols-2">
              <SectionCard title="Connexion pharmacie" icon={KeyRound}>
                <div className="space-y-4">
                  <p className="rounded-xl border border-brand/20 bg-brand-light/50 p-4 text-sm text-brand-dark">
                    Gérez vos disponibilités, vos horaires et vos demandes utilisateurs depuis votre espace pharmacie.
                  </p>
                  <Field label="Email ou téléphone professionnel" placeholder="pharmacie@sablin.ci" />
                  <Field label="Mot de passe" type="password" placeholder="Votre mot de passe" />
                  <Button className="w-full bg-brand text-white hover:bg-brand-dark">Se connecter</Button>
                  <div className="flex flex-col gap-2 text-sm sm:flex-row sm:justify-between">
                    <button className="font-semibold text-brand-dark">Mot de passe oublié ?</button>
                    <button className="font-semibold text-brand-dark">Inscrire ma pharmacie</button>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Inscription pharmacie" icon={Building2}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Nom de la pharmacie" />
                  <Field label="Nom du pharmacien responsable" />
                  <Field label="Fonction du responsable" />
                  <Field label="Email professionnel" />
                  <Field label="Téléphone professionnel" />
                  <Field label="Commune" />
                  <Field label="Quartier" />
                  <Field label="Adresse complète" />
                  <Field label="Localisation GPS si disponible" />
                  <Field label="Numéro d’autorisation si disponible" />
                  <Field label="Photo ou logo de la pharmacie" type="file" />
                  <Field label="Mot de passe" type="password" />
                  <Field label="Confirmation du mot de passe" type="password" />
                </div>
                <label className="mt-4 flex items-start gap-2 text-sm text-foreground">
                  <input type="checkbox" className="mt-1 accent-brand" />
                  J’accepte les conditions de SABLIN PHARMA Pharmacie.
                </label>
                <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
                  L’inscription sera vérifiée par l’équipe SABLIN PHARMA avant publication des données côté utilisateur.
                </p>
                <Button className="mt-4 w-full bg-brand text-white hover:bg-brand-dark">Créer mon espace pharmacie</Button>
              </SectionCard>
            </div>
          )}

          {tab === "admin-create" && (
            <SectionCard title="Création pharmacie par administrateur" icon={Building2}>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <Field label="Nom de la pharmacie" placeholder="Pharmacie Riviera Santé" />
                <Field label="Responsable" />
                <Field label="Téléphone" />
                <Field label="Email" />
                <Field label="Commune" />
                <Field label="Quartier" />
                <Field label="Adresse" />
                <Field label="Coordonnées GPS" />
                <Field label="Horaires" placeholder="08:00 - 22:00" />
                <SelectField label="Statut de garde" values={PHARMACY_OPERATION_STATUSES} />
                <Field label="Services disponibles" placeholder="Conseil, garde, parapharmacie" />
                <SelectField label="Statut de validation" values={PHARMACY_ACCOUNT_STATUSES} />
                <Field label="Identifiant interne" />
                <Field label="Notes internes" />
                <SelectField label="Source de création" values={PHARMACY_CREATION_SOURCES} />
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {["Créer seulement la fiche pharmacie", "Créer la fiche + créer un accès pharmacie", "Créer la fiche + gérer les données moi-même", "Envoyer une invitation à la pharmacie"].map((option) => (
                  <button key={option} className="rounded-xl border border-border bg-white p-4 text-left text-sm font-bold text-foreground hover:border-brand/40 hover:bg-brand-light/40">
                    {option}
                  </button>
                ))}
              </div>
              <Button className="mt-5 bg-brand text-white hover:bg-brand-dark">Créer la pharmacie</Button>
            </SectionCard>
          )}

          {tab === "inventory" && (
            <div className="space-y-6">
              <SectionCard
                title="Médicaments & disponibilités"
                icon={Pill}
                action={<Button className="bg-brand text-white hover:bg-brand-dark"><Plus className="size-4" /> Ajouter un médicament</Button>}
              >
                <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px_180px]">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un médicament, DCI, statut..." className="pl-9" />
                  </div>
                  <SelectField label="Filtre statut" values={PUBLIC_AVAILABILITY_STATUSES} />
                  <SelectField label="Fiabilité" values={RELIABILITY_LEVELS} />
                </div>
                <DataTable>
                  <table className="w-full min-w-[900px] text-sm">
                    <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                      <tr>
                        {["Médicament", "Prix indicatif", "Statut", "Source", "Fiabilité", "Mise à jour", "Actions rapides"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {visibleMedications.map((m) => (
                        <tr key={m.name}>
                          <td className="px-4 py-3">
                            <p className="font-bold text-foreground">{m.name}</p>
                            <p className="text-xs text-muted-foreground">{m.dci} · {m.form} · {m.dosage}</p>
                          </td>
                          <td className="px-4 py-3"><Price amount={m.price} size="sm" variant="brand" /></td>
                          <td className="px-4 py-3"><StatusBadge label={m.status} /></td>
                          <td className="px-4 py-3 text-muted-foreground">{m.source}</td>
                          <td className="px-4 py-3"><StatusBadge label={m.reliability} /></td>
                          <td className="px-4 py-3 text-muted-foreground">{m.updatedAt}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1.5">
                              {PUBLIC_AVAILABILITY_STATUSES.map((status) => (
                                <Button key={status} size="sm" variant="outline" className="h-8 border-brand/20 text-xs text-brand-dark hover:bg-brand-light">{status}</Button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </DataTable>
              </SectionCard>

              <SectionCard title="Ajouter un médicament" icon={Plus}>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Recherche dans le référentiel SABLIN PHARMA" placeholder="Paracétamol, DCI, dosage..." />
                  <Field label="Prix indicatif" placeholder="600 FCFA" />
                  <SelectField label="Statut" values={PUBLIC_AVAILABILITY_STATUSES} />
                  <Field label="Remarque" placeholder="Prix indicatif, forme, observation..." />
                </div>
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="font-bold text-amber-900">Médicament non trouvé</p>
                  <p className="mt-1 text-sm text-amber-800">Demandez l’ajout au référentiel. L’administrateur SABLIN PHARMA validera avant publication.</p>
                  <Button variant="outline" className="mt-3 border-amber-500/40 text-amber-800 hover:bg-amber-100">Demander l’ajout au référentiel</Button>
                </div>
              </SectionCard>
            </div>
          )}

          {tab === "import" && (
            <SectionCard title="Import inventaire Excel ou CSV" icon={Import}>
              <div className="grid gap-3 md:grid-cols-3">
                <Button variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light"><FileSpreadsheet className="size-4" /> Télécharger modèle Excel</Button>
                <Button className="bg-brand text-white hover:bg-brand-dark"><Upload className="size-4" /> Importer fichier</Button>
                <Button variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light"><CheckCircle2 className="size-4" /> Valider après aperçu</Button>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {["Lignes valides", "Lignes avec erreurs", "Médicaments reconnus", "Doublons", "Prix manquants", "Statuts invalides", "Médicaments non reconnus", "Correction avant validation"].map((item) => (
                  <div key={item} className="rounded-xl border border-border bg-muted/20 p-4 text-sm font-semibold text-foreground">{item}</div>
                ))}
              </div>
              <p className="mt-4 rounded-xl border border-brand/20 bg-brand-light/50 p-4 text-sm text-brand-dark">
                Colonnes du modèle : Nom du médicament, DCI, Dosage, Forme, Prix indicatif, Statut, Quantité interne optionnelle, Date de mise à jour, Remarque. La quantité interne n’est jamais affichée côté utilisateur.
              </p>
              <DataTable>
                <table className="mt-5 w-full min-w-[780px] text-sm">
                  <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                    <tr>{["Fichier", "Statut", "Valides", "Erreurs", "Non reconnus", "Auteur"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {importRows.map((row) => (
                      <tr key={row.file}>
                        <td className="px-4 py-3 font-semibold text-foreground">{row.file}</td>
                        <td className="px-4 py-3"><StatusBadge label={row.status} /></td>
                        <td className="px-4 py-3">{row.valid}</td>
                        <td className="px-4 py-3">{row.errors}</td>
                        <td className="px-4 py-3">{row.unknown}</td>
                        <td className="px-4 py-3 text-muted-foreground">{row.author}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </DataTable>
            </SectionCard>
          )}

          {tab === "requests" && (
            <SectionCard title="Demandes utilisateurs" icon={MessageCircle}>
              <div className="grid gap-3">
                {requests.map((request) => (
                  <Card key={`${request.type}-${request.ref}`} className="border-border/70 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge label={request.status} />
                          <StatusBadge label={request.priority} />
                        </div>
                        <p className="mt-2 font-extrabold text-foreground">{request.type}</p>
                        <p className="text-sm text-muted-foreground">{request.medication} · Référence anonymisée {request.ref} · {request.date}</p>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light">Répondre</Button>
                        <Button variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light">Traiter</Button>
                        <Button className="bg-brand text-white hover:bg-brand-dark">Marquer terminé</Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </SectionCard>
          )}

          {tab === "confirmations" && (
            <SectionCard title="Confirmations" icon={ClipboardCheck}>
              <div className="grid gap-4 xl:grid-cols-2">
                {PHARMACY_PORTAL_MEDICATIONS.slice(0, 4).map((m) => (
                  <Card key={m.name} className="border-border/70 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-extrabold text-foreground">{m.name}</p>
                        <p className="text-sm text-muted-foreground">{m.dosage} · {m.form}</p>
                      </div>
                      <StatusBadge label={m.status} />
                    </div>
                    <div className="mt-3 flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2 text-sm">
                      <span className="text-muted-foreground">Prix demandé</span>
                      <Price amount={m.price} size="sm" variant="brand" />
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <Button className="bg-brand text-white hover:bg-brand-dark">Confirmer disponible</Button>
                      <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">Confirmer rupture</Button>
                      <Button variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light">Confirmer prix</Button>
                      <Button variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light">Modifier prix indicatif</Button>
                    </div>
                    <Textarea className="mt-3" placeholder="Répondre avec remarque..." />
                  </Card>
                ))}
              </div>
            </SectionCard>
          )}

          {tab === "advice" && (
            <SectionCard title="Conseils pharmacie" icon={ShieldCheck}>
              <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
                Les conseils fournis ne remplacent pas une consultation médicale. Le pharmacien reste responsable de ses réponses.
              </p>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {["Conseil dosage pédiatrique", "Interaction possible", "Orientation vers médecin", "Question ordonnance"].map((item) => (
                  <Card key={item} className="border-border/70 p-4">
                    <StatusBadge label="Nouvelle" />
                    <p className="mt-3 font-bold text-foreground">{item}</p>
                    <Textarea className="mt-3" placeholder="Réponse du pharmacien..." />
                    <Button className="mt-3 w-full bg-brand text-white hover:bg-brand-dark">Enregistrer la réponse</Button>
                  </Card>
                ))}
              </div>
            </SectionCard>
          )}

          {tab === "schedule" && (
            <SectionCard title="Horaires & garde" icon={CalendarClock}>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {["Lundi - Vendredi", "Samedi", "Dimanche", "Ouverture exceptionnelle", "Fermeture exceptionnelle", "Période de garde", "Message spécial", "Services disponibles"].map((label) => (
                  <Field key={label} label={label} placeholder={label.includes("Lundi") ? "08:00 - 22:00" : undefined} />
                ))}
                <SelectField label="Statut officiel" values={PHARMACY_OPERATION_STATUSES} />
              </div>
              <p className="mt-4 rounded-xl border border-brand/20 bg-brand-light/50 p-4 text-sm text-brand-dark">
                Ces données alimentent directement les pharmacies proches, ouvertes, de garde et le détail pharmacie côté utilisateur.
              </p>
              <Button className="mt-4 bg-brand text-white hover:bg-brand-dark">Enregistrer les horaires</Button>
            </SectionCard>
          )}

          {tab === "profile" && (
            <SectionCard title="Profil de la pharmacie" icon={UserRound}>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <Field label="Nom de la pharmacie" />
                <Field label="Responsable" />
                <Field label="Commune" />
                <Field label="Quartier" />
                <Field label="Adresse" />
                <Field label="Localisation GPS" />
                <Field label="Téléphone professionnel" />
                <Field label="WhatsApp professionnel" />
                <Field label="Email" />
                <Field label="Services disponibles" />
                <Field label="Image ou logo" type="file" />
                <SelectField label="Statut de validation" values={PHARMACY_ACCOUNT_STATUSES} />
                <SelectField label="Source de création" values={PHARMACY_CREATION_SOURCES} />
                <Field label="Date de création" placeholder="17/06/2026" />
                <Field label="Dernière mise à jour" placeholder="17/06/2026 10:05" />
              </div>
              <Textarea className="mt-3" placeholder="Description courte de la pharmacie..." />
              <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                Les contacts renseignés ici restent verrouillés côté utilisateur par les crédits SABLIN.
              </p>
            </SectionCard>
          )}

          {tab === "history" && (
            <SectionCard title="Historique des données" icon={History}>
              <DataTable>
                <table className="w-full min-w-[900px] text-sm">
                  <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                    <tr>{["Date", "Action", "Auteur", "Source", "Ancienne valeur", "Nouvelle valeur", "Statut"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {historyRows.map((row) => (
                      <tr key={`${row.date}-${row.action}`}>
                        <td className="px-4 py-3 text-muted-foreground">{row.date}</td>
                        <td className="px-4 py-3 font-semibold text-foreground">{row.action}</td>
                        <td className="px-4 py-3">{row.author}</td>
                        <td className="px-4 py-3">{row.source}</td>
                        <td className="px-4 py-3 text-muted-foreground">{row.oldValue}</td>
                        <td className="px-4 py-3 text-foreground">{row.newValue}</td>
                        <td className="px-4 py-3"><StatusBadge label={row.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </DataTable>
            </SectionCard>
          )}

          {tab === "notifications" && (
            <SectionCard title="Notifications pharmacie" icon={Bell}>
              <div className="grid gap-3 md:grid-cols-2">
                {notifications.map((item, index) => (
                  <div key={item} className="flex items-start gap-3 rounded-xl border border-border bg-white p-4">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand">
                      {index % 3 === 0 ? <Bell className="size-4" /> : index % 3 === 1 ? <AlertTriangle className="size-4" /> : <CheckCircle2 className="size-4" />}
                    </span>
                    <div>
                      <p className="font-bold text-foreground">{item}</p>
                      <p className="text-sm text-muted-foreground">Notification interne à traiter depuis l’espace pharmacie.</p>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {tab === "settings" && (
            <SectionCard title="Paramètres pharmacie" icon={Settings}>
              <div className="grid gap-3 md:grid-cols-2">
                {["Modifier mot de passe", "Gérer notifications", "Sécurité du compte", "Confidentialité", "Aide", "Support", "Déconnexion"].map((item) => (
                  <button key={item} className="flex items-center justify-between rounded-xl border border-border bg-white p-4 text-left font-bold text-foreground hover:border-brand/40 hover:bg-brand-light/40">
                    <span className="flex items-center gap-2">
                      {item === "Déconnexion" ? <Lock className="size-4 text-red-600" /> : <Settings className="size-4 text-brand" />}
                      {item}
                    </span>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </SectionCard>
          )}

          {tab === "admin" && (
            <div className="space-y-6">
              <SectionCard title="Administration pharmacies" icon={Users}>
                <div className="mb-4 grid gap-3 md:grid-cols-[1fr_220px_220px]">
                  <Input placeholder="Rechercher une pharmacie..." />
                  <SelectField label="Statut compte" values={PHARMACY_ACCOUNT_STATUSES} />
                  <SelectField label="Rôle connecté" values={PHARMACY_ROLES} />
                </div>
                <DataTable>
                  <table className="w-full min-w-[900px] text-sm">
                    <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                      <tr>{["Pharmacie", "Commune", "Source", "Statut", "Garde", "Qualité", "Actions admin"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {PHARMACY_PORTAL_PHARMACIES.map((p) => (
                        <tr key={p.name}>
                          <td className="px-4 py-3 font-bold text-foreground">{p.name}<p className="text-xs font-normal text-muted-foreground">{p.district}</p></td>
                          <td className="px-4 py-3">{p.commune}</td>
                          <td className="px-4 py-3">{p.source}</td>
                          <td className="px-4 py-3"><StatusBadge label={p.status} /></td>
                          <td className="px-4 py-3"><StatusBadge label={p.guard} /></td>
                          <td className="px-4 py-3"><StatusBadge label={p.quality} /></td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              <Button size="sm" className="bg-brand text-white hover:bg-brand-dark">Valider</Button>
                              <Button size="sm" variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light">Modifier</Button>
                              <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">Suspendre</Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </DataTable>
              </SectionCard>

              <SectionCard title="Gestion par administrateur" icon={ShieldCheck}>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <SelectField label="Choisir une pharmacie" values={PHARMACY_PORTAL_PHARMACIES.map((p) => p.name)} />
                  <SelectField label="Source de la donnée" values={DATA_SOURCES} />
                  <SelectField label="Niveau de fiabilité" values={RELIABILITY_LEVELS} />
                  <Field label="Note interne" />
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {["Ajouter des médicaments", "Modifier prix indicatifs", "Importer un fichier", "Marquer les données vérifiées"].map((item) => (
                    <Button key={item} variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light">{item}</Button>
                  ))}
                </div>
              </SectionCard>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
