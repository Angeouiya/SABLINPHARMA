"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  ClipboardList,
  Clock,
  Coins,
  MapPin,
  Pill,
  Plus,
  Search,
  ShieldAlert,
  Timer,
  Wallet,
  Lock,
} from "lucide-react";
import { SearchBar } from "@/components/shared/search-bar";
import { SectionHeader } from "@/components/shared/section-header";
import { GoogleMap } from "@/components/shared/google-map";
import { CreditCost } from "@/components/shared/credit-cost";
import { CategoryIcon } from "@/components/category-icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useNav } from "@/store/nav";
import { distanceKm } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Category, Medication, Pharmacy } from "@/lib/types";

const ABIDJAN_CENTER = { lat: 5.34, lon: -4.008 };

const HOME_CATEGORIES: { slug: string; fallbackName: string }[] = [
  { slug: "douleur-fievre", fallbackName: "Douleur" },
  { slug: "antibiotiques", fallbackName: "Antibio" },
  { slug: "respiratoire", fallbackName: "Toux" },
  { slug: "vitamines", fallbackName: "Vitamines" },
  { slug: "digestif", fallbackName: "Digestion" },
  { slug: "dermatologie", fallbackName: "Peau" },
  { slug: "mere-enfant", fallbackName: "Maman" },
];

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

  const homeCategories = useMemo(
    () =>
      HOME_CATEGORIES.map((hc) => {
        const found = categories.find((c) => c.slug === hc.slug);
        return found ? { ...found, name: hc.fallbackName } : null;
      }).filter(Boolean) as Category[],
    [categories]
  );

  const openDutyCount = onDuty.filter((p) => p.openNow || p.isOpen247).length;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-3 py-4 sm:px-5 lg:px-6 lg:py-6">
      <section className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <Card className="border-border/80 bg-card p-4 shadow-avance sm:p-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase text-brand">SABLIN PHARMA</p>
                <h1 className="mt-1 text-2xl font-extrabold text-foreground sm:text-3xl">
                  Trouvez vos médicaments plus rapidement en Côte d'Ivoire
                </h1>
              </div>
              <div className="grid grid-cols-3 overflow-hidden rounded-lg border border-border bg-muted/50 text-center">
                <Kpi value={`${popularMeds.length}+`} label="Médocs" />
                <Kpi value={`${onDuty.length}`} label="Garde" />
                <Kpi value="100 F" label="Crédit" />
              </div>
            </div>

            <SearchBar
              variant="hero"
              placeholder="Médicament, DCI, dosage..."
            />

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <QuickAction
                icon={Pill}
                label="Médicaments"
                onClick={() => navigate("medications")}
              />
              <QuickAction
                icon={Timer}
                label="De garde"
                onClick={() => navigate("pharmacies", { filter: "on-duty" })}
              />
              <QuickAction
                icon={ClipboardList}
                label="Ordonnance"
                onClick={() => navigate("prescription")}
              />
              <QuickAction
                icon={Wallet}
                label="Crédits"
                onClick={() => navigate("wallet")}
              />
            </div>
          </div>
        </Card>

        <Card className="border-brand/20 bg-brand p-3 text-white shadow-avance sm:p-5">
          <div className="flex h-full flex-col gap-3 sm:gap-4">
            <div className="flex items-start justify-between gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-white/15 sm:size-10">
                <Coins className="size-4 sm:size-5" />
              </span>
              <Badge className="border-0 bg-white text-brand-dark">Prépayé</Badge>
            </div>
            <div>
              <p className="text-sm font-semibold text-white/80">Portefeuille</p>
              <p className="mt-1 text-xl font-extrabold sm:text-2xl">1 crédit = 100 FCFA</p>
              <p className="mt-1 text-xs text-white/75">
                Les services avancés se valident action par action.
              </p>
            </div>
            <div className="mt-auto grid grid-cols-2 gap-2 lg:grid-cols-1">
              <Button
                size="sm"
                className="bg-white text-brand-dark hover:bg-white/90 sm:h-10"
                onClick={() => navigate("wallet")}
              >
                <Coins className="size-4" /> Recharger
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-white/35 bg-transparent text-white hover:bg-white/10 hover:text-white sm:h-10"
                onClick={() => navigate("payment", { passOrdonnance: true })}
              >
                <ClipboardList className="size-4" /> Pass
              </Button>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-border/80 p-4 shadow-card">
          <SectionHeader
            title="Catégories"
            icon={<Pill className="size-4" />}
            action={{ label: "Tout", onClick: () => navigate("medications") }}
          />
          <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-7 lg:grid-cols-4">
            {loading
              ? Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-lg" />
                ))
              : homeCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => navigate("medications", { category: cat.slug })}
                    className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-lg border border-border bg-background px-2 py-3 text-center transition-colors hover:border-brand/40 hover:bg-brand-light"
                  >
                    <span
                      className="flex size-9 items-center justify-center rounded-md"
                      style={{ backgroundColor: `${cat.color}16` }}
                    >
                      <CategoryIcon name={cat.iconName} size={20} color={cat.color} />
                    </span>
                    <span className="line-clamp-1 text-[11px] font-bold text-foreground">
                      {cat.name}
                    </span>
                  </button>
                ))}
          </div>
        </Card>

        <Card className="overflow-hidden border-border/80 p-0 shadow-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <SectionHeader
              title="Pharmacies de garde"
              icon={<Timer className="size-4" />}
              action={{
                label: "Carte",
                onClick: () => navigate("pharmacies", { filter: "on-duty" }),
              }}
            />
          </div>
          <div className="grid min-w-0 gap-3 p-3 sm:p-4 md:grid-cols-[minmax(0,1fr)_220px]">
            <div className="flex flex-col gap-2">
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 rounded-lg" />
                  ))
                : onDuty.slice(0, 3).map((p) => (
                    <DutyPharmacyRow key={p.id} pharma={p} />
                  ))}
              {!loading && onDuty.length === 0 && (
                <p className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                  Aucune pharmacie de garde disponible.
                </p>
              )}
            </div>
            <div className="hidden overflow-hidden rounded-lg border border-border md:block">
              <GoogleMap
                lat={onDuty[0]?.latitude ?? ABIDJAN_CENTER.lat}
                lng={onDuty[0]?.longitude ?? ABIDJAN_CENTER.lon}
                zoom={13}
                label="Pharmacies de garde Abidjan"
                title={`${openDutyCount} pharmacies ouvertes`}
                className="h-full min-h-60"
              />
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden border-border/80 p-0 shadow-card">
          <div className="border-b border-border px-4 py-3">
            <SectionHeader
              title="Médicaments suivis"
              icon={<Search className="size-4" />}
              action={{ label: "Voir", onClick: () => navigate("medications") }}
            />
          </div>
          <div className="divide-y divide-border">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-3">
                    <Skeleton className="h-12 rounded-lg" />
                  </div>
                ))
              : popularMeds.slice(0, 6).map((m) => (
                  <MedicationAppRow key={m.id} med={m} />
                ))}
          </div>
        </Card>

        <Card className="border-border/80 p-4 shadow-card">
          <SectionHeader
            title="Services"
            icon={<Plus className="size-4" />}
            action={{ label: "Wallet", onClick: () => navigate("wallet") }}
          />
          <div className="mt-4 grid gap-2">
            <ServiceLine label="Contact pharmacie" cost={1} />
            <ServiceLine label="Disponibilité médicament" cost={1} />
            <ServiceLine label="Comparer ordonnance" cost={2} />
            <ServiceLine label="Confirmation complète" cost={4} />
          </div>
          <div className="mt-4 rounded-lg border border-brand/20 bg-brand-light p-3">
            <p className="text-sm font-bold text-brand-dark">Ordonnance rapide</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Ajoutez les médicaments, comparez les prix, puis choisissez la pharmacie.
            </p>
            <Button
              className="mt-3 w-full bg-brand text-white hover:bg-brand-dark"
              onClick={() => navigate("prescription")}
            >
              Ouvrir <ChevronRight className="size-4" />
            </Button>
          </div>
        </Card>
      </section>
    </div>
  );
}

