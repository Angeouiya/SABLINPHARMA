"use client";

import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/* ============================================================
   SABLIN PHARMA — StatBlock
   Bloc de statistique premium avec icône, valeur, label.
   ============================================================ */

interface StatBlockProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  /** Variante de couleur de l'icône */
  tone?: "brand" | "success" | "warning" | "danger" | "info" | "neutral";
  className?: string;
  /** Affiche une flèche de tendance */
  trend?: { value: string; up: boolean };
}

const tones = {
  brand: "bg-brand-light text-brand",
  success: "bg-success-light text-success",
  warning: "bg-warning-light text-warning-foreground",
  danger: "bg-danger-light text-danger",
  info: "bg-info-light text-info",
  neutral: "bg-neutral-light text-neutral-foreground",
};

export function StatBlock({
  icon: Icon,
  value,
  label,
  tone = "brand",
  className,
  trend,
}: StatBlockProps) {
  return (
    <Card
      className={cn(
        "gap-0 border-border/60 py-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-premium",
        className
      )}
    >
      <div className="flex items-center gap-3 px-4">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            tones[tone]
          )}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xl font-extrabold tabular-nums text-brand-dark">
            {value}
          </p>
          <p className="text-[11px] leading-tight text-muted-foreground">
            {label}
          </p>
        </div>
        {trend && (
          <span
            className={cn(
              "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
              trend.up
                ? "bg-success-light text-success"
                : "bg-danger-light text-danger"
            )}
          >
            {trend.up ? "↑" : "↓"} {trend.value}
          </span>
        )}
      </div>
    </Card>
  );
}

/** Grille de StatBlocks responsive */
export function StatGrid({
  stats,
  className,
}: {
  stats: StatBlockProps[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4",
        className
      )}
    >
      {stats.map((s, i) => (
        <StatBlock key={i} {...s} />
      ))}
    </div>
  );
}
