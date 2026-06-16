"use client";

import { useEffect, useState, useMemo } from "react";
import {
  ChevronLeft,
  Plus,
  Timer,
  Clock,
  MapPin,
  Phone,
  Navigation,
  Search,
  X,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { CategoryIcon } from "@/components/category-icons";
import { useNav } from "@/store/nav";
import { formatFCFA } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Pharmacy } from "@/lib/types";

interface PharmacyMedicationItem {
  id: string;
  name: string;
  slug: string;
  genericName: string;
  form: string;
  dosage: string;
  packSize: string;
  requiresRx: boolean;
  category: { id: string; name: string; slug: string; iconName: string; color: string };
  price: number;
  inStock: boolean;
}

interface PharmacyDetail extends Pharmacy {
  medications: PharmacyMedicationItem[];
}

function RatingPill({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand-dark px-2.5 py-1 text-xs font-bold text-white">
      <span className="flex size-3.5 items-center justify-center rounded-full bg-white/25">
        <span className="block size-1.5 rounded-full bg-amber-300" />
      </span>
      {rating.toFixed(1)}
    </span>
  );
}

export function PharmacyDetailView() {
  const { params, navigate } = useNav();
  const [pharmacy, setPharmacy] = useState<PharmacyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [medQuery, setMedQuery] = useState("");

  useEffect(() => {
    if (!params.slug) {
      navigate("pharmacies");
      return;
    }
    const run = () => {
      setLoading(true);
      setNotFound(false);
      setPharmacy(null);
      fetch(`/api/pharmacies/${params.slug}`)
        .then((r) => {
          if (!r.ok) throw new Error("not found");
          return r.json();
        })
        .then((data: PharmacyDetail) => setPharmacy(data))
        .catch(() => setNotFound(true))
        .finally(() => setLoading(false));
    };
    const t = setTimeout(run, 0);
    return () => clearTimeout(t);
  }, [params.slug, navigate]);

  const filteredMeds = useMemo(() => {
    if (!pharmacy) return [];
    const q = medQuery.trim().toLowerCase();
    if (!q) return pharmacy.medications;
    return pharmacy.medications.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.genericName.toLowerCase().includes(q) ||
        m.category?.name?.toLowerCase().includes(q)
    );
  }, [pharmacy, medQuery]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="mb-4 h-8 w-32" />
        <Skeleton className="h-56 rounded-2xl" />
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="mt-6 h-10 w-full rounded-xl" />
        <div className="mt-4 space-y-2.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (notFound || !pharmacy) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-brand-light text-brand">
          <Search className="size-8" />
        </span>
        <h1 className="mt-4 text-2xl font-bold text-foreground">
          Pharmacie introuvable
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Cette pharmacie n&apos;existe plus ou le lien est incorrect.
        </p>
        <Button
          className="mt-5 bg-brand-gradient text-white hover:opacity-90"
          onClick={() => navigate("pharmacies")}
        >
          <ChevronLeft className="size-4" /> Retour aux pharmacies
        </Button>
      </div>
    );
  }

  const mapsUrl = `https://www.google.com/maps?q=${pharmacy.latitude},${pharmacy.longitude}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back link */}
      <button
        onClick={() => navigate("pharmacies")}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-brand"
      >
        <ChevronLeft className="size-4" /> Pharmacies
      </button>

      {/* Header card */}
      <Card className="overflow-hidden border-border/70 py-0">
        <div className="relative bg-brand-gradient">
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage:
                "radial-gradient(circle at 80% 20%, white 1.5px, transparent 1.5px)",
              backgroundSize: "24px 24px",
            }}
          />
          <div className="absolute -right-12 -top-12 size-44 rounded-full bg-white/10 blur-3xl" />

          <div className="relative flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                <Plus className="size-9 text-white" strokeWidth={3} />
              </span>
              <div className="text-white">
                <h1 className="text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
                  {pharmacy.name}
                </h1>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-white/85">
                  <MapPin className="size-3.5" /> {pharmacy.commune}
                </p>
                <div className="mt-2">
                  <RatingPill rating={pharmacy.rating} />
                </div>
              </div>
            </div>

            <div className="flex flex-col items-start gap-2 sm:items-end">
              {pharmacy.isOnDuty && (
                <Badge className="border-0 bg-amber-400 text-xs font-bold text-amber-950">
                  <Timer className="size-3.5" /> De garde
                </Badge>
              )}
              {pharmacy.isOpen247 && (
                <Badge className="border-0 bg-white/20 text-xs font-bold text-white backdrop-blur-sm">
                  <Clock className="size-3.5" /> Ouvert 24/7
                </Badge>
              )}
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
                  pharmacy.openNow
                    ? "bg-white text-brand-dark"
                    : "bg-white/20 text-white backdrop-blur-sm"
                )}
              >
                <span
                  className={cn(
                    "size-2 rounded-full",
                    pharmacy.openNow ? "bg-brand animate-pulse" : "bg-white/70"
                  )}
                />
                {pharmacy.openNow ? "Ouvert maintenant" : "Fermé actuellement"}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Infos pratiques */}
      <section className="mt-6">
        <h2 className="text-lg font-extrabold tracking-tight text-foreground">
          Informations pratiques
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Adresse */}
          <Card className="border-border/70 py-0 transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-premium">
            <div className="flex items-start gap-3 p-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand">
                <MapPin className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Adresse
                </p>
                <p className="mt-0.5 text-sm font-semibold text-foreground">
                  {pharmacy.address}
                </p>
                <p className="text-xs text-muted-foreground">{pharmacy.commune}</p>
              </div>
            </div>
          </Card>

          {/* Téléphone */}
          <Card className="border-border/70 py-0 transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-premium">
            <a
              href={`tel:${pharmacy.phone.replace(/\s/g, "")}`}
              className="flex items-start gap-3 p-4"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand">
                <Phone className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Téléphone
                </p>
                <p className="mt-0.5 text-sm font-semibold text-brand-dark hover:underline">
                  {pharmacy.phone}
                </p>
                <p className="text-xs text-muted-foreground">
                  Appel direct depuis l&apos;app
                </p>
              </div>
            </a>
          </Card>

          {/* Horaires */}
          <Card className="border-border/70 py-0 transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-premium">
            <div className="flex items-start gap-3 p-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand">
                <Clock className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Horaires
                </p>
                <ul className="mt-1 space-y-0.5 text-xs">
                  <li className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Semaine</span>
                    <span className="font-semibold text-foreground">
                      {pharmacy.hoursWeekday}
                    </span>
                  </li>
                  <li className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Samedi</span>
                    <span className="font-semibold text-foreground">
                      {pharmacy.hoursSaturday}
                    </span>
                  </li>
                  <li className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Dimanche</span>
                    <span className="font-semibold text-foreground">
                      {pharmacy.hoursSunday}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Commune */}
          <Card className="border-border/70 py-0 transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-premium">
            <div className="flex items-start gap-3 p-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand">
                <Navigation className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Commune
                </p>
                <p className="mt-0.5 text-sm font-semibold text-foreground">
                  {pharmacy.commune}
                </p>
                <p className="text-xs text-muted-foreground">
                  Abidjan, Côte d&apos;Ivoire
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Localisation */}
      <section className="mt-6">
        <Card className="overflow-hidden border-border/70 py-0">
          <div className="relative bg-gradient-to-br from-brand-light/70 to-brand-light/30 p-5">
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 30% 30%, var(--brand) 1px, transparent 1px)",
                backgroundSize: "16px 16px",
              }}
            />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-background text-brand shadow-premium">
                  <MapPin className="size-6" />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-dark/70">
                    Localisation
                  </p>
                  <p className="text-sm font-bold text-foreground">
                    {pharmacy.name}
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                    Lat {pharmacy.latitude.toFixed(5)} · Lng{" "}
                    {pharmacy.longitude.toFixed(5)}
                  </p>
                </div>
              </div>
              <Button
                asChild
                className="shrink-0 bg-brand-gradient text-white hover:opacity-90"
              >
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                  <Navigation className="size-4" /> Voir sur Google Maps
                </a>
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* Médicaments disponibles */}
      <section className="mt-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-foreground">
              Médicaments disponibles
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {pharmacy.medications.length} produit
              {pharmacy.medications.length > 1 ? "s" : ""} référencé
              {pharmacy.medications.length > 1 ? "s" : ""} dans cette pharmacie
            </p>
          </div>
        </div>

        {/* Local search */}
        <div className="mt-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={medQuery}
              onChange={(e) => setMedQuery(e.target.value)}
              placeholder="Filtrer les médicaments (nom, principe actif, catégorie...)"
              className="h-11 rounded-xl border-border/70 bg-background pl-11 pr-11 text-sm"
            />
            {medQuery && (
              <button
                onClick={() => setMedQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Effacer le filtre"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">
              {filteredMeds.length}
            </span>{" "}
            médicament{filteredMeds.length > 1 ? "s" : ""} affiché
            {filteredMeds.length > 1 ? "s" : ""}
          </p>
        </div>

        {/* Medication rows */}
        <div className="mt-4 space-y-2.5">
          {filteredMeds.length === 0 ? (
            <Card className="flex flex-col items-center gap-2 border-border/60 p-10 text-center">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-light text-brand">
                <Search className="size-6" />
              </span>
              <p className="text-sm font-semibold text-foreground">
                Aucun médicament ne correspond
              </p>
              <p className="max-w-sm text-xs text-muted-foreground">
                Essayez un autre terme de recherche.
              </p>
            </Card>
          ) : (
            filteredMeds.map((m) => (
              <Card
                key={m.id}
                className={cn(
                  "border-border/60 py-0 transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-premium",
                  !m.inStock && "opacity-70"
                )}
              >
                <button
                  onClick={() => navigate("medication-detail", { slug: m.slug })}
                  className="flex w-full items-center gap-3 p-3.5 text-left"
                >
                  <span
                    className="flex size-11 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: m.category ? `${m.category.color}14` : undefined,
                    }}
                  >
                    {m.category ? (
                      <CategoryIcon
                        name={m.category.iconName}
                        size={22}
                        color={m.category.color}
                      />
                    ) : (
                      <Plus className="size-5 text-brand" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-sm font-bold text-foreground">
                        {m.name}
                      </h3>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {m.form} · {m.dosage}
                      {m.packSize ? ` · ${m.packSize}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-sm font-extrabold text-brand-dark">
                      {formatFCFA(m.price)}
                    </span>
                    {m.inStock ? (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-brand-light px-2 py-0.5 text-[10px] font-semibold text-brand-dark">
                        <CheckCircle2 className="size-3" /> En stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        <XCircle className="size-3" /> Rupture
                      </span>
                    )}
                  </div>
                </button>
              </Card>
            ))
          )}
        </div>
      </section>

      {/* Disclaimer */}
      <p className="mt-8 rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
        ℹ️ SABLIN PHARMA est une plateforme d&apos;information. Les prix et
        disponibilités affichés sont fournis à titre indicatif et peuvent varier.
        Aucune vente en ligne — contactez directement la pharmacie pour toute
        commande ou réservation.
      </p>
    </div>
  );
}
