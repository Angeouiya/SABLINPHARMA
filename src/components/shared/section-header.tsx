"use client";

import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
  icon?: React.ReactNode;
}

export function SectionHeader({ title, subtitle, action, className, icon }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-end justify-between gap-4", className)}>
      <div className="flex items-start gap-3">
        {icon && (
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand">
            {icon}
          </span>
        )}
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="group flex shrink-0 items-center gap-0.5 text-sm font-semibold text-brand hover:underline"
        >
          {action.label}
          <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      )}
    </div>
  );
}
