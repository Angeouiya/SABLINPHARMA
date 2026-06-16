"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Plus,
  Minus,
  Search,
  Trash2,
  CheckCircle2,
  Crown,
  ShieldAlert,
  Pill,
  MapPin,
  X,
  Loader2,
  Calculator,
  TrendingDown,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { CategoryIcon } from "@/components/category-icons";
import { useNav } from "@/store/nav";
import { useAuth } from "@/store/auth";
import { formatFCFA } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Medication } from "@/lib/types";

interface EstimateLine {
  medication: {
    id: string;
    name: string;
    slug: string;
    form: string;
    dosage: string;
    packSize: string;
    requiresRx: boolean;
  };
  quantity: number;
  unitMin: number;
  unitMax: number;
  lineMin: number;
  lineMax: number;
  pharmacyCount: number;
}

interface EstimateResult {
  lines: EstimateLine[];
  totalMin: number;
  totalMax: number;
  availablePharmacies: number;
}

interface CartItem {
  slug: string;
  name: string;
  form: string;
  dosage: string;
  packSize: string;
  requiresRx: boolean;
  avgPrice: number;
  pharmacyCount: number;
  category?: { iconName: string; color: string } | null;
  quantity: number;
}

export function PrescriptionView() {
  const { navigate } = useNav();
  const { premium } = useAuth();

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Medication[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const [items, setItems] = useState<CartItem[]>([]);
  const [estimating, setEstimating] = useState(false);
  const [estimate, setEstimate] = useState<EstimateResult | null>(null);

  const searchBoxRef = useRef<HTMLDivElement>(null);

  // Debounced search for suggestions
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      setLoadingSuggestions(false);
      return;
    }
    setLoadingSuggestions(true);
    const t = setTimeout(async () => {
      try {
        const url = `/api/medications?q=${encodeURIComponent(query.trim())}&limit=8`;
        const res = await fetch(url);
        if (!res.ok) throw new Error();
        const data: Medication[] = await res.json();
        setSuggestions(data);
        setShowSuggestions(true);
      } catch {
        toast.error("Impossible de charger les suggestions.");
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  // Close suggestion dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const addMedication = useCallback(
    (med: Medication) => {
      setItems((prev) => {
        if (prev.some((it) => it.slug === med.slug)) {
          toast.info(`${med.name} est déjà dans votre liste.`);
          return prev;
        }
        return [
          ...prev,
          {
            slug: med.slug,
            name: med.name,
            form: med.form,
            dosage: med.dosage,
            packSize: med.packSize,
            requiresRx: med.requiresRx,
            avgPrice: med.avgPrice,
            pharmacyCount: med.pharmacyCount ?? 0,
            category: med.category
              ? { iconName: med.category.iconName, color: med.category.color }
              : null,
            quantity: 1,
          },
        ];
      });
      setQuery("");
      setSuggestions([]);
      setShowSuggestions(false);
      setEstimate(null);
      toast.success(`${med.name} ajouté à l'ordonnance.`);
    },
    []
  );

  const removeItem = (slug: string) => {
    setItems((prev) => prev.filter((it) => it.slug !== slug));
    setEstimate(null);
  };

  const updateQuantity = (slug: string, delta: number) => {
    setItems((prev) =>
      prev.map((it) =>
        it.slug === slug
          ? { ...it, quantity: Math.max(1, it.quantity + delta) }
          : it
      )
    );
    setEstimate(null);
  };

  const totalItems = items.reduce((s, it) => s + it.quantity, 0);
  const totalAvg = items.reduce((s, it) => s + it.avgPrice * it.quantity, 0);

  const handleEstimate = async () => {
    if (items.length === 0) {
      toast.error("Ajoutez au moins un médicament à votre ordonnance.");
      return;
    }
    setEstimating(true);
    setEstimate(null);
    try {
      const res = await fetch("/api/prescription/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((it) => ({ slug: it.slug, quantity: it.quantity })),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? "Échec de l'estimation.");
      }
      const data: EstimateResult = await res.json();
      setEstimate(data);
      toast.success("Estimation calculée avec succès.");
      // Navigate to the dedicated result view with the items + result
      navigate("prescription-result", {
        estimateItems: items.map((it) => ({ slug: it.slug, quantity: it.quantity })),
      });
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Erreur lors de l'estimation."
      );
    } finally {
      setEstimating(false);
    }
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

      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-premium">
            <ClipboardList className="size-6" />
          </span>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Estimer mon ordonnance
            </h1>
            <p className="text-sm text-muted-foreground">
              Calculez le coût de vos médicaments et trouvez les meilleurs prix.
            </p>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* LEFT — Add medications */}
        <div className="flex flex-col gap-5">
          {/* Search box with autocomplete */}
          <div ref={searchBoxRef} className="relative">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="Rechercher un médicament (ex : Paracétamol)..."
                className="h-12 rounded-xl border-border/70 pl-11 pr-10 text-base shadow-sm"
                aria-label="Recherche de médicament"
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery("");
                    setSuggestions([]);
                    setShowSuggestions(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                  aria-label="Effacer la recherche"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            {/* Suggestions dropdown */}
            {showSuggestions && (query.trim().length > 0) && (
              <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-border/70 bg-popover shadow-premium-lg">
                {loadingSuggestions ? (
                  <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin text-brand" />
                    Recherche en cours...
                  </div>
                ) : suggestions.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 p-6 text-center">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-brand-light text-brand">
                      <Search className="size-5" />
                    </span>
                    <p className="text-sm font-medium text-foreground">
                      Aucun résultat
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Essayez un autre nom ou principe actif.
                    </p>
                  </div>
                ) : (
                  <ul className="max-h-80 overflow-y-auto scroll-thin py-1">
                    {suggestions.map((m) => (
                      <li key={m.id}>
                        <button
                          onClick={() => addMedication(m)}
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent/60"
                        >
                          <span
                            className="flex size-10 shrink-0 items-center justify-center rounded-lg"
                            style={{
                              backgroundColor: m.category
                                ? `${m.category.color}14`
                                : undefined,
                            }}
                          >
                            {m.category ? (
                              <CategoryIcon
                                name={m.category.iconName}
                                size={20}
                                color={m.category.color}
                              />
                            ) : (
                              <Pill className="size-5 text-brand" />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5">
                              <span className="truncate text-sm font-semibold text-foreground">
                                {m.name}
                              </span>
                              {m.requiresRx && (
                                <Badge
                                  variant="outline"
                                  className="shrink-0 border-amber-500/40 bg-amber-50 px-1.5 py-0 text-[9px] font-semibold text-amber-700"
                                >
                                  Rx
                                </Badge>
                              )}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {m.form} · {m.dosage} · {m.packSize}
                            </span>
                          </span>
                          <span className="flex shrink-0 flex-col items-end">
                            <span className="text-sm font-bold text-brand-dark">
                              {formatFCFA(m.avgPrice)}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {m.pharmacyCount ?? 0} pharmacies
                            </span>
                          </span>
                          <span className="ml-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-light text-brand">
                            <Plus className="size-4" />
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Added medications list */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">
              Ma liste{" "}
              {items.length > 0 && (
                <span className="ml-1 text-sm font-medium text-muted-foreground">
                  ({items.length} médicament{items.length > 1 ? "s" : ""})
                </span>
              )}
            </h2>
            {items.length > 0 && (
              <button
                onClick={() => {
                  setItems([]);
                  setEstimate(null);
                  toast.success("Liste vidée.");
                }}
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-destructive"
              >
                <Trash2 className="size-3.5" /> Tout supprimer
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <Card className="flex flex-col items-center gap-4 border-dashed border-border/70 bg-background p-10 text-center">
              <span className="flex size-20 items-center justify-center rounded-full bg-brand-light text-brand">
                <ClipboardList className="size-10" />
              </span>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Ajoutez vos médicaments pour commencer
                </h3>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Utilisez la barre de recherche ci-dessus pour trouver vos
                  médicaments, puis ajoutez-les à votre ordonnance.
                </p>
              </div>
            </Card>
          ) : (
            <ul className="flex flex-col gap-3">
              {items.map((it) => (
                <li key={it.slug}>
                  <Card className="gap-0 border-border/70 py-0 transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-premium">
                    <div className="flex items-start gap-3 p-4">
                      {/* Category icon */}
                      <span
                        className="flex size-12 shrink-0 items-center justify-center rounded-xl"
                        style={{
                          backgroundColor: it.category
                            ? `${it.category.color}14`
                            : undefined,
                        }}
                      >
                        {it.category ? (
                          <CategoryIcon
                            name={it.category.iconName}
                            size={24}
                            color={it.category.color}
                          />
                        ) : (
                          <Pill className="size-6 text-brand" />
                        )}
                      </span>

                      {/* Main info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h3 className="text-sm font-bold text-foreground">
                            {it.name}
                          </h3>
                          {it.requiresRx && (
                            <Badge
                              variant="outline"
                              className="border-amber-500/40 bg-amber-50 px-1.5 py-0 text-[9px] font-semibold text-amber-700"
                            >
                              <ShieldAlert className="size-3" /> Ordonnance
                            </Badge>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {it.form} · {it.dosage} · {it.packSize}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                          <span>
                            Prix moyen :{" "}
                            <span className="font-semibold text-brand-dark">
                              {formatFCFA(it.avgPrice)}
                            </span>
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="size-3" />
                            {it.pharmacyCount} pharmacies
                          </span>
                        </div>
                      </div>

                      {/* Quantity stepper */}
                      <div className="flex shrink-0 flex-col items-center gap-2">
                        <div className="flex items-center rounded-lg border border-border bg-background">
                          <button
                            onClick={() => updateQuantity(it.slug, -1)}
                            disabled={it.quantity <= 1}
                            className="flex size-9 items-center justify-center rounded-l-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent"
                            aria-label="Diminuer la quantité"
                          >
                            <Minus className="size-4" />
                          </button>
                          <span className="w-9 text-center text-sm font-bold text-foreground">
                            {it.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(it.slug, 1)}
                            className="flex size-9 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                            aria-label="Augmenter la quantité"
                          >
                            <Plus className="size-4" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(it.slug)}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-destructive"
                          aria-label={`Supprimer ${it.name}`}
                        >
                          <Trash2 className="size-3.5" /> Retirer
                        </button>
                      </div>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* RIGHT — Summary & estimation (sticky) */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <Card className="gap-0 overflow-hidden border-border/70 py-0 shadow-premium">
            <div className="border-b border-border/60 bg-brand-light/40 px-5 py-4">
              <div className="flex items-center gap-2">
                <Calculator className="size-5 text-brand" />
                <h3 className="text-base font-bold text-foreground">
                  Résumé de l&apos;ordonnance
                </h3>
              </div>
            </div>

            <div className="space-y-4 p-5">
              {/* Quick stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border/60 bg-background p-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Médicaments
                  </p>
                  <p className="mt-0.5 text-2xl font-extrabold text-foreground">
                    {items.length}
                  </p>
                </div>
                <div className="rounded-xl border border-border/60 bg-background p-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Total unités
                  </p>
                  <p className="mt-0.5 text-2xl font-extrabold text-foreground">
                    {totalItems}
                  </p>
                </div>
              </div>

              {/* Pre-estimate approximation */}
              {items.length > 0 && (
                <div className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3">
                  <span className="text-xs font-medium text-muted-foreground">
                    Coût moyen estimé
                  </span>
                  <span className="text-sm font-bold text-brand-dark">
                    {formatFCFA(totalAvg)}
                  </span>
                </div>
              )}

              {/* Estimate button */}
              <Button
                onClick={handleEstimate}
                disabled={items.length === 0 || estimating}
                className="w-full bg-brand-gradient text-white hover:opacity-90"
                size="lg"
              >
                {estimating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Calcul en cours...
                  </>
                ) : (
                  <>
                    <Calculator className="size-4" /> Estimer le coût
                  </>
                )}
              </Button>

              {/* Estimate result */}
              {estimating && (
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full rounded-xl" />
                  <Skeleton className="h-24 w-full rounded-xl" />
                </div>
              )}

              {!estimating && estimate && (
                <div className="space-y-4">
                  <Separator />

                  {/* Total range */}
                  <div className="rounded-xl border border-brand/20 bg-gradient-to-br from-brand-light/60 to-background p-4">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Total estimé
                    </p>
                    <p className="mt-1 text-2xl font-extrabold text-brand-dark">
                      {formatFCFA(estimate.totalMin)} —{" "}
                      {formatFCFA(estimate.totalMax)}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <TrendingDown className="size-3.5 text-brand" />
                      Fourchette basée sur {estimate.lines.length} médicament
                      {estimate.lines.length > 1 ? "s" : ""}
                    </div>
                  </div>

                  {/* Available pharmacies */}
                  <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-background px-4 py-3">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-brand-light text-brand">
                      <MapPin className="size-5" />
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-foreground">
                        {estimate.availablePharmacies} pharmacie
                        {estimate.availablePharmacies > 1 ? "s" : ""}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        ont tous les médicaments en stock
                      </p>
                    </div>
                  </div>

                  {/* Lines breakdown */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Détail par médicament
                    </p>
                    <ul className="space-y-2">
                      {estimate.lines.map((line) => (
                        <li
                          key={line.medication.id}
                          className="rounded-xl border border-border/60 bg-background p-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-foreground">
                                {line.medication.name}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {line.medication.form} ·{" "}
                                {line.medication.dosage}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className="shrink-0 border-brand/30 bg-brand-light/60 px-2 py-0 text-[10px] font-semibold text-brand-dark"
                            >
                              x{line.quantity}
                            </Badge>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              Unit. :{" "}
                              <span className="font-medium text-foreground">
                                {formatFCFA(line.unitMin)}
                                {line.unitMax !== line.unitMin
                                  ? ` — ${formatFCFA(line.unitMax)}`
                                  : ""}
                              </span>
                            </span>
                            <span className="font-bold text-brand-dark">
                              {formatFCFA(line.lineMin)}
                              {line.lineMax !== line.lineMin
                                ? ` — ${formatFCFA(line.lineMax)}`
                                : ""}
                            </span>
                          </div>
                          <div className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                            <CheckCircle2 className="size-3 text-brand" />
                            {line.pharmacyCount} pharmacie
                            {line.pharmacyCount > 1 ? "s" : ""} en stock
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA to find pharmacies */}
                  <Button
                    variant="outline"
                    className="w-full border-brand/30 text-brand-dark hover:bg-brand-light"
                    onClick={() => navigate("pharmacies")}
                  >
                    <MapPin className="size-4" /> Voir les pharmacies
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              )}

              {!estimating && !estimate && items.length > 0 && (
                <p className="text-center text-xs text-muted-foreground">
                  Cliquez sur « Estimer le coût » pour obtenir une fourchette de
                  prix détaillée.
                </p>
              )}
            </div>
          </Card>

          {/* Premium upsell */}
          {!premium && (
            <Card className="relative overflow-hidden border-amber-500/30 bg-gradient-to-br from-amber-50 to-background py-0 shadow-premium">
              <div className="absolute -right-10 -top-10 size-40 rounded-full bg-amber-300/20 blur-3xl" />
              <div className="relative flex flex-col gap-3 p-5">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-premium">
                    <Crown className="size-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-extrabold text-foreground">
                      Passez Premium
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Débloquez l&apos;estimation sans limites
                    </p>
                  </div>
                </div>
                <ul className="space-y-1.5 text-sm text-foreground/80">
                  {[
                    "Estimations d'ordonnance illimitées",
                    "Alertes de prix en temps réel",
                    "Comparaison détaillée des pharmacies",
                    "Priorité sur l'assistance WhatsApp",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-amber-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full bg-gradient-to-br from-amber-400 to-amber-600 text-white hover:opacity-90"
                  onClick={() => navigate("subscription")}
                >
                  <Crown className="size-4" /> Découvrir Premium
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Information footer */}
      <div className="mt-10">
        <Card className="flex items-start gap-3 border-border/60 bg-muted/30 p-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand">
            <ShieldAlert className="size-5" />
          </span>
          <p className="text-xs leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">
              SABLIN PHARMA
            </span>{" "}
            est une plateforme d&apos;information. Les prix sont indicatifs et
            peuvent varier selon les pharmacies. Aucune vente en ligne.
          </p>
        </Card>
      </div>
    </div>
  );
}
