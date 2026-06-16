# Task 7-c — Vue Ordonnance (PrescriptionView)

## Agent
Agent 7-c — Vue Prescription

## Task
Construire la vue « Estimer mon ordonnance » (estimation du coût d'une ordonnance) pour SABLIN PHARMA. Vue 100% informationnelle (aucune vente).

## Work Log
- Lecture du worklog.md, types.ts, format.ts, stores nav/auth, category-icons.tsx, vue medications-view (référence), routes API /api/medications et /api/prescription/estimate.
- Création de `src/components/views/prescription-view.tsx` (export nommé `PrescriptionView`, 'use client').
- Architecture en 2 colonnes `lg:grid-cols-[1fr_380px]` :
  - **Colonne gauche** : barre de recherche avec autocomplétion (debounce 250ms, GET /api/medications?q=&limit=8), dropdown de suggestions cliquables (icône catégorie colorée, badge Rx si requiresRx, prix moyen + nb pharmacies), liste des médicaments ajoutés (Card avec icône catégorie, nom, form/dosage/packSize, badge "Ordonnance" amber si requiresRx, stepper quantité min 1, prix moyen + nb pharmacies, bouton "Retirer" Trash2), empty state avec ClipboardList dans cercle brand-light.
  - **Colonne droite sticky top-24** : Card résumé (nb médicaments + total unités + coût moyen estimé) + bouton "Estimer le coût" (bg-brand-gradient) → POST /api/prescription/estimate. Pendant le calcul : spinner Loader2 + skeletons. Après estimation : encart total fourchette min-max, encart nb pharmacies ayant tout en stock, liste détaillée des lignes (nom, qté, prix unit min-max, total ligne, nb pharmacies en stock). Si non-premium : encart amber "Passez Premium" avec Crown listant les avantages + bouton navigate('subscription').
- Footer d'information : "SABLIN PHARMA est une plateforme d'information. Les prix sont indicatifs. Aucune vente en ligne."
- Gestion d'erreurs via toast sonner (recherche, ajout doublon, estimation, vidage liste).
- Lien retour "Accueil" (ChevronLeft) → navigate('home').
- Icônes utilisées : uniquement autorisées (ClipboardList, Plus, Minus, Search, Trash2, CheckCircle2, ChevronRight, Crown, ShieldAlert, Pill, MapPin, X, Loader2, Calculator, TrendingDown, ChevronLeft). AUCUNE étoile/feuille/bâtiment.
- TypeScript strict, pas de tests, pas de z-ai-web-dev-sdk côté client.

## Stage Summary
- Vue PrescriptionView complète, conforme au design system (vert brand dominant, cartes border-border/70, hover -translate-y-0.5 hover:border-brand/30, shadow-premium, scroll-thin, mobile-first responsive).
- API consommées : GET /api/medications (autocomplétion), POST /api/prescription/estimate (estimation).
- Stores utilisés : useNav (navigate), useAuth (premium pour upsell).
- Composants shadcn/ui utilisés : Button, Card, Badge, Input, Skeleton, Separator.
- Aucune erreur/warning lint introduite sur ce fichier (vérifié avec `bun run lint`).
- Contraintes critiques respectées : aucune icône interdite (Star/Leaf/Building), notes en badges numériques sans étoiles, plateforme 100% informationnelle, export nommé exactement `PrescriptionView`.
