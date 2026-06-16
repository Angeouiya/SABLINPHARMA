"use client";

import type { LucideIcon } from "lucide-react";
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type AlertVariant = "info" | "success" | "warning" | "error";

const VARIANTS: Record<
  AlertVariant,
  { icon: LucideIcon; className: string; iconClass: string }
> = {
  info: {
    icon: Info,
    className: "bg-sky-50 border-sky-500/30 text-sky-900",
    iconClass: "text-sky-600",
  },
  success: {
    icon: CheckCircle2,
    className: "bg-brand-light/60 border-brand/30 text-brand-dark",
    iconClass: "text-brand",
  },
  warning: {
    icon: AlertTriangle,
    className: "bg-amber-50 border-amber-500/30 text-amber-900",
    iconClass: "text-amber-600",
  },
  error: {
    icon: XCircle,
    className: "bg-red-50 border-red-500/30 text-red-900",
    iconClass: "text-red-600",
  },
};

interface AlertMessageProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
  icon?: LucideIcon;
}

export function AlertMessage({
  variant = "info",
  title,
  children,
  onClose,
  className,
  icon,
}: AlertMessageProps) {
  const cfg = VARIANTS[variant];
  const Icon = icon ?? cfg.icon;
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4",
        cfg.className,
        className
      )}
      role="alert"
    >
      <Icon className={cn("mt-0.5 size-5 shrink-0", cfg.iconClass)} />
      <div className="min-w-0 flex-1">
        {title && <p className="text-sm font-bold">{title}</p>}
        <div className="text-sm leading-relaxed opacity-90">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="shrink-0 rounded-md p-0.5 opacity-60 transition-opacity hover:opacity-100"
          aria-label="Fermer"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
