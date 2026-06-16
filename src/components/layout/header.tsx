"use client";

import { useState } from "react";
import { Menu, Crown, ChevronRight } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useNav } from "@/store/nav";
import { useAuth } from "@/store/auth";
import { cn } from "@/lib/utils";
import type { View } from "@/lib/types";

const NAV_ITEMS: { label: string; view: View }[] = [
  { label: "Accueil", view: "home" },
  { label: "Médicaments", view: "medications" },
  { label: "Pharmacies", view: "pharmacies" },
  { label: "Ordonnance", view: "prescription" },
];

export function Header() {
  const { view, navigate } = useNav();
  const { user, premium } = useAuth();
  const [open, setOpen] = useState(false);

  const go = (v: View) => {
    navigate(v);
    setOpen(false);
  };

  const isActive = (item: View) =>
    view === item ||
    (item === "medications" && view === "medication-detail") ||
    (item === "pharmacies" && view === "pharmacy-detail");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => go("home")}
          className="flex items-center transition-opacity hover:opacity-90"
          aria-label="Accueil SABLIN PHARMA"
        >
          <Logo size={38} />
        </button>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.view}
              onClick={() => go(item.view)}
              className={cn(
                "relative rounded-full px-4 py-2 text-sm font-medium transition-colors",
                isActive(item.view)
                  ? "text-brand"
                  : "text-foreground/70 hover:text-foreground hover:bg-accent/60"
              )}
            >
              {item.label}
              {isActive(item.view) && (
                <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand" />
              )}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {premium ? (
            <Button
              size="sm"
              variant="outline"
              className="hidden border-brand/30 bg-brand-light/50 text-brand-dark hover:bg-brand-light sm:inline-flex"
              onClick={() => go("profile")}
            >
              <Crown className="size-4 text-amber-500" />
              Premium
            </Button>
          ) : (
            <Button
              size="sm"
              className="hidden bg-brand-gradient text-white hover:opacity-90 sm:inline-flex"
              onClick={() => go("subscription")}
            >
              <Crown className="size-4" />
              Premium · 500 F
            </Button>
          )}

          {user ? (
            <Button
              size="sm"
              variant="outline"
              className="hidden sm:inline-flex"
              onClick={() => go("profile")}
            >
              Mon profil
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="hidden sm:inline-flex"
              onClick={() => navigate("auth", { authMode: "login" })}
            >
              Connexion
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen(true)}
            aria-label="Ouvrir le menu"
          >
            <Menu className="size-5" />
          </Button>
        </div>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-[300px] sm:w-[360px]">
          <SheetHeader>
            <SheetTitle className="text-left">
              <Logo size={36} />
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6 flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.view}
                onClick={() => go(item.view)}
                className={cn(
                  "flex items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors",
                  isActive(item.view)
                    ? "bg-brand-light text-brand-dark"
                    : "text-foreground/80 hover:bg-accent"
                )}
              >
                {item.label}
                <ChevronRight className="size-4 opacity-50" />
              </button>
            ))}
            <div className="my-2 h-px bg-border" />
            {premium ? (
              <button
                onClick={() => go("profile")}
                className="flex items-center justify-between rounded-xl bg-brand-light px-4 py-3 text-left text-sm font-semibold text-brand-dark"
              >
                <span className="flex items-center gap-2">
                  <Crown className="size-4 text-amber-500" /> Compte Premium
                </span>
                <ChevronRight className="size-4" />
              </button>
            ) : (
              <button
                onClick={() => go("subscription")}
                className="flex items-center justify-between rounded-xl bg-brand-gradient px-4 py-3 text-left text-sm font-semibold text-white"
              >
                <span className="flex items-center gap-2">
                  <Crown className="size-4" /> Passer Premium · 500 F/mois
                </span>
                <ChevronRight className="size-4" />
              </button>
            )}
            {user ? (
              <button
                onClick={() => go("profile")}
                className="flex items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium text-foreground/80 hover:bg-accent"
              >
                Mon profil
                <ChevronRight className="size-4 opacity-50" />
              </button>
            ) : (
              <button
                onClick={() => {
                  navigate("auth", { authMode: "login" });
                  setOpen(false);
                }}
                className="flex items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium text-foreground/80 hover:bg-accent"
              >
                Connexion / Inscription
                <ChevronRight className="size-4 opacity-50" />
              </button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
