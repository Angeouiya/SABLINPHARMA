"use client";

import { create } from "zustand";
import type { HistoryItem, HistoryKind } from "@/lib/types";

interface HistoryState {
  history: HistoryItem[];
  loading: boolean;
  setHistory: (items: HistoryItem[]) => void;
  reset: () => void;
  fetch: () => Promise<void>;
  add: (
    kind: HistoryKind,
    label: string,
    slug?: string | null,
    query?: string | null,
    meta?: string | null
  ) => Promise<void>;
  clear: () => Promise<void>;
}

export const useHistory = create<HistoryState>((set, get) => ({
  history: [],
  loading: false,
  setHistory: (items) => set({ history: items }),
  reset: () => set({ history: [], loading: false }),
  fetch: async () => {
    set({ loading: true });
    try {
      const res = await fetch("/api/history", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        set({ history: data.history ?? [] });
      } else {
        get().reset();
      }
    } catch {
      /* noop */
    } finally {
      set({ loading: false });
    }
  },
  add: async (kind, label, slug = null, query = null, meta = null) => {
    // Optimistic local add (dedup by label)
    set((s) => ({
      history: [
        {
          id: `tmp-${Date.now()}`,
          kind,
          label,
          slug,
          query,
          meta,
          createdAt: new Date().toISOString(),
        },
        ...s.history.filter((h) => h.label !== label),
      ].slice(0, 50),
    }));
    try {
      await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, label, slug, query, meta }),
      });
    } catch {
      /* noop */
    }
    get().fetch();
  },
  clear: async () => {
    set({ history: [] });
    await fetch("/api/history", { method: "DELETE" }).catch(() => {});
  },
}));
