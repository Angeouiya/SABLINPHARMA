"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CheckCircle2,
  CheckCheck,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Timer,
  Coins,
  Receipt,
  Pill,
  AlertTriangle,
  Info,
  Heart,
  Inbox,
  Loader2,
  CreditCard,
  ClipboardList,
  Headphones,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Heading, Eyebrow, Muted } from "@/components/ui/typography";
import { useNav } from "@/store/nav";
import { useAuth } from "@/store/auth";
import { useNotifications } from "@/store/notifications";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { AppNotification, NotificationType, View } from "@/lib/types";

const ICONS: Record<string, LucideIcon> = {
  Bell,
  CheckCircle2,
  Timer,
  Coins,
  Receipt,
  Pill,
  AlertTriangle,
  Info,
  Heart,
};

const TYPE_STYLES: Record<NotificationType, { circle: string; dot: string; label: string }> = {
  info: { circle: "bg-sky-100 text-sky-600", dot: "bg-sky-500", label: "Info" },
  success: { circle: "bg-brand-light text-brand", dot: "bg-brand", label: "Succès" },
  warning: { circle: "bg-amber-100 text-amber-600", dot: "bg-amber-500", label: "Alerte" },
  alert: { circle: "bg-red-100 text-red-600", dot: "bg-red-500", label: "Urgent" },
  promotion: { circle: "bg-amber-100 text-amber-600", dot: "bg-amber-500", label: "Promo" },
};

// 8 filtres par catégorie
type FilterKey = "all" | "unread" | "medications" | "pharmacies" | "prescriptions" | "credits" | "payment" | "support";

const FILTERS: { key: FilterKey; label: string; icon: LucideIcon }[] = [
  { key: "all", label: "Toutes", icon: Bell },
  { key: "unread", label: "Non lues", icon: AlertTriangle },
  { key: "medications", label: "Médicaments", icon: Pill },
  { key: "pharmacies", label: "Pharmacies", icon: Timer },
  { key: "prescriptions", label: "Ordonnances", icon: ClipboardList },
  { key: "credits", label: "Crédits", icon: Coins },
  { key: "payment", label: "Paiement", icon: CreditCard },
  { key: "support", label: "Support", icon: Headphones },
];

// Map notification title keywords to filter categories
function categorizeNotification(n: AppNotification): FilterKey {
  const t = (n.title + " " + n.message).toLowerCase();
  if (t.includes("médicament") || t.includes("stock") || t.includes("rupture") || t.includes("disponible")) return "medications";
  if (t.includes("pharmacie") || t.includes("garde")) return "pharmacies";
  if (t.includes("ordonnance") || t.includes("estimée") || t.includes("estimation")) return "prescriptions";
  if (t.includes("crédit") || t.includes("recharge") || t.includes("pass") || t.includes("solde")) return "credits";
  if (t.includes("paiement") || t.includes("wave") || t.includes("money")) return "payment";
  if (t.includes("support") || t.includes("message")) return "support";
  return "all";
}

const LINK_VIEWS: View[] = [
  "home",
  "medications",
  "pharmacies",
  "prescription",
  "wallet",
  "profile",
  "favorites",
];

function resolveLink(link: string | null): View | null {
  if (!link) return null;
  return LINK_VIEWS.includes(link as View) ? (link as View) : null;
}

// Action button config based on notification category
function getAction(n: AppNotification): { label: string; view: View } | null {
  const cat = categorizeNotification(n);
  switch (cat) {
    case "medications":
      return { label: "Voir le médicament", view: "medications" };
    case "pharmacies":
      return { label: "Voir la pharmacie", view: "pharmacies" };
    case "prescriptions":
      return { label: "Consulter l'ordonnance", view: "prescription" };
    case "credits":
      return { label: "Recharger mes crédits", view: "wallet" };
    case "payment":
      return { label: "Voir le portefeuille", view: "wallet" };
    case "support":
      return { label: "Contacter le support", view: "profile" };
    default:
      return null;
  }
}

