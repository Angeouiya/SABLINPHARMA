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
  Star,
  Cross,
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
import { useAuth } from "@/store/auth";
import { distanceKm } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Pharmacy, MedicationStatus, User } from "@/lib/types";

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
  price: number | null;
  priceLocked?: boolean;
  inStock: boolean;
}

interface LockedAccess {
  locked: boolean;
  requiresAuth: boolean;
  requiresCredits: boolean;
  isUnlocked: boolean;
  featureKey: string;
  cost: number;
  currentBalance: number;
  missingCredits: number;
  title: string;
  message: string;
  actions: string[];
}

interface PharmacyDetail extends Pharmacy {
  inventoryAccess?: LockedAccess;
  pricesAccess?: LockedAccess;
  medications: PharmacyMedicationItem[];
}

interface PharmacyRatingSummary {
  rating: number;
  ratingCount: number;
  ratingLabel: string;
  currentUserRating: number | null;
  currentUserComment: string;
  canRate: boolean;
  recentRatings: {
    id: string;
    rating: number;
    comment: string | null;
    author: string;
    createdAt: string;
  }[];
}

function pharmacyPhotoUrl(pharmacy: Pharmacy) {
  return pharmacy.logoUrl ?? pharmacy.facadeUrl ?? pharmacy.imageUrl ?? pharmacy.coverImageUrl ?? null;
}

const ABIDJAN_CENTER = { lat: 5.34, lon: -4.008 };

