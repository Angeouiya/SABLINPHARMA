"use client";

import { ShieldCheck, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentSummaryProps {
  title?: string;
  rows: { label: string; value: string; emphasis?: boolean }[];
  totalLabel?: string;
  total: string;
  className?: string;
  secureNote?: boolean;
  children?: React.ReactNode;
}

export function PaymentSummary({
  title = "Récapitulatif",
  rows,
  totalLabel = "Total",
  total,
  className,
  secureNote = true,
  children,
}: PaymentSummaryProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/70 bg-background p-5 shadow-premium",
        className
      )}
    >
      <h3 className="text-base font-bold text-foreground">{title}</h3>
      <div className="mt-4 space-y-2.5">
        {rows.map((r, i) => (
          <div
            key={i}
            className={cn(
              "flex items-center justify-between text-sm",
              r.emphasis ? "font-semibold text-foreground" : "text-muted-foreground"
            )}
          >
            <span>{r.label}</span>
            <span>{r.value}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-4">
        <span className="text-sm font-bold text-foreground">{totalLabel}</span>
        <span className="text-2xl font-extrabold text-brand-dark">{total}</span>
      </div>
      {children}
      {secureNote && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-brand-light/40 px-3 py-2 text-xs text-brand-dark">
          <Lock className="size-3.5" />
          <span className="flex items-center gap-1">
            <ShieldCheck className="size-3.5" /> Paiement 100% sécurisé · données chiffrées
          </span>
        </div>
      )}
    </div>
  );
}
