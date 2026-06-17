"use client";

import { useEffect, useState, useMemo } from "react";
import {
  ChevronLeft,
  Pill,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  MapPin,
  Phone,
  Clock,
  Timer,
  Navigation,
  Plus,
  Share2,
  ClipboardList,
  Search,
  X,
  RefreshCw,
  ArrowRight,
  Info,
  Coins,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { CategoryIcon } from "@/components/category-icons";
import { FavoriteButton } from "@/components/shared/favorite-button";
import { AlertMessage } from "@/components/shared/alert-message";
import { GoogleMap } from "@/components/shared/google-map";
import { CreditConfirmDialog } from "@/components/shared/credit-confirm-dialog";
import { CreditCost } from "@/components/shared/credit-cost";
import {
  MedicationStatusBadge,
} from "@/components/shared/status-badge";
import { getMedStatus } from "@/components/shared/medication-card";
import { Heading, Eyebrow, Price, PriceRange, Muted } from "@/components/ui/typography";
import { useNav } from "@/store/nav";
import { useCredits, CREDIT_COSTS } from "@/store/credits";
import { formatFCFA, distanceKm, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Medication, MedicationStatus } from "@/lib/types";

interface PharmacyWithMed {
  id: string;
  name: string;
  slug: string;
  address: string;
  commune: string;
  phone: string;
  hoursWeekday: string;
  isOpen247: boolean;
  isOnDuty: boolean;
  latitude: number;
  longitude: number;
  rating: number;
  price: number;
  inStock: boolean;
  openNow: boolean;
}

interface MedDetail {
  id: string;
  name: string;
  slug: string;
  genericName: string;
  category: { id: string; name: string; slug: string; iconName: string; color: string } | null;
  form: string;
  dosage: string;
  packSize: string;
  description: string;
  requiresRx: boolean;
  avgPrice: number;
  createdAt: string;
  pharmacies: PharmacyWithMed[];
}

// Abidjan reference center
const ABIDJAN_CENTER = { lat: 5.34, lon: -4.008 };

export function MedicationDetailView() {
  const { params, navigate } = useNav();
  const [med, setMed] = useState<MedDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [alternatives, setAlternatives] = useState<Medication[]>([]);
  const [quickQuery, setQuickQuery] = useState("");
  const [quickResults, setQuickResults] = useState<Medication[]>([]);
  const [quickOpen, setQuickOpen] = useState(false);
  const [showCreditDialog, setShowCreditDialog] = useState(false);
  const [pharmaciesUnlocked, setPharmaciesUnlocked] = useState(false);
  const [showPrescriptionDialog, setShowPrescriptionDialog] = useState(false);
  const [showPricesDialog, setShowPricesDialog] = useState(false);
  const [pricesUnlocked, setPricesUnlocked] = useState(false);
  const { credits, hasPass } = useCredits();

  // Fetch medication detail
  useEffect(() => {
    if (!params.slug) {
      navigate("medications");
      return;
    }
    let active = true;
    setLoading(true);
    setNotFound(false);
    setPharmaciesUnlocked(false);
    setPricesUnlocked(false);
    (async () => {
      try {
        const r = await fetch(`/api/medications/${params.slug}`);
        if (!r.ok) throw new Error("not found");
        const data = await r.json();
        if (!active) return;
        setMed(data);
        // Fetch alternatives (same genericName, different slug)
        if (data.genericName) {
          const altRes = await fetch(
            `/api/medications?q=${encodeURIComponent(data.genericName)}&limit=10`
          );
          if (altRes.ok) {
            const altData = await altRes.json();
            setAlternatives(
              altData.filter((m: Medication) => m.slug !== data.slug).slice(0, 4)
            );
          }
        }
      } catch {
        if (active) setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [params.slug, navigate]);

  // Quick search (debounced)
  useEffect(() => {
    if (!quickQuery.trim() || quickQuery.trim().length < 2) {
      setQuickResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const r = await fetch(
          `/api/medications?q=${encodeURIComponent(quickQuery)}&limit=5`
        );
        if (r.ok) setQuickResults(await r.json());
      } catch {
        /* noop */
      }
    }, 250);
    return () => clearTimeout(t);
  }, [quickQuery]);

  // Derived data
  const inStock = useMemo(
    () => (med?.pharmacies ?? []).filter((p) => p.inStock),
    [med]
  );
  const globalStatus: MedicationStatus = useMemo(() => {
    if (!med) return "to-confirm";
    if (inStock.length === 0) return "out-of-stock";
    return getMedStatus({ slug: med.slug, pharmacyCount: inStock.length });
  }, [med, inStock]);

  const minPrice = inStock.length
    ? Math.min(...inStock.map((p) => p.price))
    : med?.avgPrice ?? 0;
  const maxPrice = inStock.length
    ? Math.max(...inStock.map((p) => p.price))
    : med?.avgPrice ?? 0;

  const sortedPharmacies = useMemo(() => {
    if (!med) return [];
    return [...med.pharmacies].sort((a, b) => {
      if (a.inStock !== b.inStock) return a.inStock ? -1 : 1;
      const da = distanceKm(ABIDJAN_CENTER.lat, ABIDJAN_CENTER.lon, a.latitude, a.longitude);
      const db = distanceKm(ABIDJAN_CENTER.lat, ABIDJAN_CENTER.lon, b.latitude, b.longitude);
      return da - db;
    });
  }, [med]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="mb-4 h-8 w-32" />
        <Skeleton className="h-56 rounded-2xl" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (notFound || !med) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <span className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-brand-light text-brand">
          <Pill className="size-8" />
        </span>
        <h1 className="text-2xl font-bold">Médicament introuvable</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ce médicament n&apos;existe pas ou le lien est incorrect.
        </p>
        <Button className="mt-4 bg-brand-gradient text-white" onClick={() => navigate("medications")}>
          <ChevronLeft className="size-4" /> Retour aux médicaments
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back + quick search bar */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={() => navigate("medications")}
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-brand"
        >
          <ChevronLeft className="size-4" /> Retour aux médicaments
        </button>

        {/* Quick search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={quickQuery}
            onChange={(e) => {
              setQuickQuery(e.target.value);
              setQuickOpen(true);
            }}
            onFocus={() => setQuickOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setQuickOpen(false);
              if (e.key === "Enter" && quickQuery.trim()) {
                navigate("medications", { query: quickQuery.trim() });
                setQuickOpen(false);
              }
            }}
            placeholder="Rechercher un autre médicament..."
            className="h-10 pl-9 pr-8 text-sm"
            aria-label="Recherche rapide"
          />
          {quickQuery && (
            <button
              onClick={() => {
                setQuickQuery("");
                setQuickResults([]);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Effacer"
            >
              <X className="size-4" />
            </button>
          )}
          {quickOpen && quickResults.length > 0 && (
            <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border border-border bg-popover shadow-premium-lg">
              <ul className="max-h-72 overflow-y-auto scroll-thin py-1">
                {quickResults.map((m) => (
                  <li key={m.id}>
                    <button
                      onClick={() => {
                        navigate("medication-detail", { slug: m.slug });
                        setQuickOpen(false);
                        setQuickQuery("");
                      }}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-accent"
                    >
                      <span className="flex size-8 items-center justify-center rounded-lg bg-brand-light text-brand">
                        <Pill className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{m.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {m.form} {m.dosage} · {m.pharmacyCount} pharmacies
                        </span>
                      </span>
                      <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* ============ MEDICATION FICHE ============ */}
      <Card className="overflow-hidden border-border/70 py-0 shadow-premium">
        <div className="grid gap-0 md:grid-cols-[220px_1fr]">
          {/* Visual */}
          <div className="relative flex items-center justify-center overflow-hidden bg-brand-light">
            {med.imageUrl ? (
              <img
                src={med.imageUrl}
                alt={med.name}
                className="aspect-square w-full object-cover"
              />
            ) : (
              <div
                className="flex items-center justify-center p-8"
                style={
                  med.category
                    ? { backgroundColor: `${med.category.color}14` }
                    : { backgroundColor: "var(--brand-light)" }
                }
              >
                <div className="relative flex size-24 items-center justify-center rounded-3xl bg-background shadow-premium">
                  {med.category ? (
                    <CategoryIcon name={med.category.iconName} size={44} color={med.category.color} />
                  ) : (
                    <Pill className="size-10 text-brand" />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              {med.category && (
                <Badge
                  variant="outline"
                  className="border-brand/30 bg-brand-light/50 text-brand-dark"
                >
                  {med.category.name}
                </Badge>
              )}
              <MedicationStatusBadge status={globalStatus} size="md" />
              {med.requiresRx ? (
                <Badge className="border-0 bg-amber-500/90 text-white">
                  <ShieldAlert className="size-3" /> Ordonnance requise
                </Badge>
              ) : (
                <Badge className="border-0 bg-brand/90 text-white">
                  <CheckCircle2 className="size-3" /> Libre accès
                </Badge>
              )}
              <CreditCost cost={0} />
            </div>

            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              {med.name}
            </h1>

            {/* Info grid */}
            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <InfoItem label="DCI" value={med.genericName} />
              <InfoItem label="Dosage" value={med.dosage} />
              <InfoItem label="Forme" value={med.form} />
              <InfoItem label="Conditionnement" value={med.packSize} />
            </div>

            {/* Price + stats */}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-brand/20 bg-brand-light/40 p-3.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-brand">
                  Prix indicatif
                </p>
                {minPrice === maxPrice ? (
                  <Price amount={minPrice} size="lg" variant="brand" className="mt-1" />
                ) : (
                  <PriceRange
                    min={minPrice}
                    max={maxPrice}
                    size="lg"
                    variant="brand"
                    className="mt-1 block"
                  />
                )}
              </div>
              <div className="rounded-xl border border-border/60 bg-background p-3.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  Pharmacies disponibles
                </p>
                <p className="mt-1 text-2xl font-extrabold text-foreground">
                  {inStock.length}
                  <span className="ml-1 text-sm font-medium text-muted-foreground">
                    / {med.pharmacies.length}
                  </span>
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background p-3.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  Dernière mise à jour
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <RefreshCw className="size-3.5 text-brand" />
                  {formatDate(med.createdAt)}
                </p>
              </div>
            </div>

            {/* Description */}
            <p className="mt-4 text-sm leading-relaxed break-words text-foreground/80">
              {med.description}
            </p>

            {/* Actions */}
            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                className="bg-brand text-white hover:bg-brand-dark"
                onClick={() => navigate("prescription")}
              >
                <ClipboardList className="size-4" /> Estimer mon ordonnance
              </Button>
              <Button
                variant="outline"
                className="border-brand/30 text-brand-dark hover:bg-brand-light"
                onClick={() => {
                  if (hasPass) {
                    toast.success("Médicament ajouté à l'ordonnance");
                    navigate("prescription");
                  } else {
                    setShowPrescriptionDialog(true);
                  }
                }}
              >
                <ClipboardList className="size-4" /> Ajouter à mon ordonnance
                <CreditCost cost={hasPass ? 0 : 1} className="ml-1" />
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  navigator.share?.({ title: med.name }).catch(() => {})
                }
              >
                <Share2 className="size-4" /> Partager
              </Button>
              <FavoriteButton
                kind="medication"
                slug={med.slug}
                label={`${med.name} · ${med.form} ${med.dosage}`}
                variant="button"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Prudence block */}
      <div className="mt-4">
        <AlertMessage variant="warning">
          Les informations affichées sont indicatives. Demandez toujours conseil à un
          pharmacien ou à un professionnel de santé avant toute utilisation.
        </AlertMessage>
      </div>

      {/* ============ PHARMACIES DISPONIBLES ============ */}
      <section className="mt-8">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Eyebrow>Disponibilité</Eyebrow>
              <CreditCost cost={CREDIT_COSTS.seePharmacies} />
            </div>
            <Heading level="h2">Pharmacies disponibles</Heading>
            <Muted className="mt-0.5">
              {inStock.length} pharmacie{inStock.length > 1 ? "s" : ""} ont ce médicament en stock
              à Abidjan
            </Muted>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:inline-flex"
            onClick={() => navigate("pharmacies")}
          >
            Toutes les pharmacies <ArrowRight className="size-3.5" />
          </Button>
        </div>

        {!pharmaciesUnlocked ? (
          /* Portail crédits : l'utilisateur doit confirmer l'utilisation d'1 crédit */
          <Card className="mt-5 border-brand/20 p-6 text-center shadow-card sm:p-8">
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-light text-brand">
              <Coins className="size-7" />
            </span>
            <h3 className="mt-4 text-lg font-extrabold text-foreground">
              Voir les pharmacies disponibles
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed break-words text-muted-foreground">
              Cette action coûte 1 crédit. Elle vous permet de voir les pharmacies
              où ce médicament est disponible.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Votre solde :{" "}
              <span className="font-bold text-foreground">
                {credits} crédit{credits !== 1 ? "s" : ""}
              </span>
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <Button
                className="bg-brand text-white hover:bg-brand-dark"
                onClick={() => setShowCreditDialog(true)}
              >
                <Coins className="size-4" /> Utiliser 1 crédit
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("medications")}
              >
                Annuler
              </Button>
            </div>
          </Card>
        ) : (
          <>
            {/* Voir les prix détaillés par pharmacie — 1 crédit (gratuit avec Pass Ordonnance) */}
            {!hasPass && !pricesUnlocked && (
              <Card className="mt-5 border-brand/20 p-5 shadow-card">
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand">
                      <Coins className="size-5" />
                    </span>
                    <div>
                      <h3 className="text-sm font-extrabold text-foreground">
                        Voir les prix détaillés par pharmacie
                      </h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Prix indicatif précis pour chaque pharmacie ayant ce médicament.
                      </p>
                    </div>
                  </div>
                  <Button
                    className="bg-brand text-white hover:bg-brand-dark"
                    onClick={() => setShowPricesDialog(true)}
                  >
                    <Coins className="size-4" /> Voir les prix détaillés
                    <CreditCost cost={1} className="ml-1" />
                  </Button>
                </div>
              </Card>
            )}

            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              {sortedPharmacies.map((p) => (
                <PharmacyMedCard
                  key={p.id}
                  pharma={p}
                  medicationName={med.name}
                  medicationSlug={med.slug}
                  pricesUnlocked={hasPass || pricesUnlocked}
                />
              ))}
            </div>

            {/* Carte des pharmacies ayant ce médicament */}
            {sortedPharmacies.length > 0 && (
              <Card className="mt-4 overflow-hidden border-brand/20 py-0">
                <GoogleMap
                  lat={sortedPharmacies[0].latitude}
                  lng={sortedPharmacies[0].longitude}
                  zoom={13}
                  label={sortedPharmacies[0].name}
                  title="Pharmacies ayant ce médicament"
                  className="h-64"
                />
              </Card>
            )}
          </>
        )}

        <CreditConfirmDialog
          open={showCreditDialog}
          onOpenChange={setShowCreditDialog}
          title="Voir les pharmacies disponibles"
          cost={CREDIT_COSTS.seePharmacies}
          description="Liste exacte des pharmacies avec ce médicament en stock"
          benefits={[
            "Voir toutes les pharmacies qui ont ce médicament",
            "Prix indicatif par pharmacie",
            "Distance et statut d'ouverture",
          ]}
          onConfirm={() => setPharmaciesUnlocked(true)}
        />

        {/* Ajouter à mon ordonnance — 1 crédit */}
        <CreditConfirmDialog
          open={showPrescriptionDialog}
          onOpenChange={setShowPrescriptionDialog}
          title="Ajouter à mon ordonnance"
          cost={1}
          description="Ce médicament sera ajouté à votre ordonnance pour estimation."
          benefits={[
            "Médicament ajouté à votre liste",
            "Vous pouvez lancer l'estimation ensuite",
          ]}
          onConfirm={() => {
            toast.success("Médicament ajouté à l'ordonnance");
            navigate("prescription");
          }}
        />

        {/* Voir les prix détaillés par pharmacie — 1 crédit */}
        <CreditConfirmDialog
          open={showPricesDialog}
          onOpenChange={setShowPricesDialog}
          title="Voir les prix détaillés par pharmacie"
          cost={1}
          description="Prix indicatif précis pour chaque pharmacie ayant ce médicament."
          benefits={[
            "Prix exact par pharmacie",
            "Comparaison rapide des prix",
            "Meilleure option tarifaire",
          ]}
          onConfirm={() => setPricesUnlocked(true)}
        />
      </section>

      {/* ============ ALTERNATIVES / ÉQUIVALENTS ============ */}
      {alternatives.length > 0 && (
        <section className="mt-10">
          <div className="flex items-end justify-between gap-3">
            <div>
              <Eyebrow>Compléments</Eyebrow>
              <Heading level="h2">Alternatives ou équivalents</Heading>
              <Muted className="mt-0.5">
                Médicaments similaires ou de même principe actif ({med.genericName})
              </Muted>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {alternatives.map((alt) => {
              const status = getMedStatus(alt);
              const dist = 0;
              void dist;
              return (
                <Card
                  key={alt.id}
                  onClick={() => navigate("medication-detail", { slug: alt.slug })}
                  className="group cursor-pointer gap-0 border-border/70 py-0 transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-premium-lg"
                >
                  <div className="flex items-center gap-3 p-3.5">
                    <span
                      className="flex size-11 shrink-0 items-center justify-center rounded-xl text-white"
                      style={{ backgroundColor: alt.category?.color ?? "var(--brand)" }}
                    >
                      <CategoryIcon
                        name={alt.category?.iconName ?? "Pill"}
                        size={22}
                        color="#fff"
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-bold text-foreground">
                        {alt.name}
                      </h3>
                      <p className="truncate text-xs text-muted-foreground">
                        {alt.form} · {alt.dosage}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-border/50 px-3.5 py-2.5">
                    <Price amount={alt.avgPrice} size="sm" variant="brand" />
                    <MedicationStatusBadge status={status} />
                  </div>
                </Card>
              );
            })}
          </div>

          <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            Section informative uniquement. Ne constitue pas un conseil médical — consultez un
            professionnel de santé.
          </p>
        </section>
      )}
    </div>
  );
}

/* ============================================================
   InfoItem — petit bloc d'information label/valeur
   ============================================================ */
function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/50 bg-muted/30 px-2.5 py-1.5">
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="truncate text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

/* ============================================================
   PharmacyMedCard — carte pharmacie avec le médicament
   Affiche : nom, commune, quartier, distance, prix, statut,
   garde, MAJ + 4 boutons (Voir / Appeler / Itinéraire / Ajouter ordonnance)
   ============================================================ */
function PharmacyMedCard({
  pharma,
  medicationName,
  medicationSlug,
  pricesUnlocked,
}: {
  pharma: PharmacyWithMed;
  medicationName: string;
  medicationSlug: string;
  pricesUnlocked: boolean;
}) {
  const { navigate } = useNav();
  const dist = distanceKm(
    ABIDJAN_CENTER.lat,
    ABIDJAN_CENTER.lon,
    pharma.latitude,
    pharma.longitude
  );
  const quartier = pharma.address.split(",")[0]?.trim() ?? pharma.commune;
  const mapsUrl = `https://www.google.com/maps?q=${pharma.latitude},${pharma.longitude}`;
  const phoneHref = `tel:${pharma.phone.replace(/\s/g, "")}`;

  return (
    <Card
      className={cn(
        "gap-0 border-border/70 py-0 transition-all hover:shadow-premium",
        !pharma.inStock && "opacity-70"
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3 border-b border-border/50 p-4">
        <span className="relative flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-dark text-white">
          <Plus className="size-6" strokeWidth={3} />
          {pharma.isOnDuty && (
            <span className="absolute -right-1 -top-1 flex size-3.5 items-center justify-center rounded-full bg-amber-400 ring-2 ring-background" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-bold text-foreground">{pharma.name}</h3>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-brand-dark px-1.5 py-0.5 text-[10px] font-bold text-white">
              <span className="size-1.5 rounded-full bg-amber-300" />
              {pharma.rating.toFixed(1)}
            </span>
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3 shrink-0" />
            {quartier}, <span className="font-medium">{pharma.commune}</span>
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {/* Open / Closed */}
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
          </div>
        </div>
      </div>

      {/* Price + distance + availability */}
      <div className="grid grid-cols-3 divide-x divide-border/50 border-b border-border/50">
        <div className="px-3 py-2.5 text-center">
          <p className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
            Prix indicatif
          </p>
          {pharma.inStock ? (
            pricesUnlocked ? (
              <p className="mt-0.5 text-sm font-extrabold text-brand-dark">
                {pharma.price.toLocaleString("fr-FR")} F
              </p>
            ) : (
              <span className="mt-0.5 inline-flex items-center gap-1 text-xs font-bold text-muted-foreground">
                <Lock className="size-3" /> Masqué
              </span>
            )
          ) : (
            <p className="mt-0.5 text-sm font-bold text-muted-foreground">—</p>
          )}
        </div>
        <div className="px-3 py-2.5 text-center">
          <p className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
            Distance
          </p>
          <p className="mt-0.5 flex items-center justify-center gap-0.5 text-sm font-bold text-foreground">
            <Navigation className="size-3 text-brand" />
            {dist} km
          </p>
        </div>
        <div className="px-3 py-2.5 text-center">
          <p className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
            Stock
          </p>
          {pharma.inStock ? (
            <span className="mt-0.5 inline-flex items-center gap-0.5 text-xs font-bold text-success">
              <CheckCircle2 className="size-3" /> En stock
            </span>
          ) : (
            <span className="mt-0.5 inline-flex items-center gap-0.5 text-xs font-bold text-danger">
              <XCircle className="size-3" /> Rupture
            </span>
          )}
        </div>
      </div>

      {/* Last update + hours */}
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <RefreshCw className="size-3" /> MAJ : aujourd&apos;hui
        </span>
        <span className="flex items-center gap-1">
          <Clock className="size-3" /> {pharma.hoursWeekday}
        </span>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4">
        <Button
          size="sm"
          className="bg-brand-gradient text-white hover:opacity-90"
          onClick={() => navigate("pharmacy-detail", { slug: pharma.slug })}
        >
          Voir la pharmacie
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-muted-foreground"
          onClick={() => navigate("pharmacy-detail", { slug: pharma.slug })}
        >
          <Lock className="size-3.5" /> Contact — 1 crédit
        </Button>
        <Button size="sm" variant="outline" asChild>
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
            <Navigation className="size-3.5" /> Itinéraire
          </a>
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="border-brand/30 text-brand-dark hover:bg-brand-light"
          onClick={() => {
            toast.success(`${medicationName} ajouté à votre ordonnance`, {
              description: "Retrouvez-le dans la page Estimer mon ordonnance.",
            });
            navigate("prescription");
          }}
        >
          <ClipboardList className="size-3.5" /> Ordonnance
        </Button>
      </div>
    </Card>
  );
}
