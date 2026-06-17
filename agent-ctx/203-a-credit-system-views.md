# Task 203-a — Système de crédits (Home + Medication Detail)

## Résumé
Ajout d'une section pédagogique "Comment fonctionne SABLIN PHARMA ?" sur la home,
et d'un portail crédits (1 crédit) pour déverrouiller la liste des pharmacies sur
la vue détail médicament.

## Fichiers modifiés
1. `src/components/views/home-view.tsx`
2. `src/components/views/medication-detail-view.tsx`

## Détails

### home-view.tsx
- Imports ajoutés : `Coins` (lucide-react), `AlertMessage` (@/components/shared/alert-message),
  `Muted` (@/components/ui/typography).
- Nouvelle section "2.5. COMMENT FONCTIONNE SABLIN PHARMA" insérée entre la section
  confiance (stats) et la section catégories.
- 3 cartes en `sm:grid-cols-3` : Search/Coins/CheckCircle2 dans cercles `bg-brand-light text-brand`,
  titres "1. Recherchez gratuitement" / "2. Utilisez vos crédits" / "3. Gagnez du temps".
- AlertMessage `variant="info"` en bas avec le message pédagogique sur les crédits (200 FCFA, pas d'abonnement).

### medication-detail-view.tsx
- Imports ajoutés : `Coins` (lucide), `CreditConfirmDialog` + `CreditCost` (shared),
  `useCredits, CREDIT_COSTS` (@/store/credits).
- State ajouté : `showCreditDialog`, `pharmaciesUnlocked`, `const { credits } = useCredits()`.
- Reset `setPharmaciesUnlocked(false)` dans le useEffect de fetch (à chaque changement de slug).
- Badge `CreditCost cost={0}` ("Gratuit") ajouté à la ligne de badges des infos générales.
- Badge `CreditCost cost={CREDIT_COSTS.seePharmacies}` ("1 crédit") à côté de l'eyebrow "Disponibilité".
- Portail crédits : si `!pharmaciesUnlocked`, Card avec icône Coins (cercle bg-brand-light text-brand),
  titre "Voir les pharmacies disponibles", texte explicatif, solde courant affiché,
  boutons "Utiliser 1 crédit" (bg-brand text-white → ouvre CreditConfirmDialog) et "Annuler" (→ medications).
- Si `pharmaciesUnlocked` : liste normale (grille PharmacyMedCard + GoogleMap).
- CreditConfirmDialog : title="Voir les pharmacies disponibles", cost=1,
  description="Liste exacte des pharmacies avec ce médicament en stock",
  benefits=[3 items], onConfirm → setPharmaciesUnlocked(true).

## Contraintes respectées
- Aucune couleur dégradée (couleurs pleines uniquement).
- Titres en text-foreground ou text-white (sur fond vert).
- Pas de vert sur vert.
- Classes du design system : bg-brand, bg-brand-light, text-brand, text-brand-dark, shadow-card/premium.
- Boutons : bg-brand text-white hover:bg-brand-dark.
- TypeScript strict, pas de tests.
- Lint : 0 erreur / 0 warning sur les 2 fichiers (vérifié avec `bun run lint`).
- Dev server : ✓ Compiled sans erreur après modifications.
