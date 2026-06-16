"use client";

import {
  Pill,
  ChevronRight,
  ShieldAlert,
  CheckCircle2,
  MapPin,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CategoryIcon } from "@/components/category-icons";
import { MedicationStatusBadge } from "@/components/shared/status-badge";
import { Price } from "@/components/ui/typography";
import { useNav } from "@/store/nav";
import { cn } from "@/lib/utils";
import type { Medication, MedicationStatus } from "@/lib/types";

/** Deterministic status derived from medication data for consistent display */
export function getMedStatus(med: Pick<Medication, "slug" | "pharmacyCount">): MedicationStatus {
  const hash = med.slug.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const pct = hash % 10;
  const count = med.pharmacyCount ?? 0;
  if (count === 0) return "out-of-stock";
  if (pct < 6) return "available";
  if (pct < 9) return "low-stock";
  return "to-confirm";
}

export function MedicationCard({ med }: { med: Medication }) {
  const { navigate } = useNav();
  const status = getMedStatus(med);

  return (
    <Card
      onClick={() => navigate("medication-detail", { slug: med.slug })}
      className="group gap-0 cursor-pointer overflow-hidden border-border/70 py-0 transition-all hover:-translate-y-1 hover:border-brand/30 hover:shadow-premium-lg"
    >
      {/* Header visual */}
      <div className="relative flex h-28 items-center justify-center overflow-hidden bg-gradient-to-br from-brand-light/70 to-brand-light/30">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 30%, var(--brand) 1px, transparent 1px)",
            backgroundSize: "16px 16px",
          }}
        />
        <div className="relative flex size-16 items-center justify-center rounded-2xl bg-background shadow-premium">
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
        {med.requiresRx && (
          <span className="absolute right-2 top-2">
            <Badge className="border-0 bg-amber-500/90 text-[10px] font-semibold text-white">
              <ShieldAlert className="size-3" /> Ordonnance
            </Badge>
          </span>
        )}
        <span className="absolute bottom-2 left-2">
          <MedicationStatusBadge status={status} />
        </span>
      </div>

      {/* Body */}
      <div className="space-y-2 p-4">
        <div>
          <h3 className="line-clamp-1 text-sm font-bold text-foreground transition-colors group-hover:text-brand">
            {med.name}
          </h3>
          <p className="line-clamp-1 text-xs text-muted-foreground">{med.genericName}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="rounded-md bg-muted px-1.5 py-0.5 font-medium">{med.form}</span>
          <span className="rounded-md bg-muted px-1.5 py-0.5 font-medium">{med.dosage}</span>
        </div>

        <div className="flex items-end justify-between border-t border-border/50 pt-2.5">
          <Price amount={med.avgPrice} size="md" variant="brand" from />
          <span className="flex items-center gap-0.5 text-xs font-medium text-muted-foreground">
            <MapPin className="size-3.5 text-brand" />
            {med.pharmacyCount ?? 0} pharmacies
          </span>
        </div>

        <Button
          size="sm"
          variant="outline"
          className="w-full border-brand/30 text-brand-dark hover:bg-brand-light hover:text-brand-dark"
          onClick={(e) => {
            e.stopPropagation();
            navigate("medication-detail", { slug: med.slug });
          }}
        >
          Voir détails <ChevronRight className="size-3.5" />
        </Button>
      </div>
    </Card>
  );
}

export function MedicationRow({ med }: { med: Medication }) {
  const { navigate } = useNav();
  const status = getMedStatus(med);
  return (
    <button
      onClick={() => navigate("medication-detail", { slug: med.slug })}
      className={cn(
        "group flex w-full items-center gap-3 rounded-xl border border-border/60 bg-background px-3 py-3 text-left transition-all hover:border-brand/30 hover:bg-accent/40"
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
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-bold text-foreground group-hover:text-brand">
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
          <MedicationStatusBadge status={status} />
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {med.genericName} · {med.form} {med.dosage}
        </span>
      </span>
      <span className="flex flex-col items-end shrink-0">
        <span className="text-sm font-extrabold text-brand-dark">
          {med.avgPrice.toLocaleString("fr-FR")} F
        </span>
        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
          <CheckCircle2 className="size-3 text-brand" />
          {med.pharmacyCount ?? 0} pharmacies
        </span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}
