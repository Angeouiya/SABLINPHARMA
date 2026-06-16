"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryIcon } from "@/components/category-icons";
import { FavoriteButton } from "@/components/shared/favorite-button";
import { useNav } from "@/store/nav";
import { formatFCFA, distanceKm } from "@/lib/format";
import { cn } from "@/lib/utils";

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
  pharmacies: Array<{
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
  }>;
}

// Approx Abidjan center for distance display
const ABIDJAN_CENTER = { lat: 5.34, lon: -4.008 };

export function MedicationDetailView() {
  const { params, navigate } = useNav();
  const [med, setMed] = useState<MedDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!params.slug) {
      navigate("medications");
      return;
    }
    let active = true;
    (async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const r = await fetch(`/api/medications/${params.slug}`);
        if (!r.ok) throw new Error("not found");
        const data = await r.json();
        if (active) {
          setMed(data);
          setNotFound(false);
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

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="mb-4 h-8 w-32" />
        <Skeleton className="h-48 rounded-2xl" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (notFound || !med) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Médicament introuvable</h1>
        <Button className="mt-4" onClick={() => navigate("medications")}>
          Retour aux médicaments
        </Button>
      </div>
    );
  }

  const inStock = med.pharmacies.filter((p) => p.inStock);
  const minPrice = inStock.length ? Math.min(...inStock.map((p) => p.price)) : med.avgPrice;
  const maxPrice = inStock.length ? Math.max(...inStock.map((p) => p.price)) : med.avgPrice;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <button
        onClick={() => navigate("medications")}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-brand"
      >
        <ChevronLeft className="size-4" /> Médicaments
      </button>

      {/* Header card */}
      <Card className="overflow-hidden border-border/70 py-0">
        <div className="grid gap-0 md:grid-cols-[200px_1fr]">
          <div
            className="relative flex items-center justify-center bg-gradient-to-br from-brand-light/70 to-brand-light/30 p-8"
            style={med.category ? { backgroundColor: `${med.category.color}14` } : undefined}
          >
            <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle at 30% 30%, var(--brand) 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
            <div className="relative flex size-24 items-center justify-center rounded-3xl bg-background shadow-premium">
              {med.category ? (
                <CategoryIcon name={med.category.iconName} size={44} color={med.category.color} />
              ) : (
                <Pill className="size-10 text-brand" />
              )}
            </div>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap items-center gap-2">
              {med.category && (
                <Badge variant="outline" className="border-brand/30 bg-brand-light/50 text-brand-dark">
                  {med.category.name}
                </Badge>
              )}
              {med.requiresRx ? (
                <Badge className="border-0 bg-amber-500/90 text-white">
                  <ShieldAlert className="size-3" /> Sur ordonnance
                </Badge>
              ) : (
                <Badge className="border-0 bg-brand/90 text-white">
                  <CheckCircle2 className="size-3" /> Libre accès
                </Badge>
              )}
            </div>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              {med.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {med.genericName} · {med.form} {med.dosage}
            </p>
            <p className="mt-1 text-xs text-muted-foreground/80">{med.packSize}</p>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border/60 bg-background p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Prix min.</p>
                <p className="text-base font-extrabold text-brand-dark">{formatFCFA(minPrice)}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Prix max.</p>
                <p className="text-base font-extrabold text-foreground">{formatFCFA(maxPrice)}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Pharmacies</p>
                <p className="text-base font-extrabold text-foreground">{inStock.length} dispo</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                className="bg-brand-gradient text-white hover:opacity-90"
                onClick={() => navigate("prescription")}
              >
                <ClipboardList className="size-4" /> Estimer mon ordonnance
              </Button>
              <Button variant="outline" onClick={() => navigator.share?.({ title: med.name }).catch(() => {})}>
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

      {/* Description */}
      <Card className="mt-5 border-border/70">
        <div className="px-5 py-4">
          <h2 className="text-base font-bold text-foreground">À propos de ce médicament</h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground/80">{med.description}</p>
          {med.requiresRx && (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-50 p-3.5">
              <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-600" />
              <p className="text-sm text-amber-900">
                <strong>Médicament soumis à ordonnance.</strong> La délivrance nécessite une prescription médicale. Consultez un professionnel de santé avant usage.
              </p>
            </div>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            ℹ️ SABLIN PHARMA est une plateforme d&apos;information. Les prix affichés sont fournis à titre indicatif et peuvent varier selon les pharmacies. Aucune vente en ligne.
          </p>
        </div>
      </Card>

      {/* Pharmacies that have it */}
      <div className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold tracking-tight text-foreground">
            Pharmacies où le trouver
          </h2>
          <Badge variant="outline" className="border-brand/30 bg-brand-light/50 text-brand-dark">
            {inStock.length} disponible{inStock.length > 1 ? "s" : ""}
          </Badge>
        </div>

        <div className="mt-4 space-y-2.5">
          {med.pharmacies.map((p) => (
            <Card key={p.id} className={cn("border-border/60 py-0", !p.inStock && "opacity-60")}>
              <button
                onClick={() => p.inStock && navigate("pharmacy-detail", { slug: p.slug })}
                className="flex w-full items-center gap-3 p-4 text-left"
              >
                <span className="relative flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-dark text-white">
                  <Plus className="size-6" strokeWidth={3} />
                  {p.isOnDuty && (
                    <span className="absolute -right-1 -top-1 flex size-3.5 items-center justify-center rounded-full bg-amber-400 ring-2 ring-background" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-bold text-foreground">{p.name}</h3>
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-brand-dark px-1.5 py-0.5 text-[10px] font-bold text-white">
                      <span className="size-1.5 rounded-full bg-amber-300" />
                      {p.rating.toFixed(1)}
                    </span>
                  </div>
                  <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                    <MapPin className="size-3 shrink-0" />
                    {p.address}, {p.commune} · ~{distanceKm(ABIDJAN_CENTER.lat, ABIDJAN_CENTER.lon, p.latitude, p.longitude)} km
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {p.isOpen247 && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-brand-light px-1.5 py-0.5 text-[10px] font-semibold text-brand-dark">
                        <Clock className="size-2.5" /> 24/7
                      </span>
                    )}
                    {p.isOnDuty && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                        <Timer className="size-2.5" /> De garde
                      </span>
                    )}
                    <span
                      className={cn(
                        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                        p.openNow ? "bg-brand-light text-brand-dark" : "bg-muted text-muted-foreground"
                      )}
                    >
                      <span className={cn("size-1.5 rounded-full", p.openNow ? "bg-brand" : "bg-muted-foreground/50")} />
                      {p.openNow ? "Ouvert" : "Fermé"}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {p.inStock ? (
                    <>
                      <span className="text-base font-extrabold text-brand-dark">{formatFCFA(p.price)}</span>
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-brand">
                        <CheckCircle2 className="size-3" /> En stock
                      </span>
                    </>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-muted-foreground">
                      <XCircle className="size-3" /> Rupture
                    </span>
                  )}
                </div>
              </button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
