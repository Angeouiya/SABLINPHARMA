"use client";

import { LayoutGrid, Pill, ClipboardList, MapPin, User } from "lucide-react";
import { useNav } from "@/store/nav";
import { cn } from "@/lib/utils";
import type { View } from "@/lib/types";

const ITEMS: {
  label: string;
  view: View;
  icon: typeof Pill;
}[] = [
  { label: "Accueil", view: "home", icon: LayoutGrid },
  { label: "Médicaments", view: "medications", icon: Pill },
  { label: "Ordonnance", view: "prescription", icon: ClipboardList },
  { label: "Pharmacies", view: "pharmacies", icon: MapPin },
  { label: "Profil", view: "profile", icon: User },
];

export function BottomNav() {
  const { view, navigate } = useNav();

  const isActive = (v: View) =>
    view === v ||
    (v === "medications" && view === "medication-detail") ||
    (v === "pharmacies" && view === "pharmacy-detail");

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-background/95 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Navigation principale mobile"
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around px-1">
        {ITEMS.map((item) => {
          const active = isActive(item.view);
          const Icon = item.icon;
          return (
            <button
              key={item.view}
              onClick={() => navigate(item.view)}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                active ? "text-brand" : "text-muted-foreground"
              )}
              aria-current={active ? "page" : undefined}
            >
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-xl transition-all",
                  active ? "bg-brand-light scale-105" : "scale-100"
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
