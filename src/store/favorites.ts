"use client";

import { create } from "zustand";
import type { FavoriteItem, FavoriteKind } from "@/lib/types";

interface FavState {
  favorites: FavoriteItem[];
  loading: boolean;
  setFavorites: (items: FavoriteItem[]) => void;
  reset: () => void;
  fetch: () => Promise<void>;
  toggle: (
    kind: FavoriteKind,
    slug: string,
    label: string,
    meta?: string
  ) => Promise<boolean>;
  isFavorite: (kind: FavoriteKind, slug: string) => boolean;
  remove: (id: string) => Promise<void>;
}

export const useFavorites = create<FavState>((set, get) => ({
  favorites: [],
  loading: false,
  setFavorites: (items) => set({ favorites: items }),
  reset: () => set({ favorites: [], loading: false }),
  fetch: async () => {
    set({ loading: true });
    try {
      const res = await fetch("/api/favorites", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        set({ favorites: data.favorites ?? [] });
      } else {
        get().reset();
      }
    } catch {
      /* noop */
    } finally {
      set({ loading: false });
    }
  },
  toggle: async (kind, slug, label, meta) => {
    const existing = get().favorites.find(
      (f) => f.kind === kind && f.slug === slug
    );
    if (existing) {
      await fetch(
        `/api/favorites?kind=${kind}&slug=${encodeURIComponent(slug)}`,
        { method: "DELETE" }
      ).catch(() => {});
      set((s) => ({
        favorites: s.favorites.filter((f) => f.id !== existing.id),
      }));
      return false;
    }
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, slug, label, meta }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.favorite) {
          set((s) => ({ favorites: [data.favorite, ...s.favorites] }));
        }
      }
    } catch {
      /* noop */
    }
    return true;
  },
  isFavorite: (kind, slug) =>
    get().favorites.some((f) => f.kind === kind && f.slug === slug),
  remove: async (id) => {
    set((s) => ({ favorites: s.favorites.filter((f) => f.id !== id) }));
    await fetch(`/api/favorites/${id}`, { method: "DELETE" }).catch(() => {});
  },
}));
