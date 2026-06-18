"use client";

import { CheckCircle2, Coins, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

type CreditCostBadgeVariant =
  | "free"
  | "credits"
  | "pass"
  | "locked"
  | "unlocked"
  | "insufficient"
  | "pass-active"
  | "pass-used"
  | "pass-expired";

export function CreditCostBadge({
  cost,
  label,
  variant,
  className,
}: {
  cost?: number;
  label?: string;
  variant?: CreditCostBadgeVariant;
  className?: string;
}) {
  const resolvedVariant = variant ?? (cost === 0 ? "free" : "credits");

  if (resolvedVariant === "free") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-0.5 rounded-md bg-success-light px-1.5 py-0.5 text-[10px] font-bold text-success",
          className
        )}
      >
        {label ?? "Gratuit"}
      </span>
    );
  }

  if (resolvedVariant === "pass") {
    return <PassBadge className={className} />;
  }

  if (resolvedVariant === "locked" || resolvedVariant === "insufficient") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-0.5 rounded-md bg-danger-light px-1.5 py-0.5 text-[10px] font-bold text-danger",
          className
        )}
      >
        <Lock className="size-2.5" />
        {label ?? (resolvedVariant === "insufficient" ? "Solde insuffisant" : "Verrouillé")}
      </span>
    );
  }

  if (resolvedVariant === "unlocked") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-0.5 rounded-md bg-success-light px-1.5 py-0.5 text-[10px] font-bold text-success",
          className
        )}
      >
        <CheckCircle2 className="size-2.5" />
        {label ?? "Débloqué"}
      </span>
    );
  }

  if (resolvedVariant === "pass-active" || resolvedVariant === "pass-used" || resolvedVariant === "pass-expired") {
    const text =
      resolvedVariant === "pass-active"
        ? "Pass actif"
        : resolvedVariant === "pass-used"
          ? "Pass utilisé"
          : "Pass expiré";
    return (
      <span
        className={cn(
          "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold",
          resolvedVariant === "pass-expired"
            ? "bg-danger-light text-danger"
            : "bg-warning-light text-warning-foreground",
          className
        )}
      >
        {label ?? text}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md bg-brand-light px-1.5 py-0.5 text-[10px] font-bold text-brand-dark",
        className
      )}
    >
      <Coins className="size-2.5" />
      {label ?? `${cost} crédit${(cost ?? 0) > 1 ? "s" : ""}`}
    </span>
  );
}

/** Small badge showing the credit cost of an action */
export function CreditCost({ cost, className }: { cost: number; className?: string }) {
  return <CreditCostBadge cost={cost} className={className} />;
}

/** Badge for Pass Ordonnance Unique */
export function PassBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md bg-warning px-1.5 py-0.5 text-[10px] font-bold text-warning-foreground",
        className
      )}
    >
      Pass Ordonnance Unique
    </span>
  );
}
