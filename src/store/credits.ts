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
  // Contact pharmacy features
  seeContact: 1,
  callPharmacy: 1,
  whatsappPharmacy: 1,
  advicePharmacy: 2,
  confirmAvailability: 3,
  confirmPrice: 3,
  confirmFull: 4,
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
  "Voir les horaires généraux des pharmacies",
  "Voir le nom, la commune et le quartier d'une pharmacie",
  "Consulter son profil",
  "Accéder à l'aide et au support",
];

// Paid features list
export const PAID_FEATURES = [
  { label: "Voir les pharmacies qui possèdent un médicament", cost: 1, desc: "Liste exacte des pharmacies avec le médicament en stock" },
  { label: "Voir les prix détaillés par pharmacie", cost: 1, desc: "Prix indicatif précis pour chaque pharmacie" },
  { label: "Voir le contact (téléphone) d'une pharmacie", cost: 1, desc: "Numéro de téléphone complet de la pharmacie" },
  { label: "Appeler une pharmacie", cost: 1, desc: "Débloquer le bouton d'appel direct" },
  { label: "Contacter une pharmacie via WhatsApp", cost: 1, desc: "Débloquer le contact WhatsApp" },
  { label: "Demander conseil à une pharmacie", cost: 2, desc: "Envoyer une demande de conseil à la pharmacie" },
  { label: "Demander une confirmation de disponibilité", cost: 3, desc: "Confirmer le stock avant déplacement" },
  { label: "Demander une confirmation de prix", cost: 3, desc: "Confirmer le prix avant déplacement" },
  { label: "Confirmation complète (médicament + prix + dispo)", cost: 4, desc: "Vérification complète avant déplacement" },
  { label: "Estimer une ordonnance complète", cost: 2, desc: "Coût total, médicaments disponibles, pharmacies recommandées" },
  { label: "Ajouter un médicament à une ordonnance", cost: 1, desc: "Ajouter un produit à votre ordonnance" },
  { label: "Trouver la meilleure pharmacie pour une ordonnance", cost: 1, desc: "Pharmacie optimale selon disponibilité et proximité" },
  { label: "Comparer les pharmacies (prix et distance)", cost: 1, desc: "Tableau comparatif détaillé" },
  { label: "Activer une alerte de disponibilité", cost: 1, desc: "Notification quand un médicament est de nouveau disponible" },
  { label: "Pass Ordonnance (500 FCFA)", cost: 0, desc: "Valable pour une seule ordonnance. Expire après utilisation.", isPass: true },
];
