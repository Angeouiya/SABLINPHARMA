"use client";

import type { LucideIcon } from "lucide-react";
import { Search, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
  variant?: "default" | "search";
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  variant = "default",
}: EmptyStateProps) {
  const Icon = icon ?? (variant === "search" ? Search : Inbox);
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-12 text-center",
        className
      )}
    >
      <span className="flex size-16 items-center justify-center rounded-2xl bg-brand-light text-brand">
        <Icon className="size-8" />
      </span>
      <h3 className="text-lg font-bold text-foreground">{title}</h3>
      {description && (
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {action && (
        <Button className="mt-2 bg-brand-gradient text-white hover:opacity-90" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
