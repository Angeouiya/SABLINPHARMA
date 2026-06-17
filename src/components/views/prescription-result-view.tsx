"use client";

import { useEffect, useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Crown,
  Coins,
  Share2,
  MapPin,
  Pill,
  AlertTriangle,
  Navigation,
  Lock,
  Phone,
  Plus,
  Clock,
  Timer,
  Save,
  Pencil,
  RotateCcw,
  ClipboardList,
  TrendingDown,
  Zap,
  Store,
  XCircle,
  Info,
  Award,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FullLoader } from "@/components/shared/loader";
import { AlertMessage } from "@/components/shared/alert-message";
import { EmptyState } from "@/components/shared/empty-state";
import { LockedView } from "@/components/shared/locked-view";
import { CreditConfirmDialog } from "@/components/shared/credit-confirm-dialog";
import { CreditCost } from "@/components/shared/credit-cost";
import { Heading, Eyebrow, Muted, Price, PriceRange } from "@/components/ui/typography";
import { useNav } from "@/store/nav";
import { useAuth } from "@/store/auth";
import { useCredits, CREDIT_COSTS } from "@/store/credits";
import { formatFCFA, distanceKm, isOpenNow } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { EstimateResult } from "@/lib/types";

const ABIDJAN_CENTER = { lat: 5.34, lon: -4.008 };

// Fictive pharmacies for the result sections (realistic Abidjan data)
interface ResultPharmacy {
  id: string;
  name: string;
  slug: string;
  commune: string;
  quartier: string;
  phone: string;
  hoursWeekday: string;
  isOpen247: boolean;
  isOnDuty: boolean;
  latitude: number;
  longitude: number;
  rating: number;
  totalEstimate: number;
  availableCount: number;
  totalCount: number;
  availableMeds: string[];
  missingMeds: string[];
}

const RESULT_PHARMACIES: ResultPharmacy[] = [
  {
    id: "p1",
    name: "Pharmacie des Deux Plateaux",
    slug: "pharmacie-des-deux-plateaux",
    commune: "Cocody",
    quartier: "Rue du Café, Vallon",
    phone: "+225 27 22 48 90 10",
    hoursWeekday: "07h30 - 21h00",
    isOpen247: true,
    isOnDuty: true,
    latitude: 5.375,
    longitude: -3.995,
    rating: 4.9,
    totalEstimate: 0,
    availableCount: 0,
    totalCount: 0,
    availableMeds: [],
    missingMeds: [],
  },
  {
    id: "p2",
    name: "Pharmacie de la Riviera",
    slug: "pharmacie-de-la-riviera",
    commune: "Cocody",
    quartier: "Rue des Jardins, Riviera Palmeraie",
    phone: "+225 27 22 44 11 01",
    hoursWeekday: "07h30 - 20h30",
    isOpen247: false,
    isOnDuty: true,
    latitude: 5.3625,
    longitude: -3.9967,
    rating: 4.8,
    totalEstimate: 0,
    availableCount: 0,
    totalCount: 0,
    availableMeds: [],
    missingMeds: [],
  },
  {
    id: "p3",
    name: "Pharmacie de Marcory Zone 4",
    slug: "pharmacie-de-marcory-zone-4",
    commune: "Marcory",
    quartier: "Bd Valery Giscard d'Estaing",
    phone: "+225 27 21 35 78 90",
    hoursWeekday: "07h30 - 20h30",
    isOpen247: false,
    isOnDuty: true,
    latitude: 5.29,
    longitude: -4.02,
    rating: 4.5,
    totalEstimate: 0,
    availableCount: 0,
    totalCount: 0,
    availableMeds: [],
    missingMeds: [],
  },
  {
    id: "p4",
    name: "Pharmacie du Plateau",
    slug: "pharmacie-du-plateau",
    commune: "Plateau",
    quartier: "Avenue Chardy",
    phone: "+225 27 20 25 30 40",
    hoursWeekday: "07h30 - 20h00",
    isOpen247: false,
    isOnDuty: false,
    latitude: 5.3167,
    longitude: -4.0167,
    rating: 4.6,
    totalEstimate: 0,
    availableCount: 0,
    totalCount: 0,
    availableMeds: [],
    missingMeds: [],
  },
  {
    id: "p5",
    name: "Pharmacie de Yopougon",
    slug: "pharmacie-de-yopougon",
    commune: "Yopougon",
    quartier: "Marché de Yopougon, Avenue 13",
    phone: "+225 27 23 51 22 33",
    hoursWeekday: "07h30 - 20h00",
    isOpen247: false,
    isOnDuty: false,
    latitude: 5.34,
    longitude: -4.08,
    rating: 4.3,
    totalEstimate: 0,
    availableCount: 0,
    totalCount: 0,
    availableMeds: [],
    missingMeds: [],
  },
  {
    id: "p6",
    name: "Pharmacie d'Abobo",
    slug: "pharmacie-d-abobo",
    commune: "Abobo",
    quartier: "Centre Abobo, Rue Principale",
    phone: "+225 27 22 30 55 66",
    hoursWeekday: "08h00 - 20h00",
    isOpen247: true,
    isOnDuty: true,
    latitude: 5.42,
    longitude: -4.02,
    rating: 4.4,
    totalEstimate: 0,
    availableCount: 0,
    totalCount: 0,
    availableMeds: [],
    missingMeds: [],
  },
];