function Kpi({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-r border-border px-3 py-2 last:border-r-0">
      <p className="text-sm font-extrabold text-foreground">{value}</p>
      <p className="text-[10px] font-semibold uppercase text-muted-foreground">{label}</p>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Pill;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex h-20 flex-col items-center justify-center gap-2 rounded-lg border border-border bg-background text-sm font-bold text-foreground transition-colors hover:border-brand/40 hover:bg-brand-light hover:text-brand-dark"
    >
      <Icon className="size-5 text-brand" />
      {label}
    </button>
  );
}

function DutyPharmacyRow({ pharma }: { pharma: Pharmacy }) {
  const { navigate } = useNav();
  const dist = distanceKm(
    ABIDJAN_CENTER.lat,
    ABIDJAN_CENTER.lon,
    pharma.latitude,
    pharma.longitude
  );
  const quartier = pharma.address.split(",")[0]?.trim() ?? pharma.commune;

  return (
    <button
      onClick={() => navigate("pharmacy-detail", { slug: pharma.slug })}
      className="grid w-full min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-lg border border-border bg-background p-3 text-left transition-colors hover:border-brand/40 hover:bg-accent sm:flex sm:items-center"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-brand text-white">
        <Plus className="size-5" strokeWidth={3} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="min-w-0 break-words text-sm font-bold leading-snug text-foreground sm:truncate">
            {pharma.name}
          </span>
          {pharma.isOnDuty && (
            <Badge className="shrink-0 border-0 bg-warning text-[10px] text-warning-foreground">
              Garde
            </Badge>
          )}
        </span>
        <span className="mt-1 flex min-w-0 items-start gap-1 text-xs text-muted-foreground">
          <MapPin className="mt-0.5 size-3 shrink-0" />
          <span className="min-w-0 break-words leading-snug sm:truncate">
            {quartier}, {pharma.commune}
          </span>
        </span>
      </span>
      <span className="col-span-2 flex min-w-0 items-center justify-between gap-2 rounded-md bg-muted/30 px-2 py-1.5 text-left sm:ml-auto sm:block sm:bg-transparent sm:p-0 sm:text-right">
        <span className="block text-xs font-bold text-brand-dark">{dist} km</span>
        <span className="inline-flex shrink-0 items-center gap-1 text-[10px] text-muted-foreground">
          <Clock className="size-3" /> Ouvert
        </span>
      </span>
      <ChevronRight className="hidden size-4 shrink-0 text-muted-foreground sm:block" />
    </button>
  );
}

function MedicationAppRow({ med }: { med: Medication }) {
  const { navigate } = useNav();

  return (
    <button
      onClick={() => navigate("medication-detail", { slug: med.slug })}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent"
    >
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-md text-white"
        style={{ backgroundColor: med.category?.color ?? "var(--brand)" }}
      >
        {med.category ? (
          <CategoryIcon name={med.category.iconName} size={20} color="#fff" />
        ) : (
          <Pill className="size-5" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-bold text-foreground">{med.name}</span>
          {med.requiresRx && <ShieldAlert className="size-3.5 shrink-0 text-warning" />}
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {med.genericName} · {med.dosage}
        </span>
      </span>
      <span className="hidden shrink-0 sm:block">
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-foreground">
          <Lock className="size-3 text-brand" /> Verrouillé
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[10px] font-extrabold text-foreground">
          <Lock className="size-3 text-brand" />
          Prix verrouillé
        </span>
        <span className="mt-0.5 flex items-center justify-end gap-1 text-[10px] font-semibold text-muted-foreground">
          1 crédit
        </span>
      </span>
    </button>
  );
}

function ServiceLine({ label, cost }: { label: string; cost: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <CreditCost cost={cost} />
    </div>
  );
}
