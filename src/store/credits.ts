"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  CREDIT_COSTS,
  CREDIT_PACKS,
  FREE_FEATURES,
  PAID_FEATURES,
  type PassStatus,
} from "@/lib/restrictions";

interface CreditTransaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  fcfaEquivalent: number;
  balanceBefore: number;
  balanceAfter: number;
  status: string;
  createdAt: string;
}

interface CreditState {
  credits: number;
  hasPass: boolean;
  passStatus: PassStatus;
  transactions: CreditTransaction[];
  loading: boolean;
  fetch: () => Promise<void>;
  debit: (amount: number, description: string) => Promise<{ success: boolean; balance?: number; error?: string }>;
  recharge: (amount: number, provider: string) => Promise<{ success: boolean; balance?: number; error?: string }>;
  expirePass: () => Promise<{ success: boolean; error?: string }>;
  setCredits: (n: number) => void;
}

export const useCredits = create<CreditState>()(
  persist(
    (set, get) => ({
      credits: 0,
      hasPass: false,
      passStatus: "none",
      transactions: [],
      loading: false,
      setCredits: () => {
        // Le solde est autoritaire côté serveur. Cette méthode reste no-op pour compatibilité.
      },
      fetch: async () => {
        set({ loading: true });
        try {
          const res = await fetch("/api/credits");
          if (res.ok) {
            const data = await res.json();
            set({
              credits: data.credits ?? 0,
              transactions: data.transactions ?? [],
              hasPass: data.hasPass ?? false,
              passStatus: data.passStatus ?? "none",
            });
          }
        } catch {
          /* noop */
        } finally {
          set({ loading: false });
        }
      },
      debit: async (amount, description) => {
        try {
          const res = await fetch("/api/credits/debit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount, description }),
          });
          const data = await res.json();
          if (!res.ok) {
            return { success: false, error: data.error ?? "Erreur" };
          }
          await get().fetch();
          return { success: true, balance: get().credits };
        } catch {
          return { success: false, error: "Erreur réseau" };
        }
      },
      recharge: async (amount, provider) => {
        try {
          const res = await fetch("/api/credits/recharge", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount, provider }),
          });
          const data = await res.json();
          if (!res.ok) {
            return { success: false, error: data.error ?? "Erreur" };
          }
          await get().fetch();
          return { success: true, balance: get().credits };
        } catch {
          return { success: false, error: "Erreur réseau" };
        }
      },
      expirePass: async () => {
        try {
          const res = await fetch("/api/credits/pass/expire", {
            method: "POST",
          });
          const data = await res.json();
          if (!res.ok) {
            return { success: false, error: data.error ?? "Erreur" };
          }
          set({ hasPass: false, passStatus: "expired" });
          get().fetch();
          return { success: true };
        } catch {
          return { success: false, error: "Erreur réseau" };
        }
      },
    }),
    {
      name: "sablin-credits",
      partialize: () => ({}),
    }
  )
);

export { CREDIT_COSTS, CREDIT_PACKS, FREE_FEATURES, PAID_FEATURES };