type SortKey = "recommended" | "nearest" | "cheapest" | "complete" | "open" | "duty";

const SORT_OPTIONS: { key: SortKey; label: string; icon: typeof Filter }[] = [
  { key: "recommended", label: "Recommandée", icon: Award },
  { key: "nearest", label: "Plus proche", icon: Navigation },
  { key: "cheapest", label: "Prix le plus bas", icon: TrendingDown },
  { key: "complete", label: "Ordonnance complète", icon: CheckCircle2 },
  { key: "open", label: "Ouverte maintenant", icon: Clock },
  { key: "duty", label: "De garde", icon: Timer },
];

// ===== Actions avancées payantes (crédits) =====
type PaidAction = "bestPharmacy" | "compare" | "confirm";

const PAID_ACTION_CONFIG: Record<
  PaidAction,
  { title: string; cost: number; description: string; benefits: string[] }
> = {
  bestPharmacy: {
    title: "Voir la meilleure pharmacie",
    cost: CREDIT_COSTS.bestPharmacy,
    description:
      "Cette action coûte 1 crédit. Accédez à la pharmacie optimale selon la disponibilité et la proximité.",
    benefits: [
      "Pharmacie optimale recommandée",
      "Disponibilité complète vérifiée",
      "Coordonnées, horaires et itinéraire",
    ],
  },
  compare: {
    title: "Comparer les prix",
    cost: CREDIT_COSTS.comparePharmacies,
    description:
      "Cette action coûte 1 crédit. Affichez le tableau comparatif détaillé des pharmacies (prix, distance, horaires).",
    benefits: [
      "Tableau comparatif détaillé",
      "Prix total par pharmacie",
      "Distance et horaires side-by-side",
    ],
  },
  confirm: {
    title: "Confirmation pharmacie",
    cost: CREDIT_COSTS.confirmBeforeVisit,
    description:
      "Cette action coûte 3 crédits. Demandez à la pharmacie de vérifier le stock avant votre déplacement.",
    benefits: [
      "Vérification du stock par la pharmacie",
      "Confirmation avant déplacement",
      "Gain de temps garanti",
    ],
  },
};

