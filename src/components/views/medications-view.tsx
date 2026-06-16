"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, SlidersHorizontal, Pill, X, ChevronLeft } from "lucide-react";
import { SearchBar } from "@/components/shared/search-bar";
import { MedicationCard, MedicationRow } from "@/components/shared/medication-card";
import { CategoryIcon } from "@/components/category-icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { useNav } from "@/store/nav";
import { cn } from "@/lib/utils";
import type { Category, Medication } from "@/lib/types";

export function MedicationsView() {
  const { params, navigate } = useNav();
  const [categories, setCategories] = useState<Category[]>([]);
  const [meds, setMeds] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(params.query ?? "");
  const [activeCat, setActiveCat] = useState<string | null>(params.category ?? null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  const fetchMeds = useCallback(() => {
    setLoading(true);
    const url = new URL("/api/medications", window.location.origin);
    if (query.trim()) url.searchParams.set("q", query.trim());
    if (activeCat) url.searchParams.set("category", activeCat);
    fetch(url.toString())
      .then((r) => r.json())
      .then((data) => setMeds(data))
      .catch(() => setMeds([]))
      .finally(() => setLoading(false));
  }, [query, activeCat]);

  useEffect(() => {
    const t = setTimeout(fetchMeds, 200);
    return () => clearTimeout(t);
  }, [fetchMeds]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <button
        onClick={() => navigate("home")}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-brand"
      >
        <ChevronLeft className="size-4" /> Accueil
      </button>

      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Médicaments
        </h1>
        <p className="text-sm text-muted-foreground">
          Recherchez parmi les médicaments référencés dans les pharmacies partenaires d&apos;Abidjan.
        </p>
      </div>

      {/* Search + filters */}
      <div className="mt-6 flex flex-col gap-4">
        <SearchBar initialQuery={params.query} placeholder="Médicament, principe actif..." />

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setActiveCat(null)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
              !activeCat
                ? "border-brand bg-brand text-white"
                : "border-border bg-background text-foreground/70 hover:border-brand/40 hover:text-brand"
            )}
          >
            <Pill className="size-3.5" /> Toutes
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCat(activeCat === c.slug ? null : c.slug)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                activeCat === c.slug
                  ? "border-brand bg-brand text-white"
                  : "border-border bg-background text-foreground/70 hover:border-brand/40 hover:text-brand"
              )}
            >
              <CategoryIcon name={c.iconName} size={14} color={activeCat === c.slug ? "#fff" : c.color} />
              {c.name}
            </button>
          ))}
        </div>

        {/* Result count + view toggle */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {loading ? (
              "Chargement..."
            ) : (
              <>
                <span className="font-semibold text-foreground">{meds.length}</span> médicament{meds.length > 1 ? "s" : ""} trouvé{meds.length > 1 ? "s" : ""}
                {activeCat && ` dans « ${categories.find((c) => c.slug === activeCat)?.name} »`}
              </>
            )}
          </p>
          <div className="hidden items-center gap-1 rounded-lg border border-border p-0.5 sm:flex">
            <button
              onClick={() => setViewMode("grid")}
              className={cn("rounded-md px-2.5 py-1 text-xs font-medium", viewMode === "grid" ? "bg-brand-light text-brand-dark" : "text-muted-foreground")}
            >
              Grille
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn("rounded-md px-2.5 py-1 text-xs font-medium", viewMode === "list" ? "bg-brand-light text-brand-dark" : "text-muted-foreground")}
            >
              Liste
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mt-5">
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-2xl" />
            ))}
          </div>
        ) : meds.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 p-12 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-light text-brand">
              <Search className="size-7" />
            </span>
            <h3 className="text-lg font-bold">Aucun médicament trouvé</h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              Essayez un autre terme de recherche ou parcourez les catégories disponibles.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setQuery("");
                setActiveCat(null);
              }}
            >
              <X className="size-4" /> Réinitialiser la recherche
            </Button>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {meds.map((m) => (
              <MedicationCard key={m.id} med={m} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {meds.map((m) => (
              <MedicationRow key={m.id} med={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
