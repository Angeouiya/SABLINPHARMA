"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import {
  Search,
  SlidersHorizontal,
  Pill,
  X,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  List,
  Table2,
  CheckCircle2,
  Navigation,
  Lock,
} from "lucide-react";
import { MedicationCard } from "@/components/shared/medication-card";
import { MedicationTable } from "@/components/shared/medication-table";
import { CategoryIcon } from "@/components/category-icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { Heading, Eyebrow } from "@/components/ui/typography";
import { useNav } from "@/store/nav";
import { cn } from "@/lib/utils";
import type { Category, Medication } from "@/lib/types";

type ViewMode = "grid" | "list" | "table";

interface Filters {
  category: string | null;
  form: string;
  commune: string;
  maxPrice: string;
  nearMe: boolean;
}

const DEFAULT_FILTERS: Filters = {
  category: null,
  form: "all",
  commune: "all",
  maxPrice: "all",
  nearMe: false,
};

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

// The 7 categories displayed as cards, mapped to DB slugs
const HOME_CATEGORIES = [
  { slug: "douleur-fievre", name: "Douleur & Fièvre" },
  { slug: "antibiotiques", name: "Antibiotiques" },
  { slug: "respiratoire", name: "Toux & Rhume" },
  { slug: "vitamines", name: "Vitamines" },
  { slug: "digestif", name: "Digestion" },
  { slug: "dermatologie", name: "Peau & Soins" },
  { slug: "mere-enfant", name: "Bébé & Maman" },
];

