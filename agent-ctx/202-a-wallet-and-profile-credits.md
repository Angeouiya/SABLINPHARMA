# Task 202-a — WalletView + Profile (sections crédits)

## Résumé
Création de la vue `Mon portefeuille` (wallet-view.tsx) et enrichissement du
profile-view.tsx avec une section `Mes accès SABLIN PHARMA` et une carte
`Mon portefeuille`. Ajout de l'entrée `wallet` au menu des paramètres.

## Fichiers modifiés
1. `src/lib/types.ts` — extension de `NavParams` (packAmount?, passOrdonnance?)
2. `src/components/views/wallet-view.tsx` — vue complète (écrase le stub)
3. `src/components/views/profile-view.tsx` — 3 ajouts (settings menu, carte
   portefeuille, section accès)

## Détails

### `src/lib/types.ts`
- Ajout de `packAmount?: number` et `passOrdonnance?: boolean` sur `NavParams`
  pour permettre `navigate("payment", { packAmount })` et
  `navigate("payment", { passOrdonnance: true })` sans erreur TypeScript.

### `src/components/views/wallet-view.tsx` (nouvelle vue)
- Export nommé `WalletView`, directive `"use client"`.
- **Layout** : `max-w-4xl`, responsive, padding `py-8`.
- **Header** : Eyebrow "Gestion des crédits", Heading h1 "Mon portefeuille",
  sous-texte "Rechargez vos crédits et gérez vos services avancés."
- **Lien retour** Accueil (ChevronLeft).
- **Carte Solde actuel** (Card `bg-brand-light`) :
  - Grand nombre `text-4xl font-extrabold text-brand-dark`
  - Valeur FCFA estimée `≈ credits × 100 FCFA`
  - Message "Les recherches simples sont gratuites. Les services avancés
    utilisent vos crédits."
  - Boutons "Recharger" (scroll → packs) et "Voir les tarifs" (scroll → tableau)
  - Bloc latéral "Pass Ordonnance" (amber-50) affichant l'état `hasPass`
- **Messages pédagogiques** : grid `sm:grid-cols-3` (CheckCircle2/Zap/Coins)
  - "Aucun abonnement obligatoire"
  - "Vous payez seulement les services avancés"
  - "Rechargez vos crédits quand vous voulez"
- **Packs de recharge** : grille `sm:grid-cols-2 lg:grid-cols-4` des
  `CREDIT_PACKS` (200/2, 500/6 POPULAIRE, 1000/13, 2000/28).
  - Badge "Populaire" `bg-amber-500 text-white` sur le pack 500.
  - Bouton "Recharger" → `navigate("payment", { packAmount: pack.amount })`
- **Pass Ordonnance** : Card `bg-amber-50 border-amber-500/30`, prix 300 FCFA,
  4 avantages (estimation complète, pharmacies disponibles, comparaison simple,
  sauvegarde), bouton "Acheter le Pass — 300 FCFA" →
  `navigate("payment", { passOrdonnance: true })`. Badge "Vous possédez déjà
  le Pass" si `hasPass`.
- **Fonctionnalités & Tarifs** : tableau responsive (min-w-[640px] + scroll-x)
  avec colonnes Fonctionnalité / Description / Type d'accès / Coût.
  - Utilise `FREE_FEATURES` (badge vert "Gratuit" + 0 FCFA) et
    `PAID_FEATURES` (badge "Crédits" + `CreditCost`, ou `PassBadge` + 300 FCFA
    pour l'item `isPass`).
- **Historique des crédits** : liste des `transactions` du store (icône +/-,
  description, type + date, solde après). Skeleton pendant `loading`, EmptyState
  si tableau vide.
- **Bloc assistance** : Card avec bouton "Contacter le support" → settings.
- **SectionTitle** + **InfoNote** helpers internes.
- Imports lucide restreints à la liste autorisée : ChevronLeft, ChevronRight,
  Coins, Wallet, CheckCircle2, Receipt, Zap, Info, ClipboardList, Plus.

### `src/components/views/profile-view.tsx` (modifications)
- **Imports ajoutés** : `Wallet`, `Coins`, `Receipt` (lucide) ;
  `useCredits, FREE_FEATURES, PAID_FEATURES` (@/store/credits) ;
  `CreditBadge` (@/components/shared/credit-badge) ;
  `CreditCost, PassBadge` (@/components/shared/credit-cost) ;
  `formatFCFA` (@/lib/format).
- **SETTINGS_MENU** : nouvelle entrée `{ icon: Wallet, label: "Mon portefeuille",
  view: "wallet" as const }` insérée après "Gérer mon abonnement".
- **Header profil** : `CreditBadge` ajouté à côté du badge de statut du compte
  (flex flex-wrap items-center gap-2).
- **Carte "Mon portefeuille"** (Card `bg-brand-light`) insérée APRÈS la stats
  strip du profil et AVANT le MAIN LAYOUT grid :
  - Solde crédits `text-4xl font-extrabold text-brand-dark`
  - Valeur FCFA estimée `≈ credits × 100 FCFA`
  - Badge "Pass Ordonnance" si `hasPass`
  - Message "Les recherches simples sont gratuites. Les services avancés
    utilisent vos crédits."
  - 3 boutons : "Recharger" (→ wallet), "Voir les tarifs" (→ wallet),
    "Historique" (→ wallet)
- **Section "Mes accès SABLIN PHARMA"** insérée APRÈS la section Abonnement et
  AVANT la section Notifications :
  - `grid sm:grid-cols-2`
  - Bloc 1 "Fonctionnalités gratuites" (Card `border-success/30
    bg-success-light/20`) : icône CheckCircle2 (bg-success text-white), liste
    `FREE_FEATURES` avec coches vertes (CheckCircle2 text-success).
  - Bloc 2 "Fonctionnalités avec crédits" (Card `border-brand/30
    bg-brand-light/20`) : icône Coins (bg-brand text-white), liste
    `PAID_FEATURES` avec `CreditCost` ou `PassBadge` à droite. Bouton "Gérer
    mes crédits" → wallet.
  - Listes en `max-h-72 overflow-y-auto scroll-thin` pour gérer la longueur.

## Contraintes respectées
- Aucune couleur dégradée (couleurs pleines uniquement). `bg-brand-gradient`
  pré-existant conserve sa résolution en couleur solide.
- Titres en `text-foreground` / `text-brand-dark` (pas de vert sur vert).
- Texte toujours lisible sur son fond (amber-900 sur amber-50, brand-dark sur
  brand-light, etc.).
- Icônes lucide restreintes à la liste autorisée : Coins, Wallet, CheckCircle2,
  ClipboardList, ChevronRight, ChevronLeft, Plus, CreditCard, Receipt, Zap,
  Info, AlertCircle, Pill, Timer, Crown, Phone, Headphones, MapPin, Search.
- TypeScript strict, pas de tests, pas de z-ai-web-dev-sdk.
- `bun run lint` : 0 erreur / 0 warning.
- Dev server : ✓ Compiled sans erreur après modifications.
