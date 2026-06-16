"use client";

import { Coins } from "lucide-react";
import { cn } from "@/lib/utils";

/** Small badge showing the credit cost of an action */
export function CreditCost({
  cost,
  className,
}: {
  cost: number;
  className?: string;
}) {
  if (cost === 0) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-0.5 rounded-full bg-success-light px-1.5 py-0.5 text-[10px] font-bold text-success",
          className
        )}
      >
        Gratuit
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full bg-brand-light px-1.5 py-0.5 text-[10px] font-bold text-brand-dark",
        className
      )}
    >
      <Coins className="size-2.5" />
      {cost} crédit{cost > 1 ? "s" : ""}
    </span>
  );
}

/** Badge for Pass Ordonnance */
export function PassBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white",
        className
      )}
    >
      Pass Ordonnance
    </span>
  );
}
