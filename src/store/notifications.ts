"use client";

import { create } from "zustand";
import type { AppNotification } from "@/lib/types";

interface NotifState {
  notifications: AppNotification[];
  unread: number;
  loading: boolean;
  setNotifications: (items: AppNotification[], unread: number) => void;
  reset: () => void;
  fetch: () => Promise<void>;
  markAllRead: () => Promise<void>;
  markRead: (id: string) => void;
  remove: (id: string) => Promise<void>;
  pushLocal: (n: AppNotification) => void;
}

export const useNotifications = create<NotifState>((set, get) => ({
  notifications: [],
  unread: 0,
  loading: false,
  setNotifications: (items, unread) => set({ notifications: items, unread }),
  reset: () => set({ notifications: [], unread: 0, loading: false }),
  fetch: async () => {
    set({ loading: true });
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        set({ notifications: data.notifications ?? [], unread: data.unread ?? 0 });
      } else {
        get().reset();
      }
    } catch {
      /* noop */
    } finally {
      set({ loading: false });
    }
  },
  markAllRead: async () => {
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
      unread: 0,
    }));
    await fetch("/api/notifications", { method: "PATCH" }).catch(() => {});
  },
  markRead: (id) => {
    set((s) => {
      let decremented = false;
      const notifications = s.notifications.map((n) => {
        if (n.id === id && !n.read) decremented = true;
        return n.id === id ? { ...n, read: true } : n;
      });
      return {
        notifications,
        unread: decremented ? Math.max(0, s.unread - 1) : s.unread,
      };
    });
    fetch(`/api/notifications/${id}`, { method: "PATCH" }).catch(() => {});
  },
  remove: async (id) => {
    set((s) => {
      const target = s.notifications.find((n) => n.id === id);
      return {
        notifications: s.notifications.filter((n) => n.id !== id),
        unread: target && !target.read ? Math.max(0, s.unread - 1) : s.unread,
      };
    });
    await fetch(`/api/notifications/${id}`, { method: "DELETE" }).catch(() => {});
    get().fetch();
  },
  pushLocal: (n) =>
    set((s) => ({
      notifications: [n, ...s.notifications],
      unread: s.unread + 1,
    })),
}));
