"use client";

import { useEffect, useState } from "react";
import {
  CircleUser,
  Crown,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Settings,
  Pill,
  ClipboardList,
  CheckCircle2,
  Bell,
  Heart,
  Clock,
  Loader2,
  Lock,
  HelpCircle,
  FileText,
  CreditCard,
  Timer,
  Search,
  Navigation,
  AlertCircle,
  Info,
  RotateCcw,
  Eye,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Heading, Eyebrow, Muted, Price } from "@/components/ui/typography";
import { useNav } from "@/store/nav";
import { useAuth } from "@/store/auth";
import { useNotifications } from "@/store/notifications";
import { useFavorites } from "@/store/favorites";
import { useHistory } from "@/store/history";
import { formatDate, distanceKm } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Subscription, FavoriteItem, HistoryItem, AppNotification } from "@/lib/types";

const ABIDJAN_CENTER = { lat: 5.34, lon: -4.008 };

// Fictive saved prescriptions (localStorage)
interface SavedPrescription {
  id: string;
  name: string;
  medCount: number;
  totalCost: number;
  date: string;
}

const SETTINGS_MENU = [
  { icon: CircleUser, label: "Modifier mes informations", view: "settings" as const },
  { icon: KeyRound, label: "Changer le mot de passe", view: "settings" as const },
  { icon: Bell, label: "Gérer les notifications", view: "settings" as const },
  { icon: CreditCard, label: "Gérer mon abonnement", view: "subscription" as const },
  { icon: ShieldCheck, label: "Confidentialité", view: "settings" as const },
  { icon: HelpCircle, label: "Aide et support", view: "settings" as const },
  { icon: FileText, label: "Conditions d'utilisation", view: "settings" as const },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ProfileView() {
  const { navigate } = useNav();
  const { user, premium, logout } = useAuth();
  const unreadCount = useNotifications((s) => s.unread);
  const notifications = useNotifications((s) => s.notifications);
  const favCount = useFavorites((s) => s.favorites.length);
  const favorites = useFavorites((s) => s.favorites);
  const history = useHistory((s) => s.history);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [savedPrescriptions, setSavedPrescriptions] = useState<SavedPrescription[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/me");
        if (res.ok) {
          const data = await res.json();
          if (active) setSubscription(data.subscription ?? null);
        }
      } catch {
        /* noop */
      } finally {
        if (active) setLoading(false);
      }
    })();
    // Load saved prescriptions from localStorage
    try {
      const saved = JSON.parse(localStorage.getItem("sablin-prescriptions") || "[]");
      setSavedPrescriptions(saved);
    } catch {
      /* noop */
    }
    return () => {
      active = false;
    };
  }, []);

  // ---------- Not logged in ----------
  if (!user) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col items-center justify-center px-4 py-12">
        <Card className="w-full border-border/70 p-8 text-center shadow-premium">
          <div className="mx-auto mb-5 flex size-20 items-center justify-center rounded-full bg-brand-light">
            <CircleUser className="size-10 text-brand" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-brand-dark">
            Connectez-vous pour accéder à votre profil
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Connectez-vous ou créez un compte gratuit pour suivre vos médicaments
            consultés, vos ordonnances estimées et vos pharmacies favorites à Abidjan.
          </p>
          <div className="mt-6 flex flex-col gap-2.5">
            <Button
              onClick={() => navigate("auth", { authMode: "login" })}
              className="h-11 w-full bg-brand-gradient text-base font-semibold text-white shadow-premium transition-all hover:opacity-95 hover:shadow-premium-lg"
            >
              Se connecter
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("auth", { authMode: "register" })}
              className="h-11 w-full border-brand/30 text-base font-semibold text-brand transition-colors hover:bg-brand-light"
            >
              Créer un compte
            </Button>
          </div>
          <button
            type="button"
            onClick={() => navigate("home")}
            className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-brand"
          >
            <ChevronLeft className="size-4" />
            Retour à l&apos;accueil
          </button>
        </Card>
      </div>
    );
  }

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    toast.success("Vous êtes déconnecté. À bientôt !");
    setLoggingOut(false);
    navigate("home");
  };

  // Account status badge
  const accountStatus = premium
    ? { label: "Premium actif", className: "bg-gradient-to-br from-amber-400 to-amber-600 text-white", icon: Crown }
    : { label: "Compte gratuit", className: "bg-brand-light text-brand-dark", icon: CircleUser };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back link */}
      <button
        onClick={() => navigate("home")}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-brand"
      >
        <ChevronLeft className="size-4" /> Accueil
      </button>

      {/* ============ PROFILE CARD ============ */}
      <Card className="overflow-hidden border-border/70 py-0 shadow-premium">
        <div className="relative bg-brand-gradient">
          <div className="absolute inset-0 bg-dotted-white opacity-15" />
          <div className="absolute -right-12 -top-12 size-44 rounded-full bg-white/10 blur-3xl" />
          <div className="relative flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
            <div className="flex items-center gap-4">
              <span className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl font-extrabold text-white backdrop-blur-sm ring-4 ring-white/10">
                {getInitials(user.name)}
              </span>
              <div className="text-white">
                <h1 className="text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
                  {user.name}
                </h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/85">
                  {user.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="size-3.5" /> {user.phone}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Mail className="size-3.5" /> {user.email}
                  </span>
                  {user.commune && (
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3.5" /> {user.commune}
                    </span>
                  )}
                </div>
                <div className="mt-2.5">
                  <Badge className={cn("border-0 text-xs font-bold", accountStatus.className)}>
                    <accountStatus.icon className="size-3" /> {accountStatus.label}
                  </Badge>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              className="border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
              onClick={() => navigate("settings")}
            >
              <Settings className="size-4" /> Paramètres
            </Button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 divide-x divide-border/50">
          <ProfileStat icon={Pill} value={history.filter((h) => h.kind === "medication").length || 24} label="Médicaments consultés" />
          <ProfileStat icon={ClipboardList} value={savedPrescriptions.length || 7} label="Ordonnances estimées" />
          <ProfileStat icon={Heart} value={favCount || 3} label="Pharmacies favorites" />
        </div>
      </Card>

      {/* ============ MAIN LAYOUT ============ */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* LEFT: Settings menu */}
        <aside>
          <Card className="border-border/70 py-0">
            <div className="border-b border-border/50 bg-muted/30 px-4 py-3">
              <h3 className="text-sm font-bold text-foreground">Menu du profil</h3>
            </div>
            <div className="flex flex-col p-2">
              {SETTINGS_MENU.map((item, i) => (
                <button
                  key={i}
                  onClick={() => navigate(item.view)}
                  className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-brand"
                >
                  <item.icon className="size-4 shrink-0 text-muted-foreground group-hover:text-brand" />
                  <span className="flex-1">{item.label}</span>
                  <ChevronRight className="size-3.5 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
                </button>
              ))}
              <Separator className="my-2" />
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                {loggingOut ? (
                  <Loader2 className="size-4 shrink-0 animate-spin" />
                ) : (
                  <LogOut className="size-4 shrink-0" />
                )}
                <span className="flex-1">Se déconnecter</span>
              </button>
            </div>
          </Card>
        </aside>

        {/* RIGHT: content sections */}
        <div className="space-y-6">
          {/* ============ ABONNEMENT ============ */}
          <section>
            <SectionTitle icon={Crown} title="Abonnement" />
            {premium && subscription ? (
              <Card className="overflow-hidden border-amber-500/30 py-0 shadow-premium">
                <div className="flex items-center justify-between bg-gradient-to-r from-amber-50 to-background px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white">
                      <Crown className="size-5" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-foreground">Premium actif</p>
                      <p className="text-[11px] text-muted-foreground">Formule mensuelle</p>
                    </div>
                  </div>
                  <Badge className="border-0 bg-success text-white">
                    <CheckCircle2 className="size-3" /> Payé
                  </Badge>
                </div>
                <div className="grid grid-cols-2 divide-x divide-border/50 border-t border-border/50 sm:grid-cols-4">
                  <SubInfo label="Prix" value="500 FCFA/mois" />
                  <SubInfo label="Début" value={formatDate(subscription.startDate)} />
                  <SubInfo label="Expiration" value={subscription.endDate ? formatDate(subscription.endDate) : "—"} />
                  <SubInfo label="Statut" value="Actif" success />
                </div>
                <div className="flex flex-wrap gap-2 border-t border-border/50 p-4">
                  <Button
                    size="sm"
                    className="bg-gradient-to-br from-amber-400 to-amber-600 text-white hover:opacity-90"
                    onClick={() => navigate("subscription")}
                  >
                    <RotateCcw className="size-3.5" /> Renouveler mon abonnement
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => navigate("payment")}>
                    <CreditCard className="size-3.5" /> Historique paiements
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="overflow-hidden border-brand/20 py-0 shadow-premium">
                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-light text-brand">
                      <Crown className="size-6" />
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-foreground">
                        Compte gratuit
                      </h3>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        Passez à Premium pour débloquer les estimations illimitées,
                        les alertes de garde et l&apos;assistance prioritaire.
                      </p>
                      <p className="mt-1.5 text-lg font-extrabold text-brand-dark">
                        500 FCFA <span className="text-xs font-medium text-muted-foreground">/ mois</span>
                      </p>
                    </div>
                  </div>
                  <Button
                    className="shrink-0 bg-brand-gradient text-white hover:opacity-90"
                    onClick={() => navigate("subscription")}
                  >
                    <Crown className="size-4" /> Passer à Premium
                  </Button>
                </div>
              </Card>
            )}
          </section>

          {/* ============ NOTIFICATIONS PERSONNALISÉES ============ */}
          {notifications.length > 0 && (
            <section>
              <SectionTitle
                icon={Bell}
                title="Notifications personnalisées"
                action={{ label: "Tout voir", onClick: () => navigate("notifications") }}
              />
              <div className="space-y-2">
                {notifications.slice(0, 3).map((n) => (
                  <NotifRow key={n.id} notif={n} onClick={() => navigate("notifications")} />
                ))}
              </div>
            </section>
          )}

          {/* ============ HISTORIQUE DES RECHERCHES ============ */}
          <section>
            <SectionTitle
              icon={Search}
              title="Historique des recherches"
              action={{ label: "Tout voir", onClick: () => navigate("history") }}
            />
            {history.filter((h) => h.kind === "medication").length > 0 ? (
              <Card className="divide-y divide-border/50 border-border/70 py-0">
                {history
                  .filter((h) => h.kind === "medication")
                  .slice(0, 4)
                  .map((h) => (
                    <HistoryRow key={h.id} item={h} />
                  ))}
              </Card>
            ) : (
              <FictiveHistory />
            )}
          </section>

          {/* ============ ORDONNANCES ENREGISTRÉES ============ */}
          <section>
            <SectionTitle icon={ClipboardList} title="Ordonnances enregistrées" />
            {savedPrescriptions.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {savedPrescriptions.slice(0, 4).map((rx) => (
                  <Card key={rx.id} className="border-border/70 p-4 transition-all hover:border-brand/30 hover:shadow-premium">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand">
                          <ClipboardList className="size-5" />
                        </span>
                        <div>
                          <h3 className="text-sm font-bold text-foreground">{rx.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {rx.medCount} médicament{rx.medCount > 1 ? "s" : ""} · {formatDate(rx.date)}
                          </p>
                        </div>
                      </div>
                      <Price amount={rx.totalCost} size="sm" variant="brand" />
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 w-full border-brand/30 text-brand-dark hover:bg-brand-light"
                      onClick={() => navigate("prescription")}
                    >
                      <Eye className="size-3.5" /> Voir le détail
                    </Button>
                  </Card>
                ))}
              </div>
            ) : (
              <FictivePrescriptions />
            )}
          </section>

          {/* ============ PHARMACIES FAVORITES ============ */}
          <section>
            <SectionTitle
              icon={Heart}
              title="Pharmacies favorites"
              action={{ label: "Tout voir", onClick: () => navigate("favorites") }}
            />
            {favorites.filter((f) => f.kind === "pharmacy").length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {favorites
                  .filter((f) => f.kind === "pharmacy")
                  .slice(0, 4)
                  .map((f) => (
                    <FavPharmacyCard key={f.id} fav={f} />
                  ))}
              </div>
            ) : (
              <FictiveFavorites />
            )}
          </section>

          {/* Disclaimer */}
          <p className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
            <Info className="mr-1 inline size-3.5" />
            SABLIN PHARMA est une plateforme d&apos;information. Vos données sont
            confidentielles et sécurisées. Aucune vente en ligne.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   SectionTitle — en-tête de section avec icône + action
   ============================================================ */
