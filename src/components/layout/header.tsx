"use client";

import { useEffect, useState } from "react";
import {
  Menu,
  Crown,
  ChevronRight,
  Bell,
  Heart,
  Clock,
  Settings,
  LogOut,
  User as UserIcon,
  CreditCard,
  CheckCheck,
  Coins,
  Wallet,
  Plus,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNav } from "@/store/nav";
import { useAuth } from "@/store/auth";
import { NotificationDropdown } from "@/components/shared/notification-dropdown";
import { CreditBadge } from "@/components/shared/credit-badge";
import { useNotifications } from "@/store/notifications";
import { useCredits } from "@/store/credits";
import { cn } from "@/lib/utils";
import type { View } from "@/lib/types";

const NAV_ITEMS: { label: string; view: View }[] = [
  { label: "Accueil", view: "home" },
  { label: "Médicaments", view: "medications" },
  { label: "Pharmacies", view: "pharmacies" },
  { label: "Ordonnance", view: "prescription" },
  { label: "Profil", view: "profile" },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Header() {
  const { view, navigate } = useNav();
  const { user } = useAuth();
  const credits = useCredits((s) => s.credits);
  const { unread, fetch: fetchNotifs, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchNotifs();
    // Refresh notifications every 60s
    const t = setInterval(fetchNotifs, 60000);
    return () => clearInterval(t);
  }, [fetchNotifs]);

  const go = (v: View) => {
    navigate(v);
    setOpen(false);
  };

  const isActive = (item: View) =>
    view === item ||
    (item === "medications" && view === "medication-detail") ||
    (item === "pharmacies" && view === "pharmacy-detail") ||
    (item === "profile" &&
      (view === "favorites" ||
        view === "history" ||
        view === "settings" ||
        view === "notifications"));

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => go("home")}
          className="flex items-center transition-opacity hover:opacity-95"
          aria-label="Accueil SABLIN PHARMA"
        >
          <Logo size={44} />
        </button>

        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.view}
              onClick={() => go(item.view)}
              className={cn(
                "relative rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
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

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {/* Notifications dropdown */}
          <NotificationDropdown />

          {/* Credit balance badge + Recharger (desktop) */}
          <div className="hidden items-center gap-1.5 sm:flex">
            <button onClick={() => go("wallet")}>
              <CreditBadge />
            </button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1 border-brand/30 px-2.5 text-xs font-semibold text-brand-dark hover:bg-brand-light"
              onClick={() => go("wallet")}
            >
              <Plus className="size-3.5" /> Recharger
            </Button>
          </div>

          {/* Account menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 rounded-full border border-border bg-background p-0.5 pr-2 transition-colors hover:border-brand/40"
                  aria-label="Menu du compte"
                >
                  <span
                    className="flex size-8 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: user.avatarColor ?? "#0c7a50" }}
                  >
                    {initials(user.name)}
                  </span>
                  <span className="hidden max-w-[120px] truncate text-sm font-semibold sm:inline">
                    {user.name.split(" ")[0]}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold">{user.name}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {user.email}
                    </span>
                    <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-brand-light px-2 py-0.5 text-[10px] font-bold text-brand-dark">
                      <Coins className="size-3" /> {credits} crédit{credits > 1 ? "s" : ""}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => go("profile")}>
                  <UserIcon className="size-4" /> Mon profil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => go("favorites")}>
                  <Heart className="size-4" /> Mes favoris
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => go("history")}>
                  <Clock className="size-4" /> Historique
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => go("notifications")}>
                  <Bell className="size-4" /> Notifications
                  {unread > 0 && (
                    <span className="ml-auto rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                      {unread}
                    </span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => go("wallet")}>
                  <CreditCard className="size-4" /> Mon portefeuille
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => go("wallet")}>
                  <Coins className="size-4" /> Mon portefeuille
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => go("settings")}>
                  <Settings className="size-4" /> Paramètres
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    const { logout } = useAuth.getState();
                    await logout();
                    go("home");
                  }}
                  className="text-red-600 focus:text-red-700"
                >
                  <LogOut className="size-4" /> Se déconnecter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
            className="lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Ouvrir le menu"
          >
            <Menu className="size-5" />
          </Button>
        </div>
      </div>

      {/* Mobile sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-[300px] sm:w-[360px]">
          <SheetHeader>
            <SheetTitle className="text-left">
              <Logo size={42} />
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6 flex flex-col gap-1">
            {/* Solde crédits + Recharger (mobile) */}
            {user && (
              <div className="mb-2 flex items-center justify-between gap-2 rounded-xl border border-border bg-muted/30 px-4 py-3">
                <button
                  onClick={() => go("wallet")}
                  className="flex items-center gap-2"
                >
                  <CreditBadge />
                </button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1 border-brand/30 px-2.5 text-xs font-semibold text-brand-dark hover:bg-brand-light"
                  onClick={() => go("wallet")}
                >
                  <Plus className="size-3.5" /> Recharger
                </Button>
              </div>
            )}
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
            <button
              onClick={() => go("favorites")}
              className="flex items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium text-foreground/80 hover:bg-accent"
            >
              <span className="flex items-center gap-2">
                <Heart className="size-4" /> Mes favoris
              </span>
              <ChevronRight className="size-4 opacity-50" />
            </button>
            <button
              onClick={() => go("history")}
              className="flex items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium text-foreground/80 hover:bg-accent"
            >
              <span className="flex items-center gap-2">
                <Clock className="size-4" /> Historique
              </span>
              <ChevronRight className="size-4 opacity-50" />
            </button>
            <button
              onClick={() => go("notifications")}
              className="flex items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium text-foreground/80 hover:bg-accent"
            >
              <span className="flex items-center gap-2">
                <Bell className="size-4" /> Notifications
                {unread > 0 && (
                  <span className="rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                    {unread}
                  </span>
                )}
              </span>
              <ChevronRight className="size-4 opacity-50" />
            </button>
            <button
              onClick={() => go("wallet")}
              className="flex items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium text-foreground/80 hover:bg-accent"
            >
              <span className="flex items-center gap-2">
                <Wallet className="size-4" /> Portefeuille
              </span>
              <ChevronRight className="size-4 opacity-50" />
            </button>
            <button
              onClick={() => go("settings")}
              className="flex items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium text-foreground/80 hover:bg-accent"
            >
              <span className="flex items-center gap-2">
                <Settings className="size-4" /> Paramètres
              </span>
              <ChevronRight className="size-4 opacity-50" />
            </button>
            <div className="my-2 h-px bg-border" />
            <button
              onClick={() => go("wallet")}
              className="flex items-center justify-between rounded-xl bg-brand px-4 py-3 text-left text-sm font-semibold text-white"
            >
              <span className="flex items-center gap-2">
                <Coins className="size-4" /> Recharger mes crédits
              </span>
              <ChevronRight className="size-4" />
            </button>
            {unread > 0 && (
              <button
                onClick={() => {
                  markAllRead();
                }}
                className="mt-2 flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground/70 hover:bg-accent"
              >
                <CheckCheck className="size-4" /> Tout marquer comme lu
              </button>
            )}
            {user ? (
              <button
                onClick={async () => {
                  const { logout } = useAuth.getState();
                  await logout();
                  go("home");
                }}
                className="mt-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <LogOut className="size-4" /> Se déconnecter
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
