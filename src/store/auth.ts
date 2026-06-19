"use client";

import { create } from "zustand";
import type { User } from "@/lib/types";

interface AuthState {
  user: User | null;
  avance: boolean;
  loading: boolean;
  sessionChecked: boolean;
  setUser: (user: User | null) => void;
  setPassActive: (active: boolean) => void;
  setavance: (avance: boolean) => void;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  avance: false,
  loading: false,
  sessionChecked: false,
  setUser: (user) =>
    set((state) => ({
      user,
      avance: user ? state.avance : false,
      loading: false,
      sessionChecked: true,
    })),
  setPassActive: (active) => set({ avance: active }),
  setavance: (avance) => set({ avance }),
  logout: async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* noop */
    }
    set({ user: null, avance: false, loading: false, sessionChecked: true });
  },
  fetchMe: async () => {
    set({ loading: true });
    try {
      const res = await fetch("/api/me", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        set({ user: data.user ?? null, avance: !!data.pass, sessionChecked: true });
      } else {
        set({ user: null, avance: false, sessionChecked: true });
      }
    } catch {
      set({ user: null, avance: false, sessionChecked: true });
    } finally {
      set({ loading: false });
    }
  },
}));
