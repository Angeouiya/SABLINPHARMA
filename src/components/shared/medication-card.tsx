"use client";

import {
  Pill,
  ChevronRight,
  ShieldAlert,
  Lock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CategoryIcon } from "@/components/category-icons";
import { useNav } from "@/store/nav";
import { cn } from "@/lib/utils";
import type { Medication } from "@/lib/types";

export function MedicationCard({ med }: { med: Medication }) {
  const { navigate } = useNav();

  return (
    <Card
      onClick={() => navigate("medication-detail", { slug: med.slug })}
      className="group min-w-0 gap-0 cursor-pointer overflow-hidden border-border/70 py-0 transition-all hover:-translate-y-1 hover:border-brand/30 hover:shadow-avance-lg"
    >
      {/* Header visual */}
      <div className="relative flex h-32 items-center justify-center overflow-hidden bg-brand-light">
        {med.imageUrl ? (
          <img
            src={med.imageUrl}
            alt={med.name}
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <>
            <div className="absolute inset-0 opacity-[0.07] bg-dotted" />
            <div className="relative flex size-16 items-center justify-center rounded-2xl bg-background shadow-avance">
              {med.category ? (
                <CategoryIcon
                  name={med.category.iconName}
                  size={30}
                  color={med.category.color}
                />
              ) : (
                <Pill className="size-7 text-brand" />
              )}
            </div>
          </>
        )}
        {med.requiresRx && (
          <span className="absolute right-2 top-2">
            <Badge className="border-0 bg-amber-500/90 text-[10px] font-semibold text-white">
              <ShieldAlert className="size-3" /> Ordonnance
            </Badge>
          </span>
        )}
        <span className="absolute bottom-2 left-2">
          <Badge className="border-0 bg-white text-[10px] font-bold text-brand-dark shadow-sm">
            <Lock className="size-3" /> Verrouillé
          </Badge>
        </span>
        <span className="absolute bottom-2 right-2">
          <Badge className="border-0 bg-white text-[10px] font-bold text-brand-dark shadow-sm">
            {med.imageBadge ?? "Image illustrative"}
          </Badge>
        </span>
      </div>

      {/* Body */}
      <div className="space-y-2 p-4">
        <div>
          <h3 className="line-clamp-2 break-words text-sm font-bold leading-snug text-foreground">
            {med.name}
          </h3>
          <p className="line-clamp-2 break-words text-xs text-muted-foreground">{med.genericName}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="rounded-md bg-muted px-1.5 py-0.5 font-medium leading-tight">{med.form}</span>
          <span className="rounded-md bg-muted px-1.5 py-0.5 font-medium leading-tight">{med.dosage}</span>
        </div>
        <Badge
          variant="outline"
          className="w-fit max-w-full whitespace-normal border-border bg-muted px-2 py-1 text-[11px] font-bold leading-tight text-foreground"
        >
          <Lock className="size-3" /> Disponibilité verrouillée — 1 crédit
        </Badge>

        <div className="flex flex-col items-start gap-2 border-t border-border/50 pt-2.5 min-[380px]:flex-row min-[380px]:items-end min-[380px]:justify-between">
          <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-extrabold text-foreground">
            <Lock className="size-3.5 text-brand" />
            Prix verrouillé — 1 crédit
          </span>
          <span className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
            <Lock className="size-3.5 text-brand" />
            Voir pharmacies — 1 crédit
          </span>
        </div>

        <Button
          size="sm"
          variant="outline"
          className="min-h-10 w-full whitespace-normal border-brand/30 text-brand-dark hover:bg-brand-light hover:text-brand-dark"
          onClick={(e) => {
            e.stopPropagation();
            navigate("medication-detail", { slug: med.slug });
          }}
        >
          Voir détails <ChevronRight className="size-3.5" />
        </Button>
        <div className="grid gap-2">
          <Button
            size="sm"
            className="min-h-10 w-full whitespace-normal bg-brand px-2 text-xs leading-tight text-white hover:bg-brand-dark"
            onClick={(e) => {
              e.stopPropagation();
              navigate("medication-detail", { slug: med.slug });
            }}
          >
            Voir pharmacies — 1 crédit
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="min-h-10 w-full whitespace-normal border-brand/30 px-2 text-xs leading-tight text-brand-dark hover:bg-brand-light hover:text-brand-dark"
            onClick={(e) => {
              e.stopPropagation();
              navigate("prescription", { estimateItems: [{ slug: med.slug, quantity: 1 }] });
            }}
          >
            Ajouter ordonnance — 1 crédit
          </Button>
        </div>
        <p className="text-[11px] font-medium leading-snug text-muted-foreground">
          Connectez-vous et utilisez vos crédits SABLIN pour voir les prix.
        </p>
      </div>
    </Card>
  );
}

export function MedicationRow({ med }: { med: Medication }) {
  const { navigate } = useNav();
  return (
    <button
      onClick={() => navigate("medication-detail", { slug: med.slug })}
      className={cn(
        "group flex w-full min-w-0 items-start gap-3 rounded-xl border border-border/60 bg-background px-3 py-3 text-left transition-all hover:border-brand/30 hover:bg-accent/40 sm:items-center"
      )}
    >
      <span
        className="flex size-11 shrink-0 items-center justify-center rounded-lg text-white"
        style={{ backgroundColor: med.category?.color ?? "var(--brand)" }}
      >
        {med.category ? (
          <CategoryIcon name={med.category.iconName} size={22} color="#fff" />
        ) : (
          <Pill className="size-5 text-white" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="min-w-0 break-words text-sm font-bold text-foreground">
            {med.name}
          </span>
          {med.requiresRx && (
            <Badge
              variant="outline"
              className="border-amber-500/40 bg-amber-50 px-1.5 py-0 text-[9px] font-semibold text-amber-700"
            >
              Rx
            </Badge>
          )}
          {med.informationBadge && (
            <Badge
              variant="outline"
              className="border-brand/30 bg-white px-1.5 py-0 text-[9px] font-semibold text-brand-dark"
            >
              {med.informationBadge}
            </Badge>
          )}
          <Badge
            variant="outline"
            className="border-border bg-muted px-1.5 py-0 text-[9px] font-semibold text-foreground"
          >
            <Lock className="size-2.5" /> Verrouillé
          </Badge>
        </span>
        <span className="block break-words text-xs text-muted-foreground">
          {med.genericName} · {med.form} {med.dosage}
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end">
        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[11px] font-extrabold text-foreground">
          <Lock className="size-3 text-brand" />
          Prix verrouillé
        </span>
        <span className="flex items-center gap-0.5 text-[10px] font-semibold text-muted-foreground">
          <Lock className="size-3 text-brand" />
          1 crédit
        </span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}
