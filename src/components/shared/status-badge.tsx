"use client";

import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from "lucide-react";
import { Clock, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  MedicationStatus,
  PharmacyStatus,
} from "@/lib/types";

interface StatusBadgeProps {
  className?: string;
  size?: "sm" | "md";
}

// ===== Medication status =====
export function MedicationStatusBadge({
  status,
  className,
  size = "sm",
}: StatusBadgeProps & { status: MedicationStatus }) {
  const config = {
    available: {
      label: "Disponible",
      icon: CheckCircle2,
      className: "bg-brand-light text-brand-dark border-brand/20",
    },
    "low-stock": {
      label: "Stock faible",
      icon: AlertTriangle,
      className: "bg-amber-50 text-amber-700 border-amber-500/30",
    },
    "out-of-stock": {
      label: "Rupture",
      icon: XCircle,
      className: "bg-red-50 text-red-600 border-red-500/30",
    },
    "to-confirm": {
      label: "À confirmer",
      icon: HelpCircle,
      className: "bg-slate-100 text-slate-600 border-slate-300/50",
    },
  }[status];

  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-semibold",
        size === "sm" ? "text-[10px]" : "text-xs px-2.5 py-1",
        config.className,
        className
      )}
    >
      <Icon className={size === "sm" ? "size-3" : "size-3.5"} />
      {config.label}
    </span>
  );
}

// ===== Pharmacy status =====
export function PharmacyStatusBadge({
  status,
  className,
  size = "sm",
}: StatusBadgeProps & { status: PharmacyStatus }) {
  const config = {
    open: {
      label: "Ouvert",
      icon: null,
      className: "bg-brand-light text-brand-dark border-brand/20",
      dot: "bg-brand",
    },
    closed: {
      label: "Fermé",
      icon: null,
      className: "bg-muted text-muted-foreground border-border",
      dot: "bg-muted-foreground/50",
    },
    "on-duty": {
      label: "De garde",
      icon: Timer,
      className: "bg-amber-100 text-amber-800 border-amber-500/30",
      dot: "bg-amber-500",
    },
  }[status];

  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-semibold",
        size === "sm" ? "text-[10px]" : "text-xs px-2.5 py-1",
        config.className,
        className
      )}
    >
      {Icon ? (
        <Icon className={size === "sm" ? "size-3" : "size-3.5"} />
      ) : (
        <span
          className={cn(
            "rounded-full",
            size === "sm" ? "size-1.5" : "size-2",
            config.dot,
            status === "open" && "animate-pulse"
          )}
        />
      )}
      {config.label}
    </span>
  );
}

// ===== 24/7 pill =====
export function Open247Badge({ className, size = "sm" }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-brand/20 bg-brand-light px-2 py-0.5 font-semibold text-brand-dark",
        size === "sm" ? "text-[10px]" : "text-xs px-2.5 py-1",
        className
      )}
    >
      <Clock className={size === "sm" ? "size-3" : "size-3.5"} />
      24/7
    </span>
  );
}

// ===== On duty pill (re-export alias) =====
export function OnDutyBadge({ className, size = "sm" }: StatusBadgeProps) {
  return (
    <PharmacyStatusBadge status="on-duty" className={className} size={size} />
  );
}
