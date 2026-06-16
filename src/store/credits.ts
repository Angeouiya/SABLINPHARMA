"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CreditTransaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  balanceAfter: number;
  createdAt: string;
}

interface CreditState {
  credits: number;
  hasPass: boolean;
  transactions: CreditTransaction[];
  loading: boolean;
  fetch: () => Promise<void>;
  debit: (amount: number, description: string) => Promise<{ success: boolean; balance?: number; error?: string }>;
  recharge: (amount: number, provider: string) => Promise<{ success: boolean; balance?: number; error?: string }>;
  setCredits: (n: number) => void;
}

export const useCredits = create<CreditState>()(
  persist(
    (set, get) => ({
      credits: 0,
      hasPass: false,
      transactions: [],
      loading: false,
      setCredits: (n) => set({ credits: n }),
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
          set({ credits: data.balance });
          get().fetch();
          return { success: true, balance: data.balance };
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
          set({ credits: data.balance });
          get().fetch();
          return { success: true, balance: data.balance };
        } catch {
          return { success: false, error: "Erreur réseau" };
        }
      },
    }),
    {
      name: "sablin-credits",
      partialize: (s) => ({ credits: s.credits, hasPass: s.hasPass }),
    }
  )
);

// Credit costs for each action
export const CREDIT_COSTS = {
  seePharmacies: 1,
  seePrices: 1,
  estimatePrescription: 2,
  bestPharmacy: 1,
  comparePharmacies: 1,
  alertAvailability: 1,
  confirmBeforeVisit: 3,
} as const;

// Credit packs
export const CREDIT_PACKS = [
  { amount: 200, credits: 2, label: "Pack Découverte", popular: false },
  { amount: 500, credits: 6, label: "Pack Standard", popular: true },
  { amount: 1000, credits: 13, label: "Pack Plus", popular: false },
  { amount: 2000, credits: 28, label: "Pack Famille", popular: false },
] as const;

// Free features list
export const FREE_FEATURES = [
  "Créer un compte et se connecter",
  "Rechercher un médicament",
  "Voir les informations générales d'un médicament",
  "Consulter les catégories de médicaments",
  "Voir les pharmacies proches",
  "Consulter les pharmacies ouvertes",
  "Consulter les pharmacies de garde",
  "Voir les horaires des pharmacies",
  "Voir l'adresse et le téléphone d'une pharmacie",
  "Consulter son profil",
  "Accéder à l'aide et au support",
];

// Paid features list
export const PAID_FEATURES = [
  { label: "Voir les pharmacies qui possèdent un médicament", cost: 1, desc: "Liste exacte des pharmacies avec le médicament en stock" },
  { label: "Voir les prix détaillés par pharmacie", cost: 1, desc: "Prix indicatif précis pour chaque pharmacie" },
  { label: "Estimer une ordonnance complète", cost: 2, desc: "Coût total, médicaments disponibles, pharmacies recommandées" },
  { label: "Trouver la meilleure pharmacie pour une ordonnance", cost: 1, desc: "Pharmacie optimale selon disponibilité et proximité" },
  { label: "Comparer les pharmacies (prix et distance)", cost: 1, desc: "Tableau comparatif détaillé" },
  { label: "Activer une alerte de disponibilité", cost: 1, desc: "Notification quand un médicament est de nouveau disponible" },
  { label: "Demander une confirmation avant déplacement", cost: 3, desc: "Vérification du stock par la pharmacie avant votre déplacement" },
  { label: "Pass Ordonnance (300 FCFA)", cost: 0, desc: "Estimation complète sans crédits, pour usage occasionnel", isPass: true },
];
