"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, ChevronLeft, X, Clock, Timer, MapPin, Plus } from "lucide-react";
import { PharmacyCard } from "@/components/shared/pharmacy-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useNav } from "@/store/nav";
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

type FilterChip = "all" | "open" | "on-duty" | "247";

const CHIPS: { key: FilterChip; label: string; icon: typeof Clock }[] = [
  { key: "all", label: "Toutes", icon: Plus },
  { key: "open", label: "Ouvertes maintenant", icon: Clock },
  { key: "on-duty", label: "De garde", icon: Timer },
  { key: "247", label: "Ouvert 24/7", icon: Clock },
];

export function PharmaciesView() {
  const { params, navigate } = useNav();
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(params.query ?? "");
  const [debouncedQuery, setDebouncedQuery] = useState(params.query ?? "");
  const [filter, setFilter] = useState<FilterChip>(
    (params.filter as FilterChip) ?? "all"
  );
  const [commune, setCommune] = useState<string>("all");

  // Debounce query (200ms)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 200);
    return () => clearTimeout(t);
  }, [query]);

  const fetchPharmacies = useCallback(() => {
    setLoading(true);
    const url = new URL("/api/pharmacies", window.location.origin);
    if (debouncedQuery.trim()) url.searchParams.set("q", debouncedQuery.trim());
    if (commune !== "all") url.searchParams.set("commune", commune);
    if (filter !== "all") url.searchParams.set("filter", filter);
    fetch(url.toString())
      .then((r) => r.json())
      .then((data: Pharmacy[]) => setPharmacies(data))
      .catch(() => setPharmacies([]))
      .finally(() => setLoading(false));
  }, [debouncedQuery, commune, filter]);

  useEffect(() => {
    const t = setTimeout(fetchPharmacies, 0);
    return () => clearTimeout(t);
  }, [fetchPharmacies]);

  const resetFilters = () => {
    setQuery("");
    setDebouncedQuery("");
    setFilter("all");
    setCommune("all");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back link */}
      <button
        onClick={() => navigate("home")}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-brand"
      >
        <ChevronLeft className="size-4" /> Accueil
      </button>

      {/* Title */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Pharmacies
        </h1>
        <p className="text-sm text-muted-foreground">
          Trouvez les pharmacies partenaires à Abidjan
        </p>
      </div>

      {/* Search bar custom */}
      <div className="mt-6">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher par nom ou commune (ex : Cocody, Riviera...)"
            className="h-12 rounded-xl border-border/70 bg-background pl-11 pr-11 text-sm shadow-xs"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Effacer la recherche"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter chips + commune select */}
      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {CHIPS.map((chip) => {
            const active = filter === chip.key;
            return (
              <button
                key={chip.key}
                onClick={() => setFilter(chip.key)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
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

        <div className="shrink-0">
          <Select value={commune} onValueChange={setCommune}>
            <SelectTrigger className="h-10 w-full min-w-[200px] rounded-xl border-border/70 bg-background sm:w-[220px]">
              <span className="flex items-center gap-2">
                <MapPin className="size-4 text-brand" />
                <SelectValue placeholder="Toutes les communes" />
              </span>
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
        </div>
      </div>

      {/* Result counter */}
      <div className="mt-5">
        <p className="text-sm text-muted-foreground">
          {loading ? (
            "Chargement..."
          ) : (
            <>
              <span className="font-semibold text-foreground">{pharmacies.length}</span>{" "}
              pharmacie{pharmacies.length > 1 ? "s" : ""} trouvée
              {pharmacies.length > 1 ? "s" : ""}
            </>
          )}
        </p>
      </div>

      {/* Results grid */}
      <div className="mt-4">
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        ) : pharmacies.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 border-border/60 p-12 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-light text-brand">
              <Search className="size-7" />
            </span>
            <h3 className="text-lg font-bold text-foreground">
              Aucune pharmacie trouvée
            </h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              Essayez d&apos;élargir vos critères de recherche (terme, commune
              ou filtre) pour découvrir d&apos;autres pharmacies partenaires.
            </p>
            <Button
              variant="outline"
              onClick={resetFilters}
              className="mt-1"
            >
              <X className="size-4" /> Réinitialiser les filtres
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pharmacies.map((p) => (
              <PharmacyCard key={p.id} pharma={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
