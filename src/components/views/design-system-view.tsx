"use client";

/* ============================================================
   SABLIN PHARMA — Design System Showcase
   Documentation vivante de l'identité visuelle et des composants
   réutilisables de la plateforme (FR).
   ============================================================ */

import * as React from "react";
import {
  Search,
  Pill,
  Plus,
  MapPin,
  Timer,
  Crown,
  Bell,
  CheckCircle2,
  Phone,
  Navigation,
  ClipboardList,
  ChevronRight,
  ChevronLeft,
  Mail,
  Lock,
  Zap,
  TrendingUp,
  TrendingDown,
  Globe,
  LayoutGrid,
  Eye,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useNav } from "@/store/nav";

// shadcn/ui
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

// Typography primitives
import {
  Heading,
  Eyebrow,
  Text,
  Muted,
  Price,
  PriceRange,
} from "@/components/ui/typography";

// Shared brand components
import { Logo } from "@/components/logo";
import {
  MedicationStatusBadge,
  PharmacyStatusBadge,
  Open247Badge,
} from "@/components/shared/status-badge";
import { StatBlock, StatGrid } from "@/components/shared/stat-block";
import { AlertMessage } from "@/components/shared/alert-message";
import { EmptyState } from "@/components/shared/empty-state";
import { Loader, FullLoader, ButtonLoader } from "@/components/shared/loader";
import { MedicationCard } from "@/components/shared/medication-card";
import { PharmacyCard } from "@/components/shared/pharmacy-card";

import type { Medication, Pharmacy, MedicationStatus } from "@/lib/types";

// ============================================================
//  Données fictives pour la démonstration
// ============================================================

const demoMedications: Medication[] = [
  {
    id: "m1",
    name: "Paracétamol",
    slug: "paracetamol",
    genericName: "Paracétamol",
    categoryId: "c1",
    category: {
      id: "c1",
      name: "Douleur & Fièvre",
      slug: "douleur-fievre",
      description: null,
      iconName: "Thermometer",
      color: "#ef4444",
    },
    form: "Comprimé",
    dosage: "500 mg",
    packSize: "Boîte de 20",
    description:
      "Antidouleur et antipyrétique de première intention pour soulager fièvre et douleurs légères.",
    imageUrl: null,
    requiresRx: false,
    avgPrice: 150,
    createdAt: "2024-01-01T00:00:00.000Z",
    pharmacyCount: 12,
  },
  {
    id: "m2",
    name: "Amoxicilline",
    slug: "amoxicilline",
    genericName: "Amoxicilline",
    categoryId: "c2",
    category: {
      id: "c2",
      name: "Antibiotiques",
      slug: "antibiotiques",
      description: null,
      iconName: "ShieldCheck",
      color: "#0d9488",
    },
    form: "Gélule",
    dosage: "500 mg",
    packSize: "Boîte de 12",
    description:
      "Antibiotique à large spectre de la famille des pénicillines, sur ordonnance uniquement.",
    imageUrl: null,
    requiresRx: true,
    avgPrice: 1200,
    createdAt: "2024-01-01T00:00:00.000Z",
    pharmacyCount: 8,
  },
];

const demoPharmacies: Pharmacy[] = [
  {
    id: "p1",
    name: "Pharmacie de la Riviera",
    slug: "pharmacie-de-la-riviera",
    address: "Rue des Jardins, Riviera Palmeraie",
    commune: "Cocody",
    phone: "+225 27 22 00 00 00",
    hoursWeekday: "07h30 - 20h30",
    hoursSaturday: "08h00 - 20h00",
    hoursSunday: "09h00 - 13h00",
    isOpen247: false,
    isOnDuty: true,
    latitude: 5.36,
    longitude: -4.01,
    rating: 4.8,
    imageUrl: null,
    medicationCount: 28,
    openNow: true,
  },
  {
    id: "p2",
    name: "Pharmacie du Plateau",
    slug: "pharmacie-du-plateau",
    address: "Avenue Chardy, Le Plateau",
    commune: "Plateau",
    phone: "+225 27 22 11 11 11",
    hoursWeekday: "08h00 - 19h00",
    hoursSaturday: "08h00 - 13h00",
    hoursSunday: "Fermé",
    isOpen247: false,
    isOnDuty: false,
    latitude: 5.32,
    longitude: -4.02,
    rating: 4.6,
    imageUrl: null,
    medicationCount: 22,
    openNow: false,
  },
];