// Services disponibles (réalistes pour une pharmacie ivoirienne)
const SERVICES = [
  { icon: Stethoscope, label: "Conseils pharmaceutiques", desc: "Accompagnement par un pharmacien diplômé" },
  { icon: Smartphone, label: "Paiement Mobile Money", desc: "Orange Money, MTN MoMo, Moov Money" },
  { icon: Timer, label: "Pharmacie de garde", desc: "Disponible en dehors des heures habituelles" },
  { icon: Baby, label: "Produits bébé", desc: "Lait infantile, couches, soins pédiatriques" },
  { icon: Package, label: "Parapharmacie", desc: "Cosmétiques, compléments, bien-être" },
  { icon: HeartPulse, label: "Suivi de la tension", desc: "Mesure incluse de la tension artérielle" },
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
  const [unlockedPhone, setUnlockedPhone] = useState("");
  const [showAvailabilityDialog, setShowAvailabilityDialog] = useState(false);
  const [showPricesDialog, setShowPricesDialog] = useState(false);
  const [showCompareDialog, setShowCompareDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showWhatsappDialog, setShowWhatsappDialog] = useState(false);
  const [showAdviceDialog, setShowAdviceDialog] = useState(false);
  const [showConfirmPriceDialog, setShowConfirmPriceDialog] = useState(false);
  const [showConfirmFullDialog, setShowConfirmFullDialog] = useState(false);
  const refreshCredits = useCredits((s) => s.fetch);
  const user = useAuth((s) => s.user);

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
    setUnlockedPhone("");
    (async () => {
      try {
        const r = await fetch(`/api/pharmacies/${params.slug}`);
        if (!r.ok) throw new Error("not found");
        const data = await r.json();
        if (active) {
          setPharmacy(data);
          setAvailabilityUnlocked(Boolean(data.inventoryAccess?.isUnlocked));
          setPricesUnlocked(Boolean(data.pricesAccess?.isUnlocked));
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

  useEffect(() => {
    void refreshCredits();
  }, [refreshCredits]);

  const refetchPharmacy = async () => {
    if (!pharmacy?.slug) return;
    const r = await fetch(`/api/pharmacies/${pharmacy.slug}`, { cache: "no-store" });
    if (!r.ok) throw new Error("Impossible de recharger la pharmacie.");
    const data = await r.json();
    setPharmacy(data);
    setAvailabilityUnlocked(Boolean(data.inventoryAccess?.isUnlocked));
    setPricesUnlocked(Boolean(data.pricesAccess?.isUnlocked));
  };

  const unlockPharmacyFeature = async (featureKey: "seePharmacyInventory" | "seeDetailedPrices") => {
    if (!pharmacy) return;
    if (!user) {
      navigate("auth", { authMode: "login" });
      throw new Error("Connectez-vous pour continuer.");
    }
    const res = await fetch("/api/credits/unlock", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": `${featureKey}:${pharmacy.id}:${Date.now()}`,
      },
      body: JSON.stringify({
        featureKey,
        entityType: "pharmacy",
        entityId: pharmacy.id,
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      if (res.status === 401) navigate("auth", { authMode: "login" });
      if (res.status === 402) navigate("wallet");
      throw new Error(data?.message ?? data?.error ?? "Déblocage impossible.");
    }
    await refreshCredits();
    await refetchPharmacy();
    toast.success(data?.message ?? "Service débloqué avec succès.");
  };

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
          className="mt-4 bg-brand text-white"
          onClick={() => navigate("pharmacies")}
        >
          <ChevronLeft className="size-4" /> Retour aux pharmacies
        </Button>
      </div>
    );
  }

  const mapsUrl = `https://www.google.com/maps?q=${pharmacy.latitude},${pharmacy.longitude}`;
  const phoneDisplay = unlockedPhone.replace("+225 ", "");
  const contactVisible = contactUnlocked && !!unlockedPhone;
  const whatsappVisible = whatsappUnlocked && !!unlockedPhone;
  const unlockContact = async (action: "phone" | "whatsapp") => {
    const res = await fetch(`/api/pharmacies/${pharmacy.slug}/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.error ?? "Contact impossible à débloquer");
    }
    setUnlockedPhone(data.phone);
    if (action === "phone") setContactUnlocked(true);
    if (action === "whatsapp") setWhatsappUnlocked(true);
    await refreshCredits();
    toast.success("Contact débloqué avec succès");
  };
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
      <Card className="overflow-hidden border-border/70 py-0 shadow-avance">
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
                <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/30 bg-white/15 text-white backdrop-blur-sm">
                  {pharmacyPhotoUrl(pharmacy) ? (
                    <img
                      src={pharmacyPhotoUrl(pharmacy) ?? ""}
                      alt={`Photo ${pharmacy.name}`}
                      className="size-full object-cover"
                    />
                  ) : (
                    <Cross className="size-9" strokeWidth={2.5} />
                  )}
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
                      <span className="text-white/75">· {pharmacy.ratingLabel ?? "Note initiale"}</span>
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
              <StatusChip icon={Lock} label="Liste des médicaments verrouillée" tone="neutral" />
              {dist <= 5 && (
                <StatusChip icon={Navigation} label="À proximité" tone="info" />
              )}
              <StatusChip icon={CheckCircle2} label="Information et orientation" tone="neutral" />
              <StatusChip icon={Smartphone} label="Paiement mobile" tone="neutral" />
            </div>
          </div>
        </div>
      </Card>

      {pharmacy.publicMedia && pharmacy.publicMedia.length > 0 ? (
        <Card className="mt-4 border-border/70 p-4 shadow-card">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Heading level="h2" className="text-lg">Photos publiques validées</Heading>
              <Muted>Logo, façade, extérieur et couverture visibles côté utilisateur après validation SABLIN.</Muted>
            </div>
            <Badge className="border-0 bg-success-light text-success">Images publiques</Badge>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {pharmacy.publicMedia.slice(0, 4).map((media) => (
              <div key={media.id} className="overflow-hidden rounded-xl border border-border bg-white">
                <div className="aspect-[4/3] bg-muted">
                  <img src={media.url} alt={media.title} className="size-full object-cover" />
                </div>
                <div className="p-3">
                  <p className="text-sm font-bold text-foreground">{media.title}</p>
                  <p className="mt-1 text-xs font-semibold text-muted-foreground">{media.usage ?? media.type}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card className="mt-4 border-border/70 p-4 shadow-card">
          <Heading level="h2" className="text-lg">Photo de la pharmacie non disponible</Heading>
          <Muted>Une photo publique validée par SABLIN PHARMA sera affichée dès qu’elle sera disponible.</Muted>
        </Card>
      )}

      <PharmacyRatingPanel
        pharmacy={pharmacy}
        user={user}
        onUpdated={(summary) => {
          setPharmacy((current) =>
            current
              ? {
                  ...current,
                  rating: summary.rating,
                  ratingCount: summary.ratingCount,
                  ratingLabel: summary.ratingLabel,
                }
              : current
          );
        }}
      />

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
              <Card className="border-border/70 p-4 transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-avance">
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
                          <a href={`tel:${unlockedPhone.replace(/\s/g, "")}`}>
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
                label="Liste des médicaments"
                value={availabilityUnlocked ? `${inStockCount} / ${pharmacy.medications.length}` : "Verrouillé"}
                sub={availabilityUnlocked ? "Débloqué avec crédits" : "Voir médicaments disponibles — 1 crédit"}
              />
            </div>
          </section>
        </div>

        {/* RIGHT: Actions + Map */}
        <div className="space-y-4">
          {/* Contact actions */}
          <Card className="border-border/70 p-4 shadow-avance">
            <h3 className="mb-3 text-sm font-bold text-foreground">Actions rapides</h3>
            <div className="grid grid-cols-2 gap-2">
              {/* Appeler — verrouillé tant que contact non débloqué */}
              {contactVisible ? (
                <Button size="sm" className="bg-brand text-white hover:bg-brand-dark" asChild>
                  <a href={`tel:${unlockedPhone.replace(/\s/g, "")}`}>
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
                  <a href={`https://wa.me/${unlockedPhone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer">
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
                if (availabilityUnlocked) {
                  const el = document.getElementById("medicaments");
                  el?.scrollIntoView({ behavior: "smooth" });
                } else if (pharmacy.inventoryAccess?.requiresAuth) {
                  navigate("auth", { authMode: "login" });
                } else if ((pharmacy.inventoryAccess?.missingCredits ?? 0) > 0) {
                  navigate("wallet");
                } else {
                  setShowAvailabilityDialog(true);
                }
              }}
            >
              <Pill className="size-4" /> Voir médicaments disponibles
              <CreditCost cost={1} className="ml-1" />
            </Button>

            {/* Comparer avec d'autres pharmacies — 1 crédit */}
            <Button
              size="sm"
              variant="outline"
              className="mt-2 w-full border-brand/30 text-brand-dark hover:bg-brand-light"
              onClick={() => {
                setShowCompareDialog(true);
              }}
            >
              <MapPinned className="size-4" /> Comparer avec d'autres pharmacies
              <CreditCost cost={CREDIT_COSTS.comparePharmacies} className="ml-1" />
            </Button>

            {/* Demander conseil — 2 crédits */}
            <Button
              size="sm"
              variant="outline"
              className="mt-2 w-full border-brand/30 text-brand-dark hover:bg-brand-light"
              onClick={() => {
                setShowAdviceDialog(true);
              }}
            >
              <Lightbulb className="size-4" /> Demander conseil
              <CreditCost cost={CREDIT_COSTS.advicePharmacy} className="ml-1" />
            </Button>

            {/* Confirmer disponibilité — 3 crédits */}
            <Button
              size="sm"
              className="mt-2 w-full bg-brand text-white hover:bg-brand-dark"
              onClick={() => {
                setShowConfirmDialog(true);
              }}
            >
              <CheckCircle2 className="size-4" /> Confirmer disponibilité
              <CreditCost cost={CREDIT_COSTS.confirmAvailability} className="ml-1" />
            </Button>

            {/* Confirmer prix — 3 crédits */}
            <Button
              size="sm"
              variant="outline"
              className="mt-2 w-full border-brand/30 text-brand-dark hover:bg-brand-light"
              onClick={() => {
                setShowConfirmPriceDialog(true);
              }}
            >
              <Coins className="size-4" /> Confirmer prix
              <CreditCost cost={CREDIT_COSTS.confirmPrice} className="ml-1" />
            </Button>

            {/* Confirmation complète — 4 crédits */}
            <Button
              size="sm"
              variant="outline"
              className="mt-2 w-full border-brand/30 text-brand-dark hover:bg-brand-light"
              onClick={() => {
                setShowConfirmFullDialog(true);
              }}
            >
              <CheckCircle2 className="size-4" /> Confirmation complète
              <CreditCost cost={CREDIT_COSTS.confirmFull} className="ml-1" />
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
            <Eyebrow>Liste des médicaments</Eyebrow>
            <Heading level="h2">
              {availabilityUnlocked ? "Médicaments disponibles" : "Liste des médicaments de cette pharmacie verrouillée"}
            </Heading>
            <Muted className="mt-0.5">
              {availabilityUnlocked
                ? `${inStockCount} médicament${inStockCount > 1 ? "s" : ""} consultable${inStockCount > 1 ? "s" : ""} après déblocage.`
                : "Utilisez vos crédits pour voir les médicaments disponibles dans cette pharmacie."}
            </Muted>
          </div>
        </div>

        {!availabilityUnlocked ? (
          <Card className="mt-4 border-brand/20 p-6 text-center shadow-card sm:p-8">
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-light text-brand">
              <Lock className="size-7" />
            </span>
            <h3 className="mt-4 text-lg font-extrabold text-foreground">
              Liste des médicaments de cette pharmacie verrouillée
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              Utilisez 1 crédit SABLIN pour voir les médicaments disponibles dans cette pharmacie.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Coût : <span className="font-bold text-foreground">1 crédit</span>
              {" "}· Solde :{" "}
              <span className="font-bold text-foreground">
                {pharmacy.inventoryAccess?.currentBalance ?? 0} crédit
                {(pharmacy.inventoryAccess?.currentBalance ?? 0) > 1 ? "s" : ""}
              </span>
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              {pharmacy.inventoryAccess?.requiresAuth ? (
                <Button
                  className="bg-brand text-white hover:bg-brand-dark"
                  onClick={() => navigate("auth", { authMode: "login" })}
                >
                  Se connecter
                </Button>
              ) : (pharmacy.inventoryAccess?.missingCredits ?? 0) > 0 ? (
                <Button
                  className="bg-brand text-white hover:bg-brand-dark"
                  onClick={() => navigate("wallet")}
                >
                  Recharger maintenant
                </Button>
              ) : (
                <Button
                  className="bg-brand text-white hover:bg-brand-dark"
                  onClick={() => setShowAvailabilityDialog(true)}
                >
                  <Coins className="size-4" /> Voir médicaments disponibles — 1 crédit
                </Button>
              )}
              <Button variant="outline" onClick={() => navigate("pharmacies")}>
                Retour
              </Button>
            </div>
          </Card>
        ) : (
          <>
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

            {!pricesUnlocked && (
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
                    onClick={() => {
                      if (!user) navigate("auth", { authMode: "login" });
                      else if ((pharmacy.pricesAccess?.missingCredits ?? 0) > 0) navigate("wallet");
                      else setShowPricesDialog(true);
                    }}
                  >
                    <Coins className="size-4" /> Voir les prix
                    <CreditCost cost={CREDIT_COSTS.seePrices} className="ml-1" />
                  </Button>
                </div>
              </Card>
            )}

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
                        "border-border/60 py-0 transition-all hover:border-brand/30 hover:shadow-avance",
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
                      {pricesUnlocked && m.price !== null ? (
                        <Price amount={m.price} size="sm" variant="brand" />
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                          <Lock className="size-2.5" /> Prix masqué
                        </span>
                      )}
                      {availabilityUnlocked ? (
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
                          description: "Retrouvez-le dans la page Comparer les prix des pharmacies.",
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
          </>
        )}
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
              className="gap-0 border-border/60 p-4 transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-avance"
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
        title="Voir médicaments disponibles"
        cost={CREDIT_COSTS.alertAvailability}
        description="Débloquez l’inventaire public contrôlé de cette pharmacie."
        benefits={[
          "Médicaments disponibles dans cette pharmacie",
          "Statuts publics contrôlés",
        ]}
        debitOnConfirm={false}
        onConfirm={() => unlockPharmacyFeature("seePharmacyInventory")}
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
        debitOnConfirm={false}
        onConfirm={() => unlockPharmacyFeature("seeDetailedPrices")}
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
          "Contact débloqué après validation",
        ]}
        debitOnConfirm={false}
        onConfirm={() => unlockContact("phone")}
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
        debitOnConfirm={false}
        onConfirm={() => unlockContact("whatsapp")}
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
   PharmacyRatingPanel — avis utilisateurs vérifiés
   ============================================================ */
function PharmacyRatingPanel({
  pharmacy,
  user,
  onUpdated,
}: {
  pharmacy: PharmacyDetail;
  user: User | null;
  onUpdated: (summary: Pick<PharmacyRatingSummary, "rating" | "ratingCount" | "ratingLabel">) => void;
}) {
  const { navigate } = useNav();
  const [summary, setSummary] = useState<PharmacyRatingSummary>({
    rating: pharmacy.rating,
    ratingCount: pharmacy.ratingCount ?? 0,
    ratingLabel: pharmacy.ratingLabel ?? "Note initiale",
    currentUserRating: null,
    currentUserComment: "",
    canRate: Boolean(user),
    recentRatings: [],
  });
  const [selectedRating, setSelectedRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      try {
        const response = await fetch(`/api/pharmacies/${pharmacy.slug}/ratings`, {
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Impossible de charger les avis.");
        const data = (await response.json()) as PharmacyRatingSummary;
        if (!active) return;
        setSummary(data);
        setSelectedRating(data.currentUserRating ?? 0);
        setComment(data.currentUserComment ?? "");
      } catch {
        if (!active) return;
        setSummary((current) => ({
          ...current,
          canRate: Boolean(user),
        }));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [pharmacy.slug, user]);

  const submitRating = async () => {
    if (!user) {
      navigate("auth", { authMode: "login" });
      return;
    }
    if (selectedRating < 1) {
      toast.error("Choisissez une note entre 1 et 5.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(`/api/pharmacies/${pharmacy.slug}/ratings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: selectedRating, comment }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error ?? "Impossible d'enregistrer la note.");
      }

      const nextSummary: PharmacyRatingSummary = {
        ...summary,
        rating: data.rating,
        ratingCount: data.ratingCount,
        ratingLabel: data.ratingLabel,
        currentUserRating: data.currentUserRating,
        currentUserComment: data.currentUserComment ?? "",
        canRate: true,
      };
      setSummary(nextSummary);
      onUpdated(nextSummary);
      toast.success(data.message ?? "Votre note a été enregistrée.");

      const refreshed = await fetch(`/api/pharmacies/${pharmacy.slug}/ratings`, {
        cache: "no-store",
      });
      if (refreshed.ok) {
        const refreshedData = (await refreshed.json()) as PharmacyRatingSummary;
        setSummary(refreshedData);
        setSelectedRating(refreshedData.currentUserRating ?? selectedRating);
        setComment(refreshedData.currentUserComment ?? "");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Notation impossible.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="mt-4 border-border/70 p-4 shadow-card">
      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Avis utilisateurs
          </p>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-4xl font-extrabold leading-none text-foreground">
              {summary.rating.toFixed(1)}
            </span>
            <span className="pb-1 text-sm font-bold text-muted-foreground">/ 5</span>
          </div>
          <div className="mt-2 flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star
                key={index}
                className={cn(
                  "size-4",
                  index < Math.round(summary.rating)
                    ? "fill-amber-400 text-amber-400"
                    : "text-border"
                )}
              />
            ))}
          </div>
          <p className="mt-2 text-xs font-semibold text-muted-foreground">
            {loading ? "Chargement des avis..." : summary.ratingLabel}
          </p>
        </div>

        <div className="min-w-0 space-y-4">
          <div>
            <Heading level="h2" className="text-lg">Noter cette pharmacie</Heading>
            <Muted>
              Votre avis aide les utilisateurs à choisir une pharmacie fiable. Une seule note est
              conservée par compte et peut être mise à jour.
            </Muted>
          </div>

          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, index) => {
              const value = index + 1;
              const active = selectedRating >= value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelectedRating(value)}
                  className={cn(
                    "flex size-10 items-center justify-center rounded-lg border text-sm font-bold transition-colors",
                    active
                      ? "border-amber-400 bg-amber-400 text-amber-950"
                      : "border-border bg-white text-muted-foreground hover:border-brand/40"
                  )}
                  aria-label={`Noter ${value} sur 5`}
                >
                  <Star className={cn("size-5", active && "fill-amber-950")} />
                </button>
              );
            })}
          </div>

          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Commentaire optionnel : accueil, clarté, rapidité, expérience générale..."
            className="min-h-24 w-full resize-none rounded-xl border border-border bg-white px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-brand focus:ring-2 focus:ring-brand/15"
          />

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              className="bg-brand text-white hover:bg-brand-dark"
              onClick={submitRating}
              disabled={submitting}
            >
              <Star className="size-4" />
              {user ? "Enregistrer mon avis" : "Se connecter pour noter"}
            </Button>
            <span className="text-xs text-muted-foreground">
              Les avis abusifs peuvent être masqués par l'équipe SABLIN PHARMA.
            </span>
          </div>

          {summary.recentRatings.length > 0 && (
            <div className="space-y-2 border-t border-border pt-3">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Derniers avis
              </p>
              {summary.recentRatings.map((rating) => (
                <div key={rating.id} className="rounded-lg border border-border bg-white p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{rating.author}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                      <Star className="size-3 fill-amber-400 text-amber-400" />
                      {rating.rating}/5
                    </span>
                    <span className="text-[10px] font-semibold text-muted-foreground">
                      {new Date(rating.createdAt).toLocaleDateString("fr-CI")}
                    </span>
                  </div>
                  {rating.comment && (
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {rating.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
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
      <Card className="border-border/70 py-0 transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-avance">
        <a href={href} className="block">
          {content}
        </a>
      </Card>
    );
  }
  return (
    <Card className="border-border/70 py-0 transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-avance">
      {content}
    </Card>
  );
}
