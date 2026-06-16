"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Heart,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Pill,
  Plus,
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
import { useFavorites } from "@/store/favorites";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { FavoriteItem, FavoriteKind } from "@/lib/types";

const KIND_ICON: Record<FavoriteKind, LucideIcon> = {
  medication: Pill,
  pharmacy: Plus,
};

const KIND_LABEL: Record<FavoriteKind, string> = {
  medication: "Médicament",
  pharmacy: "Pharmacie",
};

type TabValue = "all" | "medication" | "pharmacy";

export function FavoritesView() {
  const { navigate } = useNav();
  const { user } = useAuth();
  const {
    favorites,
    loading,
    fetch: fetchFavorites,
    remove,
  } = useFavorites();
  const [tab, setTab] = useState<TabValue>("all");

  useEffect(() => {
    if (user) fetchFavorites();
  }, [user, fetchFavorites]);

  const filtered = useMemo(() => {
    if (tab === "all") return favorites;
    return favorites.filter((f) => f.kind === tab);
  }, [favorites, tab]);

  const counts = useMemo(
    () => ({
      all: favorites.length,
      medication: favorites.filter((f) => f.kind === "medication").length,
      pharmacy: favorites.filter((f) => f.kind === "pharmacy").length,
    }),
    [favorites]
  );

  const handleRemove = (item: FavoriteItem) => {
    remove(item.id);
    toast.success(`${KIND_LABEL[item.kind]} retiré de vos favoris`);
  };

  const handleView = (item: FavoriteItem) => {
    if (item.kind === "medication") {
      navigate("medication-detail", { slug: item.slug });
    } else {
      navigate("pharmacy-detail", { slug: item.slug });
    }
  };

  // Non connecté
  if (!user) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate("home")}
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-brand"
        >
          <ChevronLeft className="size-4" /> Accueil
        </button>
        <Card className="mt-6 border-border/70">
          <EmptyState
            icon={Heart}
            title="Connectez-vous pour voir vos favoris"
            description="Enregistrez vos médicaments et pharmacies préférés pour un accès rapide à tout moment."
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

      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Mes favoris
          </h1>
          {favorites.length > 0 && (
            <Badge className="bg-brand text-white">
              {favorites.length} favori{favorites.length > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Vos médicaments et pharmacies enregistrés.
        </p>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as TabValue)}
        className="mt-5"
      >
        <TabsList>
          <TabsTrigger value="all">Tous ({counts.all})</TabsTrigger>
          <TabsTrigger value="medication">
            Médicaments ({counts.medication})
          </TabsTrigger>
          <TabsTrigger value="pharmacy">Pharmacies ({counts.pharmacy})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-5">
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-border/70">
            <EmptyState
              icon={Heart}
              title="Aucun favori"
              description="Ajoutez des médicaments ou pharmacies à vos favoris en cliquant sur le cœur."
              action={{
                label: "Explorer",
                onClick: () => navigate("medications"),
              }}
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => {
              const Icon = KIND_ICON[item.kind];
              return (
                <Card
                  key={item.id}
                  className="group flex flex-col gap-3 border-border/70 p-5 transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-premium-lg"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-premium">
                      <Icon className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-bold leading-snug text-foreground">
                        {item.label}
                      </p>
                      <Badge
                        variant="secondary"
                        className="mt-1.5 bg-brand-light text-brand-dark"
                      >
                        {KIND_LABEL[item.kind]}
                      </Badge>
                    </div>
                  </div>

                  {item.meta && (
                    <p className="line-clamp-1 text-xs text-muted-foreground">
                      {item.meta}
                    </p>
                  )}

                  <div className="mt-auto flex items-center gap-2 border-t border-border/70 pt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleView(item)}
                    >
                      Voir
                      <ChevronRight className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className={cn(
                        "size-9 shrink-0 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                      )}
                      onClick={() => handleRemove(item)}
                      aria-label="Retirer des favoris"
                    >
                      <Trash2 className="size-4" />
                    </Button>
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