function SectionTitle({
  icon: Icon,
  title,
  action,
}: {
  icon: typeof Crown;
  title: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-xl bg-brand-light text-brand">
          <Icon className="size-5" />
        </span>
        <h2 className="text-lg font-extrabold tracking-tight text-brand-dark">{title}</h2>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="group flex items-center gap-0.5 text-sm font-semibold text-brand hover:underline"
        >
          {action.label}
          <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      )}
    </div>
  );
}

/* ============================================================
   ProfileStat — statistique du profil
   ============================================================ */
function ProfileStat({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Pill;
  value: number;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-3 py-4 text-center">
      <span className="flex size-9 items-center justify-center rounded-lg bg-brand-light text-brand">
        <Icon className="size-4.5" />
      </span>
      <p className="mt-1.5 text-xl font-extrabold tabular-nums text-brand-dark">{value}</p>
      <p className="text-[10px] leading-tight text-muted-foreground">{label}</p>
    </div>
  );
}

/* ============================================================
   SubInfo — info d'abonnement
   ============================================================ */
function SubInfo({
  label,
  value,
  success = false,
}: {
  label: string;
  value: string;
  success?: boolean;
}) {
  return (
    <div className="px-4 py-3 text-center">
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={cn("mt-0.5 text-sm font-bold", success ? "text-success" : "text-foreground")}>
        {value}
      </p>
    </div>
  );
}

