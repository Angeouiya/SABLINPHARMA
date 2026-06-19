"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  Search,
  ChevronLeft,
  X,
  Clock,
  Timer,
  MapPin,
  Plus,
  Phone,
  Navigation,
  ChevronRight,
  SlidersHorizontal,
  CheckCircle2,
  MapPinned,
  Pill,
  Stethoscope,
  Baby,
  Cross,
  ArrowRight,
  Lock,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { GoogleMap } from "@/components/shared/google-map";
import { CreditCost } from "@/components/shared/credit-cost";
import { Heading, Eyebrow, Muted } from "@/components/ui/typography";
import { useNav } from "@/store/nav";
import { distanceKm } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Pharmacy } from "@/lib/types";

const COMMUNES = [
  "Cocody",
  "Plateau",
  "Yopougon",
  "Marcory",
  "Treichville",
  "Adjamé",
  "Abobo",
  "Koumassi",
  "Port-Bouët",
  "Attécoubé",
  "Bingerville",
  "Songon",
];

const SERVICES = [
  { key: "247", label: "Ouvert 24/7" },
  { key: "garde", label: "Pharmacie de garde" },
  { key: "parking", label: "Parking" },
  { key: "delivery", label: "Livraison" },
];

type QuickFilter = "all" | "open" | "on-duty" | "near";

const ABIDJAN_CENTER = { lat: 5.34, lon: -4.008 };

interface Filters {
  commune: string;
  quartier: string;
  openNow: boolean;
  onDuty: boolean;
  nearMe: boolean;
  maxDistance: string;
  medication: string;
  service: string;
}

const DEFAULT_FILTERS: Filters = {
  commune: "all",
  quartier: "",
  openNow: false,
  onDuty: false,
  nearMe: false,
  maxDistance: "all",
  medication: "",
  service: "all",
};

