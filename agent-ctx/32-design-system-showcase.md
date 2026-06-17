# Task 32 — Design System Showcase View

## Agent
Agent 32 (Design System Showcase View)

## Task
Construire la page "Design System Showcase" de SABLIN PHARMA — une documentation vivante de l'identité visuelle et des composants réutilisables, en FRANÇAIS. Page Next.js 16 App Router, TypeScript strict, Tailwind 4, shadcn/ui. Export nommé exact `DesignSystemView` dans `src/components/views/design-system-view.tsx`.

## Contexte consulté
- `/home/z/my-project/worklog.md` (tasks 1, 7-a, 7-c, 7-d, 7-e, 8, 9, 23-a, 23-b) : design system vert brand premium, contraintes d'icônes (pas d'étoile/feuille/bâtiment), stores useNav, composants partagés.
- Composants UI : `typography.tsx`, `button.tsx`, `card.tsx`, `badge.tsx`, `input.tsx`, `label.tsx`, `switch.tsx`, `checkbox.tsx`, `skeleton.tsx`, `separator.tsx`, `select.tsx`, `table.tsx`.
- Composants partagés : `logo.tsx`, `status-badge.tsx`, `stat-block.tsx`, `alert-message.tsx`, `empty-state.tsx`, `loader.tsx`, `section-header.tsx`, `payment-summary.tsx`, `medication-card.tsx`, `pharmacy-card.tsx`, `favorite-button.tsx`.
- `globals.css` : variables oklch, classes utilitaires premium (bg-brand-gradient, bg-brand-soft, bg-dotted, shadow-premium, animate-pulse-ring, glass-card).
- `lib/types.ts` : types Medication/Pharmacy/MedicationStatus pour les données fictives.
- `store/nav.ts` : useNav pour le lien retour Accueil.

## Fichier livré
`/home/z/my-project/src/components/views/design-system-view.tsx`

## Work Log
- Lecture complète du worklog et de tous les composants cibles.
- Écriture du fichier showcase (≈ 950 lignes) avec structure complète :
  1. **Hero** : bandeau `bg-brand-gradient` + `bg-dotted-white` overlay, Logo variant light size 56, Eyebrow, titre h1 "Design System", sous-titre, bouton retour Accueil (ChevronLeft → navigate('home')), badge "Version v1.0" avec icône LayoutGrid.
  2. **Layout 2 colonnes** (lg:flex) : aside w-56 sticky top-24 caché mobile avec sommaire cliquable (11 ancres) + bloc "Composants réutilisables" (Zap) ; main flex-1 space-y-12.
  3. **Couleurs** : Palette principale (6 swatches avec oklch), Statuts (10 swatches success/warning/danger/info/neutral + light), Dégradés (bg-brand-gradient, bg-brand-soft, bg-dotted).
  4. **Typographie** : Heading h1/h2/h3/h4 "Santé pour tous", Eyebrow, Text xs/sm/md/lg, Muted, Price sm/md/lg/xl + variantes + `from`, PriceRange 100 — 150 FCFA.
  5. **Boutons** : 9 variantes, 4 tailles (sm/default/lg/icon), 6 boutons avec icônes (Search/Eye/Crown/ClipboardList/Phone/Navigation), états normal + disabled.
  6. **Badges** : MedicationStatusBadge x4, PharmacyStatusBadge x3 + Open247Badge, Badge shadcn x4.
  7. **Cartes** : MedicationCard x2 (Paracétamol sans Rx, Amoxicilline avec Rx), PharmacyCard x2 (Riviera on-duty open, Plateau closed), Card shadcn basique.
  8. **Statistiques** : StatGrid principale 4 blocs (12/33+/24/7/Abidjan), StatGrid tonalités 4 blocs (TrendingUp/TrendingDown/Bell/Crown avec trends).
  9. **Alertes** : 4 AlertMessage (info/success/warning/error) avec titres et textes réalistes.
  10. **États** : EmptyState "Aucun résultat" (Search), 3 Loader (sm/md/lg), boutons avec ButtonLoader, FullLoader dans conteneur réduit, 3 Skeleton cards.
  11. **Abonnement Premium** : Card premium bg-brand-gradient avec Crown, prix 500 FCFA/mois, 5 avantages (CheckCircle2), boutons S'abonner + En savoir plus.
  12. **Tableau** : Table shadcn 5 lignes fictives (Médicament/Dosage/Prix/Pharmacies/Statut) avec MedicationStatusBadge.
  13. **Formulaire** : Card avec Input email + téléphone, Select commune, Switch notifications, Checkbox conditions, boutons Envoyer (Lock) + Réinitialiser.
  14. **Footer showcase** : note version + badge "Documentation vivante" avec point pulse.

## Composants réutilisés (zéro duplication)
Logo, Heading, Eyebrow, Text, Muted, Price, PriceRange, Button, Card (+Header/Title/Description/Content), Badge, Input, Label, Switch, Checkbox, Skeleton, Separator, Select (+Trigger/Value/Content/Item), Table (+Header/Body/Row/Head/Cell), MedicationStatusBadge, PharmacyStatusBadge, Open247Badge, StatBlock, StatGrid, AlertMessage, EmptyState, Loader, FullLoader, ButtonLoader, MedicationCard, PharmacyCard.

## Contraintes respectées
- Icônes : uniquement autorisées (Search, Pill, Plus, MapPin, Timer, Crown, Bell, CheckCircle2, Phone, Navigation, ClipboardList, ChevronRight, ChevronLeft, Mail, Lock, Zap, TrendingUp, TrendingDown, Globe, LayoutGrid, Eye). Aucune étoile/feuille/bâtiment. Notes en badges numériques sans étoiles.
- TypeScript strict, export nommé exact `DesignSystemView`, `'use client'`, données fictives locales (pas de fetch API), pas de z-ai-web-dev-sdk côté client, pas de tests.
- Design system : vert brand dominant, classes premium, cartes border-border/70 hover, responsive mobile-first.

## Vérifications
- `bun run lint` : exit 0, 0 erreur, 0 warning.
- Agent Browser (desktop 1440x900 + mobile 390x844) via hash temporaire : hero OK, sidebar sticky OK, 11 sections affichées sans débordement, footer OK. Screenshots VLM analysés.
- Ajustement post-VLM : raccourcissement labels StatBlock pour éviter troncature.
- Revert du hack temporaire page.tsx après tests.

## Stage Summary
Vue showcase premium livrée, lint-clean, démontrant 25+ composants réutilisables du design system SABLIN PHARMA. Documentation vivante élégante avec navigation latérale sticky, hero bg-brand-gradient, 11 sections organisées en Cards, footer de version. Contraintes d'icônes intégralement respectées. Layout responsive mobile-first vérifié sur desktop et mobile.
