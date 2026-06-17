# Task 204-a — Vues prescription + payment (crédits & Pass Ordonnance)

## Contexte
Mise à jour de 2 vues SABLIN PHARMA pour intégrer le système de crédits :
- prescription-view.tsx : estimation protégée par 2 crédits (ou gratuite si Pass actif)
- payment-view.tsx : ajout de la recharge de crédits + achat du Pass Ordonnance

## Fichiers modifiés
1. **src/components/views/prescription-view.tsx** (Edit ciblé)
   - Imports : CreditConfirmDialog, CreditCost, useCredits, CREDIT_COSTS
   - State : showCreditDialog
   - useCredits : { hasPass }
   - Bouton "Estimer le coût" → ouvre CreditConfirmDialog (sauf si hasPass → handleEstimate direct)
   - Badge CreditCost (cost=2 ou 0 si hasPass) dans le bouton
   - Message contextuel sous le bouton
   - CreditConfirmDialog ajouté en fin de composant

2. **src/components/views/payment-view.tsx** (Edit ciblé)
   - Imports : useCredits, CREDIT_PACKS, CreditCost, Coins
   - Hook useNav : { navigate, params }
   - Hook useCredits : { recharge, fetch: fetchCredits, hasPass }
   - Type PaymentMode = "premium" | "recharge" | "pass"
   - State mode + selectedPackAmount (initialisés depuis params)
   - useMemo : currentAmount, currentLabel, currentShortLabel
   - Header mode-aware (bg-brand-light, icône dynamique)
   - Section "Que souhaitez-vous payer ?" : 3 cartes cliquables
   - Section "Recharger mes crédits" : 4 packs CREDIT_PACKS
   - Section "Pass Ordonnance" : description + CreditCost cost=0
   - handlePay refactorisé en 3 branches (recharge / pass / premium)
   - Bouton "Payer {currentAmount} FCFA" (mode-aware)
   - Récapitulatif mode-aware
   - Modale succès mode-aware
   - Toutes les classes bg-brand-gradient → bg-brand text-white hover:bg-brand-dark

3. **src/app/api/credits/pass/route.ts** (nouveau fichier)
   - POST : crée PassOrdonnance actif (300 FCFA), enregistre Payment + CreditTransaction
   - Vérifie absence de pass actif
   - Réutilise getSessionUser + db

## API utilisée
- POST /api/credits/recharge (existant) — recharge(amount, provider)
- POST /api/credits/pass (nouveau) — achat Pass Ordonnance
- POST /api/subscription (existant) — abonnement Premium
- useCredits : credits, hasPass, debit, recharge, fetch

## Design system respecté
- Couleurs pleines uniquement (aucun dégradé)
- Classes : bg-brand, bg-brand-light, text-brand, text-brand-dark
- Boutons : bg-brand text-white hover:bg-brand-dark
- Titres : text-foreground
- Texte toujours lisible

## Vérification
- bun run lint : 0 erreur, 0 warning
- TypeScript strict respecté
- Pas de tests écrits
- dev.log surveillé : aucune erreur de compilation