/* ============================================================
   NotifRow — ligne de notification
   ============================================================ */
function NotifRow({
  notif,
  onClick,
}: {
  notif: AppNotification;
  onClick: () => void;
}) {
  const toneMap = {
    info: "bg-info-light text-info",
    success: "bg-success-light text-success",
    warning: "bg-warning-light text-warning-foreground",
    alert: "bg-danger-light text-danger",
    promotion: "bg-amber-100 text-amber-700",
  } as const;
  const tone = toneMap[notif.type] || toneMap.info;
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border border-border/60 bg-background p-3 text-left transition-all hover:border-brand/30 hover:shadow-card"
    >
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", tone)}>
        <Bell className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{notif.title}</p>
        <p className="truncate text-xs text-muted-foreground">{notif.message}</p>
      </div>
      {!notif.read && <span className="size-2 shrink-0 rounded-full bg-brand" />}
    </button>
  );
}

/* ============================================================
   HistoryRow — ligne d'historique
   ============================================================ */
function HistoryRow({ item }: { item: HistoryItem }) {
  const { navigate } = useNav();
  return (
    <div className="flex items-center gap-3 p-3.5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand">
        <Pill className="size-4.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{item.label}</p>
        <p className="text-xs text-muted-foreground">
          {item.meta ? `${item.meta} · ` : ""}{formatDate(item.createdAt)}
        </p>
      </div>
      <Badge className="border-0 bg-success-light text-success">
        <CheckCircle2 className="size-2.5" /> Disponible
      </Badge>
      <Button
        size="sm"
        variant="ghost"
        className="text-brand hover:bg-brand-light"
        onClick={() =>
          item.slug
            ? navigate("medication-detail", { slug: item.slug })
            : navigate("medications", { query: item.query ?? undefined })
        }
      >
        <Search className="size-3.5" /> Rechercher
      </Button>
    </div>
  );
}

