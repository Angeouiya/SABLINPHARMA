"use client";

import { Pill, ChevronRight, ShieldAlert, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CategoryIcon } from "@/components/category-icons";
import { useNav } from "@/store/nav";
import { formatFCFA } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Medication } from "@/lib/types";

export function MedicationCard({ med }: { med: Medication }) {
  const { navigate } = useNav();

  return (
    <button
      onClick={() => navigate("medication-detail", { slug: med.slug })}
      className="group text-left"
    >
      <Card className="gap-0 overflow-hidden border-border/70 py-0 transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-premium-lg">
        <div className="relative flex h-28 items-center justify-center overflow-hidden bg-gradient-to-br from-brand-light/70 to-brand-light/30">
          <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle at 30% 30%, var(--brand) 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
          <div className="relative flex size-16 items-center justify-center rounded-2xl bg-background shadow-premium">
            {med.category ? (
              <CategoryIcon
                name={med.category.iconName}
                size={30}
                className="text-brand"
              />
            ) : (
              <Pill className="size-7 text-brand" />
            )}
          </div>
          {med.requiresRx && (
            <span className="absolute right-2 top-2">
              <Badge className="border-0 bg-amber-500/90 text-[10px] font-semibold text-white">
                <ShieldAlert className="size-3" /> Ordonnance
              </Badge>
            </span>
          )}
        </div>
        <div className="space-y-1.5 p-4">
          <h3 className="line-clamp-1 text-sm font-bold text-foreground transition-colors group-hover:text-brand">
            {med.name}
          </h3>
          <p className="text-xs text-muted-foreground">
            {med.form} · {med.dosage}
          </p>
          <p className="text-[11px] text-muted-foreground/80">{med.packSize}</p>
          <div className="flex items-end justify-between pt-1.5">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">À partir de</p>
              <p className="text-base font-extrabold text-brand-dark">{formatFCFA(med.avgPrice)}</p>
            </div>
            <span className="flex items-center gap-0.5 text-xs font-medium text-muted-foreground">
              <CheckCircle2 className="size-3.5 text-brand" />
              {med.pharmacyCount ?? 0} pharmacies
            </span>
          </div>
        </div>
      </Card>
    </button>
  );
}

export function MedicationRow({ med }: { med: Medication }) {
  const { navigate } = useNav();
  return (
    <button
      onClick={() => navigate("medication-detail", { slug: med.slug })}
      className={cn(
        "group flex w-full items-center gap-3 rounded-xl border border-border/60 bg-background px-3 py-3 text-left transition-all hover:border-brand/30 hover:bg-accent/40"
      )}
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand">
        {med.category ? (
          <CategoryIcon name={med.category.iconName} size={22} />
        ) : (
          <Pill className="size-5" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-bold text-foreground group-hover:text-brand">
            {med.name}
          </span>
          {med.requiresRx && (
            <Badge variant="outline" className="border-amber-500/40 bg-amber-50 px-1.5 py-0 text-[9px] font-semibold text-amber-700">
              Rx
            </Badge>
          )}
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {med.genericName} · {med.form} {med.dosage}
        </span>
      </span>
      <span className="flex flex-col items-end shrink-0">
        <span className="text-sm font-bold text-brand-dark">{formatFCFA(med.avgPrice)}</span>
        <span className="text-[10px] text-muted-foreground">{med.pharmacyCount ?? 0} pharmacies</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}
