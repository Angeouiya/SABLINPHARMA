"use client";

import { MapPin, Clock, Phone, Navigation, ChevronRight, Plus, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useNav } from "@/store/nav";
import { cn } from "@/lib/utils";
import type { Pharmacy } from "@/lib/types";

function RatingPill({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand-dark px-2 py-0.5 text-[11px] font-bold text-white">
      <span className="flex size-3 items-center justify-center rounded-full bg-white/25">
        <span className="block size-1.5 rounded-full bg-amber-300" />
      </span>
      {rating.toFixed(1)}
    </span>
  );
}

export function PharmacyCard({ pharma, showPrice }: { pharma: Pharmacy; showPrice?: number }) {
  const { navigate } = useNav();

  return (
    <button
      onClick={() => navigate("pharmacy-detail", { slug: pharma.slug })}
      className="group block w-full text-left"
    >
      <Card className="gap-0 overflow-hidden border-border/70 py-0 transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-premium-lg">
        <div className="relative flex h-24 items-center justify-between overflow-hidden bg-brand-dark px-4">
          <div className="relative flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <Plus className="size-7 text-white" strokeWidth={3} />
            </span>
            <div className="text-white">
              <RatingPill rating={pharma.rating} />
            </div>
          </div>
          <div className="relative flex flex-col items-end gap-1.5">
            {pharma.isOpen247 && (
              <Badge className="border-0 bg-white/20 text-[10px] font-bold text-white backdrop-blur-sm">
                <Clock className="size-3" /> 24/7
              </Badge>
            )}
            {pharma.isOnDuty && (
              <Badge className="border-0 bg-amber-400 text-[10px] font-bold text-amber-950">
                <Timer className="size-3" /> De garde
              </Badge>
            )}
          </div>
        </div>
        <div className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-bold leading-tight text-foreground transition-colors group-hover:text-brand">
              {pharma.name}
            </h3>
            <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </div>
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <MapPin className="mt-0.5 size-3.5 shrink-0 text-brand/70" />
            <span className="line-clamp-1">{pharma.address}, {pharma.commune}</span>
          </p>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                pharma.openNow
                  ? "bg-brand-light text-brand-dark"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <span className={cn("size-1.5 rounded-full", pharma.openNow ? "bg-brand animate-pulse" : "bg-muted-foreground/50")} />
              {pharma.openNow ? "Ouvert maintenant" : "Fermé"}
            </span>
            {showPrice !== undefined && (
              <span className="text-[11px] font-semibold text-brand-dark">
                {showPrice.toLocaleString("fr-FR")} F
              </span>
            )}
          </div>
        </div>
      </Card>
    </button>
  );
}

export function PharmacyRow({ pharma }: { pharma: Pharmacy }) {
  const { navigate } = useNav();
  return (
    <button
      onClick={() => navigate("pharmacy-detail", { slug: pharma.slug })}
      className="group flex w-full items-center gap-3 rounded-xl border border-border/60 bg-background px-3 py-3 text-left transition-all hover:border-brand/30 hover:bg-accent/40"
    >
      <span className="relative flex size-11 shrink-0 items-center justify-center rounded-lg bg-brand-dark text-white">
        <Plus className="size-6" strokeWidth={3} />
        {pharma.isOnDuty && (
          <span className="absolute -right-1 -top-1 flex size-3.5 items-center justify-center rounded-full bg-amber-400 ring-2 ring-background" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-bold text-foreground group-hover:text-brand">
            {pharma.name}
          </span>
          <RatingPill rating={pharma.rating} />
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          <MapPin className="mr-1 inline size-3" />
          {pharma.commune} · {pharma.isOpen247 ? "Ouvert 24/7" : pharma.hoursWeekday}
        </span>
      </span>
      <span className="flex flex-col items-end shrink-0">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-bold",
            pharma.openNow ? "bg-brand-light text-brand-dark" : "bg-muted text-muted-foreground"
          )}
        >
          {pharma.openNow ? "Ouvert" : "Fermé"}
        </span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}
