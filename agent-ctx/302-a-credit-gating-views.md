# Task 302-a — Credit-gating sur 2 vues (medication-detail + pharmacy-detail)

Agent: 302-a (credit-gating views)

## Contexte
Tu peux consulter le travail des agents précédents dans `/agent-ctx/`. Le worklog partagé est dans `/home/z/my-project/worklog.md`.

## Fichiers modifiés
- `src/components/views/medication-detail-view.tsx`
- `src/components/views/pharmacy-detail-view.tsx`

## Résumé des changements

### FICHIER 1 — medication-detail-view.tsx
- Imports : ajouté `Lock` (lucide-react) ; `useCredits` étendu pour `hasPass`
- States : `showPrescriptionDialog`, `showPricesDialog`, `pricesUnlocked` (reset au changement de médicament)
- Bouton "Ajouter à mon ordonnance" dans les actions, avec `CreditCost cost={1}` (cost=0 si hasPass). hasPass → toast + navigate("prescription") ; sinon ouvre `CreditConfirmDialog` (title="Ajouter à mon ordonnance", cost=1)
- Bannière "Voir les prix détaillés par pharmacie" après déverrouillage pharmacies, avec bouton + `CreditConfirmDialog` (cost=1, onConfirm → setPricesUnlocked(true)). Masquée si hasPass
- `PharmacyMedCard` : nouveau prop `pricesUnlocked`, cellule prix affiche "Masqué" (Lock) si verrouillé
- Badge `CreditCost cost={0}` ("Gratuit") conservé sur les infos générales
- `bg-brand-gradient` → `bg-brand` (couleur pleine, contrainte respectée)

### FICHIER 2 — pharmacy-detail-view.tsx
- Imports : `Coins`, `Lock` (lucide-react) ; `CreditConfirmDialog`, `CreditCost` ; `useCredits, CREDIT_COSTS`
- States : `availabilityUnlocked`, `pricesUnlocked`, `showAvailabilityDialog`, `showPricesDialog`, `showCompareDialog`, `showConfirmDialog` + `hasPass`
- 2 bannières de déverrouillage dans la section médicaments :
  - "Voir la disponibilité" (cost=1, `alertAvailability`) → `CreditConfirmDialog`
  - "Voir les prix" (cost=1, `seePrices`) → `CreditConfirmDialog`
- Liste médicaments : prix et statut masqués (Lock) tant que non déverrouillés / sans hasPass
- Carte "Actions rapides" : 2 nouveaux boutons full-width :
  - "Comparer avec d'autres pharmacies" (cost=1, `comparePharmacies`)
  - "Demander une confirmation" (cost=3, `confirmBeforeVisit`)
- 4 `CreditConfirmDialog` au total
- `bg-brand-gradient` → `bg-brand`

## Contraintes respectées
- AUCUNE couleur dégradée (couleurs pleines uniquement)
- Titres en `text-foreground` / `text-brand-dark`
- Texte toujours lisible
- Tout en français

## Vérifications
- `bun run lint` : 0 erreur, 0 warning
- Dev server : compilation OK (✓ Compiled in 510ms)
