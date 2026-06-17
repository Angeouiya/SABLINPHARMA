# Task 23-b — Vues Paramètres & Résultat d'ordonnance

**Task ID**: 23-b
**Agent**: Agent 23-b (views settings + prescription-result)
**Task**: Construire 2 vues FRANÇAIS pour SABLIN PHARMA (Next.js 16 / App Router / TS / Tailwind 4 / shadcn/ui) : `SettingsView` (paramètres utilisateur) et `PrescriptionResultView` (résultat d'estimation d'ordonnance).

## Contexte lu
- `worklog.md` (Tasks 1, 7-a, 7-c, 7-d, 7-e, 8) : design system vert brand dominant, plateforme 100% informationnelle, navigation SPA via `useNav`, stores `useAuth`/`useFavorites`, composants partagés dans `src/components/shared/`.
- `src/components/views/prescription-view.tsx` : la vue "Estimer mon ordonnance" qui, après clic sur "Estimer le coût", appelle `navigate("prescription-result", { estimateItems: [{slug, quantity}] })`.
- `src/components/views/payment-view.tsx` : style de référence (cards border-border/70 shadow-premium, bg-brand-gradient, sticky top-24, layout 2 colonnes `lg:grid-cols-[1fr_380px]`).
- API :
  - `GET /api/settings` → `{ settings }` (retourne des défauts même non connecté, sinon la ligne `UserSettings` de l'utilisateur).
  - `PATCH /api/settings` body `{ champ: valeur }` → `{ settings }` (whitelist: pushAlerts, dutyAlerts, priceAlerts, promoAlerts, emailRecap, language, theme, defaultCommune).
  - `POST /api/prescription/estimate` body `{ items: [{slug, quantity}] }` → `{ lines, totalMin, totalMax, availablePharmacies }`.
- Types `UserSettings` et `EstimateResult`/`EstimateLine` déjà définis dans `src/lib/types.ts`.

## Work Log
- Lecture du worklog partagé, des vues existantes (prescription-view, payment-view, profile-view), des stores (useNav, useAuth, useFavorites), des composants partagés (EmptyState, Loader, AlertMessage, PaymentSummary, SectionHeader, StatusBadge), des composants shadcn/ui (Switch, Select, Card, Badge, Separator, Label, Button), des routes API `/api/settings` et `/api/prescription/estimate`, et de la config ESLint (toutes les règles strictes désactivées — `exhaustive-deps` off).
- Écriture de `src/components/views/settings-view.tsx` (export nommé `SettingsView`, 'use client') :
  * Back link "Accueil" (ChevronLeft) → `navigate('home')`.
  * Header brand-gradient (Settings size-6 dans span size-11 rounded-2xl) + titre "Paramètres" + sous-titre "Gérez vos préférences et votre compte".
  * Si `!user` → Card avec `EmptyState({ icon: Settings, ... })` + bouton "Se connecter" → `navigate('auth', {authMode:'login'})` + bouton "Retour à l'accueil".
  * Fetch au mount (dans useEffect avec setTimeout(0) pour respecter les bonnes pratiques) → `GET /api/settings` → `setSettings`. State `settings: UserSettings|null`, `saving: string|null` (nom du champ en cours de save).
  * Loader simple pendant que `settings === null`.
  * 4 Cards séparées (chacune avec `CardHeader` icône + `CardTitle`) :
    1. **Notifications** (Bell size-4 dans span size-9 bg-brand-light) : 5 lignes Switch (pushAlerts, dutyAlerts, priceAlerts avec badge "Premium" Crown si `!premium` + Switch désactivée, promoAlerts, emailRecap). Chaque switch fait un PATCH optimiste : update locale immédiate → PATCH → toast succès ou revert + toast erreur. Spinner `Loader2` à côté du switch pendant le save. Encart amber si `premium` rappelant que les alertes prix sont activées.
    2. **Préférences** (Globe) : grid sm:grid-cols-2 avec Select langue (Français / "English (Bientôt)" disabled), Select thème (Clair/Sombre/Automatique), Select commune par défaut ("Aucune" + 12 communes d'Abidjan). Chaque `onValueChange` → `patch(key, value)`. Notes explicatives sous chaque select.
    3. **Confidentialité & sécurité** (Lock) : 3 boutons outline — "Modifier mon mot de passe" (toast "Bientôt disponible"), "Télécharger mes données" (toast "Bientôt disponible"), "Supprimer mon compte" (red, `window.confirm` + toast info décoratif). Encart brand-light ShieldCheck rassurance données.
    4. **Abonnement** (Crown, span bg-gradient amber) : si `premium` → encart "Premium actif" + bouton "Gérer l'abonnement" → `navigate('subscription')`. Sinon → encart amber "Passez à Premium" + bouton "Découvrir Premium" (gradient amber) → `navigate('subscription')`.
  * Bouton "Se déconnecter" (outline red, en bas) → `logout()` + toast + `navigate('home')`.
  * Footer note : "SABLIN PHARMA v1.0 — Plateforme d'information. Aucune vente en ligne."
  * Imports nettoyés (Separator/CardFooter retirés car non utilisés).
- Écriture de `src/components/views/prescription-result-view.tsx` (export nommé `PrescriptionResultView`, 'use client') :
  * Récupère `params.estimateItems` via `useNav`. Si vide → `navigate('prescription')` (effet de redirection dans le useEffect).
  * Au mount : `POST /api/prescription/estimate` avec `{ items }` → `setEstimate(result)`. Effet avec `setTimeout(0)` + flag `cancelled` pour cleanup. Pendant le calcul : `FullLoader` + back link "Ordonnance".
  * Header succès : `CheckCircle2` verte size-8 dans span size-14 rounded-full bg-brand-light ring-8 ring-brand-light/30, titre "Estimation calculée" + sous-titre.
  * Layout 2 colonnes `lg:grid-cols-[1fr_380px]` :
    - **Colonne gauche** — "Détail par médicament" + Badge count. Pour chaque `line` : Card border-border/70 p-5 shadow-premium hover -translate-y-0.5 hover:border-brand/30. Header : span Pill brand-light + nom médicament bold + badge "Ordonnance" amber si `requiresRx` + Badge "x{quantity}" brand-light. Sous-titre form · dosage · packSize. Separator. Grid 2 cols : "Prix unitaire" (min — max formatFCFA) / "Total ligne" (lineMin — lineMax en brand-dark extrabold, aligné à droite). Footer : MapPin brand + "{pharmacyCount} pharmacies en stock".
    - **Colonne droite** (sticky top-24) — Card récap "Récapitulatif de l'ordonnance" : 3 rows (Médicaments / Unités totales / Pharmacies avec tout en stock), Separator, "Fourchette totale estimée" en `text-3xl font-extrabold text-brand-dark` avec tiret séparateur, note "Fourchette basée sur les prix réels en pharmacie". Puis 3 boutons : "Voir les pharmacies dispos" (bg-brand-gradient, MapPin + ChevronRight) → `navigate('pharmacies')`, "Nouvelle estimation" (outline, ChevronLeft) → `navigate('prescription')`, "Partager le résultat" (outline, Share2) → `navigator.share?.()` ou fallback clipboard + toast.
    - **Encart premium** si `!premium` : Card amber gradient Crown "Estimations illimitées avec Premium" + bouton "Découvrir Premium" → `navigate('subscription')`.
  * Footer disclaimer : encart muted AlertTriangle "SABLIN PHARMA est une plateforme d'information. Les prix sont indicatifs et peuvent varier. Aucune vente en ligne."
  * Gestion erreur : si fetch échoue → `AlertMessage variant="error"` + boutons "Retour à l'ordonnance" (brand-gradient) et "Retour à l'accueil" (outline).
- **Icônes strictement autorisées uniquement** : Settings, Bell, Crown, Globe, Lock, ChevronLeft, ChevronRight, Loader2, ShieldCheck, Download, Trash2, CheckCircle2 (settings-view) ; ChevronLeft, ChevronRight, CheckCircle2, Crown, Share2, MapPin, Pill, AlertTriangle (prescription-result-view). AUCUNE étoile (Star/Sparkles), feuille (Leaf/Sprout) ou bâtiment (Building/Hospital/Home). Notes = badges numériques sans étoiles.
- TypeScript strict, exports nommés exacts `SettingsView` et `PrescriptionResultView`, `'use client'` partout, toast via `sonner`, `formatFCFA` utilisé, pas de `z-ai-web-dev-sdk` côté client, pas de tests.
- Vérification `bun run lint` : **exit code 0, 0 erreur, 0 warning** sur tout le projet. Dev server log propre (uniquement des `✓ Compiled` et des `200`).

## Stage Summary
- 2 vues livrées et lint-clean, prêtes pour intégration : `settings-view.tsx` (4 sections Cartes : Notifications avec switches + lock Premium, Préférences avec 3 selects, Confidentialité & sécurité avec 3 boutons, Abonnement avec statut/upsell Premium) et `prescription-result-view.tsx` (header succès CheckCircle2, layout 2 colonnes avec détail par médicament + récap sticky, actions partager/nouvelle estimation/pharmacies, upsell Premium, gestion loading/erreur).
- API consommées correctement : `GET /api/settings`, `PATCH /api/settings` (patch optimiste + revert), `POST /api/prescription/estimate`.
- Stores utilisés : `useNav` (navigate, params.estimateItems), `useAuth` (user, premium, logout).
- Composants shadcn/ui réutilisés : Button, Card (+Header/Title/Content), Badge, Label, Switch, Separator, Select (+Trigger/Value/Content/Item). Composants partagés : EmptyState, Loader/FullLoader, AlertMessage.
- Design system respecté : vert brand dominant (bg-brand-gradient, text-brand, text-brand-dark, bg-brand-light, shadow-premium, shadow-premium-lg), accent amber pour Premium, cartes border-border/70, sticky card sur desktop, responsive mobile-first, back link + header cohérents avec les autres vues.
- Contraintes critiques d'icônes intégralement respectées (aucune étoile/feuille/bâtiment ; notes en badges numériques sans étoiles). Plateforme 100% informationnelle (footer disclaimer, aucune vente).
