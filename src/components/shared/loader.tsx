"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Loader({
  size = "md",
  className,
  label,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}) {
  const s = size === "sm" ? "size-4" : size === "lg" ? "size-8" : "size-6";
  return (
    <div className={cn("flex items-center justify-center gap-2.5 text-muted-foreground", className)}>
      <Loader2 className={cn(s, "animate-spin text-brand")} />
      {label && <span className="text-sm font-medium">{label}</span>}
    </div>
  );
}

export function FullLoader({ label = "Chargement..." }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
      <Loader2 className="size-10 animate-spin text-brand" />
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

export function ButtonLoader({ className }: { className?: string }) {
  return <Loader2 className={cn("size-4 animate-spin", className)} />;
}
