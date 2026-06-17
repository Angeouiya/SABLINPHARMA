# Task 501-a — Modifications SABLIN PHARMA (home-view + profile-view)

Agent: subagent (modifications home-view + profile-view, suppression du mode Premium)

## Contexte
Lecture préalable de `/home/z/my-project/worklog.md` (contexte tâches 1 → 503-a).
Le système de crédits SABLIN + Pass Ordonnance est déjà en place (stores/credits.ts, components/shared/credit-cost.tsx, views/wallet-view.tsx, payment-view.tsx). La tâche 503-a a déjà supprimé le mode Premium de payment-view et notifications-view. La présente tâche 501-a étend cette suppression aux vues Home et Profile.

## Fichiers modifiés
1. `src/components/views/home-view.tsx` (699 → 721 lignes)
2. `src/components/views/profile-view.tsx` (983 → 860 lignes)

## Changements home-view.tsx
- Imports : `Crown` supprimé, `Wallet` ajouté, `CreditCost` + `PassBadge` ajoutés depuis `@/components/shared/credit-cost`
- Hero : bouton secondaire "Estimer mon ordonnance" → "Acheter un Pass Ordonnance" (`navigate("payment", { passOrdonnance: true })`)
- Section "Comment fonctionne SABLIN PHARMA ?" :
  - Étape 1 : "Recherchez gratuitement des informations simples."
  - Étape 2 : "Utilisez vos crédits pour débloquer les services avancés."
  - Étape 3 : titre "Rechargez vos crédits", icône Wallet, texte "Rechargez à partir de 200 FCFA ou achetez un Pass Ordonnance à 300 FCFA."
- Section 5 : remplacement complet "ESTIMATION ORDONNANCE + PREMIUM" → "ORDONNANCE AVEC CRÉDITS + CRÉDITS SABLIN"
  - Carte gauche "Ordonnance avec crédits" : liste avec PassBadge + CreditCost (1, 2, 1, 1, 3 crédits), 2 boutons (Recharger mes crédits → wallet ; Acheter un Pass Ordonnance — 300 FCFA → payment?passOrdonnance=true)
  - Carte droite "Crédits SABLIN" : 4 points clés (sans engagement, crédits sur tous services, recharge dès 200 FCFA, Pass à 300 FCFA), 2 boutons identiques

## Changements profile-view.tsx
- Imports : `Crown`, `RotateCcw`, `CreditCard`, `useEffect` supprimés ; `Subscription` retiré du type import
- SETTINGS_MENU : ligne "Gérer mon abonnement" (CreditCard, view subscription) supprimée — il ne reste que "Mon portefeuille" (Wallet, view wallet)
- Hook useAuth : `premium` retiré
- États `subscription` et `loading` supprimés ; `useEffect` (fetch /api/me) supprimé
- `savedPrescriptions` migré vers `useState` avec lazy initializer SSR-safe (résout le lint react-hooks/set-state-in-effect)
- Constant `accountStatus` supprimée ; badge accountStatus remplacé par `<CreditBadge />` + `<PassBadge />` si `hasPass`
- Carte "Mon portefeuille" :
  - Bouton "Recharger" → "Recharger mes crédits"
  - Bouton "Voir les tarifs" remplacé par "Acheter un Pass Ordonnance" (navigate payment?passOrdonnance=true)
  - Message : "Rechargez vos crédits ou achetez un Pass Ordonnance pour débloquer les services avancés."
- Section "ABONNEMENT" (Crown, 500 FCFA/mois, Premium actif, Renouveler, Passer à Premium) ENTIÈREMENT SUPPRIMÉE
- Composant `SubInfo` supprimé (plus utilisé)
- Type composant `SectionTitle` : `icon: typeof Crown` → `icon: typeof Wallet`

## Vérifications
- `bun run lint` → 0 erreur, 0 warning (après correction lazy initializer)
- `dev.log` : toutes les routes API 200, compiles réussies, aucune runtime error
- Contraintes : aucune couleur dégradée (couleurs pleines bg-brand, bg-brand-light, bg-amber-* uniquement) ; aucune mention interdite (Premium, Abonnement, 500 FCFA/mois, Estimation gratuite, Commencer l'estimation, Recommandé, S'abonner, Renouveler) dans le texte utilisateur

## Notes pour les agents suivants
- La classe CSS `shadow-premium` / `shadow-premium-lg` est un utilitaire d'ombre défini dans globals.css — c'est un nom technique, pas le mot "Premium" affiché à l'utilisateur. Il peut être conservé.
- `bg-brand-gradient` est défini en CSS comme couleur solide (`background-color: var(--brand)`) malgré son nom — conforme à la contrainte "couleurs pleines".
- Le store `useAuth` expose toujours `premium` et `setPremium` mais ils ne sont plus utilisés par les vues Home/Profile. Pour nettoyer entièrement, il faudrait modifier `src/store/auth.ts` (hors périmètre de cette tâche).
- L'API `/api/me` retourne toujours `subscription` dans sa réponse, mais les vues Home/Profile ne le consomment plus. Pour nettoyer entièrement, il faudrait modifier `src/app/api/me/route.ts` (hors périmètre).
