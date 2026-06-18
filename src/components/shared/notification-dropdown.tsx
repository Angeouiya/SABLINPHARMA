"use client";

import { useState, useEffect, useRef } from "react";
import {
  Bell,
  CheckCircle2,
  Timer,
  Crown,
  Pill,
  AlertTriangle,
  Info,
  Heart,
  ChevronRight,
  CheckCheck,
  type LucideIcon,
} from "lucide-react";
import { useNotifications } from "@/store/notifications";
import { useNav } from "@/store/nav";
import { cn } from "@/lib/utils";
import type { AppNotification, NotificationType, View } from "@/lib/types";

const ICONS: Record<string, LucideIcon> = {
  Bell,
  CheckCircle2,
  Timer,
  Crown,
  Pill,
  AlertTriangle,
  Info,
  Heart,
};

const TYPE_STYLES: Record<NotificationType, { circle: string }> = {
  info: { circle: "bg-sky-100 text-sky-600" },
  success: { circle: "bg-brand-light text-brand" },
  warning: { circle: "bg-amber-100 text-amber-600" },
  alert: { circle: "bg-red-100 text-red-600" },
  promotion: { circle: "bg-amber-100 text-amber-600" },
};

const LINK_VIEWS: View[] = [
  "home",
  "medications",
  "pharmacies",
  "prescription",
  "subscription",
  "wallet",
  "requests",
  "profile",
  "favorites",
];

export function NotificationDropdown() {
  const { notifications, unread, markAllRead, markRead } = useNotifications();
  const { navigate } = useNav();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleOpen = (n: AppNotification) => {
    if (!n.read) markRead(n.id);
    const view = LINK_VIEWS.includes(n.link as View)
      ? (n.link as View)
      : null;
    setOpen(false);
    if (view) navigate(view);
    else navigate("notifications");
  };

  const recent = notifications.slice(0, 5);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex size-10 items-center justify-center rounded-md text-foreground/70 transition-colors hover:bg-accent hover:text-foreground"
        aria-label={`Notifications${unread > 0 ? ` (${unread} non lues)` : ""}`}
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold leading-4 text-white ring-2 ring-background">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed left-3 right-3 top-16 z-50 w-auto max-w-none overflow-hidden rounded-lg border border-border bg-popover shadow-avance-lg sm:absolute sm:left-auto sm:right-0 sm:top-[calc(100%+8px)] sm:w-96">
          <div className="flex items-center justify-between border-b border-border bg-muted/40 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-foreground">Notifications</h3>
              {unread > 0 && (
                <span className="rounded-md bg-brand px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {unread}
                </span>
              )}
            </div>
            {unread > 0 && (
              <button
                onClick={() => markAllRead()}
                className="flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs font-bold text-brand-dark hover:bg-brand-light"
              >
                <CheckCheck className="size-3.5" /> Lu
              </button>
            )}
          </div>

          {recent.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <span className="flex size-11 items-center justify-center rounded-lg bg-brand-light text-brand">
                <Bell className="size-6" />
              </span>
              <p className="text-sm font-semibold text-foreground">
                Aucune notification
              </p>
              <p className="text-xs text-muted-foreground">
                Vous serez informé des nouveautés et alertes.
              </p>
            </div>
          ) : (
            <ul className="max-h-[360px] divide-y divide-border overflow-y-auto scroll-thin">
              {recent.map((n) => {
                const Icon = ICONS[n.icon] ?? Bell;
                const styles = TYPE_STYLES[n.type] ?? TYPE_STYLES.info;
                return (
                  <li key={n.id}>
                    <button
                      onClick={() => handleOpen(n)}
                      className={cn(
                        "grid w-full grid-cols-[2rem_1fr_auto] items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-accent",
                        !n.read && "bg-brand-light/20"
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-md",
                          styles.circle
                        )}
                      >
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-extrabold text-foreground">
                          {n.title}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {n.message}
                        </p>
                      </div>
                      {!n.read ? (
                        <span className="mt-1 size-2 rounded-full bg-brand" />
                      ) : (
                        <ChevronRight className="mt-0.5 size-4 text-muted-foreground" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <button
            onClick={() => {
              setOpen(false);
              navigate("notifications");
            }}
            className="flex w-full items-center justify-center gap-1 border-t border-border bg-muted/40 px-3 py-2.5 text-sm font-bold text-brand-dark transition-colors hover:bg-brand-light"
          >
            Tout afficher
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
