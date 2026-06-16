"use client";

import { Coins } from "lucide-react";
import { useCredits } from "@/store/credits";
import { useAuth } from "@/store/auth";
import { cn } from "@/lib/utils";

export function CreditBadge({ className }: { className?: string }) {
  const credits = useCredits((s) => s.credits);
  const { user } = useAuth();

  if (!user) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-brand-light px-2.5 py-1 text-xs font-bold text-brand-dark",
        className
      )}
    >
      <Coins className="size-3.5" />
      {credits} crédit{credits > 1 ? "s" : ""}
    </span>
  );
}