/* ============================================================
   FavPharmacyCard — carte pharmacie favorite
   ============================================================ */
function FavPharmacyCard({ fav }: { fav: FavoriteItem }) {
  const { navigate } = useNav();
  const meta = fav.meta ? JSON.parse(fav.meta) : null;
  return (
    <Card className="border-border/70 p-4 transition-all hover:border-brand/30 hover:shadow-premium">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-dark text-white">
          <MapPin className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold text-foreground">{fav.label}</h3>
          <p className="text-xs text-muted-foreground">{meta?.commune || fav.meta || "Abidjan"}</p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            <span className="inline-flex items-center gap-0.5 rounded-full bg-success-light px-1.5 py-0.5 text-[9px] font-bold text-success">
              <span className="size-1.5 rounded-full bg-success animate-pulse" /> Ouvert
            </span>
          </div>
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="mt-3 w-full border-brand/30 text-brand-dark hover:bg-brand-light"
        onClick={() => navigate("pharmacy-detail", { slug: fav.slug })}
      >
        Voir la pharmacie <ChevronRight className="size-3.5" />
      </Button>
    </Card>
  );
}

/* ============================================================
   Fictive data components (when user has no real data yet)
   ============================================================ */
function FictiveHistory() {
  const { navigate } = useNav();
  const items = [
    { name: "Paracétamol", dosage: "500 mg", date: "Aujourd'hui", available: true },
    { name: "Amoxicilline", dosage: "500 mg", date: "Hier", available: true },
    { name: "Vitamine C", dosage: "1000 mg", date: "12 juin 2026", available: true },
    { name: "Smecta", dosage: "3 g", date: "10 juin 2026", available: false },
  ];
  return (
    <Card className="divide-y divide-border/50 border-border/70 py-0">
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-3 p-3.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand">
            <Pill className="size-4.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {it.name} <span className="font-normal text-muted-foreground">· {it.dosage}</span>
            </p>
            <p className="text-xs text-muted-foreground">{it.date}</p>
          </div>
          <Badge className={cn("border-0", it.available ? "bg-success-light text-success" : "bg-danger-light text-danger")}>
            {it.available ? "Disponible" : "Rupture"}
          </Badge>
          <Button
            size="sm"
            variant="ghost"
            className="text-brand hover:bg-brand-light"
            onClick={() => navigate("medications", { query: it.name })}
          >
            <Search className="size-3.5" /> Rechercher
          </Button>
        </div>
      ))}
    </Card>
  );
}

