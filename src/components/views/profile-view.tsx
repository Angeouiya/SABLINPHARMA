"use client";

import { useState } from "react";
import {
  CircleUser,
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
  Timer,
  Search,
  Navigation,
  AlertCircle,
  Info,
  Eye,
  KeyRound,
  Wallet,
  Coins,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Heading, Eyebrow, Muted } from "@/components/ui/typography";
import { useNav } from "@/store/nav";
import { useAuth } from "@/store/auth";
import { useCredits, FREE_FEATURES, PAID_FEATURES } from "@/store/credits";
import { CreditBadge } from "@/components/shared/credit-badge";
import { CreditCost, PassBadge } from "@/components/shared/credit-cost";
import { LogoutConfirmDialog } from "@/components/shared/logout-confirm-dialog";
import { useNotifications } from "@/store/notifications";
import { useFavorites } from "@/store/favorites";
import { useHistory } from "@/store/history";
import { formatDate, distanceKm, formatFCFA } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { FavoriteItem, HistoryItem, AppNotification } from "@/lib/types";

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
  { icon: Wallet, label: "Mon portefeuille", view: "wallet" as const },
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
  const { user, logout } = useAuth();
  const credits = useCredits((s) => s.credits);
  const hasPass = useCredits((s) => s.hasPass);
  const passStatus = useCredits((s) => s.passStatus);
  const transactions = useCredits((s) => s.transactions);
  const unreadCount = useNotifications((s) => s.unread);
  const notifications = useNotifications((s) => s.notifications);
  const favCount = useFavorites((s) => s.favorites.length);
  const favorites = useFavorites((s) => s.favorites);
  const history = useHistory((s) => s.history);
  const [loggingOut, setLoggingOut] = useState(false);
  const [savedPrescriptions] = useState<SavedPrescription[]>(
    () => {
      if (typeof window === "undefined") return [];
      try {
        return JSON.parse(localStorage.getItem("sablin-prescriptions") || "[]");
      } catch {
        return [];
      }
    }
  );

  // ---------- Not logged in ----------
  if (!user) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col items-center justify-center px-4 py-12">
        <Card className="w-full border-border/70 p-8 text-center shadow-avance">
          <div className="mx-auto mb-5 flex size-20 items-center justify-center rounded-full bg-brand-light">
            <CircleUser className="size-10 text-brand" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-brand-dark">
            Connectez-vous pour accéder à votre profil
          </h1>
          <p className="mt-2 text-sm leading-relaxed break-words text-muted-foreground">
            Connectez-vous ou créez un compte gratuit pour suivre vos médicaments
            consultés, vos ordonnances estimées et vos pharmacies favorites à Abidjan.
          </p>
          <div className="mt-6 flex flex-col gap-2.5">
            <Button
              onClick={() => navigate("auth", { authMode: "login" })}
              className="h-11 w-full bg-brand text-base font-semibold text-white shadow-avance transition-all hover:opacity-95 hover:shadow-avance-lg"
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
      <Card className="overflow-hidden border-border/70 py-0 shadow-avance">
        <div className="relative bg-brand">
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
                  {user.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="size-3.5" /> {user.email}
                    </span>
                  )}
                  {user.commune && (
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3.5" /> {user.commune}
                    </span>
                  )}
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <CreditBadge />
                  {hasPass && <PassBadge />}
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
          <ProfileStat icon={Pill} value={history.filter((h) => h.kind === "medication").length} label="Médicaments consultés" />
          <ProfileStat icon={ClipboardList} value={savedPrescriptions.length} label="Ordonnances estimées" />
          <ProfileStat icon={Heart} value={favCount} label="Pharmacies favorites" />
        </div>
      </Card>

      {/* ============ MON PORTEFEUILLE ============ */}
      <Card className="mt-6 border-border/70 bg-brand-light p-6 shadow-avance">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              <span className="flex size-10 items-center justify-center rounded-xl bg-brand text-white">
                <Wallet className="size-5" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-brand-dark/70">
                  Mon portefeuille
                </p>
                <p className="text-sm font-medium text-brand-dark/80">
                  Crédits SABLIN PHARMA
                  {hasPass && (
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                      <ClipboardList className="size-2.5" /> Pass Ordonnance Unique
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="mt-3">
              <p className="text-4xl font-extrabold tabular-nums text-brand-dark">
                {credits}{" "}
                <span className="text-xl font-bold">
                  crédit{credits > 1 ? "s" : ""}
                </span>
              </p>
              <p className="mt-1 text-sm font-semibold text-brand-dark/80">
                ≈ {formatFCFA(credits * 100)}
                <span className="ml-1 font-normal text-brand-dark/60">
                  (1 crédit ≈ 100 FCFA)
                </span>
              </p>
            </div>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-brand-dark/80">
              Rechargez vos crédits ou achetez un Pass Ordonnance Unique pour débloquer les services avancés.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:w-56">
            <Button
              onClick={() => navigate("wallet")}
              className="bg-brand text-white hover:bg-brand-dark"
            >
              <Coins className="size-4" /> Recharger mes crédits
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("payment", { passOrdonnance: true })}
              className="border-amber-500/50 bg-amber-50 text-amber-900 hover:bg-amber-100"
            >
              <ClipboardList className="size-4" /> Acheter un Pass Ordonnance Unique
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("wallet")}
              className="border-brand/30 text-brand-dark hover:bg-brand"
            >
              <Receipt className="size-4" /> Historique
            </Button>
          </div>
        </div>
      </Card>

      {/* ============ COMPRENDRE MES CRÉDITS ============ */}
      <Card className="mt-6 border-border/70 p-6 shadow-avance">
        <div className="flex items-center gap-2.5">
          <span className="flex size-10 items-center justify-center rounded-xl bg-brand text-white">
            <Coins className="size-5" />
          </span>
          <div>
            <h2 className="text-lg font-extrabold tracking-tight text-brand-dark">
              Comprendre mes crédits
            </h2>
            <p className="text-xs text-muted-foreground">
              Tout ce qu&apos;il faut savoir sur les crédits SABLIN
            </p>
          </div>
        </div>

        {/* Définition */}
        <div className="mt-4 rounded-xl bg-muted/40 p-4">
          <p className="text-sm leading-relaxed text-foreground/85">
            <strong className="font-semibold text-foreground">Un crédit SABLIN</strong> est une
            unité interne qui permet de débloquer les services avancés de la plateforme.
            <span className="mt-1 block font-semibold text-brand-dark">
              1 crédit = 100 FCFA.
            </span>
          </p>
        </div>

        {/* Solde actuel + équivalent FCFA */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-brand/20 bg-brand-light/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-dark/70">
              Solde actuel
            </p>
            <p className="mt-1 text-4xl font-extrabold tabular-nums text-brand-dark">
              {credits}
            </p>
            <p className="text-sm font-medium text-brand-dark/70">
              crédit{credits > 1 ? "s" : ""} SABLIN
            </p>
          </div>
          <div className="rounded-xl border border-border bg-background p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Équivalent en FCFA
            </p>
            <p className="mt-1 text-4xl font-extrabold tabular-nums text-foreground">
              {formatFCFA(credits * 100)}
            </p>
            <p className="text-sm font-medium text-muted-foreground">
              au taux 1 crédit = 100 FCFA
            </p>
          </div>
        </div>

        {/* Services récemment utilisés (3 dernières transactions) */}
        <div className="mt-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">
              Services récemment utilisés
            </h3>
            <span className="text-xs text-muted-foreground">
              3 dernières transactions
            </span>
          </div>
          {transactions.length > 0 ? (
            <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto scroll-thin pr-1">
              {transactions.slice(0, 3).map((t) => {
                const isCredit = t.amount > 0;
                return (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {t.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(t.createdAt)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums",
                        isCredit
                          ? "bg-success-light text-success"
                          : "bg-danger-light text-danger"
                      )}
                    >
                      {isCredit ? "+" : ""}
                      {t.amount} crédit{Math.abs(t.amount) > 1 ? "s" : ""}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="mt-3 flex flex-col items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-center">
              <Coins className="size-7 text-muted-foreground/60" />
              <p className="mt-2 text-sm font-medium text-muted-foreground">
                Aucune transaction pour le moment.
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground/80">
                Vos services utilisés apparaîtront ici.
              </p>
            </div>
          )}
        </div>

        {/* CTA buttons */}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button
            onClick={() => navigate("wallet")}
            className="flex-1 bg-brand text-white hover:bg-brand-dark"
          >
            <Wallet className="size-4" /> Voir mon portefeuille
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("wallet")}
            className="flex-1 border-brand/30 text-brand-dark hover:bg-brand-light"
          >
            <HelpCircle className="size-4" /> FAQ crédits
          </Button>
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
              <LogoutConfirmDialog onConfirm={handleLogout}>
                <button
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
              </LogoutConfirmDialog>
            </div>
          </Card>
        </aside>

        {/* RIGHT: content sections */}
        <div className="space-y-6">
          {/* ============ MES ACCÈS SABLIN PHARMA ============ */}
          <section>
            <SectionTitle icon={CheckCircle2} title="Mes accès SABLIN PHARMA" />
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Bloc : Fonctionnalités couvertes */}
              <Card className="border-success/30 bg-success-light/20 p-5">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-success text-white">
                    <CheckCircle2 className="size-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      Fonctionnalités couvertes
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Accessibles à tous, sans crédits
                    </p>
                  </div>
                </div>
                <ul className="mt-4 max-h-72 space-y-2 overflow-y-auto scroll-thin pr-1">
                  {FREE_FEATURES.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-sm text-foreground/85"
                    >
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              {/* Bloc : Fonctionnalités avec crédits */}
              <Card className="border-brand/30 bg-brand-light/20 p-5">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-brand text-white">
                    <Coins className="size-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      Fonctionnalités avec crédits
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Services avancés payants
                    </p>
                  </div>
                </div>
                <ul className="mt-4 max-h-72 space-y-2.5 overflow-y-auto scroll-thin pr-1">
                  {PAID_FEATURES.map((f) => (
                    <li
                      key={f.label}
                      className="flex items-start justify-between gap-2 text-sm text-foreground/85"
                    >
                      <span className="flex-1">{f.label}</span>
                      {"isPass" in f && f.isPass ? (
                        <PassBadge className="shrink-0" />
                      ) : (
                        <CreditCost cost={f.cost} className="shrink-0" />
                      )}
                    </li>
                  ))}
                </ul>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full border-brand/30 text-brand-dark hover:bg-brand-light"
                  onClick={() => navigate("wallet")}
                >
                  <Wallet className="size-4" /> Gérer mes crédits
                </Button>
              </Card>
            </div>
          </section>

          {/* ============ RESTRICTIONS DE MON COMPTE ============ */}
          <section>
            <SectionTitle icon={Lock} title="Restrictions de mon compte" />
            <Card className="border-border/70 p-5">
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-sm text-foreground/85">
                  <Lock className="mt-0.5 size-4 shrink-0 text-danger" />
                  <span>
                    Sans crédit, vous pouvez rechercher des informations simples.
                  </span>
                </li>
                <li className="flex items-start gap-3 text-sm text-foreground/85">
                  <Lock className="mt-0.5 size-4 shrink-0 text-danger" />
                  <span>
                    Sans crédit, vous ne pouvez pas utiliser le module Ordonnance.
                  </span>
                </li>
                <li className="flex items-start gap-3 text-sm text-foreground/85">
                  <Lock className="mt-0.5 size-4 shrink-0 text-danger" />
                  <span>
                    Sans crédit, vous ne pouvez pas voir les pharmacies qui possèdent réellement un médicament.
                  </span>
                </li>
                <li className="flex items-start gap-3 text-sm text-foreground/85">
                  <Lock className="mt-0.5 size-4 shrink-0 text-danger" />
                  <span>
                    Sans crédit, vous ne pouvez pas comparer les prix.
                  </span>
                </li>
                <li className="flex items-start gap-3 text-sm text-foreground/85">
                  <Lock className="mt-0.5 size-4 shrink-0 text-danger" />
                  <span>
                    Sans crédit, vous ne pouvez pas demander de confirmation avant déplacement.
                  </span>
                </li>
                <li className="flex items-start gap-3 text-sm text-foreground/85">
                  <Lock className="mt-0.5 size-4 shrink-0 text-danger" />
                  <span>
                    Sans crédit, vous ne pouvez pas voir les contacts complets des pharmacies.
                  </span>
                </li>
                <li className="flex items-start gap-3 text-sm text-foreground/85">
                  <Lock className="mt-0.5 size-4 shrink-0 text-danger" />
                  <span>
                    Sans crédit, vous ne pouvez pas appeler une pharmacie depuis SABLIN PHARMA.
                  </span>
                </li>
                <li className="flex items-start gap-3 text-sm text-foreground/85">
                  <Lock className="mt-0.5 size-4 shrink-0 text-danger" />
                  <span>
                    Sans crédit, la comparaison des prix et les confirmations sont verrouillées.
                  </span>
                </li>
                <li className="flex items-start gap-3 text-sm text-foreground/85">
                  <Lock className="mt-0.5 size-4 shrink-0 text-danger" />
                  <span>
                    Sans crédit, vous ne pouvez pas envoyer une demande de conseil.
                  </span>
                </li>
                <li className="flex items-start gap-3 text-sm text-foreground/85">
                  <ClipboardList className="mt-0.5 size-4 shrink-0 text-warning" />
                  <span>
                    Sans Pass Ordonnance Unique actif, une ordonnance ne peut pas être traitée avec pass.
                  </span>
                </li>
                <li className="flex items-start gap-3 text-sm text-foreground/85">
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-warning" />
                  <span>
                    Un pass utilisé est expiré et ne peut jamais être réutilisé pour une nouvelle ordonnance.
                  </span>
                </li>
                <li className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 p-3 text-sm">
                  <span className="font-semibold text-foreground">Statut actuel du pass</span>
                  <Badge className={cn(
                    "border-0",
                    hasPass ? "bg-success text-white" : "bg-muted text-foreground"
                  )}>
                    {hasPass ? "Pass actif" : passStatus === "expired" ? "Pass expiré" : "Aucun pass"}
                  </Badge>
                </li>
                <li className="flex items-start gap-3 rounded-xl bg-success-light/40 p-3 text-sm font-bold text-foreground">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                  <div className="flex-1">
                    <p>
                      Rechargez vos crédits ou achetez un Pass Ordonnance Unique pour débloquer ces services.
                    </p>
                    <Button
                      size="sm"
                      className="mt-2 bg-brand text-white hover:bg-brand-dark"
                      onClick={() => navigate("wallet")}
                    >
                      <Wallet className="size-4" /> Recharger
                    </Button>
                  </div>
                </li>
              </ul>
            </Card>
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
                  <Card key={rx.id} className="border-border/70 p-4 transition-all hover:border-brand/30 hover:shadow-avance">
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
                      <LockedPrescriptionPrice />
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
  icon: typeof Wallet;
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
      <Badge className="border-0 bg-muted text-foreground">
        <Lock className="size-2.5 text-brand" /> Verrouillé
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
    <Card className="border-border/70 p-4 transition-all hover:border-brand/30 hover:shadow-avance">
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
    { name: "Paracétamol", dosage: "500 mg", date: "Aujourd'hui" },
    { name: "Amoxicilline", dosage: "500 mg", date: "Hier" },
    { name: "Vitamine C", dosage: "1000 mg", date: "12 juin 2026" },
    { name: "Smecta", dosage: "3 g", date: "10 juin 2026" },
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
          <Badge className="border-0 bg-muted text-foreground">
            <Lock className="size-2.5 text-brand" /> Verrouillé
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
        <Card key={rx.id} className="border-border/70 p-4 transition-all hover:border-brand/30 hover:shadow-avance">
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
            <LockedPrescriptionPrice />
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

function LockedPrescriptionPrice() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-muted px-2 py-1 text-[10px] font-extrabold text-foreground">
      <Lock className="size-3 text-brand" />
      Prix verrouillé
    </span>
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
        <Card key={i} className="border-border/70 p-4 transition-all hover:border-brand/30 hover:shadow-avance">
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
