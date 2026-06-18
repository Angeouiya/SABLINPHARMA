"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/lib/types";

interface AuthState {
  user: User | null;
  avance: boolean;
  setUser: (user: User | null) => void;
  setPassActive: (active: boolean) => void;
  setavance: (avance: boolean) => void;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      avance: false,
      setUser: (user) => set({ user }),
      setPassActive: (active) => set({ avance: active }),
      setavance: (avance) => set({ avance }),
      logout: async () => {
        try {
          await fetch("/api/auth/logout", { method: "POST" });
        } catch {
          /* noop */
        }
        set({ user: null, avance: false });
      },
      fetchMe: async () => {
        try {
          const res = await fetch("/api/me");
          if (res.ok) {
            const data = await res.json();
            set({ user: data.user, avance: !!data.pass });
          } else {
            set({ user: null, avance: false });
          }
        } catch {
          /* noop */
        }
      },
    }),
    {
      name: "sablin-auth",
      partialize: (s) => ({ user: s.user, avance: s.avance }),
    }
  )
);
