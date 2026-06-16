"use client";

import { useEffect, useState } from "react";
import {
  Search,
  ClipboardList,
  Crown,
  ChevronRight,
  Timer,
  Plus,
  MapPin,
  Phone,
  Navigation,
  CheckCircle2,
  ShieldAlert,
  Zap,
  Pill,
  Headphones,
  ArrowRight,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { SearchBar } from "@/components/shared/search-bar";
import { SectionHeader } from "@/components/shared/section-header";
import { StatBlock } from "@/components/shared/stat-block";
import { MedicationStatusBadge } from "@/components/shared/status-badge";
import { GoogleMap } from "@/components/shared/google-map";
import { CategoryIcon } from "@/components/category-icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Heading, Eyebrow, Price } from "@/components/ui/typography";
import { useNav } from "@/store/nav";
import { formatFCFA, distanceKm } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Category, Medication, Pharmacy } from "@/lib/types";

// Abidjan center reference for distance display
const ABIDJAN_CENTER = { lat: 5.34, lon: -4.008 };

// The 7 categories requested, mapped to DB slugs with friendly names
const HOME_CATEGORIES: { slug: string; fallbackName: string }[] = [
  { slug: "douleur-fievre", fallbackName: "Douleur & Fièvre" },
  { slug: "antibiotiques", fallbackName: "Antibiotiques" },
  { slug: "respiratoire", fallbackName: "Toux & Rhume" },
  { slug: "vitamines", fallbackName: "Vitamines" },
  { slug: "digestif", fallbackName: "Digestion" },
  { slug: "dermatologie", fallbackName: "Peau & Soins" },
  { slug: "mere-enfant", fallbackName: "Bébé & Maman" },
];

// Deterministic status assignment for the "recently searched" table
function medStatus(med: Medication): "available" | "low-stock" | "out-of-stock" {
  const hash = med.slug.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const pct = hash % 10;
  if (pct < 7) return "available";
  if (pct < 9) return "low-stock";
  return "out-of-stock";
}