const tableRows: {
  name: string;
  dosage: string;
  price: string;
  pharmacies: number;
  status: MedicationStatus;
}[] = [
  { name: "Paracétamol", dosage: "500 mg", price: "150 FCFA", pharmacies: 12, status: "available" },
  { name: "Amoxicilline", dosage: "500 mg", price: "1 200 FCFA", pharmacies: 8, status: "available" },
  { name: "Ibuprofène", dosage: "400 mg", price: "350 FCFA", pharmacies: 5, status: "low-stock" },
  { name: "Coartem", dosage: "20/120 mg", price: "2 500 FCFA", pharmacies: 0, status: "out-of-stock" },
  { name: "Aspirine", dosage: "100 mg", price: "200 FCFA", pharmacies: 3, status: "to-confirm" },
];

const SECTIONS = [
  { id: "couleurs", label: "Couleurs" },
  { id: "typographie", label: "Typographie" },
  { id: "boutons", label: "Boutons" },
  { id: "badges", label: "Badges" },
  { id: "cartes", label: "Cartes" },
  { id: "stats", label: "Statistiques" },
  { id: "alertes", label: "Alertes" },
  { id: "etats", label: "États" },
  { id: "abonnement", label: "Portefeuille" },
  { id: "tableau", label: "Tableau" },
  { id: "formulaire", label: "Formulaire" },
] as const;

const premiumBenefits = [
  "Estimations d'ordonnance illimitées et prioritaires",
  "Alertes de prix et de stock en temps réel",
  "Notifications de pharmacie de garde personnalisées",
  "Accès anticipé aux nouveaux médicaments référencés",
  "Support prioritaire par téléphone et e-mail",
];

// ============================================================
//  Petits helpers de présentation
// ============================================================

function Swatch({
  name,
  value,
  className,
}: {
  name: string;
  value: string;
  className: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-background p-2.5 transition-colors hover:border-brand/30">
      <div
        className={cn(
          "size-12 shrink-0 rounded-lg border border-border/40 shadow-sm",
          className
        )}
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{name}</p>
        <p className="truncate font-mono text-xs text-muted-foreground">{value}</p>
      </div>
    </div>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
      {children}
    </h3>
  );
}

function SectionShell({
  id,
  eyebrow,
  title,
  description,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <Card className="border-border/70 py-0 shadow-card">
        <CardContent className="space-y-6 p-6">
          <div className="space-y-1.5">
            <Eyebrow>{eyebrow}</Eyebrow>
            <Heading level="h2">{title}</Heading>
            <Muted size="md">{description}</Muted>
          </div>
          {children}
        </CardContent>
      </Card>
    </section>
  );
}

// ============================================================
//  Vue principale
// ============================================================