export function PrescriptionResultView() {
  const { params, navigate } = useNav();
  const { user, premium } = useAuth();
  const { hasPass } = useCredits();

  const [estimate, setEstimate] = useState<EstimateResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("recommended");
  // Action avancée en attente de confirmation (débit de crédits)
  const [paidAction, setPaidAction] = useState<PaidAction | null>(null);

  const estimateItems = params.estimateItems;

  useEffect(() => {
    const items = estimateItems ?? [];
    if (!items.length) {
      // Pas d'items : on affichera le LockedView côté rendu (pas de navigation auto)
      setLoading(false);
      setEstimate(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/prescription/estimate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error ?? "Échec de l'estimation.");
        }
        const data: EstimateResult = await res.json();
        if (!cancelled) setEstimate(data);
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "Erreur lors de l'estimation."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [estimateItems]);

  // Build pharmacy list with availability based on estimate
  const pharmaciesWithAvailability = useMemo(() => {
    if (!estimate) return [];
    const total = estimate.lines.length;
    return RESULT_PHARMACIES.map((p, idx) => {
      // Deterministic availability: first pharmacies have all meds
      const availableCount = idx < 3 ? total : Math.max(1, total - (idx % 2 === 0 ? 1 : 2));
      const availableMeds = estimate.lines
        .slice(0, availableCount)
        .map((l) => l.medication.name);
      const missingMeds = estimate.lines
        .slice(availableCount)
        .map((l) => l.medication.name);

      // Generate per-medication prices for this pharmacy
      const medPrices = estimate.lines.map((line, lineIdx) => {
        if (lineIdx >= availableCount) return null;
        // Deterministic price between unitMin and unitMax based on pharmacy index
        const range = line.unitMax - line.unitMin;
        const factor = ((idx * 37 + lineIdx * 53) % 100) / 100;
        const unitPrice = line.unitMin + Math.round(range * factor);
        return {
          name: line.medication.name,
          quantity: line.quantity,
          unitPrice,
          lineTotal: unitPrice * line.quantity,
        };
      });

      const totalEstimate = medPrices
        .filter(Boolean)
        .reduce((s, mp) => s + (mp?.lineTotal ?? 0), 0);

      const dist = distanceKm(
        ABIDJAN_CENTER.lat,
        ABIDJAN_CENTER.lon,
        p.latitude,
        p.longitude
      );
      const openNow = isOpenNow({
        hoursWeekday: p.hoursWeekday,
        hoursSaturday: p.hoursWeekday,
        hoursSunday: "Fermé",
        isOpen247: p.isOpen247,
      });
      return {
        ...p,
        availableCount,
        totalCount: total,
        availableMeds,
        missingMeds,
        medPrices,
        totalEstimate: totalEstimate || estimate.totalMin,
        distance: dist,
        openNow,
      };
    });
  }, [estimate]);

  const fullPharmacies = pharmaciesWithAvailability.filter(
    (p) => p.availableCount === p.totalCount
  );
  const partialPharmacies = pharmaciesWithAvailability.filter(
    (p) => p.availableCount < p.totalCount
  );

  // Best option
  const bestOption = useMemo(() => {
    if (pharmaciesWithAvailability.length === 0) return null;
    const sorted = [...pharmaciesWithAvailability].sort((a, b) => {
      // Complete availability first
      if (a.availableCount === a.totalCount && b.availableCount !== b.totalCount) return -1;
      if (b.availableCount === b.totalCount && a.availableCount !== a.totalCount) return 1;
      // Then open
      if (a.openNow && !b.openNow) return -1;
      if (b.openNow && !a.openNow) return 1;
      // Then nearest
      return a.distance - b.distance;
    });
    return sorted[0];
  }, [pharmaciesWithAvailability]);

  // Sorted pharmacies based on filter
  const sortedFull = useMemo(() => {
    const arr = [...fullPharmacies];
    switch (sortKey) {
      case "nearest":
        return arr.sort((a, b) => a.distance - b.distance);
      case "cheapest":
        return arr.sort((a, b) => a.totalEstimate - b.totalEstimate);
      case "open":
        return arr.sort((a, b) => (b.openNow ? 1 : 0) - (a.openNow ? 1 : 0));
      case "duty":
        return arr.sort((a, b) => (b.isOnDuty ? 1 : 0) - (a.isOnDuty ? 1 : 0));
      default:
        return arr;
    }
  }, [fullPharmacies, sortKey]);

  const handleShare = async () => {
    if (!estimate) return;
    const text = `Mon estimation d'ordonnance SABLIN PHARMA : ${formatFCFA(
      estimate.totalMin
    )} — ${formatFCFA(estimate.totalMax)} (${estimate.lines.length} médicaments).`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Estimation SABLIN PHARMA", text });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        toast.success("Résultat copié dans le presse-papiers.");
      }
    } catch {
      /* cancelled */
    }
  };

  const handleSave = () => {
    if (!user) {
      toast.info("Connectez-vous pour enregistrer votre ordonnance.");
      navigate("auth", { authMode: "login" });
      return;
    }
    toast.success("Ordonnance enregistrée dans votre profil.", {
      description: "Retrouvez-la dans la section Historique.",
    });
  };

  // ===== Actions avancées payantes =====
  // Si l'utilisateur a un Pass Ordonnance Unique actif, l'action est gratuite (pas de dialog).
  // Sinon, on ouvre un CreditConfirmDialog pour débiter le coût de l'action.
  const performPaidAction = (action: PaidAction) => {
    if (action === "bestPharmacy" && bestOption) {
      navigate("pharmacy-detail", { slug: bestOption.slug });
      toast.success("Accès à la meilleure pharmacie.");
    } else if (action === "compare") {
      const el = document.getElementById("pharmacies-complete");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
      toast.success("Comparaison des pharmacies affichée.");
    } else if (action === "confirm") {
      toast.success("Demande de confirmation envoyée à la pharmacie.", {
        description: "Vous recevrez une réponse sous 24h.",
      });
    }
    setPaidAction(null);
  };

  const handlePaidAction = (action: PaidAction) => {
    if (hasPass) {
      performPaidAction(action);
    } else {
      setPaidAction(action);
    }
  };

  // ===== LockedView : aucune donnée d'estimation transmise =====
  if (!estimateItems || estimateItems.length === 0) {
    return (
      <LockedView
        title="Résultat indisponible"
        message="Veuillez utiliser 2 crédits ou un Pass Ordonnance Unique pour lancer l'estimation complète."
        cost={2}
        backLabel="Retour à l'ordonnance"
        backView="prescription"
      />
    );
  }

  // ===== Loading =====
  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate("prescription")}
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-brand"
        >
          <ChevronLeft className="size-4" /> Ordonnance
        </button>
        <FullLoader label="Calcul de votre estimation en cours..." />
      </div>
    );
  }

  // ===== Error =====
  if (error || !estimate) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate("prescription")}
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-brand"
        >
          <ChevronLeft className="size-4" /> Ordonnance
        </button>
        <AlertMessage variant="error" title="Estimation indisponible">
          {error ?? "Nous n'avons pas pu calculer votre estimation."}
        </AlertMessage>
        <Button
          className="mt-4 bg-brand text-white"
          onClick={() => navigate("prescription")}
        >
          <ChevronLeft className="size-4" /> Retour à l&apos;ordonnance
        </Button>
      </div>
    );
  }

  const totalUnits = estimate.lines.reduce((s, l) => s + l.quantity, 0);
  const availableMeds = estimate.lines.filter((l) => l.pharmacyCount > 0).length;
  const toConfirmMeds = estimate.lines.filter((l) => l.pharmacyCount === 0).length;
  const outStockMeds = estimate.lines.filter(
    (l) => l.pharmacyCount === 0
  ).length;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back link */}
      <button
        onClick={() => navigate("prescription")}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-brand"
      >
        <ChevronLeft className="size-4" /> Ordonnance
      </button>

      {/* ============ GRAND RÉSUMÉ ============ */}
      <div className="flex items-start gap-4">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-brand-light ring-8 ring-brand-light/30">
          <CheckCircle2 className="size-8 text-brand" />
        </span>
        <div>
          <Eyebrow>Estimation terminée</Eyebrow>
          <Heading level="h1">Résultat de votre ordonnance</Heading>
          <Muted className="mt-1 max-w-2xl">
            Voici le coût estimatif de votre ordonnance et les pharmacies capables de
            vous fournir vos médicaments à Abidjan.
          </Muted>
        </div>
      </div>

      {/* Stats strip */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <SummaryStat
          icon={Pill}
          tone="brand"
          value={estimate.lines.length}
          label="Médicaments"
        />
        <SummaryStat
          icon={TrendingDown}
          tone="success"
          value={formatFCFA(estimate.totalMin)}
          label="Coût total min."
          isText
        />
        <SummaryStat
          icon={CheckCircle2}
          tone="success"
          value={availableMeds}
          label="Disponibles"
        />
        <SummaryStat
          icon={Info}
          tone="info"
          value={toConfirmMeds}
          label="À confirmer"
        />
        <SummaryStat
          icon={XCircle}
          tone="danger"
          value={outStockMeds}
          label="Rupture"
        />
      </div>

      {/* ============ MAIN LAYOUT ============ */}
      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_340px] lg:gap-6">
        {/* LEFT: detail + pharmacies */}
        <div className="space-y-5 lg:space-y-6">
          {/* Médicaments list */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <Eyebrow>Détail</Eyebrow>
                <Heading level="h2">Médicaments de l&apos;ordonnance</Heading>
              </div>
              <Badge variant="secondary" className="bg-brand-light text-brand-dark">
                {estimate.lines.length} produit{estimate.lines.length > 1 ? "s" : ""}
              </Badge>
            </div>

            <div className="space-y-3">
              {estimate.lines.map((line, idx) => {
                const status: "available" | "to-confirm" | "out-of-stock" =
                  line.pharmacyCount > 5
                    ? "available"
                    : line.pharmacyCount > 0
                    ? "to-confirm"
                    : "out-of-stock";
                return (
                  <Card
                    key={`${line.medication.slug}-${idx}`}
                    className="border-border/70 p-4 shadow-card transition-all hover:border-brand/30 hover:shadow-premium"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand">
                        <Pill className="size-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-foreground">
                            {line.medication.name}
                          </h3>
                          {line.medication.requiresRx && (
                            <Badge className="border-0 bg-amber-500/90 px-1.5 py-0 text-[9px] font-bold text-white">
                              Rx
                            </Badge>
                          )}
                          <MedStatusBadge status={status} />
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {line.medication.form} · {line.medication.dosage} · Qté {line.quantity}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <PriceRange
                          min={line.lineMin}
                          max={line.lineMax}
                          size="sm"
                          variant="brand"
                        />
                        <p className="mt-0.5 flex items-center justify-end gap-0.5 text-[10px] text-muted-foreground">
                          <MapPin className="size-3" /> {line.pharmacyCount} pharmacies
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Meilleure option recommandée */}
          {bestOption && (
            <section>
              <Card className="overflow-hidden border-brand/30 py-0 shadow-premium-lg">
                <div className="flex items-center gap-3 bg-brand px-5 py-3.5 text-white">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                    <Award className="size-5" />
                  </span>
                  <div className="flex-1">
                    <h2 className="text-base font-extrabold">
                      Meilleure option recommandée
                    </h2>
                    <p className="text-xs text-white/85">
                      Disponibilité complète, proximité et prix optimisé
                    </p>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-dark text-white">
                        <Plus className="size-6" strokeWidth={3} />
                      </span>
                      <div>
                        <h3 className="text-base font-bold text-foreground">
                          {bestOption.name}
                        </h3>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="size-3" /> {bestOption.quartier}, {bestOption.commune} · {bestOption.distance} km
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-success-light px-2 py-0.5 text-[10px] font-bold text-success">
                            <CheckCircle2 className="size-2.5" /> Ordonnance complète
                          </span>
                          {bestOption.openNow && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-brand-light px-2 py-0.5 text-[10px] font-bold text-brand-dark">
                              <span className="size-1.5 rounded-full bg-brand animate-pulse" /> Ouvert
                            </span>
                          )}
                          {bestOption.isOnDuty && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-warning-light px-2 py-0.5 text-[10px] font-bold text-warning-foreground">
                              <Timer className="size-2.5" /> De garde
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                        Total estimatif
                      </p>
                      <Price amount={bestOption.totalEstimate} size="lg" variant="brand" />
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="bg-brand text-white hover:bg-brand-dark"
                      onClick={() => handlePaidAction("bestPharmacy")}
                    >
                      <Award className="size-3.5" />
                      {hasPass ? "Meilleure pharmacie" : "Meilleure pharmacie — 1 crédit"}
                      <CreditCost cost={hasPass ? 0 : CREDIT_COSTS.bestPharmacy} className="ml-1" />
                      <ChevronRight className="size-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-muted-foreground"
                      onClick={() => navigate("pharmacy-detail", { slug: bestOption.slug })}
                    >
                      <Lock className="size-3.5" /> Contact — 1 crédit
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <a
                        href={`https://www.google.com/maps?q=${bestOption.latitude},${bestOption.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Navigation className="size-3.5" /> Itinéraire
                      </a>
                    </Button>
                  </div>
                </div>
              </Card>
            </section>
          )}

          {/* Comparaison des prix par pharmacie */}
          {fullPharmacies.length > 0 && estimate && (
            <section>
              <div className="mb-4">
                <Eyebrow>Comparaison</Eyebrow>
                <Heading level="h2">
                  Comparaison des prix par pharmacie
                </Heading>
                <Muted className="mt-0.5">
                  Comparez le prix de chaque médicament et le total de votre ordonnance selon la pharmacie.
                </Muted>
              </div>

              {/* Mobile: cartes empilées */}
              <div className="flex flex-col gap-3 lg:hidden">
                {fullPharmacies
                  .slice()
                  .sort((a, b) => a.totalEstimate - b.totalEstimate)
                  .map((p, pIdx) => (
                    <Card
                      key={p.id}
                      className={cn(
                        "border-border/70 p-4 shadow-card",
                        pIdx === 0 && "border-success/40 bg-success-light/10"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {pIdx === 0 && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-success px-1.5 py-0.5 text-[9px] font-bold text-white">
                              <TrendingDown className="size-2.5" /> Moins cher
                            </span>
                          )}
                          <div>
                            <p className="text-sm font-bold text-foreground">{p.name}</p>
                            <p className="text-[10px] text-muted-foreground">{p.commune} · {p.distance} km</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">Total</p>
                          <p className={cn(
                            "text-base font-extrabold",
                            pIdx === 0 ? "text-success" : "text-brand-dark"
                          )}>
                            {p.totalEstimate.toLocaleString("fr-FR")} F
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border/50 pt-3">
                        {p.medPrices?.map((mp, i) => (
                          <div key={i} className="flex items-center justify-between rounded-lg bg-muted/30 px-2.5 py-1.5">
                            <span className="truncate text-[11px] font-medium text-muted-foreground">
                              {mp ? mp.name : "—"}
                            </span>
                            <span className={cn("text-xs font-bold", mp ? "text-foreground" : "text-danger")}>
                              {mp ? `${mp.lineTotal.toLocaleString("fr-FR")} F` : "—"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
              </div>

              {/* Desktop: tableau */}
              <Card className="hidden overflow-hidden border-border/70 py-0 shadow-card lg:block">
                <div className="overflow-x-auto scroll-thin">
                  <table className="w-full border-collapse text-left text-sm" style={{ display: "table" }}>
                    <thead className="border-b border-border/60 bg-muted/40">
                      <tr>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                          Pharmacie
                        </th>
                        {estimate.lines.map((line, i) => (
                          <th key={i} className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wide text-muted-foreground">
                            {line.medication.name}
                            <span className="block text-[10px] font-normal text-muted-foreground/70">×{line.quantity}</span>
                          </th>
                        ))}
                        <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-brand-dark">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {fullPharmacies
                        .slice()
                        .sort((a, b) => a.totalEstimate - b.totalEstimate)
                        .map((p, pIdx) => (
                          <tr
                            key={p.id}
                            className={cn(
                              "transition-colors hover:bg-accent/30",
                              pIdx === 0 && "bg-brand-light/30"
                            )}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {pIdx === 0 && (
                                  <span className="inline-flex items-center gap-0.5 rounded-full bg-success px-1.5 py-0.5 text-[9px] font-bold text-white">
                                    <TrendingDown className="size-2.5" /> Moins cher
                                  </span>
                                )}
                                <div>
                                  <p className="text-xs font-bold text-foreground">{p.name}</p>
                                  <p className="text-[10px] text-muted-foreground">{p.commune} · {p.distance} km</p>
                                </div>
                              </div>
                            </td>
                            {p.medPrices?.map((mp, i) => (
                              <td key={i} className="px-3 py-3 text-center">
                                {mp ? (
                                  <span className="text-xs font-semibold text-foreground">
                                    {mp.lineTotal.toLocaleString("fr-FR")} F
                                  </span>
                                ) : (
                                  <span className="text-xs text-danger">—</span>
                                )}
                              </td>
                            ))}
                            <td className="px-4 py-3 text-center">
                              <span className={cn(
                                "text-sm font-extrabold",
                                pIdx === 0 ? "text-success" : "text-brand-dark"
                              )}>
                                {p.totalEstimate.toLocaleString("fr-FR")} F
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <p className="mt-3 text-xs text-muted-foreground">
                Les prix affichés sont indicatifs et peuvent varier. Le badge « Moins cher » indique la pharmacie avec le total le plus bas pour votre ordonnance complète.
              </p>
            </section>
          )}

          {/* Pharmacies ayant TOUTE l'ordonnance */}
          <section id="pharmacies-complete">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <Eyebrow>Disponibilité complète</Eyebrow>
                <Heading level="h2">
                  Pharmacies ayant toute l&apos;ordonnance
                </Heading>
                <Muted className="mt-0.5">
                  {fullPharmacies.length} pharmacie{fullPharmacies.length > 1 ? "s" : ""} peuvent fournir tous vos médicaments
                </Muted>
              </div>
            </div>

            {/* Sort filters */}
            <div className="mb-4 flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {SORT_OPTIONS.map((opt) => {
                const active = sortKey === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => setSortKey(opt.key)}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                      active
                        ? "border-brand bg-brand text-white"
                        : "border-border bg-background text-foreground/70 hover:border-brand/40 hover:text-brand"
                    )}
                  >
                    <opt.icon className="size-3.5" /> {opt.label}
                  </button>
                );
              })}
            </div>

            {sortedFull.length === 0 ? (
              <Card className="p-6 text-center text-sm text-muted-foreground">
                Aucune pharmacie ne dispose de tous les médicaments actuellement.
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {sortedFull.map((p) => (
                  <FullPharmacyCard key={p.id} pharma={p} />
                ))}
              </div>
            )}
          </section>

          {/* Pharmacies ayant une PARTIE de l'ordonnance */}
          {partialPharmacies.length > 0 && (
            <section>
              <div className="mb-4">
                <Eyebrow>Disponibilité partielle</Eyebrow>
                <Heading level="h2">
                  Pharmacies ayant une partie de l&apos;ordonnance
                </Heading>
                <Muted className="mt-0.5">
                  Ces pharmacies disposent de certains médicaments uniquement
                </Muted>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {partialPharmacies.map((p) => (
                  <PartialPharmacyCard key={p.id} pharma={p} />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* RIGHT: Résumé + actions */}
        <div className="space-y-3 lg:space-y-4">
          {/* Résumé de l'ordonnance */}
          <Card className="border-border/70 p-4 shadow-card lg:sticky lg:top-24 lg:p-5">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-brand-light text-brand">
                <ClipboardList className="size-4" />
              </span>
              <h3 className="text-base font-bold text-foreground">
                Résumé de l&apos;ordonnance
              </h3>
            </div>

            <div className="mt-4 space-y-2.5 text-sm">
              <Row label="Total estimatif" value={
                <PriceRange min={estimate.totalMin} max={estimate.totalMax} size="sm" variant="brand" />
              } />
              <Row label="Nombre de produits" value={String(estimate.lines.length)} />
              <Row
                label="Disponibilité globale"
                value={
                  availableMeds === estimate.lines.length ? "Complète" : "Partielle"
                }
              />
              {bestOption && (
                <Row label="Pharmacie recommandée" value={bestOption.name} small />
              )}
              {bestOption && (
                <Row label="Distance estimée" value={`${bestOption.distance} km`} />
              )}
            </div>

            <Separator className="my-4" />

            <div className="rounded-xl bg-brand-light/50 p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wide text-brand">
                Fourchette totale
              </p>
              <PriceRange min={estimate.totalMin} max={estimate.totalMax} size="xl" variant="brand" className="mt-1 block" />
            </div>

            {bestOption && (
              <Button
                className="mt-4 w-full bg-brand text-white hover:bg-brand-dark"
                onClick={() => handlePaidAction("bestPharmacy")}
              >
                <Award className="size-4" />
                {hasPass ? "Meilleure pharmacie" : "Meilleure pharmacie — 1 crédit"}
                <CreditCost cost={hasPass ? 0 : CREDIT_COSTS.bestPharmacy} className="ml-1.5" />
              </Button>
            )}

            {/* Message Pass Ordonnance */}
            {hasPass && (
              <p className="mt-2 text-center text-[11px] leading-snug text-muted-foreground">
                <span className="inline-flex items-center gap-1 font-bold text-amber-700">
                  <Crown className="size-3" /> Pass Ordonnance Unique actif — actions gratuites
                </span>
              </p>
            )}
          </Card>

          {/* Actions avancées payantes */}
          <Card className="border-border/70 p-4">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-brand-light text-brand">
                <Zap className="size-4" />
              </span>
              <h3 className="text-base font-bold text-foreground">Actions avancées</h3>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {hasPass
                ? "Toutes les actions avancées sont gratuites avec votre Pass Ordonnance Unique."
                : "Chaque action avancée utilise des crédits. Achetez un Pass Ordonnance Unique pour un usage illimité."}
            </p>

            <div className="mt-3 space-y-2">
              <Button
                size="sm"
                variant="outline"
                className="w-full justify-between border-brand/30 hover:bg-brand-light/40 hover:text-brand-dark"
                onClick={() => handlePaidAction("compare")}
              >
                <span className="flex items-center gap-1.5">
                  <TrendingDown className="size-3.5" />
                  {hasPass ? "Comparer les prix" : "Comparer les prix — 1 crédit"}
                </span>
                <CreditCost cost={hasPass ? 0 : CREDIT_COSTS.comparePharmacies} />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full justify-between border-brand/30 hover:bg-brand-light/40 hover:text-brand-dark"
                onClick={() => handlePaidAction("confirm")}
              >
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5" />
                  {hasPass ? "Confirmation pharmacie" : "Confirmation pharmacie — 3 crédits"}
                </span>
                <CreditCost cost={hasPass ? 0 : CREDIT_COSTS.confirmBeforeVisit} />
              </Button>
            </div>
          </Card>

          {/* Action buttons */}
          <Card className="border-border/70 p-4">
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" onClick={handleSave}>
                <Save className="size-3.5" /> Enregistrer
              </Button>
              <Button size="sm" variant="outline" onClick={() => navigate("prescription")}>
                <Pencil className="size-3.5" /> Modifier
              </Button>
              <Button size="sm" variant="outline" onClick={() => navigate("prescription")}>
                <RotateCcw className="size-3.5" /> Nouvelle
              </Button>
              <Button size="sm" variant="outline" onClick={handleShare}>
                <Share2 className="size-3.5" /> Partager
              </Button>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="mt-2 w-full text-muted-foreground"
              onClick={() => navigate("history")}
            >
              <ClipboardList className="size-3.5" /> Voir mes ordonnances
            </Button>
          </Card>

          {/* Credits upsell */}
          {!premium && (
            <Card className="overflow-hidden border-amber-500/30 py-0">
              <div className="bg-amber-50 p-4">
                <div className="flex items-center gap-2">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-amber-500 text-white">
                    <Coins className="size-5" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-foreground">Rechargez vos crédits</p>
                    <p className="text-[11px] text-muted-foreground">À partir de 200 FCFA</p>
                  </div>
                </div>
                <ul className="mt-3 space-y-1 text-xs text-foreground/80">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-amber-500" /> Estimations illimitées
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-amber-500" /> Comparateur avancé
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-amber-500" /> Alertes de disponibilité
                  </li>
                </ul>
                <Button
                  size="sm"
                  className="mt-3 w-full bg-brand text-white hover:bg-brand-dark"
                  onClick={() => navigate("wallet")}
                >
                  <Coins className="size-3.5" /> Recharger
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* ============ MESSAGE DE PRUDENCE ============ */}
      <div className="mt-8">
        <AlertMessage variant="warning" icon={AlertTriangle}>
          Les prix et disponibilités sont indicatifs. Veuillez confirmer auprès de la
          pharmacie avant tout déplacement. Demandez toujours conseil à un pharmacien ou
          professionnel de santé.
        </AlertMessage>
      </div>

      {/* ============ DIALOGUE ACTION AVANCÉE PAYANTE ============ */}
      <CreditConfirmDialog
        open={paidAction !== null}
        onOpenChange={(o) => {
          if (!o) setPaidAction(null);
        }}
        title={paidAction ? PAID_ACTION_CONFIG[paidAction].title : ""}
        cost={paidAction ? PAID_ACTION_CONFIG[paidAction].cost : 0}
        description={paidAction ? PAID_ACTION_CONFIG[paidAction].description : ""}
        benefits={paidAction ? PAID_ACTION_CONFIG[paidAction].benefits : []}
        onConfirm={() => {
          if (paidAction) performPaidAction(paidAction);
        }}
      />
    </div>
  );
}

/* ============================================================
   SummaryStat — statistique du grand résumé
   ============================================================ */
function SummaryStat({
  icon: Icon,
  tone,
  value,
  label,
  isText = false,
}: {
  icon: typeof Pill;
  tone: "brand" | "success" | "warning" | "danger" | "info" | "neutral";
  value: string | number;
  label: string;
  isText?: boolean;
}) {
  const tones = {
    brand: "bg-brand-light text-brand",
    success: "bg-success-light text-success",
    warning: "bg-warning-light text-warning-foreground",
    danger: "bg-danger-light text-danger",
    info: "bg-info-light text-info",
    neutral: "bg-neutral-light text-neutral-foreground",
  };
  return (
    <Card className="gap-0 border-border/60 py-3">
      <div className="flex items-center gap-2.5 px-3">
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", tones[tone])}>
          <Icon className="size-4.5" />
        </span>
        <div className="min-w-0">
          <p className={cn("font-extrabold leading-tight text-brand-dark", isText ? "text-sm" : "text-lg")}>
            {value}
          </p>
          <p className="truncate text-[10px] leading-tight text-muted-foreground">{label}</p>
        </div>
      </div>
    </Card>
  );
}

/* ============================================================
   Row — ligne label/value du résumé
   ============================================================ */
function Row({
  label,
  value,
  small = false,
}: {
  label: string;
  value: React.ReactNode;
  small?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-semibold text-foreground text-right truncate", small && "text-xs")}>
        {value}
      </span>
    </div>
  );
}

/* ============================================================
   MedStatusBadge — badge de statut médicament
   ============================================================ */
function MedStatusBadge({
  status,
}: {
  status: "available" | "to-confirm" | "out-of-stock";
}) {
  const config = {
    available: { label: "Disponible", icon: CheckCircle2, className: "bg-success-light text-success" },
    "to-confirm": { label: "À confirmer", icon: Info, className: "bg-info-light text-info" },
    "out-of-stock": { label: "Rupture", icon: XCircle, className: "bg-danger-light text-danger" },
  }[status];
  const Icon = config.icon;
  return (
    <span className={cn("inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold", config.className)}>
      <Icon className="size-2.5" /> {config.label}
    </span>
  );
}

/* ============================================================
   FullPharmacyCard — pharmacie avec toute l'ordonnance
   ============================================================ */
function FullPharmacyCard({
  pharma,
}: {
  pharma: ResultPharmacy & { distance: number; openNow: boolean };
}) {
  const { navigate } = useNav();
  const mapsUrl = `https://www.google.com/maps?q=${pharma.latitude},${pharma.longitude}`;
  const phoneHref = `tel:${pharma.phone.replace(/\s/g, "")}`;

  return (
    <Card className="gap-0 overflow-hidden border-border/70 py-0 shadow-card transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-premium-lg">
      <div className="flex items-center justify-between bg-brand px-4 py-2.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
          <CheckCircle2 className="size-2.5" /> Ordonnance complète
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-brand-dark px-1.5 py-0.5 text-[10px] font-bold text-white">
          <span className="size-1.5 rounded-full bg-amber-300" />
          {pharma.rating.toFixed(1)}
        </span>
      </div>
      <div className="space-y-3 p-4">
        <div>
          <h3 className="text-sm font-bold text-foreground">{pharma.name}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3" /> {pharma.quartier}, {pharma.commune}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
            pharma.openNow ? "bg-success-light text-success" : "bg-neutral-light text-neutral-foreground"
          )}>
            <span className={cn("size-1.5 rounded-full", pharma.openNow ? "bg-success animate-pulse" : "bg-muted-foreground/50")} />
            {pharma.openNow ? "Ouvert" : "Fermé"}
          </span>
          {pharma.isOnDuty && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-warning-light px-2 py-0.5 text-[10px] font-bold text-warning-foreground">
              <Timer className="size-2.5" /> De garde
            </span>
          )}
          {pharma.isOpen247 && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-brand-light px-2 py-0.5 text-[10px] font-bold text-brand-dark">
              <Clock className="size-2.5" /> 24/7
            </span>
          )}
          <span className="inline-flex items-center gap-0.5 rounded-full bg-info-light px-2 py-0.5 text-[10px] font-bold text-info">
            <Navigation className="size-2.5" /> {pharma.distance} km
          </span>
        </div>
        <div className="flex items-center justify-between border-t border-border/50 pt-2.5">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
              Total estimatif
            </p>
            <Price amount={pharma.totalEstimate} size="md" variant="brand" />
          </div>
          <div className="text-right">
            <p className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
              Médicaments
            </p>
            <p className="text-sm font-bold text-success">
              {pharma.availableCount}/{pharma.totalCount}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <Button size="sm" className="bg-brand text-white hover:opacity-90" onClick={() => navigate("pharmacy-detail", { slug: pharma.slug })}>
            Voir
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-muted-foreground"
            onClick={() => navigate("pharmacy-detail", { slug: pharma.slug })}
          >
            <Lock className="size-3.5" />
          </Button>
          <Button size="sm" variant="outline" asChild>
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
              <Navigation className="size-3.5" />
            </a>
          </Button>
        </div>
      </div>
    </Card>
  );
}

/* ============================================================
   PartialPharmacyCard — pharmacie avec partie de l'ordonnance
   ============================================================ */
function PartialPharmacyCard({
  pharma,
}: {
  pharma: ResultPharmacy & { distance: number; openNow: boolean };
}) {
  const { navigate } = useNav();
  const mapsUrl = `https://www.google.com/maps?q=${pharma.latitude},${pharma.longitude}`;

  return (
    <Card className="gap-0 overflow-hidden border-border/70 py-0 shadow-card transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-premium-lg">
      <div className="flex items-center justify-between bg-muted px-4 py-2.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-warning-light px-2 py-0.5 text-[10px] font-bold text-warning-foreground">
          <AlertTriangle className="size-2.5" /> Disponibilité partielle
        </span>
        <span className="text-[10px] font-bold text-muted-foreground">
          {pharma.availableCount}/{pharma.totalCount} médicaments
        </span>
      </div>
      <div className="space-y-3 p-4">
        <div>
          <h3 className="text-sm font-bold text-foreground">{pharma.name}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3" /> {pharma.quartier}, {pharma.commune} · {pharma.distance} km
          </p>
        </div>

        {/* Available meds */}
        <div>
          <p className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-success">
            <CheckCircle2 className="size-3" /> Disponibles ({pharma.availableMeds.length})
          </p>
          <div className="flex flex-wrap gap-1">
            {pharma.availableMeds.map((m) => (
              <span key={m} className="rounded-md bg-success-light px-1.5 py-0.5 text-[10px] font-medium text-success">
                {m}
              </span>
            ))}
          </div>
        </div>

        {/* Missing meds */}
        {pharma.missingMeds.length > 0 && (
          <div>
            <p className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-danger">
              <XCircle className="size-3" /> Manquants ({pharma.missingMeds.length})
            </p>
            <div className="flex flex-wrap gap-1">
              {pharma.missingMeds.map((m) => (
                <span key={m} className="rounded-md bg-danger-light px-1.5 py-0.5 text-[10px] font-medium text-danger line-through">
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 border-t border-border/50 pt-2.5">
          <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate("pharmacy-detail", { slug: pharma.slug })}>
            Voir détails
          </Button>
          <Button size="sm" variant="outline" asChild>
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
              <Navigation className="size-3.5" /> Itinéraire
            </a>
          </Button>
        </div>
      </div>
    </Card>
  );
}
