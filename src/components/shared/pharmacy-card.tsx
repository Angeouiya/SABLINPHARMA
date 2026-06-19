"use client";

import { MapPin, Clock, ChevronRight, Plus, Timer, Lock, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CreditCost } from "@/components/shared/credit-cost";
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

export function PharmacyCard({ pharma }: { pharma: Pharmacy }) {
  const { navigate } = useNav();

  return (
    <button
      onClick={() => navigate("pharmacy-detail", { slug: pharma.slug })}
      className="group block w-full min-w-0 text-left"
    >
      <Card className="min-w-0 gap-0 overflow-hidden border-border/70 py-0 transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-avance-lg">
        <div className="relative flex h-32 items-center justify-between overflow-hidden bg-brand-dark px-4">
          {pharma.imageUrl && (
            <img
              src={pharma.imageUrl}
              alt={pharma.name}
              className="absolute inset-0 size-full object-cover"
            />
          )}
          {!pharma.imageUrl && (
            <p className="absolute bottom-3 left-4 right-4 rounded-lg bg-white/15 px-3 py-2 text-xs font-bold text-white">
              Photo de la pharmacie non disponible
            </p>
          )}
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <Plus className="size-7 text-white" strokeWidth={3} />
            </span>
            <div className="text-white">
              <RatingPill rating={pharma.rating} />
            </div>
          </div>
          <div className="relative flex max-w-[46%] flex-col items-end gap-1.5">
            {pharma.isOpen247 && (
              <Badge className="whitespace-normal border-0 bg-white/20 text-[10px] font-bold leading-tight text-white backdrop-blur-sm">
                <Clock className="size-3" /> 24/7
              </Badge>
            )}
            {pharma.isOnDuty && (
              <Badge className="whitespace-normal border-0 bg-amber-400 text-[10px] font-bold leading-tight text-amber-950">
                <Timer className="size-3" /> De garde
              </Badge>
            )}
          </div>
        </div>
        <div className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="break-words text-sm font-bold leading-tight text-foreground">
              {pharma.name}
            </h3>
            <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </div>
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <MapPin className="mt-0.5 size-3.5 shrink-0 text-brand/70" />
            <span className="break-words">{pharma.address}, {pharma.commune}</span>
          </p>
          <div className="flex flex-wrap items-center gap-2">
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
            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold text-foreground">
              <Lock className="size-3 text-brand" />
              Prix verrouillé
            </span>
          </div>
          {/* Contact verrouillé — aucune info téléphone affichée */}
          <div className="flex flex-col gap-1.5 rounded-lg bg-muted/60 px-2 py-1.5 min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold leading-tight text-muted-foreground">
              <Lock className="size-3" /> Contact verrouillé
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold leading-tight text-brand-dark">
              <Phone className="size-3" /> Voir contact <CreditCost cost={1} />
            </span>
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
      className="group flex w-full min-w-0 items-start gap-3 rounded-xl border border-border/60 bg-background px-3 py-3 text-left transition-all hover:border-brand/30 hover:bg-accent/40 min-[420px]:items-center"
    >
      <span className="relative flex size-11 shrink-0 items-center justify-center rounded-lg bg-brand-dark text-white">
        <Plus className="size-6" strokeWidth={3} />
        {pharma.isOnDuty && (
          <span className="absolute -right-1 -top-1 flex size-3.5 items-center justify-center rounded-full bg-amber-400 ring-2 ring-background" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="break-words text-sm font-bold leading-snug text-foreground">
            {pharma.name}
          </span>
          <RatingPill rating={pharma.rating} />
        </span>
        <span className="block break-words text-xs text-muted-foreground">
          <MapPin className="mr-1 inline size-3" />
          {pharma.commune} · {pharma.isOpen247 ? "Ouvert 24/7" : pharma.hoursWeekday}
        </span>
        <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
          <Lock className="size-2.5" /> Contact verrouillé <CreditCost cost={1} />
        </span>
      </span>
      <span className="flex flex-col items-end gap-1 shrink-0">
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