export function MedicationsView() {
  const { params, navigate } = useNav();
  const [categories, setCategories] = useState<Category[]>([]);
  const [allMeds, setAllMeds] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(params.query ?? "");
  const [filters, setFilters] = useState<Filters>({
    ...DEFAULT_FILTERS,
    category: params.category ?? null,
  });
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const mobileFiltersRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!showFiltersMobile) return;
    const id = window.setTimeout(() => {
      mobileFiltersRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 40);
    return () => window.clearTimeout(id);
  }, [showFiltersMobile]);

  // Fetch categories
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  // Fetch all medications once
  useEffect(() => {
    let active = true;
    setLoading(true);
    const url = new URL("/api/medications", window.location.origin);
    url.searchParams.set("limit", "100");
    (async () => {
      try {
        const r = await fetch(url.toString());
        const data = await r.json();
        if (active) setAllMeds(data);
      } catch {
        if (active) setAllMeds([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Unique forms for the form filter
  const forms = useMemo(() => {
    const set = new Set<string>();
    allMeds.forEach((m) => set.add(m.form));
    return Array.from(set).sort();
  }, [allMeds]);

  // Client-side filtering
  const filteredMeds = useMemo(() => {
    let result = allMeds;

    // Query filter
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.genericName.toLowerCase().includes(q) ||
          m.dosage.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (filters.category) {
      result = result.filter((m) => m.category?.slug === filters.category);
    }

    // Form filter
    if (filters.form !== "all") {
      result = result.filter((m) => m.form === filters.form);
    }

    // Price filter
    if (filters.maxPrice !== "all") {
      const max = parseInt(filters.maxPrice, 10);
      result = result.filter((m) => m.avgPrice <= max);
    }

    return result;
  }, [allMeds, query, filters]);

  const activeFiltersCount =
    (filters.category ? 1 : 0) +
    (filters.form !== "all" ? 1 : 0) +
    (filters.commune !== "all" ? 1 : 0) +
    (filters.maxPrice !== "all" ? 1 : 0) +
    (filters.nearMe ? 1 : 0);

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setQuery("");
  };

  const homeCategories = HOME_CATEGORIES.map((hc) => {
    const found = categories.find((c) => c.slug === hc.slug);
    return found ? { ...found, name: hc.name } : null;
  }).filter(Boolean) as Category[];

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
        <Eyebrow>Recherche de médicaments</Eyebrow>
        <Heading level="h1">Médicaments</Heading>
        <p className="text-sm text-muted-foreground sm:text-base">
          Recherchez un médicament et consultez ses informations générales. Les disponibilités
          réelles et pharmacies associées sont débloquées avec les crédits SABLIN.
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
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  // search is live, just blur
                  (e.target as HTMLInputElement).blur();
                }
              }}
              placeholder="Rechercher un médicament, une DCI ou un dosage"
              className="h-12 border-border bg-background pl-11 pr-4 text-[15px]"
              aria-label="Rechercher un médicament"
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
            onClick={() => {
              const q = query.trim();
              if (q) navigate("medications", { query: q });
            }}
          >
            <Search className="size-4" /> Rechercher
          </Button>
          {/* Mobile filter toggle */}
          <Button
            size="lg"
            variant="outline"
            className="relative h-12 w-full shrink-0 lg:hidden"
            onClick={() => setShowFiltersMobile((v) => !v)}
            aria-expanded={showFiltersMobile}
            aria-controls="medications-mobile-filters"
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
          <span className="font-medium">Exemple :</span> Paracétamol 500 mg, Amoxicilline,
          Vitamine C, Doliprane, Efferalgan, Smecta, Augmentin…
        </p>
      </Card>

      {/* Mobile filters: rendered close to the button so the action feels immediate */}
      {showFiltersMobile && (
        <Card
          id="medications-mobile-filters"
          ref={mobileFiltersRef}
          className="mt-4 overflow-hidden border-border/70 p-4 shadow-avance lg:hidden"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold">Filtres médicaments</h3>
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
            forms={forms}
            categories={categories}
            activeCount={activeFiltersCount}
            onReset={resetFilters}
            isMobile
          />
        </Card>
      )}

      {/* ============ CATEGORIES SECTION ============ */}
      <section className="mt-8">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight text-brand-dark">
              Parcourir par catégorie
            </h2>
            <p className="text-xs text-muted-foreground">
              Sélectionnez une famille pour filtrer les médicaments
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:grid-cols-4 lg:grid-cols-7">
          {loading
            ? Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-2xl" />
              ))
            : homeCategories.map((cat) => {
                const active = filters.category === cat.slug;
                return (
                  <button
                    key={cat.id}
                    onClick={() =>
                      setFilters((f) => ({
                        ...f,
                        category: active ? null : cat.slug,
                      }))
                    }
                    className={cn(
                      "group flex flex-col items-center gap-2.5 rounded-2xl border p-4 text-center transition-all hover:-translate-y-0.5 hover:shadow-avance",
                      active
                        ? "border-brand bg-brand-light"
                        : "border-border/60 bg-background hover:border-brand/30"
                    )}
                  >
                    <span
                      className="flex size-12 items-center justify-center rounded-2xl transition-transform group-hover:scale-110"
                      style={{ backgroundColor: `${cat.color}14` }}
                    >
                      <CategoryIcon name={cat.iconName} size={24} color={cat.color} />
                    </span>
                    <span
                      className={cn(
                        "text-xs font-bold leading-tight",
                        active ? "text-brand-dark" : "text-foreground"
                      )}
                    >
                      {cat.name}
                    </span>
                  </button>
                );
              })}
        </div>
      </section>

      {/* ============ MAIN LAYOUT: filters sidebar + results ============ */}
      <div className="mt-8 grid min-w-0 gap-6 lg:grid-cols-[260px_1fr]">
        {/* Desktop filters sidebar */}
        <aside className="hidden lg:block">
          <FiltersPanel
            filters={filters}
            setFilters={setFilters}
            forms={forms}
            categories={categories}
            activeCount={activeFiltersCount}
            onReset={resetFilters}
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
                  <span className="font-bold text-foreground">{filteredMeds.length}</span>{" "}
                  médicament{filteredMeds.length > 1 ? "s" : ""} trouvé
                  {filteredMeds.length > 1 ? "s" : ""}
                  {filters.category &&
                    ` dans « ${categories.find((c) => c.slug === filters.category)?.name} »`}
                </>
              )}
            </p>
            <div className="grid w-full grid-cols-3 gap-1 rounded-lg border border-border bg-background p-0.5 sm:flex sm:w-auto sm:items-center">
              {(
                [
                  { mode: "grid" as const, icon: LayoutGrid, label: "Grille" },
                  { mode: "list" as const, icon: List, label: "Liste" },
                  { mode: "table" as const, icon: Table2, label: "Tableau" },
                ]
              ).map((v) => (
                <button
                  key={v.mode}
                  onClick={() => setViewMode(v.mode)}
                  className={cn(
                    "flex min-h-9 items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                    viewMode === v.mode
                      ? "bg-brand-light text-brand-dark"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-label={v.label}
                >
                  <v.icon className="size-3.5" />
                  <span className="hidden sm:inline">{v.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Active filter chips */}
          {activeFiltersCount > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {filters.category && (
                <FilterChip
                  label={categories.find((c) => c.slug === filters.category)?.name ?? "Catégorie"}
                  onRemove={() => setFilters((f) => ({ ...f, category: null }))}
                />
              )}
              {filters.form !== "all" && (
                <FilterChip
                  label={filters.form}
                  onRemove={() => setFilters((f) => ({ ...f, form: "all" }))}
                />
              )}
              {filters.commune !== "all" && (
                <FilterChip
                  label={filters.commune}
                  onRemove={() => setFilters((f) => ({ ...f, commune: "all" }))}
                />
              )}
              {filters.maxPrice !== "all" && (
                <FilterChip
                  label={`≤ ${parseInt(filters.maxPrice, 10).toLocaleString("fr-FR")} F`}
                  onRemove={() => setFilters((f) => ({ ...f, maxPrice: "all" }))}
                />
              )}
              {filters.nearMe && (
                <FilterChip
                  label="Pharmacie proche"
                  onRemove={() => setFilters((f) => ({ ...f, nearMe: false }))}
                />
              )}
              <button
                onClick={resetFilters}
                className="text-xs font-semibold text-brand hover:underline"
              >
                Tout effacer
              </button>
            </div>
          )}

          {/* Results display */}
          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-2xl" />
              ))}
            </div>
          ) : filteredMeds.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Aucun médicament trouvé"
              description="Essayez un autre terme de recherche, modifiez vos filtres ou parcourez les catégories disponibles."
              action={{ label: "Réinitialiser la recherche", onClick: resetFilters }}
            />
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredMeds.map((m) => (
                <MedicationCard key={m.id} med={m} />
              ))}
            </div>
          ) : viewMode === "list" ? (
            <div className="flex flex-col gap-2">
              {filteredMeds.map((m) => (
                <MedicationRowSimple key={m.id} med={m} />
              ))}
            </div>
          ) : (
            <MedicationTable meds={filteredMeds} />
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
  forms,
  categories,
  activeCount,
  onReset,
  isMobile = false,
}: {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  forms: string[];
  categories: Category[];
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

      {/* Category */}
      <FilterGroup label="Catégorie">
        <Select
          value={filters.category ?? "all"}
          onValueChange={(v) =>
            setFilters((f) => ({ ...f, category: v === "all" ? null : v }))
          }
        >
          <SelectTrigger className="h-10 w-full min-w-0">
            <SelectValue placeholder="Toutes les catégories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les catégories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.slug}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterGroup>

      {/* Form */}
      <FilterGroup label="Forme">
        <Select
          value={filters.form}
          onValueChange={(v) => setFilters((f) => ({ ...f, form: v }))}
        >
          <SelectTrigger className="h-10 w-full min-w-0">
            <SelectValue placeholder="Toutes les formes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les formes</SelectItem>
            {forms.map((form) => (
              <SelectItem key={form} value={form}>
                {form}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterGroup>

      <div className="rounded-xl border border-border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
        <div className="flex items-start gap-2">
          <Lock className="mt-0.5 size-4 shrink-0 text-brand" />
          <p>
            Les statuts de stock et pharmacies qui possèdent réellement un médicament
            sont verrouillés. Utilisez “Voir pharmacies — 1 crédit” sur une fiche médicament.
          </p>
        </div>
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

      {/* Max price */}
      <FilterGroup label="Prix indicatif max.">
        <Select
          value={filters.maxPrice}
          onValueChange={(v) => setFilters((f) => ({ ...f, maxPrice: v }))}
        >
          <SelectTrigger className="h-10 w-full min-w-0">
            <SelectValue placeholder="Tous les prix" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les prix</SelectItem>
            <SelectItem value="500">≤ 500 FCFA</SelectItem>
            <SelectItem value="1000">≤ 1 000 FCFA</SelectItem>
            <SelectItem value="2000">≤ 2 000 FCFA</SelectItem>
            <SelectItem value="5000">≤ 5 000 FCFA</SelectItem>
          </SelectContent>
        </Select>
      </FilterGroup>

      {/* Near me toggle */}
      <FilterGroup label="Localisation">
        <button
          onClick={() => setFilters((f) => ({ ...f, nearMe: !f.nearMe }))}
          className={cn(
            "flex w-full min-w-0 items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-colors",
            filters.nearMe
              ? "border-brand bg-brand-light text-brand-dark"
              : "border-border bg-background text-muted-foreground hover:border-brand/30"
          )}
        >
          <Navigation className="size-4 shrink-0" />
          <span className="min-w-0 flex-1">Pharmacie proche de moi</span>
          <span
            className={cn(
              "ml-auto flex size-4 items-center justify-center rounded-full border",
              filters.nearMe ? "border-brand bg-brand" : "border-border"
            )}
          >
            {filters.nearMe && <CheckCircle2 className="size-3 text-white" />}
          </span>
        </button>
      </FilterGroup>
    </div>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-brand/30 bg-brand-light px-2.5 py-1 text-xs font-semibold text-brand-dark">
      {label}
      <button
        onClick={onRemove}
        className="ml-0.5 rounded-full p-0.5 hover:bg-brand/10"
        aria-label="Retirer le filtre"
      >
        <X className="size-3" />
      </button>
    </span>
  );
}

/* Simple list row for the "list" view mode (uses MedicationRow-like layout but local) */
function MedicationRowSimple({ med }: { med: Medication }) {
  const { navigate } = useNav();
  return (
    <button
      onClick={() => navigate("medication-detail", { slug: med.slug })}
      className="group flex w-full min-w-0 items-start gap-3 rounded-xl border border-border/60 bg-background px-3 py-3 text-left transition-all hover:border-brand/30 hover:bg-accent/40 min-[420px]:items-center"
    >
      <span
        className="flex size-11 shrink-0 items-center justify-center rounded-lg text-white"
        style={{ backgroundColor: med.category?.color ?? "var(--brand)" }}
      >
        <CategoryIcon name={med.category?.iconName ?? "Pill"} size={22} color="#fff" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block break-words text-sm font-bold leading-snug text-foreground">
          {med.name}
        </span>
        <span className="mt-0.5 block break-words text-xs text-muted-foreground">
          {med.genericName} · {med.form} {med.dosage}
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end">
        <span className="text-sm font-extrabold text-brand-dark">
          {med.avgPrice.toLocaleString("fr-FR")} F
        </span>
        <span className="flex items-center gap-0.5 text-[10px] font-semibold text-muted-foreground">
          <Lock className="size-3 text-brand" />
          1 crédit
        </span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}
