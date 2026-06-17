# Task 402-a — Credit-gating contacts pharmacie (téléphone, WhatsApp, conseil, confirmations)

Agent: 402-a (credit-gating pharmacy contact)

## Contexte
Tu peux consulter le travail des agents précédents dans `/agent-ctx/`. Le worklog partagé est dans `/home/z/my-project/worklog.md`.
Références utilisées :
- `src/store/credits.ts` (CREDIT_COSTS : seeContact=1, callPharmacy=1, whatsappPharmacy=1, advicePharmacy=2, confirmAvailability=3, confirmPrice=3, confirmFull=4)
- `src/components/shared/locked-contact.tsx` (LockedContact, type phone/whatsapp/advice/confirm*)
- `src/components/shared/credit-confirm-dialog.tsx` (CreditConfirmDialog)
- `src/components/shared/credit-cost.tsx` (CreditCost)

## Fichiers modifiés
- `src/components/views/pharmacy-detail-view.tsx`
- `src/components/shared/pharmacy-card.tsx`
- `src/components/views/pharmacies-view.tsx`

## Résumé des changements

### FICHIER 1 — pharmacy-detail-view.tsx
- **Imports** : ajouté `MessageCircle`, `Lightbulb` (lucide-react) ; `LockedContact` (shared/locked-contact)
- **States** : `contactUnlocked`, `whatsappUnlocked` (reset au changement de slug) + 5 nouveaux states `showContactDialog`, `showWhatsappDialog`, `showAdviceDialog`, `showConfirmPriceDialog`, `showConfirmFullDialog`
- **Variables dérivées** :
  - `whatsappHref = https://wa.me/${phone sans non-chiffres}`
  - `phoneDisplay = phone sans "+225 "`
  - `contactVisible = contactUnlocked || hasPass`
  - `whatsappVisible = whatsappUnlocked || hasPass`
- **InfoCard Téléphone** : remplacée par Card custom contenant `LockedContact type="phone" cost=1` quand verrouillé, ou numéro + bouton Appeler (tel:) quand débloqué
- **Actions rapides** (modifiées) :
  - Appeler : conditionnel — si `!contactVisible` → bouton "Appeler — 1 crédit" (ouvre showContactDialog) ; si `contactVisible` → lien `tel:`
  - WhatsApp : conditionnel — si `!whatsappVisible` → bouton "WhatsApp — 1 crédit" (ouvre showWhatsappDialog) ; si `whatsappVisible` → lien `wa.me`
  - Demander conseil — 2 crédits (Lightbulb, advicePharmacy) → showAdviceDialog
  - Confirmer disponibilité — 3 crédits (CheckCircle2, confirmAvailability) → showConfirmDialog (renommé depuis "Demander une confirmation" qui utilisait confirmBeforeVisit)
  - Confirmer prix — 3 crédits (Coins, confirmPrice) → showConfirmPriceDialog
  - Confirmation complète — 4 crédits (CheckCircle2, confirmFull) → showConfirmFullDialog
  - Boutons gratuits conservés : Itinéraire, Partager, Favori (col-span-2), Voir médicaments, Comparer
- **9 CreditConfirmDialog** au total avec titres/descriptions/benefits conformes au cahier des charges :
  1. Disponibilité médicaments (alertAvailability, 1)
  2. Prix détaillés (seePrices, 1)
  3. Comparer pharmacies (comparePharmacies, 1)
  4. Confirmer disponibilité (confirmAvailability, 3)
  5. Débloquer le contact pharmacie (seeContact, 1) → setContactUnlocked(true)
  6. Débloquer WhatsApp (whatsappPharmacy, 1) → setWhatsappUnlocked(true)
  7. Demander conseil (advicePharmacy, 2) → toast
  8. Confirmer prix (confirmPrice, 3) → toast
  9. Confirmation complète (confirmFull, 4) → toast
- **hasPass** → tous les contacts/actions sont gratuits (toast direct, pas de dialog)

### FICHIER 2 — pharmacy-card.tsx
- Imports : `Lock`, `Phone` (lucide-react) ; `CreditCost` (shared) ; `Navigation` retiré (inutilisé)
- **PharmacyCard** : bandeau "Contact verrouillé" + "Voir contact — 1 crédit" en bas de la card
- **PharmacyRow** : ligne "Contact verrouillé — 1 crédit" sous l'adresse
- Aucun numéro affiché, aucun lien tel: généré — la carte entière navigue vers pharmacy-detail où le déblocage se fait

### FICHIER 3 — pharmacies-view.tsx
- Imports : `Lock` (lucide-react) ; `CreditCost` (shared)
- **PharmacyResultCard** :
  - Supprimé le lien téléphone `<a href={tel:}>` dans le body
  - Remplacé par un bandeau "Contact verrouillé — Voir contact 1 crédit"
  - Bouton "Appeler" (tel:) remplacé par bouton "Voir contact" qui navigue vers pharmacy-detail
  - Plus aucun `phoneHref` / `tel:` dans la carte
- **OnDutyMiniCard** : ajout d'un mini-badge "Contact — 1 crédit" à côté des badges Ouvert/24-7

## Contraintes respectées
- AUCUNE couleur dégradée (couleurs pleines bg-brand, bg-brand-dark, bg-muted, bg-brand-light, bg-success-light, bg-amber-*)
- Titres en `text-foreground` / `text-brand-dark`
- Texte toujours lisible (`text-muted-foreground` pour secondaire)
- **Aucun numéro de téléphone visible avant déblocage** (remplacé par "Contact verrouillé")
- **Aucun lien tel: ou wa.me généré avant paiement** (uniquement dans branches conditionnelles `contactVisible` / `whatsappVisible`)
- hasPass désactive tous les paywalls (contacts visibles, boutons directs, pas de dialog)
- Tout en français

## Vérifications
- `bun run lint` : 0 erreur, 0 warning
- Dev server : compilation OK, `/api/pharmacies/pharmacie-d-angre` 200 (compile 524ms)
- Pas de tests écrits (conforme aux consignes)