function FictivePrescriptions() {
  const { navigate } = useNav();
  const items = [
    { id: "rx1", name: "Ordonnance rhume", medCount: 3, totalCost: 2150, date: "2026-06-14" },
    { id: "rx2", name: "Traitement paludisme", medCount: 2, totalCost: 4000, date: "2026-06-08" },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((rx) => (
        <Card key={rx.id} className="border-border/70 p-4 transition-all hover:border-brand/30 hover:shadow-premium">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand">
                <ClipboardList className="size-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-foreground">{rx.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {rx.medCount} médicaments · {formatDate(rx.date)}
                </p>
              </div>
            </div>
            <Price amount={rx.totalCost} size="sm" variant="brand" />
          </div>
          <Button
            size="sm"
            variant="outline"
            className="mt-3 w-full border-brand/30 text-brand-dark hover:bg-brand-light"
            onClick={() => navigate("prescription")}
          >
            <Eye className="size-3.5" /> Voir le détail
          </Button>
        </Card>
      ))}
    </div>
  );
}

function FictiveFavorites() {
  const { navigate } = useNav();
  const items = [
    { name: "Pharmacie de la Riviera", commune: "Cocody", quartier: "Riviera Palmeraie", dist: 2.8, open: true, duty: true },
    { name: "Pharmacie du Plateau", commune: "Plateau", quartier: "Avenue Chardy", dist: 2.6, open: false, duty: false },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((p, i) => (
        <Card key={i} className="border-border/70 p-4 transition-all hover:border-brand/30 hover:shadow-premium">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-dark text-white">
              <MapPin className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-bold text-foreground">{p.name}</h3>
              <p className="text-xs text-muted-foreground">
                {p.quartier}, {p.commune} · {p.dist} km
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                <span className={cn("inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold", p.open ? "bg-success-light text-success" : "bg-neutral-light text-neutral-foreground")}>
                  <span className={cn("size-1.5 rounded-full", p.open ? "bg-success animate-pulse" : "bg-muted-foreground/50")} />
                  {p.open ? "Ouvert" : "Fermé"}
                </span>
                {p.duty && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-warning-light px-1.5 py-0.5 text-[9px] font-bold text-warning-foreground">
                    <Timer className="size-2.5" /> De garde
                  </span>
                )}
              </div>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="mt-3 w-full border-brand/30 text-brand-dark hover:bg-brand-light"
            onClick={() => navigate("pharmacies")}
          >
            Voir la pharmacie <ChevronRight className="size-3.5" />
          </Button>
        </Card>
      ))}
    </div>
  );
}
