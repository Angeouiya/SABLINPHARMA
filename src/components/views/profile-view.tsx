"use client";

import { useEffect, useState, type ReactNode } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useNav } from "@/store/nav";
import { useAuth } from "@/store/auth";
import { useNotifications } from "@/store/notifications";
import { useFavorites } from "@/store/favorites";
import { formatDate } from "@/lib/format";
import type { Subscription } from "@/lib/types";

const STATS = [
  {
    label: "Médicaments consultés",
    value: 24,
    icon: Pill,
  },
  {
    label: "Ordonnances estimées",
    value: 7,
    icon: ClipboardList,
  },
  {
    label: "Pharmacies favorites",
    value: 3,
    icon: MapPin,
  },
];

const FAVORITE_COMMUNES = ["Cocody", "Plateau", "Marcory"];

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
  const favCount = useFavorites((s) => s.favorites.length);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [dutyAlerts, setDutyAlerts] = useState(false);

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
            Connectez-vous ou créez un compte gratuit pour suivre vos
            médicaments consultés, vos ordonnances estimées et vos pharmacies
            favorites à Abidjan.
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

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
    setLoggingOut(false);
    toast.success("Vous êtes déconnecté. À bientôt !");
    navigate("home");
  }

  const endDate = subscription?.endDate ? formatDate(subscription.endDate) : null;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      {/* Back link */}
      <button
        type="button"
        onClick={() => navigate("home")}
        className="group mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-brand"
      >
        <ChevronLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
        Retour à l&apos;accueil
      </button>

      {/* ---------- Profile header ---------- */}
      <Card className="overflow-hidden border-border/70 shadow-premium">
        <div className="bg-brand-gradient px-6 py-6 sm:px-8 sm:py-7">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:text-left">
            <Avatar className="size-16 border-2 border-white/40 shadow-sm sm:size-20">
              <AvatarFallback className="bg-white/15 text-xl font-bold text-white sm:text-2xl">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                {user.name}
              </h1>
              <p className="mt-0.5 flex items-center justify-center text-sm text-white/85 sm:justify-start">
                <Mail className="mr-1.5 size-3.5" />
                {user.email}
              </p>
              <div className="mt-2.5 flex justify-center sm:justify-start">
                {premium ? (
                  <Badge className="border-0 bg-amber-400/95 px-2.5 py-1 text-xs font-bold text-amber-950 shadow-sm">
                    <Crown className="mr-1 size-3.5" />
                    Premium
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-white/40 bg-white/10 px-2.5 py-1 text-xs font-semibold text-white"
                  >
                    Compte gratuit
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ---------- Stats ---------- */}
      <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-4">
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <Card
              key={s.label}
              className="border-border/70 p-3 shadow-premium sm:p-5"
            >
              <div className="flex size-9 items-center justify-center rounded-lg bg-brand-light sm:size-11">
                <Icon className="size-4 text-brand sm:size-5" />
              </div>
              <div className="mt-2.5 text-2xl font-extrabold tracking-tight text-brand-dark sm:mt-3 sm:text-3xl">
                {s.value}
              </div>
              <div className="mt-0.5 text-[11px] leading-tight text-muted-foreground sm:text-xs">
                {s.label}
              </div>
            </Card>
          );
        })}
      </div>

      {/* ---------- Personal info ---------- */}
      <Card className="mt-6 border-border/70 shadow-premium">
        <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-border/70 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-brand-light">
              <CircleUser className="size-4 text-brand" />
            </span>
            <div>
              <CardTitle className="text-base font-bold">
                Informations personnelles
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Vos coordonnées et votre commune de référence
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toast.info("L’édition du profil sera bientôt disponible.")
            }
            className="shrink-0"
          >
            <Settings className="size-3.5" />
            <span className="hidden sm:inline">Modifier</span>
          </Button>
        </CardHeader>
        <CardContent className="grid gap-4 pt-5 sm:grid-cols-2">
          <InfoRow
            icon={<CircleUser className="size-4 text-brand" />}
            label="Nom complet"
            value={user.name}
          />
          <InfoRow
            icon={<Mail className="size-4 text-brand" />}
            label="E-mail"
            value={user.email}
          />
          <InfoRow
            icon={<Phone className="size-4 text-brand" />}
            label="Téléphone"
            value={user.phone || "Non renseigné"}
          />
          <InfoRow
            icon={<MapPin className="size-4 text-brand" />}
            label="Commune"
            value={user.commune || "Non renseignée"}
          />
        </CardContent>
      </Card>

      {/* ---------- Subscription ---------- */}
      <Card className="mt-6 border-border/70 shadow-premium">
        <CardHeader className="flex flex-row items-center gap-3 border-b border-border/70 pb-4">
          <span className="flex size-9 items-center justify-center rounded-lg bg-brand-light">
            <ShieldCheck className="size-4 text-brand" />
          </span>
          <div>
            <CardTitle className="text-base font-bold">Abonnement</CardTitle>
            <p className="text-xs text-muted-foreground">
              Gérez votre offre SABLIN PHARMA
            </p>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
          ) : premium ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-9 items-center justify-center rounded-lg bg-amber-100">
                  <Crown className="size-5 text-amber-600" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-brand-dark">Premium actif</p>
                    <Badge className="border-0 bg-amber-400/95 px-2 py-0.5 text-[10px] font-bold text-amber-950">
                      PREMIUM
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {endDate
                      ? `Renouvellement / fin le ${endDate}`
                      : "Abonnement actif sans date d'expiration"}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate("subscription")}
                className="shrink-0"
              >
                Gérer
                <ChevronRight className="size-4" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                  <Crown className="size-5 text-amber-600" />
                </span>
                <div>
                  <p className="font-bold text-amber-950">
                    Passez Premium — 500 FCFA/mois
                  </p>
                  <p className="mt-0.5 text-sm text-amber-800/80">
                    Estimations illimitées, alertes de garde et pharmacies
                    favorites étendues.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => navigate("subscription")}
                className="shrink-0 bg-brand-gradient font-semibold text-white shadow-premium hover:opacity-95"
              >
                Découvrir
                <ChevronRight className="size-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---------- Quick access ---------- */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Notifications", icon: Bell, view: "notifications" as const, badge: unreadCount },
          { label: "Mes favoris", icon: Heart, view: "favorites" as const, badge: favCount },
          { label: "Historique", icon: Clock, view: "history" as const },
          { label: "Paramètres", icon: Settings, view: "settings" as const },
        ].map((item) => (
          <button
            key={item.view}
            onClick={() => navigate(item.view)}
            className="group flex flex-col items-start gap-3 rounded-2xl border border-border/70 bg-background p-4 text-left shadow-premium transition-all hover:-translate-y-0.5 hover:border-brand/30"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-brand-light text-brand transition-transform group-hover:scale-110">
              <item.icon className="size-5" />
            </span>
            <span className="flex items-center gap-2 text-sm font-bold text-foreground group-hover:text-brand">
              {item.label}
              {item.badge ? (
                <span className="rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                  {item.badge}
                </span>
              ) : null}
              <ChevronRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
            </span>
          </button>
        ))}
      </div>

      {/* ---------- Preferences ---------- */}
      <Card className="mt-6 border-border/70 shadow-premium">
        <CardHeader className="flex flex-row items-center gap-3 border-b border-border/70 pb-4">
          <span className="flex size-9 items-center justify-center rounded-lg bg-brand-light">
            <Settings className="size-4 text-brand" />
          </span>
          <div>
            <CardTitle className="text-base font-bold">Préférences</CardTitle>
            <p className="text-xs text-muted-foreground">
              Vos communes favorites et notifications
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">
              Communes favorites
            </p>
            <div className="flex flex-wrap gap-2">
              {FAVORITE_COMMUNES.map((c) => (
                <Badge
                  key={c}
                  variant="outline"
                  className="border-brand/30 bg-brand-light px-3 py-1 text-xs font-medium text-brand-dark"
                >
                  <MapPin className="mr-1 size-3" />
                  {c}
                </Badge>
              ))}
              <button
                type="button"
                onClick={() =>
                  toast.info("Ajout de communes favorites bientôt disponible.")
                }
                className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-brand hover:text-brand"
              >
                + Ajouter
              </button>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <PrefRow
              icon={<Bell className="size-4 text-brand" />}
              title="Notifications générales"
              desc="Recevoir les actualités et conseils santé"
              checked={notifEnabled}
              onCheckedChange={(v) => {
                setNotifEnabled(v);
                toast.success(
                  v
                    ? "Notifications activées."
                    : "Notifications désactivées."
                );
              }}
            />
            <PrefRow
              icon={<CheckCircle2 className="size-4 text-brand" />}
              title="Alertes pharmacies de garde"
              desc="Être informé des pharmacies de garde près de chez moi"
              checked={dutyAlerts}
              onCheckedChange={(v) => {
                setDutyAlerts(v);
                toast.success(
                  v ? "Alertes de garde activées." : "Alertes de garde désactivées."
                );
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* ---------- Logout ---------- */}
      <div className="mt-6 flex justify-center sm:justify-end">
        <Button
          variant="outline"
          onClick={handleLogout}
          disabled={loggingOut}
          className="h-11 border-destructive/30 text-destructive transition-colors hover:bg-destructive/5 hover:text-destructive"
        >
          {loggingOut ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <LogOut className="size-4" />
          )}
          Se déconnecter
        </Button>
      </div>

      <div className="mt-8 flex justify-center sm:mt-10">
        <Logo size={28} showText={false} />
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 px-3.5 py-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-background">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-sm font-semibold text-foreground">
          {value}
        </p>
      </div>
    </div>
  );
}

function PrefRow({
  icon,
  title,
  desc,
  checked,
  onCheckedChange,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-brand-light">
          {icon}
        </span>
        <div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
