"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CheckCircle2,
  CheckCheck,
  Trash2,
  ChevronLeft,
  Timer,
  Crown,
  Pill,
  AlertTriangle,
  Info,
  Heart,
  Inbox,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
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
  Crown,
  Pill,
  AlertTriangle,
  Info,
  Heart,
};

const TYPE_STYLES: Record<NotificationType, { circle: string; dot: string }> = {
  info: { circle: "bg-sky-100 text-sky-600", dot: "bg-sky-500" },
  success: { circle: "bg-brand-light text-brand", dot: "bg-brand" },
  warning: { circle: "bg-amber-100 text-amber-600", dot: "bg-amber-500" },
  alert: { circle: "bg-red-100 text-red-600", dot: "bg-red-500" },
  promotion: { circle: "bg-amber-100 text-amber-600", dot: "bg-amber-500" },
};

const LINK_VIEWS: View[] = [
  "home",
  "medications",
  "pharmacies",
  "prescription",
  "subscription",
  "profile",
];

function resolveLink(link: string | null): View | null {
  if (!link) return null;
  return (LINK_VIEWS as string[]).includes(link) ? (link as View) : null;
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
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (user) fetchNotifs();
  }, [user, fetchNotifs]);

  const filtered = useMemo(() => {
    if (tab === "unread") return notifications.filter((n) => !n.read);
    return notifications;
  }, [notifications, tab]);

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
            description="Recevez des alertes sur les pharmacies de garde, les nouveautés et les offres Premium."
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
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <button
        onClick={() => navigate("home")}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-brand"
      >
        <ChevronLeft className="size-4" /> Accueil
      </button>

      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Notifications
          </h1>
          {unread > 0 && (
            <Badge className="bg-brand text-white">
              {unread} non lue{unread > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Restez informé des pharmacies de garde, nouveautés et offres.
        </p>
      </div>

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

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as "all" | "unread")}
        className="mt-5"
      >
        <TabsList>
          <TabsTrigger value="all">
            Toutes ({notifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread">Non lues ({unread})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-4">
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-border/70">
            <EmptyState
              icon={Inbox}
              title="Aucune notification"
              description={
                tab === "unread"
                  ? "Vous avez lu toutes vos notifications. De nouvelles alertes apparaîtront ici."
                  : "Vous n'avez pas encore de notification. Explorez les médicaments pour commencer."
              }
              action={{
                label: "Explorer les médicaments",
                onClick: () => navigate("medications"),
              }}
            />
          </Card>
        ) : (
          <div className="flex flex-col gap-2.5">
            {filtered.map((n) => {
              const Icon = ICONS[n.icon] ?? Bell;
              const styles = TYPE_STYLES[n.type];
              return (
                <Card
                  key={n.id}
                  className={cn(
                    "group relative flex cursor-pointer items-start gap-3 border-border/70 p-4 transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-premium-lg",
                    !n.read && "bg-brand-light/20"
                  )}
                  onClick={() => handleOpen(n)}
                >
                  <span
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-xl",
                      styles.circle
                    )}
                  >
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-bold text-foreground">
                        {n.title}
                      </p>
                      {!n.read && (
                        <span
                          className={cn("size-2 shrink-0 rounded-full", styles.dot)}
                          aria-label="Notification non lue"
                        />
                      )}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                      {n.message}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground/70">
                      {formatDate(n.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(n.id);
                    }}
                    className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
                    aria-label="Supprimer la notification"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
