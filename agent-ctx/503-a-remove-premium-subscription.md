# Task ID: 503-a — Suppression du mode Premium (SABLIN PHARMA)

Agent: subagent
Date: 2026-06-17

## Mission
Modifier 3 fichiers pour supprimer le mode "Premium" (500 FCFA/mois) et toute mention d'abonnement/premium/subscription, en gardant uniquement "Recharger mes crédits" (packs 200/500/1000/2000) et "Pass Ordonnance" (300 FCFA). Tout en FRANÇAIS, couleurs pleines (pas de dégradés).

## Fichiers modifiés

### 1. `src/components/views/payment-view.tsx`
- Supprimé imports inutilisés (`Crown`, `ChevronRight`, `Clock`, `useEffect`)
- Supprimé constante `PRICE = 500`
- `PaymentMode` réduit à `"recharge" | "pass"`
- `useAuth` : retiré `premium, setPremium, fetchMe`
- `handlePay` : supprimé la branche `else` qui appelait `POST /api/subscription`
- Titre header : fixe "Paiement"
- Sélecteur de mode : 2 cartes (Pass + Recharge) au lieu de 3 (plus de carte "Abonnement Premium")
- Description Pass : "sans recharger vos crédits" (au lieu de "sans souscrire à l'abonnement Premium")
- Récapitulatif sticky, modale succès, boutons retour : tous pointent vers `wallet`
- `PAYMENT_HISTORY` : 4 lignes "Premium mensuel" → lignes crédits/Pass

### 2. `src/app/api/notifications/route.ts`
- Supprimé 4 notifications abonnement : "Abonnement bientôt expiré", "Abonnement activé", "Paiement réussi (Abonnement renouvelé)", "Paiement échoué"
- Ajouté 6 notifications crédits :
  * "Recharge réussie" (success, link wallet, CheckCircle2)
  * "Crédits utilisés" (info, link wallet, Coins)
  * "Solde faible" (warning, link wallet, AlertTriangle)
  * "Pass Ordonnance activé" (success, link wallet, Receipt)
  * "Contact pharmacie débloqué" (success, link pharmacies, CheckCircle2)
  * "Estimation ordonnance débloquée" (success, link prescription, CheckCircle2)
- Conservé 8 notifications non-abonnement (médicament, stock, rupture, garde, ordonnance estimée, ordonnance enregistrée, pharmacie favorite, support)

### 3. `src/components/views/notifications-view.tsx`
- Imports lucide : `Crown` → `Coins` + `Receipt`
- Map `ICONS` : `Crown` → `Coins` + `Receipt`
- `FilterKey` : `"subscription"` → `"credits"`
- `FILTERS` : ligne "Abonnement" (Crown) → "Crédits" (Coins)
- `categorizeNotification` : `abonnement|premium` → `crédit|recharge|pass|solde` ; ajouté "estimation"
- `LINK_VIEWS` : `"subscription"` → `"wallet"`
- `getAction` : cas "credits" → "Recharger mes crédits" (view wallet) ; cas "payment" → "Voir le portefeuille" (view wallet)
- `counts` : clé `subscription` → `credits`
- EmptyState : "offres Premium" → "l'état de vos crédits"
- Muted header : "abonnement, paiements" → "crédits, paiements"

## Vérifications
- `bun run lint` : 0 erreur, 0 warning
- `dev.log` : toutes routes API répondent 200, aucune runtime error

## Contraintes respectées
- Aucune couleur dégradée (couleurs pleines)
- Aucune mention utilisateur "Premium"/"Abonnement"/"500 FCFA/mois"/"S'abonner"/"Renouveler"/"subscription"
- Reste uniquement la classe CSS `shadow-premium` (utilitaire d'ombre dans globals.css, indépendant du concept d'abonnement) — utilisé dans toute la codebase, renommer dépassait le périmètre de cette tâche

## Worklog partagé
Section ajoutée à `/home/z/my-project/worklog.md` avec Task ID: 503-a
