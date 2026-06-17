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
  Share2,
  ClipboardList,
  Truck,
  Smartphone,
  Pill,
  Baby,
  Stethoscope,
  HeartPulse,
  Package,
  Sparkles,
  Info,
  ChevronRight,
  MapPinned,
  Coins,
  Lock,
  MessageCircle,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { CategoryIcon } from "@/components/category-icons";
import { FavoriteButton } from "@/components/shared/favorite-button";
import { AlertMessage } from "@/components/shared/alert-message";
import { EmptyState } from "@/components/shared/empty-state";
import { GoogleMap } from "@/components/shared/google-map";
import { CreditConfirmDialog } from "@/components/shared/credit-confirm-dialog";
import { CreditCost } from "@/components/shared/credit-cost";
import { LockedContact } from "@/components/shared/locked-contact";
import { Heading, Eyebrow, Muted, Price } from "@/components/ui/typography";
import { useNav } from "@/store/nav";
import { useCredits, CREDIT_COSTS } from "@/store/credits";
import { distanceKm } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Pharmacy, MedicationStatus } from "@/lib/types";

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

const ABIDJAN_CENTER = { lat: 5.34, lon: -4.008 };

// Services disponibles (réalistes pour une pharmacie ivoirienne)
const SERVICES = [
  { icon: Stethoscope, label: "Conseils pharmaceutiques", desc: "Accompagnement par un pharmacien diplômé" },
  { icon: Smartphone, label: "Paiement Mobile Money", desc: "Orange Money, MTN MoMo, Moov Money" },
  { icon: Timer, label: "Pharmacie de garde", desc: "Disponible en dehors des heures habituelles" },
  { icon: Baby, label: "Produits bébé", desc: "Lait infantile, couches, soins pédiatriques" },
  { icon: Package, label: "Parapharmacie", desc: "Cosmétiques, compléments, bien-être" },
  { icon: HeartPulse, label: "Suivi de la tension", desc: "Mesure gratuite de la tension artérielle" },
  { icon: Plus, label: "Première urgence", desc: "Pansements, antiseptiques, sérum physiologique" },
];

const DAYS = [
  { key: "weekday", label: "Lundi — Vendredi" },
  { key: "saturday", label: "Samedi" },
  { key: "sunday", label: "Dimanche" },
];

function medStatus(inStock: boolean, slug: string): MedicationStatus {
  if (!inStock) return "out-of-stock";
  const hash = slug.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return hash % 5 === 0 ? "low-stock" : "available";
}