export function HomeView() {
  const { navigate } = useNav();
  const [categories, setCategories] = useState<Category[]>([]);
  const [popularMeds, setPopularMeds] = useState<Medication[]>([]);
  const [onDuty, setOnDuty] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [cats, meds, pharma] = await Promise.all([
          fetch("/api/categories").then((r) => r.json()),
          fetch("/api/medications?limit=8").then((r) => r.json()),
          fetch("/api/pharmacies?filter=on-duty").then((r) => r.json()),
        ]);
        if (!active) return;
        setCategories(cats);
        setPopularMeds(meds);
        setOnDuty(pharma.slice(0, 4));
      } catch {
        /* noop */
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Filter to the 7 requested categories, in the defined order
  const homeCategories = HOME_CATEGORIES.map((hc) => {
    const found = categories.find((c) => c.slug === hc.slug);
    return found ? { ...found, name: hc.fallbackName } : null;
  }).filter(Boolean) as Category[];

  // Top 6 meds for the "recently searched" table
  const recentMeds = popularMeds.slice(0, 6);

  return (
    <div className="flex flex-col">
      {/* ========================================================
          1. HERO
          ======================================================== */}
      <section className="relative overflow-hidden bg-brand-gradient">
        <div className="absolute inset-0 bg-dotted-white opacity-20" />
        <div className="absolute -right-20 -top-20 size-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 size-80 rounded-full bg-emerald-300/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-12 lg:px-8 lg:py-20">
          <div className="text-white">
            {/* Logo prominent */}
            <div className="mb-5 hidden items-center gap-2.5 lg:flex">
              <Logo size={44} variant="light" />
            </div>

            <h1 className="mt-4 text-3xl font-extrabold leading-[1.08] tracking-tight sm:text-4xl lg:text-5xl">
              Trouvez vos médicaments{" "}
              <span className="text-amber-300">plus rapidement</span>{" "}
              en Côte d&apos;Ivoire
            </h1>

            <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/85 sm:text-base">
              Recherchez un médicament, trouvez une pharmacie disponible près de chez vous,
              consultez les pharmacies ouvertes ou de garde, et estimez le coût de votre
              ordonnance. Simple, rapide et fiable.
            </p>

            {/* Large search bar */}
            <div className="mt-6 max-w-xl">
              <SearchBar
                variant="hero"
                placeholder="Rechercher un médicament (ex : Paracétamol)..."
              />
            </div>

            {/* Secondary action button */}
            <div className="mt-3 flex flex-wrap gap-2.5">
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
                onClick={() => navigate("prescription")}
              >
                <ClipboardList className="size-4" /> Estimer mon ordonnance
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="text-white hover:bg-white/10 hover:text-white"
                onClick={() => navigate("pharmacies", { filter: "on-duty" })}
              >
                <Timer className="size-4" /> Pharmacies de garde
              </Button>
            </div>

            {/* Popular searches */}
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-white/70">Recherches populaires :</span>
              {["Paracétamol", "Amoxicilline", "Vitamine C", "Coartem"].map((p) => (
                <button
                  key={p}
                  onClick={() => navigate("medications", { query: p })}
                  className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative hidden lg:block">
            <div className="relative overflow-hidden rounded-3xl border border-white/20 shadow-2xl">
              <img
                src="/images/hero-pharmacy.png"
                alt="Pharmacie moderne à Abidjan"
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-black/60 p-5">
                <div className="flex items-center gap-3 rounded-2xl bg-white/95 p-3 backdrop-blur-sm">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-brand-light text-brand">
                    <Plus className="size-6" strokeWidth={3} />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground">Pharmacie de la Riviera</p>
                    <p className="text-xs text-muted-foreground">Cocody · Ouvert maintenant</p>
                  </div>
                  <Badge className="border-0 bg-amber-400 text-[10px] font-bold text-amber-950">
                    <Timer className="size-3" /> De garde
                  </Badge>
                </div>
              </div>
            </div>
            {/* Floating badge */}
            <div className="absolute -left-4 top-6 hidden rounded-2xl bg-white p-3 shadow-premium-lg xl:block">
              <div className="flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-xl bg-success-light text-success">
                  <CheckCircle2 className="size-5" />
                </span>
                <div>
                  <p className="text-xs font-bold text-foreground">12 pharmacies</p>
                  <p className="text-[10px] text-muted-foreground">de garde ce soir</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          2. CONFIANCE — chiffres clés
          ======================================================== */}
      <section className="border-b border-border/60 bg-background">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatBlock
              icon={Plus}
              tone="brand"
              value="12"
              label="Pharmacies partenaires"
            />
            <StatBlock
              icon={Pill}
              tone="success"
              value="33+"
              label="Médicaments référencés"
            />
            <StatBlock
              icon={Search}
              tone="info"
              value="15 000+"
              label="Recherches effectuées"
            />
            <StatBlock
              icon={MapPin}
              tone="warning"
              value="12"
              label="Communes couvertes"
            />
          </div>
        </div>
      </section>

      {/* ========================================================
          3. CATÉGORIES
          ======================================================== */}
      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <SectionHeader
          title="Catégories de médicaments"
          subtitle="Explorez nos familles de produits santé en un clic"
          icon={<Pill className="size-5" />}
          action={{ label: "Voir tout", onClick: () => navigate("medications") }}
        />
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          {loading
            ? Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-2xl" />
              ))
            : homeCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => navigate("medications", { category: cat.slug })}
                  className="group flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-background p-5 text-center shadow-card transition-all hover:-translate-y-1 hover:border-brand/30 hover:shadow-premium-lg"
                >
                  <span
                    className="flex size-14 items-center justify-center rounded-2xl transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${cat.color}14` }}
                  >
                    <CategoryIcon name={cat.iconName} size={28} color={cat.color} />
                  </span>
                  <span className="text-sm font-bold leading-tight text-foreground transition-colors group-hover:text-brand">
                    {cat.name}
                  </span>
                </button>
              ))}
        </div>
      </section>

      {/* ========================================================
          4. PHARMACIES DE GARDE PROCHES
          ======================================================== */}
      <section className="bg-brand-soft/40">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <SectionHeader
            title="Pharmacies de garde proches"
            subtitle="Ouvertes maintenant près de chez vous à Abidjan"
            icon={<Timer className="size-5" />}
            action={{
              label: "Voir toutes",
              onClick: () => navigate("pharmacies", { filter: "on-duty" }),
            }}
          />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-56 rounded-2xl" />
                ))
              : onDuty.length > 0 ? (
                onDuty.map((p) => (
                  <DutyPharmacyCard key={p.id} pharma={p} />
                ))
              ) : (
                <Card className="col-span-full p-8 text-center text-sm text-muted-foreground">
                  Aucune pharmacie de garde pour le moment.
                </Card>
              )}
          </div>

          {/* Carte Google Maps des pharmacies de garde */}
          {onDuty.length > 0 && (
            <Card className="mt-6 overflow-hidden border-brand/20 py-0">
              <GoogleMap
                lat={onDuty[0].latitude}
                lng={onDuty[0].longitude}
                zoom={13}
                label="Pharmacies de garde Abidjan"
                title="Carte des pharmacies de garde"
                className="h-64 sm:h-72"
              />
            </Card>
          )}
        </div>
      </section>

      {/* ========================================================
          5. ESTIMATION ORDONNANCE + PREMIUM
          ======================================================== */}
      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Estimation */}
          <Card className="relative overflow-hidden border-brand/20 bg-brand-light py-0">
            <div className="absolute -right-8 -top-8 size-40 rounded-full bg-brand/10 blur-2xl" />
            <div className="relative flex h-full flex-col gap-4 p-6">
              <div className="flex items-center gap-3">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-premium">
                  <ClipboardList className="size-6" />
                </span>
                <Eyebrow>Estimation gratuite</Eyebrow>
              </div>
              <div>
                <Heading level="h3">Estimez votre ordonnance</Heading>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  Ajoutez plusieurs médicaments et obtenez instantanément un coût total
                  estimatif, avec la liste des pharmacies où les trouver au meilleur prix.
                </p>
              </div>
              <ul className="space-y-1.5 text-sm text-foreground/80">
                {[
                  "Ajoutez autant de médicaments que nécessaire",
                  "Fourchette de coût min. / max. en temps réel",
                  "Comparaison des prix par pharmacie",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 shrink-0 text-brand" /> {f}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-auto w-full bg-brand-gradient text-white hover:opacity-90"
                size="lg"
                onClick={() => navigate("prescription")}
              >
                <ClipboardList className="size-4" /> Commencer l&apos;estimation
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </Card>

          {/* Premium */}
          <Card className="relative overflow-hidden border-amber-500/30 bg-amber-50 py-0">
            <div className="absolute -right-10 -top-10 size-44 rounded-full bg-amber-300/20 blur-3xl" />
            <div className="relative flex h-full flex-col gap-4 p-6">
              <div className="flex items-center justify-between">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-premium">
                  <Crown className="size-6" />
                </span>
                <Badge className="border-0 bg-amber-500 text-[11px] font-bold text-white">
                  Recommandé
                </Badge>
              </div>
              <div>
                <Heading level="h3">Abonnement Premium</Heading>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Débloquez toutes les fonctionnalités avancées de SABLIN PHARMA.
                </p>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-extrabold text-brand-dark">500</span>
                <span className="text-sm font-semibold text-muted-foreground">FCFA / mois</span>
              </div>
              <ul className="grid grid-cols-1 gap-1.5 text-sm text-foreground/80 sm:grid-cols-2">
                {[
                  "Recherche illimitée",
                  "Estimation d'ordonnance",
                  "Pharmacies ouvertes",
                  "Pharmacies de garde",
                  "Historique complet",
                  "Favoris illimités",
                  "Alertes de disponibilité",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 shrink-0 text-amber-500" /> {f}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-auto w-full bg-amber-500 text-white hover:bg-amber-600"
                size="lg"
                onClick={() => navigate("subscription")}
              >
                <Crown className="size-4" /> S&apos;abonner maintenant
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* ========================================================
          6. MÉDICAMENTS RÉCEMMENT RECHERCHÉS — tableau
          ======================================================== */}
      <section className="bg-brand-soft/40">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <SectionHeader
            title="Médicaments récemment recherchés"
            subtitle="Prix indicatifs et disponibilité dans nos pharmacies partenaires"
            icon={<Zap className="size-5" />}
            action={{ label: "Voir tout", onClick: () => navigate("medications") }}
          />
          <Card className="mt-6 overflow-hidden border-border/60 py-0 shadow-premium">
            <div className="overflow-x-auto scroll-thin">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-border/60 bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold">Médicament</th>
                    <th className="px-5 py-3.5 font-semibold">Dosage</th>
                    <th className="px-5 py-3.5 font-semibold">Forme</th>
                    <th className="px-5 py-3.5 font-semibold">Prix indicatif</th>
                    <th className="px-5 py-3.5 font-semibold">Pharmacies</th>
                    <th className="px-5 py-3.5 font-semibold">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={6} className="px-5 py-3">
                          <Skeleton className="h-6 w-full" />
                        </td>
                      </tr>
                    ))
                  ) : (
                    recentMeds.map((m) => {
                      const status = medStatus(m);
                      return (
                        <tr
                          key={m.id}
                          onClick={() => navigate("medication-detail", { slug: m.slug })}
                          className="cursor-pointer transition-colors hover:bg-accent/40"
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-foreground">{m.name}</span>
                              {m.requiresRx && (
                                <ShieldAlert className="size-3.5 text-amber-500" />
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">{m.genericName}</span>
                          </td>
                          <td className="px-5 py-3.5 text-muted-foreground">{m.dosage}</td>
                          <td className="px-5 py-3.5 text-muted-foreground">{m.form}</td>
                          <td className="px-5 py-3.5">
                            <Price amount={m.avgPrice} size="sm" variant="brand" />
                          </td>
                          <td className="px-5 py-3.5 text-muted-foreground">
                            {m.pharmacyCount} dispo
                          </td>
                          <td className="px-5 py-3.5">
                            <MedicationStatusBadge status={status} />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </section>

      {/* ========================================================
          7. SUPPORT
          ======================================================== */}
      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <Card className="relative overflow-hidden border-brand/20 bg-brand-gradient py-0">
          <div className="absolute inset-0 bg-dotted-white opacity-15" />
          <div className="absolute -right-16 -top-16 size-56 rounded-full bg-white/10 blur-3xl" />
          <div className="relative flex flex-col items-center gap-6 p-8 text-center text-white sm:flex-row sm:p-10 sm:text-left">
            <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <Headphones className="size-8" />
            </span>
            <div className="flex-1">
              <h3 className="text-xl font-extrabold sm:text-2xl">
                Besoin d&apos;aide ?
              </h3>
              <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-white/85 sm:text-base">
                Notre équipe vous accompagne pour trouver vos médicaments plus facilement.
                Disponible 24h/24 pour vous orienter vers la pharmacie la plus proche.
              </p>
            </div>
            <div className="flex flex-col gap-2.5 sm:flex-row">
              <Button
                variant="outline"
                size="lg"
                className="border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
                asChild
              >
                <a href="tel:+2250700000000">
                  <Phone className="size-4" /> Appeler
                </a>
              </Button>
              <Button
                size="lg"
                className="bg-white text-brand-dark hover:bg-white/90"
                onClick={() => navigate("pharmacies", { filter: "on-duty" })}
              >
                Contacter le support <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}

/* ========================================================
   DutyPharmacyCard — carte pharmacie de garde enrichie
   Affiche : nom, commune, quartier, statut, distance, téléphone,
   boutons Voir détails / Itinéraire.
   ======================================================== */
function DutyPharmacyCard({ pharma }: { pharma: Pharmacy }) {
  const { navigate } = useNav();
  const dist = distanceKm(
    ABIDJAN_CENTER.lat,
    ABIDJAN_CENTER.lon,
    pharma.latitude,
    pharma.longitude
  );
  // Extract quartier from address (part after commune)
  const quartier = pharma.address.split(",")[0]?.trim() ?? pharma.commune;
  const mapsUrl = `https://www.google.com/maps?q=${pharma.latitude},${pharma.longitude}`;

  return (
    <Card className="gap-0 overflow-hidden border-border/70 py-0 shadow-card transition-all hover:-translate-y-1 hover:border-brand/30 hover:shadow-premium-lg">
      {/* Header banner */}
      <div className="relative flex items-center justify-between bg-brand px-4 py-3">
        {pharma.imageUrl && (
          <img
            src={pharma.imageUrl}
            alt={pharma.name}
            className="absolute inset-0 size-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
            <Plus className="size-5 text-white" strokeWidth={3} />
          </span>
          <Badge className="border-0 bg-amber-400 text-[10px] font-bold text-amber-950">
            <Timer className="size-3" /> De garde
          </Badge>
        </div>
        <span className="relative inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
          <span className="size-1.5 rounded-full bg-emerald-300 animate-pulse" />
          Ouvert
        </span>
      </div>

      {/* Body */}
      <div className="space-y-3 p-4">
        <div>
          <h3 className="text-sm font-bold leading-tight text-foreground">
            {pharma.name}
          </h3>
          <p className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground">
            <MapPin className="mt-0.5 size-3.5 shrink-0 text-brand/70" />
            <span>
              {quartier}, <span className="font-medium text-foreground/70">{pharma.commune}</span>
            </span>
          </p>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-brand-light px-2 py-1 font-semibold text-brand-dark">
            <Navigation className="size-3.5" /> {dist} km
          </span>
          <a
            href={`tel:${pharma.phone.replace(/\s/g, "")}`}
            className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-brand"
            onClick={(e) => e.stopPropagation()}
          >
            <Phone className="size-3.5" /> {pharma.phone.replace("+225 ", "")}
          </a>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            className="flex-1 bg-brand-gradient text-white hover:opacity-90"
            onClick={() => navigate("pharmacy-detail", { slug: pharma.slug })}
          >
            Voir détails <ChevronRight className="size-3.5" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            asChild
          >
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
              <Navigation className="size-3.5" /> Itinéraire
            </a>
          </Button>
        </div>
      </div>
    </Card>
  );
}
