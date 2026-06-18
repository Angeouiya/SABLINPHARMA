"use client";

import { useEffect, useState } from "react";
import {
  Menu,
  ChevronRight,
  Bell,
  Heart,
  Clock,
  Settings,
  LogOut,
  User as UserIcon,
  CheckCheck,
  Coins,
  Wallet,
  Plus,
  MessageSquareText,
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
import { LogoutConfirmDialog } from "@/components/shared/logout-confirm-dialog";
import { useNotifications } from "@/store/notifications";
import { useCredits } from "@/store/credits";
import { cn } from "@/lib/utils";
import type { View } from "@/lib/types";

const NAV_ITEMS: { label: string; view: View }[] = [
  { label: "Accueil", view: "home" },
  { label: "Médicaments", view: "medications" },
  { label: "Pharmacies", view: "pharmacies" },
  { label: "Ordonnance", view: "prescription" },
  { label: "Demandes", view: "requests" },
  { label: "Portefeuille", view: "wallet" },
  { label: "Profil", view: "profile" },
];
const AUTH_ONLY_VIEWS: View[] = ["requests", "wallet", "profile"];

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
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const visibleNavItems = user ? NAV_ITEMS : NAV_ITEMS.filter((item) => !AUTH_ONLY_VIEWS.includes(item.view));

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
        view === "notifications" ||
        view === "requests"));

  const confirmLogout = async () => {
    const { logout } = useAuth.getState();
    await logout();
    go("home");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/90">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-3 sm:px-5 lg:px-6">
        <button
          onClick={() => go("home")}
          className="flex items-center transition-opacity hover:opacity-95"
          aria-label="Accueil SABLIN PHARMA"
        >
          <Logo size={44} />
        </button>

        <nav className="ml-3 hidden items-center gap-0.5 xl:flex">
          {visibleNavItems.map((item) => (
            <button
              key={item.view}
              onClick={() => go(item.view)}
              className={cn(
                "relative rounded-md px-3 py-1.5 text-sm font-semibold transition-colors",
                isActive(item.view)
                  ? "bg-brand text-white"
                  : "text-foreground/70 hover:bg-accent hover:text-foreground"
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {/* Notifications dropdown */}
          <NotificationDropdown />

          {/* Credit balance badge + Recharger (desktop) */}
          {user && (
            <div className="hidden items-center gap-1.5 sm:flex">
              <button
                onClick={() => go("wallet")}
                className="whitespace-nowrap rounded-md bg-brand-light px-2.5 py-1 text-xs font-bold text-brand-dark"
              >
                Solde : {credits} crédit{credits > 1 ? "s" : ""}
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

          {/* Account menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 rounded-lg border border-border bg-background p-0.5 pr-2 transition-colors hover:border-brand/40"
                  aria-label="Menu du compte"
                >
                  <span
                    className="flex size-8 items-center justify-center rounded-md text-xs font-bold text-white"
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
                    <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-md bg-brand-light px-2 py-0.5 text-[10px] font-bold text-brand-dark">
                      <Coins className="size-3" /> Solde : {credits} crédit{credits > 1 ? "s" : ""}
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
                <DropdownMenuItem onClick={() => go("requests")}>
                  <MessageSquareText className="size-4" /> Mes demandes
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => go("wallet")}>
                  <Coins className="size-4" /> Mon portefeuille
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => go("settings")}>
                  <Settings className="size-4" /> Paramètres
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => {
                    setLogoutConfirmOpen(true);
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
            className="xl:hidden"
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
          <div className="mt-5 flex flex-col gap-1">
            {/* Solde crédits + Recharger (mobile) */}
            {user && (
              <div className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5">
                <button
                  onClick={() => go("wallet")}
                  className="flex min-w-0 items-center gap-2 text-left"
                >
                  <span className="inline-flex items-center gap-1 rounded-md bg-brand-light px-2 py-1 text-xs font-bold text-brand-dark">
                    <Coins className="size-3.5 shrink-0" />
                    Solde : {credits} crédit{credits > 1 ? "s" : ""}
                  </span>
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
            {visibleNavItems.map((item) => (
              <button
                key={item.view}
                onClick={() => go(item.view)}
                className={cn(
                  "flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors",
                  isActive(item.view)
                    ? "bg-brand text-white"
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
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium text-foreground/80 hover:bg-accent"
            >
              <span className="flex items-center gap-2">
                <Heart className="size-4" /> Mes favoris
              </span>
              <ChevronRight className="size-4 opacity-50" />
            </button>
            <button
              onClick={() => go("history")}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium text-foreground/80 hover:bg-accent"
            >
              <span className="flex items-center gap-2">
                <Clock className="size-4" /> Historique
              </span>
              <ChevronRight className="size-4 opacity-50" />
            </button>
            <button
              onClick={() => go("notifications")}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium text-foreground/80 hover:bg-accent"
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
              onClick={() => go("requests")}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium text-foreground/80 hover:bg-accent"
            >
              <span className="flex items-center gap-2">
                <MessageSquareText className="size-4" /> Mes demandes
              </span>
              <ChevronRight className="size-4 opacity-50" />
            </button>
            <button
              onClick={() => go("wallet")}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium text-foreground/80 hover:bg-accent"
            >
              <span className="flex items-center gap-2">
                <Wallet className="size-4" /> Portefeuille
              </span>
              <ChevronRight className="size-4 opacity-50" />
            </button>
            <button
              onClick={() => go("settings")}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium text-foreground/80 hover:bg-accent"
            >
              <span className="flex items-center gap-2">
                <Settings className="size-4" /> Paramètres
              </span>
              <ChevronRight className="size-4 opacity-50" />
            </button>
            {user && (
              <>
                <div className="my-2 h-px bg-border" />
                <button
                  onClick={() => go("wallet")}
                  className="flex items-center justify-between rounded-lg bg-brand px-3 py-2.5 text-left text-sm font-semibold text-white"
                >
                  <span className="flex items-center gap-2">
                    <Coins className="size-4" /> Recharger mes crédits
                  </span>
                  <ChevronRight className="size-4" />
                </button>
              </>
            )}
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
                onClick={() => setLogoutConfirmOpen(true)}
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

      <LogoutConfirmDialog
        open={logoutConfirmOpen}
        onOpenChange={setLogoutConfirmOpen}
        onConfirm={confirmLogout}
      />
    </header>
  );
}
