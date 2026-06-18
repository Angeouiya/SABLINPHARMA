"use client";

import { useEffect, useMemo } from "react";
import {
  Clock,
  Trash2,
  ChevronLeft,
  Pill,
  Plus,
  ClipboardList,
  X,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { useNav } from "@/store/nav";
import { useAuth } from "@/store/auth";
import { useHistory } from "@/store/history";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";
import type { HistoryItem, HistoryKind, View, NavParams } from "@/lib/types";

const KIND_ICON: Record<HistoryKind, LucideIcon> = {
  medication: Pill,
  pharmacy: Plus,
  prescription: ClipboardList,
};

const KIND_LABEL: Record<HistoryKind, string> = {
  medication: "Médicament",
  pharmacy: "Pharmacie",
  prescription: "Ordonnance",
};

const GROUP_ORDER = [
  "Aujourd'hui",
  "Hier",
  "Cette semaine",
  "Plus ancien",
] as const;

type GroupLabel = (typeof GROUP_ORDER)[number];

function getGroupLabel(createdAt: string): GroupLabel {
  const date = new Date(createdAt);
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const startOfYesterday = new Date(
    startOfToday.getTime() - 24 * 60 * 60 * 1000
  );
  const startOfWeek = new Date(
    startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000
  );

  if (date >= startOfToday) return "Aujourd'hui";
  if (date >= startOfYesterday) return "Hier";
  if (date >= startOfWeek) return "Cette semaine";
  return "Plus ancien";
}

function handleItemClick(
  item: HistoryItem,
  navigate: (view: View, params?: NavParams) => void
) {
  if (item.kind === "medication" && item.slug) {
    navigate("medication-detail", { slug: item.slug });
    return;
  }
  if (item.kind === "pharmacy" && item.slug) {
    navigate("pharmacy-detail", { slug: item.slug });
    return;
  }
  if (item.kind === "prescription") {
    navigate("prescription");
    return;
  }
  if (item.query) {
    navigate("medications", { query: item.query });
    return;
  }
  navigate("medications");
}

export function HistoryView() {
  const { navigate } = useNav();
  const { user } = useAuth();
  const {
    history,
    loading,
    fetch: fetchHistory,
    clear,
    setHistory,
  } = useHistory();

  useEffect(() => {
    if (user) fetchHistory();
  }, [user, fetchHistory]);

  const grouped = useMemo(() => {
    const map = new Map<GroupLabel, HistoryItem[]>();
    for (const item of history) {
      const label = getGroupLabel(item.createdAt);
      const arr = map.get(label) ?? [];
      arr.push(item);
      map.set(label, arr);
    }
    return GROUP_ORDER.filter((g) => map.has(g)).map((g) => ({
      label: g,
      items: map.get(g) as HistoryItem[],
    }));
  }, [history]);

  const handleClear = () => {
    if (history.length === 0) return;
    if (
      !window.confirm(
        "Voulez-vous vraiment effacer tout votre historique ? Cette action est irréversible."
      )
    )
      return;
    clear();
    toast.success("Historique effacé");
  };

  const handleRemoveOne = (id: string) => {
    setHistory(history.filter((h) => h.id !== id));
    toast.success("Élément supprimé de l'historique");
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
            icon={Clock}
            title="Connectez-vous pour voir votre historique"
            description="Vos dernières recherches et consultations seront enregistrées ici pour un accès rapide."
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
            Historique
          </h1>
          {history.length > 0 && (
            <Badge variant="secondary">
              {history.length} élément{history.length > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Vos dernières recherches et consultations.
        </p>
      </div>

      {history.length > 0 && (
        <div className="mt-5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
          >
            <Trash2 className="size-4" /> Effacer l&apos;historique
          </Button>
        </div>
      )}

      <div className="mt-5">
        {loading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-2xl" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <Card className="border-border/70">
            <EmptyState
              icon={Clock}
              title="Aucun historique"
              description="Vos recherches et consultations de médicaments ou pharmacies apparaîtront ici."
              action={{
                label: "Rechercher un médicament",
                onClick: () => navigate("medications"),
              }}
            />
          </Card>
        ) : (
          <div className="flex flex-col gap-6">
            {grouped.map((group) => (
              <section key={group.label} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {group.label}
                  </h2>
                  <div className="h-px flex-1 bg-border/70" />
                  <span className="text-xs font-medium text-muted-foreground">
                    {group.items.length}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {group.items.map((item) => {
                    const Icon = KIND_ICON[item.kind];
                    return (
                      <Card
                        key={item.id}
                        className="group flex cursor-pointer items-center gap-3 border-border/70 p-3 transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-avance-lg"
                        onClick={() => handleItemClick(item, navigate)}
                      >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand">
                          <Icon className="size-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-foreground">
                            {item.label}
                          </p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                            <span className="font-medium text-brand-dark">
                              {KIND_LABEL[item.kind]}
                            </span>
                            <span aria-hidden>·</span>
                            <span>{formatDate(item.createdAt)}</span>
                            {item.query && (
                              <>
                                <span aria-hidden>·</span>
                                <span className="truncate">« {item.query} »</span>
                              </>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveOne(item.id);
                          }}
                          className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
                          aria-label="Supprimer cet élément"
                        >
                          <X className="size-4" />
                        </button>
                      </Card>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
