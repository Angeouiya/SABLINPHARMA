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
    <div className={cn("flex min-w-0 items-center justify-between gap-3", className)}>
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        {icon && (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-brand-light text-brand">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-sm font-extrabold leading-tight text-foreground sm:text-lg">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="group flex shrink-0 items-center gap-0.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-bold text-brand-dark transition-colors hover:border-brand/40 hover:bg-brand-light"
        >
          {action.label}
          <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      )}
    </div>
  );
}