export function PharmaciesView() {
  const { params, navigate } = useNav();
  const [allPharmacies, setAllPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(params.query ?? "");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>(
    (params.filter === "on-duty" || params.filter === "open" ? (params.filter as QuickFilter) : "all")
  );
  const [filters, setFilters] = useState<Filters>({
    ...DEFAULT_FILTERS,
    commune: "all",
  });
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const mobileFiltersRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!showFiltersMobile) return;
    const id = window.setTimeout(() => {
      mobileFiltersRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 40);
    return () => window.clearTimeout(id);
  }, [showFiltersMobile]);

  // Fetch all pharmacies once
  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      try {
        const r = await fetch("/api/pharmacies");
        const data = await r.json();
        if (active) setAllPharmacies(data);
      } catch {
        if (active) setAllPharmacies([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Enrich pharmacies with distance
  const enriched = useMemo(
    () =>
      allPharmacies.map((p) => ({
        ...p,
        distance: distanceKm(ABIDJAN_CENTER.lat, ABIDJAN_CENTER.lon, p.latitude, p.longitude),
      })),
    [allPharmacies]
  );

  // On-duty pharmacies (for the special section)
  const onDutyPharmacies = useMemo(
    () => enriched.filter((p) => p.isOnDuty).slice(0, 3),
    [enriched]
  );

  // Client-side filtering
  const filteredPharmacies = useMemo(() => {
    let result = enriched;

    // Query
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.commune.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q)
      );
    }

    // Quick filter
    if (quickFilter === "open") result = result.filter((p) => p.openNow);
    if (quickFilter === "on-duty") result = result.filter((p) => p.isOnDuty);
    if (quickFilter === "near") {
      result = [...result].sort((a, b) => a.distance - b.distance).slice(0, 6);
    }

    // Commune
    if (filters.commune !== "all") {
      result = result.filter((p) => p.commune === filters.commune);
    }

    // Quartier
    if (filters.quartier.trim()) {
      const q = filters.quartier.toLowerCase().trim();
      result = result.filter((p) => p.address.toLowerCase().includes(q));
    }

    // Open now
    if (filters.openNow) result = result.filter((p) => p.openNow);

    // On duty
    if (filters.onDuty) result = result.filter((p) => p.isOnDuty);

    // Max distance
    if (filters.maxDistance !== "all") {
      const max = parseFloat(filters.maxDistance);
      result = result.filter((p) => p.distance <= max);
    }

    // Sort: nearMe first, then on-duty, then rating
    if (filters.nearMe) {
      result = [...result].sort((a, b) => a.distance - b.distance);
    } else {
      result = [...result].sort((a, b) => {
        if (a.isOnDuty !== b.isOnDuty) return a.isOnDuty ? -1 : 1;
        return b.rating - a.rating;
      });
    }

    return result;
  }, [enriched, query, quickFilter, filters]);

  const activeFiltersCount =
    (filters.commune !== "all" ? 1 : 0) +
    (filters.quartier.trim() ? 1 : 0) +
    (filters.openNow ? 1 : 0) +
    (filters.onDuty ? 1 : 0) +
    (filters.nearMe ? 1 : 0) +
    (filters.maxDistance !== "all" ? 1 : 0) +
    (filters.medication.trim() ? 1 : 0) +
    (filters.service !== "all" ? 1 : 0);

  const resetAll = () => {
    setQuery("");
    setQuickFilter("all");
    setFilters(DEFAULT_FILTERS);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back link */}
      <button
        onClick={() => navigate("home")}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-brand"
      >
        <ChevronLeft className="size-4" /> Accueil
      </button>

      {/* Header */}
      <div className="flex flex-col gap-2">
        <Eyebrow>Recherche de pharmacies</Eyebrow>
        <Heading level="h1">Pharmacies</Heading>
        <p className="text-sm text-muted-foreground sm:text-base">
          Trouvez une pharmacie proche, ouverte ou de garde à Abidjan, et accédez à toutes
          les informations utiles.
        </p>
      </div>

      {/* ============ SEARCH ZONE ============ */}
      <Card className="mt-6 overflow-hidden border-border/70 p-4 shadow-avance sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une pharmacie, une commune ou un quartier"
              className="h-12 border-border bg-background pl-11 pr-10 text-[15px]"
              aria-label="Rechercher une pharmacie"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Effacer"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          <Button
            size="lg"
            className="h-12 w-full shrink-0 bg-brand text-white hover:opacity-90 sm:w-auto"
          >
            <Search className="size-4" /> Rechercher
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="relative h-12 w-full shrink-0 lg:hidden"
            onClick={() => setShowFiltersMobile((v) => !v)}
            aria-expanded={showFiltersMobile}
            aria-controls="pharmacies-mobile-filters"
          >
            <SlidersHorizontal className="size-4" /> Filtres
            {activeFiltersCount > 0 && (
              <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </div>
        <p className="mt-2.5 text-xs text-muted-foreground">
          <span className="font-medium">Exemple :</span> Cocody, Yopougon, Marcory,
          Pharmacie de garde, Riviera…
        </p>

        {/* Quick filter chips */}
        <div className="mt-3 flex flex-wrap gap-2">
          {(
            [
              { key: "all" as const, label: "Toutes", icon: Plus },
              { key: "open" as const, label: "Ouvertes maintenant", icon: Clock },
              { key: "on-duty" as const, label: "De garde", icon: Timer },
              { key: "near" as const, label: "À proximité", icon: Navigation },
            ]
          ).map((chip) => {
            const active = quickFilter === chip.key;
            return (
              <button
                key={chip.key}
                onClick={() => setQuickFilter(chip.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                  active
                    ? "border-brand bg-brand text-white"
                    : "border-border bg-background text-foreground/70 hover:border-brand/40 hover:text-brand"
                )}
              >
                <chip.icon className="size-3.5" /> {chip.label}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Mobile filters: close to the trigger so the button never feels inactive */}
      {showFiltersMobile && (
        <Card
          id="pharmacies-mobile-filters"
          ref={mobileFiltersRef}
          className="mt-4 overflow-hidden border-border/70 p-4 shadow-avance lg:hidden"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold">Filtres pharmacies</h3>
            <button
              onClick={() => setShowFiltersMobile(false)}
              className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Fermer les filtres"
            >
              <X className="size-4" />
            </button>
          </div>
          <FiltersPanel
            filters={filters}
            setFilters={setFilters}
            activeCount={activeFiltersCount}
            onReset={() => setFilters(DEFAULT_FILTERS)}
            isMobile
          />
        </Card>
      )}

      {/* ============ ON-DUTY SECTION (highlighted) ============ */}
      {!loading && onDutyPharmacies.length > 0 && (
        <section className="mt-6">
          <Card className="overflow-hidden border-amber-500/30 py-0 shadow-avance">
            <div className="flex items-center gap-3 border-b border-amber-500/20 bg-amber-50 px-5 py-3.5">
              <span className="flex size-10 items-center justify-center rounded-xl bg-amber-400 text-amber-950">
                <Timer className="size-5" />
              </span>
              <div className="flex-1">
                <h2 className="text-base font-extrabold text-foreground">
                  Pharmacies de garde proches
                </h2>
                <p className="text-xs text-muted-foreground">
                  Actuellement de garde à Abidjan — pour vos urgences
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="hidden text-amber-700 hover:bg-amber-50 sm:inline-flex"
                onClick={() => setQuickFilter("on-duty")}
              >
                Voir tout <ArrowRight className="size-3.5" />
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {onDutyPharmacies.map((p) => (
                <OnDutyMiniCard key={p.id} pharma={p} />
              ))}
            </div>
          </Card>
        </section>
      )}

      {/* ============ GOOGLE MAP ============ */}
      <section className="mt-6">
        <Card className="overflow-hidden border-brand/20 py-0">
          <GoogleMap
            lat={5.34}
            lng={-4.008}
            zoom={12}
            label="Pharmacies Abidjan"
            title="Carte des pharmacies à Abidjan"
            className="h-72 sm:h-80"
          />
        </Card>
      </section>

      {/* ============ MAIN LAYOUT: filters sidebar + results ============ */}
      <div className="mt-6 grid min-w-0 gap-6 lg:grid-cols-[270px_1fr]">
        {/* Desktop filters sidebar */}
        <aside className="hidden lg:block">
          <FiltersPanel
            filters={filters}
            setFilters={setFilters}
            activeCount={activeFiltersCount}
            onReset={() => setFilters(DEFAULT_FILTERS)}
          />
        </aside>

        {/* Results */}
        <div className="min-w-0">
          {/* Toolbar */}
          <div className="mb-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {loading ? (
                "Chargement..."
              ) : (
                <>
                  <span className="font-bold text-foreground">
                    {filteredPharmacies.length}
                  </span>{" "}
                  pharmacie{filteredPharmacies.length > 1 ? "s" : ""} trouvée
                  {filteredPharmacies.length > 1 ? "s" : ""}
                </>
              )}
            </p>
            {activeFiltersCount > 0 && (
              <button
                onClick={resetAll}
                className="text-xs font-semibold text-brand hover:underline"
              >
                Tout effacer ({activeFiltersCount})
              </button>
            )}
          </div>

          {/* Results grid */}
          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-2xl" />
              ))}
            </div>
          ) : filteredPharmacies.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Aucune pharmacie trouvée"
              description="Essayez d'élargir vos critères de recherche : modifiez le terme, la commune ou les filtres pour découvrir d'autres pharmacies partenaires."
              action={{ label: "Réinitialiser les filtres", onClick: resetAll }}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredPharmacies.map((p) => (
                <PharmacyResultCard key={p.id} pharma={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   FiltersPanel — panneau de filtres réutilisable
   ============================================================ */
function FiltersPanel({
  filters,
  setFilters,
  activeCount,
  onReset,
  isMobile = false,
}: {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  activeCount: number;
  onReset: () => void;
  isMobile?: boolean;
}) {
  return (
    <div className={cn("min-w-0 space-y-5", !isMobile && "sticky top-24")}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="size-4 text-brand" />
          <h3 className="text-sm font-bold text-foreground">Filtres</h3>
          {activeCount > 0 && (
            <span className="rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={onReset}
            className="text-xs font-semibold text-brand hover:underline"
          >
            Effacer
          </button>
        )}
      </div>

      {/* Commune */}
      <FilterGroup label="Commune">
        <Select
          value={filters.commune}
          onValueChange={(v) => setFilters((f) => ({ ...f, commune: v }))}
        >
          <SelectTrigger className="h-10 w-full min-w-0">
            <SelectValue placeholder="Toutes les communes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les communes</SelectItem>
            {COMMUNES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterGroup>

      {/* Quartier */}
      <FilterGroup label="Quartier">
        <Input
          value={filters.quartier}
          onChange={(e) => setFilters((f) => ({ ...f, quartier: e.target.value }))}
          placeholder="Ex : Riviera, Zone 4…"
          className="h-10 w-full min-w-0"
        />
      </FilterGroup>

      {/* Toggles: open / on-duty / near */}
      <FilterGroup label="Disponibilité">
        <div className="space-y-1.5">
          <ToggleRow
            label="Ouverte maintenant"
            icon={Clock}
            checked={filters.openNow}
            onChange={(v) => setFilters((f) => ({ ...f, openNow: v }))}
          />
          <ToggleRow
            label="Pharmacie de garde"
            icon={Timer}
            checked={filters.onDuty}
            onChange={(v) => setFilters((f) => ({ ...f, onDuty: v }))}
          />
          <ToggleRow
            label="Pharmacie proche de moi"
            icon={Navigation}
            checked={filters.nearMe}
            onChange={(v) => setFilters((f) => ({ ...f, nearMe: v }))}
          />
        </div>
      </FilterGroup>

      {/* Max distance */}
      <FilterGroup label="Distance maximale">
        <Select
          value={filters.maxDistance}
          onValueChange={(v) => setFilters((f) => ({ ...f, maxDistance: v }))}
        >
          <SelectTrigger className="h-10 w-full min-w-0">
            <SelectValue placeholder="Toutes distances" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes distances</SelectItem>
            <SelectItem value="2">≤ 2 km</SelectItem>
            <SelectItem value="5">≤ 5 km</SelectItem>
            <SelectItem value="10">≤ 10 km</SelectItem>
            <SelectItem value="20">≤ 20 km</SelectItem>
          </SelectContent>
        </Select>
      </FilterGroup>

      {/* Medication availability */}
      <FilterGroup label="Disponibilité d'un médicament">
        <div className="relative">
          <Pill className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.medication}
            onChange={(e) => setFilters((f) => ({ ...f, medication: e.target.value }))}
            placeholder="Nom du médicament…"
            className="h-10 w-full min-w-0 pl-9"
          />
        </div>
      </FilterGroup>

      {/* Services */}
      <FilterGroup label="Services disponibles">
        <Select
          value={filters.service}
          onValueChange={(v) => setFilters((f) => ({ ...f, service: v }))}
        >
          <SelectTrigger className="h-10 w-full min-w-0">
            <SelectValue placeholder="Tous les services" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les services</SelectItem>
            {SERVICES.map((s) => (
              <SelectItem key={s.key} value={s.key}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterGroup>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  icon: Icon,
  checked,
  onChange,
}: {
  label: string;
  icon: typeof Clock;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        "flex w-full min-w-0 items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors",
        checked
          ? "border-brand bg-brand-light text-brand-dark"
          : "border-border bg-background text-muted-foreground hover:border-brand/30"
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="min-w-0 flex-1">{label}</span>
      <span
        className={cn(
          "flex size-4 items-center justify-center rounded-full border",
          checked ? "border-brand bg-brand" : "border-border"
        )}
      >
        {checked && <CheckCircle2 className="size-3 text-white" />}
      </span>
    </button>
  );
}

/* ============================================================
   OnDutyMiniCard — carte compacte pour la section "de garde"
   ============================================================ */
function OnDutyMiniCard({ pharma }: { pharma: Pharmacy & { distance?: number } }) {
  const { navigate } = useNav();
  const dist =
    pharma.distance ??
    distanceKm(ABIDJAN_CENTER.lat, ABIDJAN_CENTER.lon, pharma.latitude, pharma.longitude);
  const quartier = pharma.address.split(",")[0]?.trim() ?? pharma.commune;

  return (
    <button
      onClick={() => navigate("pharmacy-detail", { slug: pharma.slug })}
      className="group flex min-w-0 items-start gap-3 rounded-xl border border-border/60 bg-background p-3 text-left transition-all hover:border-brand/30 hover:shadow-avance min-[420px]:items-center"
    >
      <span className="relative flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-dark text-white">
        <Plus className="size-5" strokeWidth={3} />
        <span className="absolute -right-1 -top-1 flex size-3.5 items-center justify-center rounded-full bg-amber-400 ring-2 ring-background" />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="break-words text-sm font-bold leading-snug text-foreground">
          {pharma.name}
        </h3>
        <p className="break-words text-xs text-muted-foreground">
          {quartier}, {pharma.commune} · {dist} km
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-0.5 rounded-full bg-success-light px-1.5 py-0.5 text-[9px] font-bold text-success">
            <span className="size-1.5 rounded-full bg-success animate-pulse" /> Ouvert
          </span>
          {pharma.isOpen247 && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-brand-light px-1.5 py-0.5 text-[9px] font-bold text-brand-dark">
              <Clock className="size-2.5" /> 24/7
            </span>
          )}
          <span className="inline-flex items-center gap-0.5 rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground">
            <Lock className="size-2.5" /> Contact <CreditCost cost={1} />
          </span>
        </div>
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

/* ============================================================
   PharmacyResultCard — carte pharmacie complète avec 4 boutons
   ============================================================ */
function PharmacyResultCard({ pharma }: { pharma: Pharmacy & { distance?: number } }) {
  const { navigate } = useNav();
  const dist =
    pharma.distance ??
    distanceKm(ABIDJAN_CENTER.lat, ABIDJAN_CENTER.lon, pharma.latitude, pharma.longitude);
  const quartier = pharma.address.split(",")[0]?.trim() ?? pharma.commune;
  const mapsUrl = `https://www.google.com/maps?q=${pharma.latitude},${pharma.longitude}`;
  const todayHours = pharma.hoursWeekday;

  return (
    <Card className="min-w-0 gap-0 overflow-hidden border-border/70 py-0 shadow-card transition-all hover:-translate-y-1 hover:border-brand/30 hover:shadow-avance-lg">
      {/* Header banner */}
      <div className="relative flex items-center justify-between gap-3 bg-brand px-4 py-3">
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
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-dark px-1.5 py-0.5 text-[10px] font-bold text-white">
            <span className="size-1.5 rounded-full bg-amber-300" />
            {pharma.rating.toFixed(1)}
          </span>
        </div>
        <div className="relative flex max-w-[50%] flex-wrap items-center justify-end gap-1.5">
          {pharma.isOnDuty && (
            <Badge className="whitespace-normal border-0 bg-amber-400 text-[10px] font-bold leading-tight text-amber-950">
              <Timer className="size-3" /> De garde
            </Badge>
          )}
          {pharma.isOpen247 && (
            <Badge className="whitespace-normal border-0 bg-white/20 text-[10px] font-bold leading-tight text-white backdrop-blur-sm">
              <Clock className="size-3" /> 24/7
            </Badge>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="space-y-3 p-4">
        <div>
          <h3 className="break-words text-sm font-bold leading-tight text-foreground">
            {pharma.name}
          </h3>
          <p className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground">
            <MapPin className="mt-0.5 size-3.5 shrink-0 text-brand/70" />
            <span className="break-words">
              {quartier}, <span className="font-medium text-foreground/70">{pharma.commune}</span>
            </span>
          </p>
        </div>

        {/* Status + distance row */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
              pharma.openNow
                ? "bg-success-light text-success"
                : "bg-neutral-light text-neutral-foreground"
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                pharma.openNow ? "bg-success animate-pulse" : "bg-muted-foreground/50"
              )}
            />
            {pharma.openNow ? "Ouvert" : "Fermé"}
          </span>
          {pharma.openNow && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-brand-light px-2 py-0.5 text-[10px] font-bold text-brand-dark">
              <CheckCircle2 className="size-2.5" /> Disponible aujourd&apos;hui
            </span>
          )}
          {dist <= 5 && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-info-light px-2 py-0.5 text-[10px] font-bold text-info">
              <Navigation className="size-2.5" /> À proximité
            </span>
          )}
        </div>

        {/* Info grid: distance + hours */}
        <div className="grid grid-cols-1 gap-2 border-t border-border/50 pt-2.5 min-[380px]:grid-cols-2">
          <div className="flex items-center gap-1.5 text-xs">
            <Navigation className="size-3.5 text-brand" />
            <span className="font-bold text-foreground">{dist} km</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <Clock className="size-3.5 text-brand" />
            <span className="break-words text-muted-foreground">{todayHours}</span>
          </div>
        </div>

        {/* Contact verrouillé — aucune info téléphone affichée, aucun lien tel: */}
        <div className="flex flex-col gap-1.5 rounded-lg bg-muted/60 px-2.5 py-2 min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold leading-tight text-muted-foreground">
            <Lock className="size-3.5" /> Contact verrouillé
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold leading-tight text-brand-dark">
            <Phone className="size-3.5" /> Voir contact <CreditCost cost={1} />
          </span>
        </div>

        {/* Actions — aucun lien tel: généré */}
        <div className="grid grid-cols-1 gap-2 pt-1 min-[380px]:grid-cols-2">
          <Button
            size="sm"
            className="min-h-10 whitespace-normal bg-brand px-2 leading-tight text-white hover:bg-brand-dark"
            onClick={() => navigate("pharmacy-detail", { slug: pharma.slug })}
          >
            Voir détails <ChevronRight className="size-3.5" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="min-h-10 whitespace-normal border-brand/30 px-2 leading-tight text-brand-dark hover:bg-brand-light"
            onClick={() => navigate("pharmacy-detail", { slug: pharma.slug })}
          >
            <Phone className="size-3.5" /> Voir contact
          </Button>
          <Button size="sm" variant="outline" className="min-h-10 whitespace-normal px-2 leading-tight" asChild>
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
              <Navigation className="size-3.5" /> Itinéraire
            </a>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="min-h-10 whitespace-normal border-brand/30 px-2 leading-tight text-brand-dark hover:bg-brand-light"
            onClick={() => navigate("pharmacy-detail", { slug: pharma.slug })}
          >
            <Pill className="size-3.5" /> Médicaments
          </Button>
        </div>
      </div>
    </Card>
  );
}
