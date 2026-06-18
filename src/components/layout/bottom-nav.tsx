"use client";

import { LayoutGrid, Pill, ClipboardList, MapPin, Wallet } from "lucide-react";
import { useNav } from "@/store/nav";
import { useAuth } from "@/store/auth";
import { cn } from "@/lib/utils";
import type { View } from "@/lib/types";

const ITEMS: {
  label: string;
  view: View;
  icon: typeof Pill;
}[] = [
  { label: "Accueil", view: "home", icon: LayoutGrid },
  { label: "Médocs", view: "medications", icon: Pill },
  { label: "Ordo", view: "prescription", icon: ClipboardList },
  { label: "Carte", view: "pharmacies", icon: MapPin },
  { label: "Wallet", view: "wallet", icon: Wallet },
];

export function BottomNav() {
  const { view, navigate } = useNav();
  const user = useAuth((s) => s.user);
  const visibleItems = user ? ITEMS : ITEMS.filter((item) => item.view !== "wallet");

  const isActive = (v: View) =>
    view === v ||
    (v === "medications" && view === "medication-detail") ||
    (v === "pharmacies" && view === "pharmacy-detail");

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/98 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Navigation principale mobile"
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around px-1.5">
        {visibleItems.map((item) => {
          const active = isActive(item.view);
          const Icon = item.icon;
          return (
            <button
              key={item.view}
              onClick={() => navigate(item.view)}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition-colors",
                active ? "text-brand-dark" : "text-muted-foreground"
              )}
              aria-current={active ? "page" : undefined}
            >
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-md transition-all",
                  active ? "bg-brand text-white" : "scale-100"
                )}
              >
                <Icon className="size-5" strokeWidth={active ? 2.5 : 2} />
              </span>
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