export function NotificationsView() {
  const { navigate } = useNav();
  const { user } = useAuth();
  const {
    notifications,
    unread,
    loading,
    fetch: fetchNotifs,
    markAllRead,
    markRead,
    remove,
  } = useNotifications();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (user) fetchNotifs();
  }, [user, fetchNotifs]);

  const filtered = useMemo(() => {
    if (filter === "all") return notifications;
    if (filter === "unread") return notifications.filter((n) => !n.read);
    return notifications.filter((n) => categorizeNotification(n) === filter);
  }, [notifications, filter]);

  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = {
      all: notifications.length,
      unread: unread,
      medications: 0,
      pharmacies: 0,
      prescriptions: 0,
      credits: 0,
      payment: 0,
      support: 0,
    };
    notifications.forEach((n) => {
      const cat = categorizeNotification(n);
      if (cat !== "all") c[cat]++;
    });
    return c;
  }, [notifications, unread]);

  const handleClearAll = async () => {
    if (notifications.length === 0) return;
    if (
      !window.confirm(
        "Voulez-vous vraiment effacer toutes vos notifications ? Cette action est irréversible."
      )
    )
      return;
    setClearing(true);
    try {
      const ids = notifications.map((n) => n.id);
      for (const id of ids) {
        await remove(id);
      }
      toast.success("Toutes les notifications ont été effacées");
    } catch {
      toast.error("Une erreur est survenue lors de la suppression");
    } finally {
      setClearing(false);
    }
  };

  const handleOpen = (n: AppNotification) => {
    if (!n.read) markRead(n.id);
    const view = resolveLink(n.link);
    if (view) navigate(view);
  };

  const handleMarkAll = () => {
    markAllRead();
    toast.success("Toutes les notifications marquées comme lues");
  };

  const handleRemove = (id: string) => {
    remove(id);
    toast.success("Notification supprimée");
  };

  // Non connecté
  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate("home")}
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-brand"
        >
          <ChevronLeft className="size-4" /> Accueil
        </button>
        <Card className="mt-6 border-border/70">
          <EmptyState
            icon={Bell}
            title="Connectez-vous pour voir vos notifications"
            description="Recevez des alertes sur les pharmacies de garde, les nouveautés et l'état de vos crédits."
            action={{
              label: "Se connecter",
              onClick: () => navigate("auth", { authMode: "login" }),
            }}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <button
        onClick={() => navigate("home")}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-brand"
      >
        <ChevronLeft className="size-4" /> Accueil
      </button>

      {/* Header */}
      <div className="flex flex-col gap-2">
        <Eyebrow>Alertes et informations</Eyebrow>
        <div className="flex flex-wrap items-center gap-3">
          <Heading level="h1">Notifications</Heading>
          {unread > 0 && (
            <Badge className="bg-brand text-white">
              {unread} non lue{unread > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        <Muted>
          Restez informé des disponibilités de médicaments, pharmacies de garde,
          crédits, paiements et ordonnances.
        </Muted>
      </div>

      {/* Actions bar */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleMarkAll}
          disabled={unread === 0}
        >
          <CheckCheck className="size-4" /> Tout marquer comme lu
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearAll}
          disabled={notifications.length === 0 || clearing}
        >
          {clearing ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Trash2 className="size-4" />
          )}
          Effacer tout
        </Button>
      </div>

      {/* Filters */}
      <div className="mt-5 flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          const count = counts[f.key];
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors",
                active
                  ? "border-brand bg-brand text-white"
                  : "border-border bg-background text-foreground/70 hover:border-brand/40 hover:text-brand"
              )}
            >
              <f.icon className="size-3.5" />
              {f.label}
              {count > 0 && (
                <span
                  className={cn(
                    "ml-0.5 rounded-full px-1.5 py-0 text-[10px] font-bold",
                    active ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notifications list */}
      <div className="mt-5">
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-border/70">
            <EmptyState
              icon={Inbox}
              title="Aucune notification"
              description={
                filter === "unread"
                  ? "Vous avez lu toutes vos notifications. De nouvelles alertes apparaîtront ici."
                  : "Vous n'avez pas de notification dans cette catégorie pour le moment."
              }
              action={{
                label: "Retour à l'accueil",
                onClick: () => navigate("home"),
              }}
            />
          </Card>
        ) : (
          <div className="flex flex-col gap-2.5">
            {filtered.map((n) => {
              const Icon = ICONS[n.icon] ?? Bell;
              const styles = TYPE_STYLES[n.type] ?? TYPE_STYLES.info;
              const action = getAction(n);
              return (
                <Card
                  key={n.id}
                  className={cn(
                    "group border-border/70 p-4 transition-all hover:border-brand/30 hover:shadow-premium",
                    !n.read && "bg-brand-light/20"
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <span
                      className={cn(
                        "flex size-11 shrink-0 items-center justify-center rounded-xl",
                        styles.circle
                      )}
                    >
                      <Icon className="size-5" />
                    </span>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-foreground">
                          {n.title}
                        </p>
                        {!n.read && (
                          <span
                            className={cn("size-2 shrink-0 rounded-full", styles.dot)}
                            aria-label="Non lue"
                          />
                        )}
                        <Badge
                          variant="outline"
                          className="border-border/60 px-1.5 py-0 text-[9px] font-semibold text-muted-foreground"
                        >
                          {styles.label}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed break-words text-muted-foreground">
                        {n.message}
                      </p>
                      <p className="mt-1.5 text-xs text-muted-foreground/70">
                        {formatDate(n.createdAt)}
                      </p>

                      {/* Actions */}
                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        {action && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 border-brand/30 text-brand-dark hover:bg-brand-light"
                            onClick={() => {
                              if (!n.read) markRead(n.id);
                              navigate(action.view);
                            }}
                          >
                            {action.label}
                            <ArrowRight className="size-3" />
                          </Button>
                        )}
                        {!n.read && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-muted-foreground hover:text-brand"
                            onClick={() => {
                              markRead(n.id);
                              toast.success("Marqué comme lu");
                            }}
                          >
                            <CheckCheck className="size-3.5" /> Marquer comme lu
                          </Button>
                        )}
                        <button
                          onClick={() => handleRemove(n.id)}
                          className="ml-auto flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-red-600"
                        >
                          <Trash2 className="size-3.5" /> Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
