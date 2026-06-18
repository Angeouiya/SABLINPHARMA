"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/store/favorites";
import { useAuth } from "@/store/auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { FavoriteKind } from "@/lib/types";

interface FavoriteButtonProps {
  kind: FavoriteKind;
  slug: string;
  label: string;
  meta?: string;
  variant?: "icon" | "button";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function FavoriteButton({
  kind,
  slug,
  label,
  meta,
  variant = "icon",
  size = "md",
  className,
}: FavoriteButtonProps) {
  const { isFavorite, toggle } = useFavorites();
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const active = isFavorite(kind, slug);

  const handle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.info("Connectez-vous pour ajouter des favoris.");
      return;
    }
    setBusy(true);
    const added = await toggle(kind, slug, label, meta);
    toast.success(added ? "Ajouté à vos favoris" : "Retiré de vos favoris");
    setBusy(false);
  };
  const buttonSize = size === "md" ? "default" : size;

  if (variant === "button") {
    return (
      <Button
        type="button"
        variant={active ? "default" : "outline"}
        size={buttonSize}
        onClick={handle}
        disabled={busy}
        className={cn(
          active && "bg-rose-500 text-white hover:bg-rose-600 border-rose-500",
          className
        )}
      >
        <Heart className={cn("size-4", active && "fill-current")} />
        {active ? "Favori" : "Ajouter aux favoris"}
      </Button>
    );
  }

  const iconSize = size === "sm" ? "size-4" : size === "lg" ? "size-6" : "size-5";
  return (
    <button
      type="button"
      onClick={handle}
      disabled={busy}
      aria-label={active ? "Retirer des favoris" : "Ajouter aux favoris"}
      aria-pressed={active}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-full border transition-colors",
        active
          ? "border-rose-500/40 bg-rose-50 text-rose-500 hover:bg-rose-100"
          : "border-border bg-background text-muted-foreground hover:text-rose-500 hover:border-rose-500/30",
        className
      )}
    >
      <Heart className={cn(iconSize, active && "fill-current")} />
    </button>
  );
}