export function DesignSystemView() {
  const { navigate } = useNav();

  return (
    <div className="min-h-screen bg-background">
      {/* ─────────── Hero ─────────── */}
      <header className="relative overflow-hidden bg-brand-gradient">
        <div className="bg-dotted-white absolute inset-0 opacity-30" />
        <div className="relative mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <button
            onClick={() => navigate("home")}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/25"
          >
            <ChevronLeft className="size-3.5" />
            Accueil
          </button>
          <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-3">
              <Logo size={56} variant="light" />
              <div className="space-y-2">
                <Eyebrow className="text-white/85">Plateforme santé</Eyebrow>
                <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
                  Design System
                </h1>
                <p className="max-w-xl text-sm leading-relaxed text-white/85 sm:text-base">
                  L&apos;identité visuelle de SABLIN PHARMA — composants,
                  couleurs, typographie. Une référence vivante pour des
                  interfaces pharmaceutiques modernes et premium.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-white backdrop-blur-sm">
              <LayoutGrid className="size-5 text-amber-300" />
              <div className="leading-none">
                <p className="text-xs font-medium uppercase tracking-wide text-white/70">
                  Version
                </p>
                <p className="text-lg font-extrabold">v1.0</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ─────────── Corps ─────────── */}
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="lg:flex lg:items-start lg:gap-8">
          {/* Navigation latérale sticky (desktop) */}
          <aside className="hidden lg:block lg:w-56 lg:shrink-0">
            <nav className="sticky top-24 space-y-1">
              <p className="mb-3 px-3 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Sommaire
              </p>
              {SECTIONS.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-brand-light/60 hover:text-brand-dark"
                >
                  {s.label}
                  <ChevronRight className="size-3.5 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                </a>
              ))}
              <Separator className="my-3" />
              <div className="rounded-lg bg-brand-light/50 px-3 py-3">
                <p className="flex items-center gap-1.5 text-xs font-bold text-brand-dark">
                  <Zap className="size-3.5" />
                  Composants réutilisables
                </p>
                <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                  Tous les composants de cette page sont exportés et prêts à
                  l&apos;emploi dans les vues de la plateforme.
                </p>
              </div>
            </nav>
          </aside>

          {/* Contenu principal */}
          <main className="min-w-0 flex-1 space-y-12">
            {/* ─────────── 1. Couleurs ─────────── */}
            <SectionShell
              id="couleurs"
              eyebrow="Fondations"
              title="Couleurs"
              description="La palette pharmaceutique de SABLIN PHARMA : un vert dominant pour la confiance, des touches douces pour les statuts et un blanc dominant pour la clarté."
            >
              <div className="space-y-2">
                <SubTitle>Palette principale</SubTitle>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <Swatch
                    name="Brand"
                    value="oklch(0.58 0.14 156)"
                    className="bg-brand"
                  />
                  <Swatch
                    name="Brand Dark"
                    value="oklch(0.34 0.08 156)"
                    className="bg-brand-dark"
                  />
                  <Swatch
                    name="Brand Light"
                    value="oklch(0.95 0.03 156)"
                    className="bg-brand-light"
                  />
                  <Swatch
                    name="Background"
                    value="oklch(0.995 0.004 156)"
                    className="bg-background"
                  />
                  <Swatch
                    name="Muted"
                    value="oklch(0.965 0.008 156)"
                    className="bg-muted"
                  />
                  <Swatch
                    name="Foreground"
                    value="oklch(0.22 0.02 156)"
                    className="bg-foreground"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <SubTitle>Statuts</SubTitle>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  <Swatch
                    name="Success"
                    value="Disponible · Ouvert"
                    className="bg-success"
                  />
                  <Swatch
                    name="Success Light"
                    value="oklch(0.95 0.04 150)"
                    className="bg-success-light"
                  />
                  <Swatch
                    name="Warning"
                    value="Stock faible · De garde"
                    className="bg-warning"
                  />
                  <Swatch
                    name="Warning Light"
                    value="oklch(0.96 0.05 75)"
                    className="bg-warning-light"
                  />
                  <Swatch
                    name="Danger"
                    value="Rupture · Fermé"
                    className="bg-danger"
                  />
                  <Swatch
                    name="Danger Light"
                    value="oklch(0.96 0.04 25)"
                    className="bg-danger-light"
                  />
                  <Swatch
                    name="Info"
                    value="À confirmer"
                    className="bg-info"
                  />
                  <Swatch
                    name="Info Light"
                    value="oklch(0.95 0.04 240)"
                    className="bg-info-light"
                  />
                  <Swatch
                    name="Neutral"
                    value="Neutre"
                    className="bg-neutral"
                  />
                  <Swatch
                    name="Neutral Light"
                    value="oklch(0.96 0.005 156)"
                    className="bg-neutral-light"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <SubTitle>Dégradés & utilitaires</SubTitle>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="overflow-hidden rounded-lg border border-border/60">
                    <div className="bg-brand-gradient h-16" />
                    <div className="bg-background p-2.5">
                      <p className="text-sm font-semibold text-foreground">
                        bg-brand-gradient
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">
                        Hero, en-têtes premium
                      </p>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-lg border border-border/60">
                    <div className="bg-brand-soft h-16" />
                    <div className="bg-background p-2.5">
                      <p className="text-sm font-semibold text-foreground">
                        bg-brand-soft
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">
                        Fonds clairs dégradés
                      </p>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-lg border border-border/60">
                    <div className="bg-dotted bg-brand-light/40 h-16" />
                    <div className="bg-background p-2.5">
                      <p className="text-sm font-semibold text-foreground">
                        bg-dotted
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">
                        Texture points pharmacie
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </SectionShell>

            {/* ─────────── 2. Typographie ─────────── */}
            <SectionShell
              id="typographie"
              eyebrow="Textes & hiérarchie"
              title="Typographie"
              description="Une hiérarchie claire pour guider la lecture : eyebrow > titre > texte > muted > prix. Police Plus Jakarta Sans, Graisses extrabold pour les titres."
            >
              <div className="space-y-4">
                <div className="rounded-xl border border-border/60 bg-brand-light/30 p-5">
                  <Eyebrow>Plateforme santé</Eyebrow>
                  <Heading level="h1" className="mt-1">
                    Santé pour tous
                  </Heading>
                  <Heading level="h2" className="mt-2">
                    Santé pour tous
                  </Heading>
                  <Heading level="h3" className="mt-2">
                    Santé pour tous
                  </Heading>
                  <Heading level="h4" className="mt-1">
                    Santé pour tous
                  </Heading>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 rounded-xl border border-border/60 p-4">
                    <SubTitle>Tailles de texte</SubTitle>
                    <Text size="xs">Texte xs — Légendes et détails</Text>
                    <Text size="sm">Texte sm — Informations secondaires</Text>
                    <Text size="md">Texte md — Corps par défaut</Text>
                    <Text size="lg">Texte lg — Lecture confortable</Text>
                    <Muted size="xs">Muted — Texte discret et secondaire</Muted>
                  </div>

                  <div className="space-y-3 rounded-xl border border-border/60 p-4">
                    <SubTitle>Prix (FCFA)</SubTitle>
                    <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
                      <Price amount={150} size="sm" />
                      <Price amount={150} size="md" />
                      <Price amount={150} size="lg" />
                      <Price amount={150} size="xl" />
                    </div>
                    <Separator />
                    <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
                      <Price amount={150} size="md" variant="brand" from />
                      <Price amount={150} size="md" variant="dark" />
                      <Price amount={150} size="md" variant="muted" />
                    </div>
                    <Separator />
                    <div className="space-y-1">
                      <Muted size="xs">Fourchette de prix</Muted>
                      <PriceRange min={100} max={150} size="md" />
                    </div>
                  </div>
                </div>
              </div>
            </SectionShell>

            {/* ─────────── 3. Boutons ─────────── */}
            <SectionShell
              id="boutons"
              eyebrow="Actions"
              title="Boutons"
              description="Neuf variantes couvrant tous les contextes d'action : principal, gradient premium, contour, secondaire, fantôme, destructeur, succès, avertissement et lien."
            >
              <div className="space-y-5">
                <div className="space-y-2">
                  <SubTitle>Variantes</SubTitle>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="default">Default</Button>
                    <Button variant="brand-gradient">Brand Gradient</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="destructive">Destructive</Button>
                    <Button variant="success">Success</Button>
                    <Button variant="warning">Warning</Button>
                    <Button variant="link">Link</Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <SubTitle>Tailles</SubTitle>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button size="sm">Small</Button>
                    <Button size="default">Default</Button>
                    <Button size="lg">Large</Button>
                    <Button size="icon" aria-label="Ajouter">
                      <Plus className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <SubTitle>Avec icônes</SubTitle>
                  <div className="flex flex-wrap gap-3">
                    <Button>
                      <Search className="size-4" />
                      Rechercher
                    </Button>
                    <Button variant="outline">
                      <Eye className="size-4" />
                      Voir détails
                    </Button>
                    <Button variant="brand-gradient">
                      <Crown className="size-4" />
                      Recharger
                    </Button>
                    <Button variant="outline">
                      <ClipboardList className="size-4" />
                      Estimer ordonnance
                    </Button>
                    <Button variant="success">
                      <Phone className="size-4" />
                      Appeler
                    </Button>
                    <Button variant="outline">
                      <Navigation className="size-4" />
                      Itinéraire
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <SubTitle>États</SubTitle>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button>Normal</Button>
                    <Button disabled>Désactivé</Button>
                    <Button variant="brand-gradient" disabled>
                      <Crown className="size-4" />
                      Crédits désactivé
                    </Button>
                  </div>
                </div>
              </div>
            </SectionShell>

            {/* ─────────── 4. Badges ─────────── */}
            <SectionShell
              id="badges"
              eyebrow="Étiquettes de statut"
              title="Badges"
              description="Des badges sémantiques pour communiquer instantanément l'état d'un médicament ou d'une pharmacie, complétés par les badges shadcn classiques."
            >
              <div className="space-y-5">
                <div className="space-y-2">
                  <SubTitle>Médicaments</SubTitle>
                  <div className="flex flex-wrap gap-3 rounded-xl border border-border/60 p-4">
                    <MedicationStatusBadge status="available" size="md" />
                    <MedicationStatusBadge status="low-stock" size="md" />
                    <MedicationStatusBadge status="out-of-stock" size="md" />
                    <MedicationStatusBadge status="to-confirm" size="md" />
                  </div>
                </div>

                <div className="space-y-2">
                  <SubTitle>Pharmacies</SubTitle>
                  <div className="flex flex-wrap gap-3 rounded-xl border border-border/60 p-4">
                    <PharmacyStatusBadge status="open" size="md" />
                    <PharmacyStatusBadge status="closed" size="md" />
                    <PharmacyStatusBadge status="on-duty" size="md" />
                    <Open247Badge size="md" />
                  </div>
                </div>

                <div className="space-y-2">
                  <SubTitle>Badges shadcn classiques</SubTitle>
                  <div className="flex flex-wrap gap-3 rounded-xl border border-border/60 p-4">
                    <Badge>Default</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="outline">Outline</Badge>
                    <Badge variant="destructive">Destructive</Badge>
                  </div>
                </div>
              </div>
            </SectionShell>

            {/* ─────────── 5. Cartes ─────────── */}
            <SectionShell
              id="cartes"
              eyebrow="Composants produits"
              title="Cartes"
              description="Cartes premium pour présenter médicaments et pharmacies. Effets de survol subtils (translation, bordure brand, ombre premium)."
            >
              <div className="space-y-6">
                <div className="space-y-2">
                  <SubTitle>MedicationCard</SubTitle>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {demoMedications.map((m) => (
                      <MedicationCard key={m.id} med={m} />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <SubTitle>PharmacyCard</SubTitle>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {demoPharmacies.map((p) => (
                      <PharmacyCard key={p.id} pharma={p} />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <SubTitle>Card shadcn (structure basique)</SubTitle>
                  <Card className="max-w-md border-border/70 py-0 shadow-card">
                    <CardHeader>
                      <CardTitle>Titre de la carte</CardTitle>
                      <CardDescription>
                        Description courte pour contextualiser le contenu.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Text size="sm">
                        Contenu principal de la carte. Utilisé pour les
                        encarts d&apos;information, les résumés et les
                        formulaires courts.
                      </Text>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </SectionShell>

            {/* ─────────── 6. Statistiques ─────────── */}
            <SectionShell
              id="stats"
              eyebrow="Indicateurs"
              title="Statistiques"
              description="Blocs de statistiques premium avec icône colorée, valeur en gras et label. Six tonalités disponibles pour s'adapter au contexte."
            >
              <div className="space-y-5">
                <div className="space-y-2">
                  <SubTitle>Grille principale</SubTitle>
                  <StatGrid
                    stats={[
                      {
                        icon: Plus,
                        value: "12",
                        label: "Pharmacies",
                        tone: "brand",
                      },
                      {
                        icon: Pill,
                        value: "33+",
                        label: "Médicaments",
                        tone: "success",
                      },
                      {
                        icon: Timer,
                        value: "24/7",
                        label: "De garde",
                        tone: "warning",
                      },
                      {
                        icon: MapPin,
                        value: "Abidjan",
                        label: "Couverture",
                        tone: "info",
                      },
                    ]}
                  />
                </div>

                <div className="space-y-2">
                  <SubTitle>Tonalités & tendances</SubTitle>
                  <StatGrid
                    stats={[
                      {
                        icon: TrendingUp,
                        value: "+18%",
                        label: "Recherches",
                        tone: "success",
                        trend: { value: "4%", up: true },
                      },
                      {
                        icon: TrendingDown,
                        value: "-3%",
                        label: "Ruptures",
                        tone: "danger",
                        trend: { value: "2%", up: false },
                      },
                      {
                        icon: Bell,
                        value: "4",
                        label: "Non lues",
                        tone: "warning",
                      },
                      {
                        icon: Crown,
                        value: "1 240",
                        label: "Crédits",
                        tone: "neutral",
                      },
                    ]}
                  />
                </div>
              </div>
            </SectionShell>

            {/* ─────────── 7. Alertes ─────────── */}
            <SectionShell
              id="alertes"
              eyebrow="Messages contextuels"
              title="Alertes & messages"
              description="Quatre variantes pour informer, confirmer, avertir ou signaler une erreur. Icône intégrée, titre optionnel et contenu libre."
            >
              <div className="space-y-3">
                <AlertMessage
                  variant="info"
                  title="Information"
                >
                  Votre demande d&apos;estimation d&apos;ordonnance a bien été
                  prise en compte et sera traitée immédiatement.
                </AlertMessage>
                <AlertMessage
                  variant="success"
                  title="Estimation terminée"
                >
                  L&apos;estimation de votre ordonnance est prête. Fourchette
                  totale : <strong>3 200 — 4 100 FCFA</strong> dans 7
                  pharmacies.
                </AlertMessage>
                <AlertMessage
                  variant="warning"
                  title="Stock faible"
                >
                  Le médicament recherché est en stock faible dans 3
                  pharmacies. Pensez à appeler avant de vous déplacer.
                </AlertMessage>
                <AlertMessage
                  variant="error"
                  title="Erreur d&apos;estimation"
                >
                  Impossible d&apos;estimer le prix de cet élément.
                  Vérifiez votre ordonnance ou réessayez ultérieurement.
                </AlertMessage>
              </div>
            </SectionShell>

            {/* ─────────── 8. États ─────────── */}
            <SectionShell
              id="etats"
              eyebrow="Vides & chargements"
              title="États"
              description="Composants dédiés aux états transitoires : liste vide, chargement en cours, skeletons. Indispensables pour une UX fluide et rassurante."
            >
              <div className="space-y-6">
                <div className="space-y-2">
                  <SubTitle>EmptyState</SubTitle>
                  <div className="rounded-xl border border-border/60 bg-brand-light/20">
                    <EmptyState
                      icon={Search}
                      title="Aucun résultat"
                      description="Essayez avec d'autres mots-clés ou ajustez vos filtres pour trouver le médicament recherché."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <SubTitle>Loader</SubTitle>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="flex flex-col items-center gap-3 rounded-xl border border-border/60 p-5">
                      <Loader size="sm" label="sm" />
                    </div>
                    <div className="flex flex-col items-center gap-3 rounded-xl border border-border/60 p-5">
                      <Loader size="md" label="md" />
                    </div>
                    <div className="flex flex-col items-center gap-3 rounded-xl border border-border/60 p-5">
                      <Loader size="lg" label="lg" />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 p-5">
                    <Button disabled>
                      <ButtonLoader />
                      Chargement…
                    </Button>
                    <Button variant="outline" disabled>
                      <ButtonLoader />
                      Vérification
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <SubTitle>FullLoader</SubTitle>
                  <div className="overflow-hidden rounded-xl border border-border/60">
                    <div className="max-h-48 overflow-hidden">
                      <FullLoader label="Chargement du design system…" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <SubTitle>Loading skeletons</SubTitle>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {[0, 1, 2].map((i) => (
                      <Card
                        key={i}
                        className="gap-0 border-border/60 py-0"
                      >
                        <Skeleton className="h-28 rounded-b-none" />
                        <div className="space-y-2.5 p-4">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                          <Skeleton className="h-3 w-2/3" />
                          <div className="flex items-center justify-between pt-2">
                            <Skeleton className="h-6 w-20" />
                            <Skeleton className="h-4 w-14" />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </SectionShell>

            {/* ─────────── 9. Portefeuille Crédits ─────────── */}
            <section id="abonnement" className="scroll-mt-24">
              <Card className="overflow-hidden border-brand/20 py-0 shadow-premium-lg">
                <div className="relative bg-brand-gradient p-6 text-white">
                  <div className="bg-dotted-white absolute inset-0 opacity-30" />
                  <div className="relative flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <Eyebrow className="text-amber-200">
                        Portefeuille Crédits
                      </Eyebrow>
                      <h3 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                        Passez Crédits
                      </h3>
                      <p className="max-w-md text-sm leading-relaxed text-white/85">
                        Débloquez toutes les fonctionnalités avancées et
                        soutenez le développement de la plateforme.
                      </p>
                    </div>
                    <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                      <Crown className="size-7 text-amber-300" />
                    </span>
                  </div>
                  <div className="relative mt-5 flex items-baseline gap-1.5">
                    <span className="text-4xl font-extrabold tabular-nums sm:text-5xl">
                      500
                    </span>
                    <span className="text-base font-medium text-white/85">
                      FCFA / mois
                    </span>
                  </div>
                </div>
                <CardContent className="space-y-5 p-6">
                  <ul className="space-y-2.5">
                    {premiumBenefits.map((b) => (
                      <li key={b} className="flex items-start gap-2.5">
                        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-brand" />
                        <Text size="sm">{b}</Text>
                      </li>
                    ))}
                  </ul>
                  <Separator />
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      size="lg"
                      className="flex-1 bg-brand-gradient text-white hover:opacity-90"
                    >
                      <Crown className="size-4" />
                      Recharger
                    </Button>
                    <Button size="lg" variant="outline" className="flex-1">
                      En savoir plus
                    </Button>
                  </div>
                  <Muted size="xs" className="text-center">
                    Annulable à tout moment · Sans engagement · Paiement
                    sécurisé
                  </Muted>
                </CardContent>
              </Card>
            </section>

            {/* ─────────── 10. Tableau ─────────── */}
            <SectionShell
              id="tableau"
              eyebrow="Données tabulaires"
              title="Tableau"
              description="Exemple de tableau pour présenter des listes structurées. Responsive grâce à un conteneur à défilement horizontal sur petits écrans."
            >
              <div className="overflow-hidden rounded-xl border border-border/70">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-brand-light/40 hover:bg-brand-light/40">
                      <TableHead className="font-bold text-brand-dark">
                        Médicament
                      </TableHead>
                      <TableHead className="font-bold text-brand-dark">
                        Dosage
                      </TableHead>
                      <TableHead className="font-bold text-brand-dark">
                        Prix moyen
                      </TableHead>
                      <TableHead className="font-bold text-brand-dark">
                        Pharmacies
                      </TableHead>
                      <TableHead className="font-bold text-brand-dark">
                        Statut
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableRows.map((row) => (
                      <TableRow key={row.name}>
                        <TableCell className="font-semibold text-foreground">
                          {row.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {row.dosage}
                        </TableCell>
                        <TableCell className="font-bold text-brand-dark">
                          {row.price}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {row.pharmacies} dispo.
                        </TableCell>
                        <TableCell>
                          <MedicationStatusBadge status={row.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Muted size="xs">
                Données fictives présentées à titre indicatif. Les prix peuvent
                varier selon les pharmacies partenaires.
              </Muted>
            </SectionShell>

            {/* ─────────── 11. Formulaire ─────────── */}
            <SectionShell
              id="formulaire"
              eyebrow="Saisie utilisateur"
              title="Formulaire"
              description="Combinaison des champs shadcn : Input, Label, Select, Switch, Checkbox et Button. Validation et états gérés côté formulaire parent."
            >
              <Card className="border-border/70 py-0 shadow-card">
                <CardContent className="space-y-5 p-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="ds-email">
                        <Mail className="size-3.5 text-muted-foreground" />
                        E-mail
                      </Label>
                      <Input
                        id="ds-email"
                        type="email"
                        placeholder="vous@exemple.ci"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ds-phone">Téléphone</Label>
                      <Input
                        id="ds-phone"
                        type="tel"
                        placeholder="+225 07 00 00 00 00"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Commune</Label>
                    <Select>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sélectionnez votre commune" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cocody">Cocody</SelectItem>
                        <SelectItem value="plateau">Plateau</SelectItem>
                        <SelectItem value="yopougon">Yopougon</SelectItem>
                        <SelectItem value="marcory">Marcory</SelectItem>
                        <SelectItem value="treichville">Treichville</SelectItem>
                        <SelectItem value="adjame">Adjamé</SelectItem>
                        <SelectItem value="abobo">Abobo</SelectItem>
                        <SelectItem value="koumassi">Koumassi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                    <div className="space-y-0.5">
                      <Label
                        htmlFor="ds-notifs"
                        className="text-sm font-semibold"
                      >
                        Notifications push
                      </Label>
                      <Muted size="xs">
                        Recevez les alertes de pharmacie de garde
                      </Muted>
                    </div>
                    <Switch id="ds-notifs" defaultChecked />
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Checkbox id="ds-terms" className="mt-0.5" />
                    <Label
                      htmlFor="ds-terms"
                      className="text-sm font-normal leading-relaxed text-muted-foreground"
                    >
                      J&apos;accepte les conditions d&apos;utilisation et la
                      politique de confidentialité de SABLIN PHARMA.
                    </Label>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      type="submit"
                      className="flex-1 bg-brand-gradient text-white hover:opacity-90"
                    >
                      <Lock className="size-4" />
                      Envoyer la demande
                    </Button>
                    <Button type="reset" variant="outline" className="flex-1">
                      Réinitialiser
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </SectionShell>
          </main>
        </div>

        {/* ─────────── Footer du showcase ─────────── */}
        <footer className="mt-16 border-t border-border/60 pt-8">
          <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
            <div className="flex items-center gap-2">
              <Globe className="size-4 text-brand" />
              <Muted size="sm">
                SABLIN PHARMA Design System v1.0 — Composants réutilisables
                pour une plateforme pharmaceutique moderne et premium.
              </Muted>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-brand-light px-3 py-1.5">
              <span className="size-1.5 animate-pulse rounded-full bg-brand" />
              <span className="text-xs font-bold text-brand-dark">
                Documentation vivante
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