export function PharmacyDetailView() {
  const { params, navigate } = useNav();
  const [pharmacy, setPharmacy] = useState<PharmacyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [medQuery, setMedQuery] = useState("");
  const [availabilityUnlocked, setAvailabilityUnlocked] = useState(false);
  const [pricesUnlocked, setPricesUnlocked] = useState(false);
  const [contactUnlocked, setContactUnlocked] = useState(false);
  const [whatsappUnlocked, setWhatsappUnlocked] = useState(false);
  const [showAvailabilityDialog, setShowAvailabilityDialog] = useState(false);
  const [showPricesDialog, setShowPricesDialog] = useState(false);
  const [showCompareDialog, setShowCompareDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showWhatsappDialog, setShowWhatsappDialog] = useState(false);
  const [showAdviceDialog, setShowAdviceDialog] = useState(false);
  const [showConfirmPriceDialog, setShowConfirmPriceDialog] = useState(false);
  const [showConfirmFullDialog, setShowConfirmFullDialog] = useState(false);
  const { hasPass } = useCredits();

  useEffect(() => {
    if (!params.slug) {
      navigate("pharmacies");
      return;
    }
    let active = true;
    setLoading(true);
    setNotFound(false);
    setAvailabilityUnlocked(false);
    setPricesUnlocked(false);
    setContactUnlocked(false);
    setWhatsappUnlocked(false);
    (async () => {
      try {
        const r = await fetch(`/api/pharmacies/${params.slug}`);
        if (!r.ok) throw new Error("not found");
        const data = await r.json();
        if (active) setPharmacy(data);
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

  // Current day index (0 = Sunday)
  const todayIndex = new Date().getDay();
  const todayLabel =
    todayIndex === 0 ? "Dimanche" : todayIndex === 6 ? "Samedi" : "Lundi — Vendredi";

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
      </div>
    );
  }

  if (notFound || !pharmacy) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <span className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-brand-light text-brand">
          <Search className="size-8" />
        </span>
        <h1 className="text-2xl font-bold">Pharmacie introuvable</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Cette pharmacie n&apos;existe pas ou le lien est incorrect.
        </p>
        <Button
          className="mt-4 bg-brand-gradient text-white"
          onClick={() => navigate("pharmacies")}
        >
          <ChevronLeft className="size-4" /> Retour aux pharmacies
        </Button>
      </div>
    );
  }

  const mapsUrl = `https://www.google.com/maps?q=${pharmacy.latitude},${pharmacy.longitude}`;
  const phoneHref = `tel:${pharmacy.phone.replace(/\s/g, "")}`;
  const whatsappHref = `https://wa.me/${pharmacy.phone.replace(/[^0-9]/g, "")}`;
  const phoneDisplay = pharmacy.phone.replace("+225 ", "");
  const contactVisible = contactUnlocked || hasPass;
  const whatsappVisible = whatsappUnlocked || hasPass;
  const dist = distanceKm(
    ABIDJAN_CENTER.lat,
    ABIDJAN_CENTER.lon,
    pharmacy.latitude,
    pharmacy.longitude
  );
  const quartier = pharmacy.address.split(",")[0]?.trim() ?? pharmacy.commune;
  const hoursMap: Record<string, string> = {
    weekday: pharmacy.hoursWeekday,
    saturday: pharmacy.hoursSaturday,
    sunday: pharmacy.hoursSunday,
  };
  const inStockCount = pharmacy.medications.filter((m) => m.inStock).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back link */}
      <button
        onClick={() => navigate("pharmacies")}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-brand"
      >
        <ChevronLeft className="size-4" /> Retour aux pharmacies
      </button>

      {/* ============ FICHE PHARMACIE (header) ============ */}
      <Card className="overflow-hidden border-border/70 py-0 shadow-premium">
        <div className="relative bg-brand">
          {pharmacy.imageUrl && (
            <img
              src={pharmacy.imageUrl}
              alt={pharmacy.name}
              className="absolute inset-0 size-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                  <Plus className="size-9 text-white" strokeWidth={3} />
                </span>
                <div className="text-white">
                  <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl">
                    {pharmacy.name}
                  </h1>
                  <p className="mt-1.5 max-w-md text-sm leading-relaxed break-words text-white/85">
                    Pharmacie partenaire SABLIN PHARMA à {pharmacy.commune}. Vos médicaments
                    et produits de santé, avec un accompagnement professionnel.
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/85">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3.5" /> {quartier}, {pharmacy.commune}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Navigation className="size-3.5" /> {dist} km de vous
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 font-bold backdrop-blur-sm">
                      <span className="size-1.5 rounded-full bg-amber-300" />
                      {pharmacy.rating.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status badges column */}
              <div className="flex flex-wrap items-center gap-1.5 sm:flex-col sm:items-end">
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
                {pharmacy.isOnDuty && (
                  <Badge className="border-0 bg-amber-400 text-xs font-bold text-amber-950">
                    <Timer className="size-3.5" /> De garde
                  </Badge>
                )}
                {pharmacy.isOpen247 && (
                  <Badge className="border-0 bg-white/20 text-xs font-bold text-white backdrop-blur-sm">
                    <Clock className="size-3.5" /> 24/7
                  </Badge>
                )}
              </div>
            </div>

            {/* Badges row */}
            <div className="mt-4 flex flex-wrap gap-1.5">
              <StatusChip icon={CheckCircle2} label="Médicaments disponibles" tone="success" />
              {dist <= 5 && (
                <StatusChip icon={Navigation} label="À proximité" tone="info" />
              )}
              <StatusChip icon={Truck} label="Livraison disponible" tone="neutral" />
              <StatusChip icon={Smartphone} label="Paiement mobile" tone="neutral" />
            </div>
          </div>
        </div>
      </Card>

      {/* ============ LAYOUT: infos left + actions/map right ============ */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* LEFT: Hours + contact info */}
        <div className="space-y-6">
          {/* Horaires */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-brand-light text-brand">
                <Clock className="size-4" />
              </span>
              <Heading level="h3">Horaires d&apos;ouverture</Heading>
            </div>
            <Card className="border-border/70 py-0">
              <div className="divide-y divide-border/50">
                {DAYS.map((day) => {
                  const hours = hoursMap[day.key];
                  const isToday = day.label === todayLabel;
                  const closed = !hours || hours.toLowerCase().includes("ferm");
                  return (
                    <div
                      key={day.key}
                      className={cn(
                        "flex items-center justify-between px-4 py-3",
                        isToday && "bg-brand-light/40"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-sm font-semibold",
                            isToday ? "text-brand-dark" : "text-foreground"
                          )}
                        >
                          {day.label}
                        </span>
                        {isToday && (
                          <Badge className="border-0 bg-brand px-1.5 py-0 text-[9px] font-bold text-white">
                            Aujourd&apos;hui
                          </Badge>
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-sm font-medium",
                          closed ? "text-muted-foreground" : "text-foreground"
                        )}
                      >
                        {closed ? "Fermé" : hours}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Garde special block */}
            {pharmacy.isOnDuty && (
              <Card className="mt-3 overflow-hidden border-amber-500/30 py-0">
                <div className="flex items-center gap-3 bg-amber-50 p-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-amber-950">
                    <Timer className="size-5" />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground">
                      Pharmacie de garde
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Cette pharmacie assure la garde — ouverte en dehors des heures
                      habituelles pour vos urgences.
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </section>

          {/* Contact info grid */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-brand-light text-brand">
                <Info className="size-4" />
              </span>
              <Heading level="h3">Informations pratiques</Heading>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InfoCard icon={MapPin} label="Adresse" value={pharmacy.address} sub={`${pharmacy.commune}, Abidjan`} />
              {/* Téléphone verrouillé tant que non débloqué */}
              <Card className="border-border/70 p-4 transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-premium">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand">
                    <Phone className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                      Téléphone
                    </p>
                    {contactVisible ? (
                      <>
                        <p className="text-sm font-bold text-foreground">
                          {phoneDisplay}
                        </p>
                        <p className="text-xs text-muted-foreground">Appel direct</p>
                        <Button size="sm" asChild className="bg-brand text-white hover:bg-brand-dark">
                          <a href={phoneHref}>
                            <Phone className="size-3.5" /> Appeler
                          </a>
                        </Button>
                      </>
                    ) : (
                      <LockedContact
                        type="phone"
                        cost={CREDIT_COSTS.seeContact}
                        unlocked={false}
                        onUnlock={() => setShowContactDialog(true)}
                        className="flex-wrap"
                      />
                    )}
                  </div>
                </div>
              </Card>
              <InfoCard
                icon={Navigation}
                label="Distance estimée"
                value={`${dist} km`}
                sub="Depuis le centre d'Abidjan"
              />
              <InfoCard
                icon={Pill}
                label="Médicaments en stock"
                value={`${inStockCount} / ${pharmacy.medications.length}`}
                sub="Disponibles maintenant"
              />
            </div>
          </section>
        </div>

        {/* RIGHT: Actions + Map */}
        <div className="space-y-4">
          {/* Contact actions */}
          <Card className="border-border/70 p-4 shadow-premium">
            <h3 className="mb-3 text-sm font-bold text-foreground">Actions rapides</h3>
            <div className="grid grid-cols-2 gap-2">
              {/* Appeler — verrouillé tant que contact non débloqué */}
              {contactVisible ? (
                <Button size="sm" className="bg-brand text-white hover:bg-brand-dark" asChild>
                  <a href={phoneHref}>
                    <Phone className="size-4" /> Appeler
                  </a>
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="bg-brand text-white hover:bg-brand-dark"
                  onClick={() => setShowContactDialog(true)}
                >
                  <Phone className="size-4" /> Appeler
                  <CreditCost cost={CREDIT_COSTS.callPharmacy} className="ml-1" />
                </Button>
              )}
              {/* WhatsApp — verrouillé tant que non débloqué */}
              {whatsappVisible ? (
                <Button size="sm" variant="outline" asChild>
                  <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="size-4" /> WhatsApp
                  </a>
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-brand/30 text-brand-dark hover:bg-brand-light"
                  onClick={() => setShowWhatsappDialog(true)}
                >
                  <MessageCircle className="size-4" /> WhatsApp
                  <CreditCost cost={CREDIT_COSTS.whatsappPharmacy} className="ml-1" />
                </Button>
              )}
              <Button size="sm" variant="outline" asChild>
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                  <Navigation className="size-4" /> Itinéraire
                </a>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  navigator
                    .share?.({ title: pharmacy.name, text: pharmacy.address })
                    .catch(() => toast.info("Lien copié"))
                }
              >
                <Share2 className="size-4" /> Partager
              </Button>
              <FavoriteButton
                kind="pharmacy"
                slug={pharmacy.slug}
                label={pharmacy.name}
                meta={pharmacy.commune}
                variant="button"
                size="sm"
                className="col-span-2"
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              className="mt-2 w-full border-brand/30 text-brand-dark hover:bg-brand-light"
              onClick={() => {
                const el = document.getElementById("medicaments");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <Pill className="size-4" /> Voir médicaments disponibles
            </Button>

            {/* Comparer avec d'autres pharmacies — 1 crédit */}
            <Button
              size="sm"
              variant="outline"
              className="mt-2 w-full border-brand/30 text-brand-dark hover:bg-brand-light"
              onClick={() => {
                if (hasPass) {
                  toast.success("Comparaison lancée");
                  navigate("pharmacies");
                } else {
                  setShowCompareDialog(true);
                }
              }}
            >
              <MapPinned className="size-4" /> Comparer avec d'autres pharmacies
              <CreditCost cost={hasPass ? 0 : CREDIT_COSTS.comparePharmacies} className="ml-1" />
            </Button>

            {/* Demander conseil — 2 crédits */}
            <Button
              size="sm"
              variant="outline"
              className="mt-2 w-full border-brand/30 text-brand-dark hover:bg-brand-light"
              onClick={() => {
                if (hasPass) {
                  toast.success("Demande de conseil envoyée", {
                    description: "La pharmacie vous répondra par téléphone ou WhatsApp.",
                  });
                } else {
                  setShowAdviceDialog(true);
                }
              }}
            >
              <Lightbulb className="size-4" /> Demander conseil
              <CreditCost cost={hasPass ? 0 : CREDIT_COSTS.advicePharmacy} className="ml-1" />
            </Button>

            {/* Confirmer disponibilité — 3 crédits */}
            <Button
              size="sm"
              className="mt-2 w-full bg-brand text-white hover:bg-brand-dark"
              onClick={() => {
                if (hasPass) {
                  toast.success("Demande de confirmation envoyée", {
                    description: "La pharmacie vous rappellera pour confirmer le stock.",
                  });
                } else {
                  setShowConfirmDialog(true);
                }
              }}
            >
              <CheckCircle2 className="size-4" /> Confirmer disponibilité
              <CreditCost cost={hasPass ? 0 : CREDIT_COSTS.confirmAvailability} className="ml-1" />
            </Button>

            {/* Confirmer prix — 3 crédits */}
            <Button
              size="sm"
              variant="outline"
              className="mt-2 w-full border-brand/30 text-brand-dark hover:bg-brand-light"
              onClick={() => {
                if (hasPass) {
                  toast.success("Demande de confirmation de prix envoyée", {
                    description: "La pharmacie vous confirmera le prix avant votre déplacement.",
                  });
                } else {
                  setShowConfirmPriceDialog(true);
                }
              }}
            >
              <Coins className="size-4" /> Confirmer prix
              <CreditCost cost={hasPass ? 0 : CREDIT_COSTS.confirmPrice} className="ml-1" />
            </Button>

            {/* Confirmation complète — 4 crédits */}
            <Button
              size="sm"
              variant="outline"
              className="mt-2 w-full border-brand/30 text-brand-dark hover:bg-brand-light"
              onClick={() => {
                if (hasPass) {
                  toast.success("Demande de confirmation complète envoyée", {
                    description: "Vérification médicament + prix + disponibilité en cours.",
                  });
                } else {
                  setShowConfirmFullDialog(true);
                }
              }}
            >
              <CheckCircle2 className="size-4" /> Confirmation complète
              <CreditCost cost={hasPass ? 0 : CREDIT_COSTS.confirmFull} className="ml-1" />
            </Button>
          </Card>

          {/* Google Map */}
          <Card className="overflow-hidden border-brand/20 py-0">
            <GoogleMap
              lat={pharmacy.latitude}
              lng={pharmacy.longitude}
              zoom={16}
              label={pharmacy.name}
              title="Localisation de la pharmacie"
              className="h-56"
            />
          </Card>
        </div>
      </div>

      {/* ============ MÉDICAMENTS DISPONIBLES ============ */}
      <section id="medicaments" className="mt-10 scroll-mt-20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Eyebrow>Stock de la pharmacie</Eyebrow>
            <Heading level="h2">Médicaments disponibles</Heading>
            <Muted className="mt-0.5">
              {inStockCount} médicament{inStockCount > 1 ? "s" : ""} en stock sur{" "}
              {pharmacy.medications.length} référencés
            </Muted>
          </div>
        </div>

        {/* Local search */}
        <div className="mt-4 relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={medQuery}
            onChange={(e) => setMedQuery(e.target.value)}
            placeholder="Filtrer les médicaments (nom, principe actif, catégorie...)"
            className="h-11 rounded-xl border-border/70 bg-background pl-11 pr-10 text-sm"
          />
          {medQuery && (
            <button
              onClick={() => setMedQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Effacer le filtre"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Bannières de déverrouillage créditées : disponibilité + prix */}
        {(!hasPass || !availabilityUnlocked || !pricesUnlocked) && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {!hasPass && !availabilityUnlocked && (
              <Card className="border-brand/20 p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand">
                      <Package className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-extrabold text-foreground">
                        Voir la disponibilité
                      </h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Stock exact par médicament dans cette pharmacie.
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-brand text-white hover:bg-brand-dark"
                    onClick={() => setShowAvailabilityDialog(true)}
                  >
                    <Coins className="size-4" /> Voir la disponibilité
                    <CreditCost cost={CREDIT_COSTS.alertAvailability} className="ml-1" />
                  </Button>
                </div>
              </Card>
            )}
            {!hasPass && !pricesUnlocked && (
              <Card className="border-brand/20 p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand">
                      <Coins className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-extrabold text-foreground">
                        Voir les prix
                      </h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Prix indicatif précis pour chaque médicament.
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-brand text-white hover:bg-brand-dark"
                    onClick={() => setShowPricesDialog(true)}
                  >
                    <Coins className="size-4" /> Voir les prix
                    <CreditCost cost={CREDIT_COSTS.seePrices} className="ml-1" />
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Medication list */}
        <div className="mt-4 space-y-2.5">
          {filteredMeds.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Aucun médicament ne correspond"
              description="Essayez un autre terme de recherche."
            />
          ) : (
            filteredMeds.map((m) => {
              const status = medStatus(m.inStock, m.slug);
              return (
                <Card
                  key={m.id}
                  className={cn(
                    "border-border/60 py-0 transition-all hover:border-brand/30 hover:shadow-premium",
                    !m.inStock && "opacity-70"
                  )}
                >
                  <div className="flex items-center gap-3 p-3.5">
                    <button
                      onClick={() => navigate("medication-detail", { slug: m.slug })}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
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
                          <Pill className="size-5 text-brand" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-bold text-foreground">
                          {m.name}
                        </h3>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {m.genericName} · {m.form} {m.dosage}
                        </p>
                      </div>
                    </button>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {(hasPass || pricesUnlocked) ? (
                        <Price amount={m.price} size="sm" variant="brand" />
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                          <Lock className="size-2.5" /> Prix masqué
                        </span>
                      )}
                      {(hasPass || availabilityUnlocked) ? (
                        <MedStatusBadge status={status} />
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                          <Lock className="size-2.5" /> Masqué
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 border-brand/30 text-brand-dark hover:bg-brand-light"
                      onClick={() => {
                        toast.success(`${m.name} ajouté à votre ordonnance`, {
                          description: "Retrouvez-le dans la page Estimer mon ordonnance.",
                        });
                      }}
                    >
                      <ClipboardList className="size-3.5" />
                      <span className="hidden sm:inline">Ordonnance</span>
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </section>

      {/* ============ SERVICES DISPONIBLES ============ */}
      <section className="mt-10">
        <div className="mb-4">
          <Eyebrow>Accompagnement</Eyebrow>
          <Heading level="h2">Services disponibles</Heading>
          <Muted className="mt-0.5">
            Les services proposés par cette pharmacie à {pharmacy.commune}
          </Muted>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <Card
              key={s.label}
              className="gap-0 border-border/60 p-4 transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-premium"
            >
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand">
                  <s.icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-foreground">{s.label}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ============ INFORMATION RASSURANTE ============ */}
      <section className="mt-8">
        <AlertMessage variant="info" icon={Info}>
          Les disponibilités et prix affichés sont indicatifs. Veuillez confirmer auprès de
          la pharmacie avant tout déplacement. SABLIN PHARMA est une plateforme
          d&apos;information — aucune vente en ligne.
        </AlertMessage>
      </section>

      {/* ============ DIALOGUES CRÉDITS ============ */}
      <CreditConfirmDialog
        open={showAvailabilityDialog}
        onOpenChange={setShowAvailabilityDialog}
        title="Disponibilité des médicaments"
        cost={CREDIT_COSTS.alertAvailability}
        description="Voir quels médicaments sont en stock dans cette pharmacie."
        benefits={[
          "Stock exact par médicament",
          "Disponibilité en temps réel",
        ]}
        onConfirm={() => setAvailabilityUnlocked(true)}
      />
      <CreditConfirmDialog
        open={showPricesDialog}
        onOpenChange={setShowPricesDialog}
        title="Prix détaillés des médicaments"
        cost={CREDIT_COSTS.seePrices}
        description="Voir le prix indicatif de chaque médicament dans cette pharmacie."
        benefits={[
          "Prix exact par médicament",
          "Comparaison rapide",
          "Budget maîtrisé",
        ]}
        onConfirm={() => setPricesUnlocked(true)}
      />
      <CreditConfirmDialog
        open={showCompareDialog}
        onOpenChange={setShowCompareDialog}
        title="Comparer avec d'autres pharmacies"
        cost={CREDIT_COSTS.comparePharmacies}
        description="Comparez cette pharmacie avec d'autres pharmacies à Abidjan."
        benefits={[
          "Tableau comparatif détaillé",
          "Meilleur rapport prix/distance",
          "Choix éclairé",
        ]}
        onConfirm={() => {
          toast.success("Comparaison débloquée");
          navigate("pharmacies");
        }}
      />
      <CreditConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title="Confirmer la disponibilité"
        cost={CREDIT_COSTS.confirmAvailability}
        description="Cette confirmation coûte 3 crédits. Elle permet de demander à la pharmacie de confirmer le stock avant votre déplacement."
        benefits={[
          "Éviter un déplacement inutile",
          "Confirmation par téléphone",
          "Gain de temps garanti",
        ]}
        onConfirm={() => {
          toast.success("Demande de confirmation envoyée", {
            description: "La pharmacie vous rappellera pour confirmer le stock.",
          });
        }}
      />
      <CreditConfirmDialog
        open={showContactDialog}
        onOpenChange={setShowContactDialog}
        title="Débloquer le contact pharmacie"
        cost={CREDIT_COSTS.seeContact}
        description="Cette action coûte 1 crédit. Elle vous permet de voir le contact complet de cette pharmacie."
        benefits={[
          "Voir le numéro de téléphone",
          "Bouton Appeler débloqué",
          "Contact accessible pendant 24h",
        ]}
        onConfirm={() => setContactUnlocked(true)}
      />
      <CreditConfirmDialog
        open={showWhatsappDialog}
        onOpenChange={setShowWhatsappDialog}
        title="Débloquer WhatsApp"
        cost={CREDIT_COSTS.whatsappPharmacy}
        description="Cette action coûte 1 crédit. Elle débloque le contact WhatsApp direct de cette pharmacie."
        benefits={[
          "Lien WhatsApp direct",
          "Conversation écrite",
          "Partage de documents possibles",
        ]}
        onConfirm={() => setWhatsappUnlocked(true)}
      />
      <CreditConfirmDialog
        open={showAdviceDialog}
        onOpenChange={setShowAdviceDialog}
        title="Demander conseil à cette pharmacie"
        cost={CREDIT_COSTS.advicePharmacy}
        description="Cette action coûte 2 crédits. Elle permet d'envoyer une demande ou d'ouvrir un canal de contact avec la pharmacie. SABLIN PHARMA ne remplace pas un professionnel de santé."
        benefits={[
          "Demande envoyée à la pharmacie",
          "Réponse par téléphone ou WhatsApp",
          "Conseil personnalisé",
        ]}
        onConfirm={() => {
          toast.success("Demande de conseil envoyée", {
            description: "La pharmacie vous répondra par téléphone ou WhatsApp.",
          });
        }}
      />
      <CreditConfirmDialog
        open={showConfirmPriceDialog}
        onOpenChange={setShowConfirmPriceDialog}
        title="Confirmer le prix"
        cost={CREDIT_COSTS.confirmPrice}
        description="Cette confirmation coûte 3 crédits. Elle permet de demander à la pharmacie de confirmer le prix avant votre déplacement."
        benefits={[
          "Prix exact confirmé",
          "Aucune surprise à la caisse",
          "Budget maîtrisé",
        ]}
        onConfirm={() => {
          toast.success("Demande de confirmation de prix envoyée", {
            description: "La pharmacie vous confirmera le prix avant votre déplacement.",
          });
        }}
      />
      <CreditConfirmDialog
        open={showConfirmFullDialog}
        onOpenChange={setShowConfirmFullDialog}
        title="Confirmation complète"
        cost={CREDIT_COSTS.confirmFull}
        description="Vérification complète : médicament + prix + disponibilité avant votre déplacement."
        benefits={[
          "Médicament confirmé en stock",
          "Prix exact garanti",
          "Aucun déplacement inutile",
        ]}
        onConfirm={() => {
          toast.success("Demande de confirmation complète envoyée", {
            description: "Vérification médicament + prix + disponibilité en cours.",
          });
        }}
      />
    </div>
  );
}

/* ============================================================
   StatusChip — badge de statut coloré (sur fond vert du header)
   ============================================================ */
function StatusChip({
  icon: Icon,
  label,
  tone,
}: {
  icon: typeof CheckCircle2;
  label: string;
  tone: "success" | "info" | "neutral";
}) {
  const tones = {
    success: "bg-white/20 text-white backdrop-blur-sm",
    info: "bg-white/20 text-white backdrop-blur-sm",
    neutral: "bg-white/15 text-white/90 backdrop-blur-sm",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold",
        tones[tone]
      )}
    >
      <Icon className="size-3" /> {label}
    </span>
  );
}

/* ============================================================
   MedStatusBadge — badge de statut médicament (compact)
   ============================================================ */
function MedStatusBadge({ status }: { status: MedicationStatus }) {
  const config = {
    available: { label: "Disponible", icon: CheckCircle2, className: "bg-success-light text-success" },
    "low-stock": { label: "Stock faible", icon: Info, className: "bg-warning-light text-warning-foreground" },
    "out-of-stock": { label: "Rupture", icon: XCircle, className: "bg-danger-light text-danger" },
    "to-confirm": { label: "À confirmer", icon: Info, className: "bg-neutral-light text-neutral-foreground" },
  }[status];
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold",
        config.className
      )}
    >
      <Icon className="size-2.5" /> {config.label}
    </span>
  );
}

/* ============================================================
   InfoCard — carte d'information pratique
   ============================================================ */
function InfoCard({
  icon: Icon,
  label,
  value,
  sub,
  href,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
  sub: string;
  href?: string;
}) {
  const content = (
    <div className="flex items-start gap-3 p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 truncate text-sm font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
    </div>
  );
  if (href) {
    return (
      <Card className="border-border/70 py-0 transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-premium">
        <a href={href} className="block">
          {content}
        </a>
      </Card>
    );
  }
  return (
    <Card className="border-border/70 py-0 transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-premium">
      {content}
    </Card>
  );
}
