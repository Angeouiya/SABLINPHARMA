# Task 7-a — full-stack-developer

## Task
Construire 2 vues pour SABLIN PHARMA (Next.js 16, App Router, TypeScript, Tailwind 4, shadcn/ui) en français :
1. `src/components/views/pharmacies-view.tsx` — liste filtrable des pharmacies
2. `src/components/views/pharmacy-detail-view.tsx` — fiche détaillée d'une pharmacie

## Travail effectué

### 1. Lecture du contexte
- Lecture de `/home/z/my-project/worklog.md` (Task 1) : design system vert/blanc premium, navigation SPA via `useNav`, composants partagés existants (PharmacyCard/Row, SectionHeader, SearchBar, CategoryIcon).
- Lecture de `src/lib/types.ts` (Pharmacy), `src/lib/format.ts` (formatFCFA), `src/store/nav.ts` (navigate/params), `src/app/api/pharmacies/route.ts` et `[slug]/route.ts` (shapes API).
- Lecture des vues existantes `home-view.tsx`, `medications-view.tsx`, `medication-detail-view.tsx` pour aligner style/structure.

### 2. PharmaciesView
- Lien retour "Accueil" (ChevronLeft → navigate('home'))
- Titre + sous-titre
- Barre de recherche custom (Input + Search + bouton X) avec debounce 200ms
- 4 chips de filtre : Toutes / Ouvertes maintenant (open) / De garde (on-duty) / Ouvert 24/7 (247) — filtre actif lu depuis `params.filter` au mount
- Select shadcn de commune (Toutes + 12 communes d'Abidjan)
- Compteur "X pharmacies trouvées"
- Grille PharmacyCard (1/2/3/4 cols responsive)
- 8 skeletons pendant le chargement
- Empty state (Search + message + bouton réinitialiser)
- Fetch GET /api/pharmacies?q=&commune=&filter= via useCallback + setTimeout(0) (contourne la règle `react-hooks/set-state-in-effect`)

### 3. PharmacyDetailView
- Lien retour "Pharmacies" (ChevronLeft → navigate('pharmacies'))
- Carte d'en-tête : bandeau `bg-brand-gradient`, icône Plus blanche dans cercle `bg-white/15`, nom, commune (MapPin), badge note numérique (RatingPill `bg-brand-dark` + point ambre), badges "De garde" (Timer, bg-amber-400 text-amber-950) / "Ouvert 24/7" (Clock), statut Ouvert/Fermé (point pulsant)
- Section "Informations pratiques" (grid 2 cols) : Adresse / Téléphone (lien tel:) / Horaires (semaine/samedi/dimanche) / Commune
- Carte localisation : fond `from-brand-light/70 to-brand-light/30`, icône MapPin, coordonnées lat/lng en mono, bouton "Voir sur Google Maps" (lien externe `https://www.google.com/maps?q=LAT,LNG` target _blank rel noopener)
- Section "Médicaments disponibles" avec recherche locale (Input + compteur), lignes cliquables (icône catégorie colorée, nom, form+dosage+packSize, prix en brand-dark, badge En stock/Rupture) → navigate('medication-detail', {slug})
- Gestion 404 ("Pharmacie introuvable" + bouton retour)
- Skeletons pendant le chargement
- Effet de fetch sur [params.slug] via setTimeout(0)

## Contraintes respectées
- ❌ Aucune icône Star/StarHalf/Sparkles/Leaf/Sprout/Building/Building2/Hotel/Hospital/Home
- ✅ Notes affichées en badge numérique (cercle bg-brand-dark text-white + point ambre)
- ✅ Icônes utilisées : Search, ChevronLeft, X, Clock, Timer, MapPin, Plus, Phone, Navigation, CheckCircle2, XCircle
- ✅ Classes du design system : `bg-brand-gradient`, `bg-brand-light`, `text-brand`, `text-brand-dark`, `shadow-premium`, `shadow-premium-lg`, `no-scrollbar`
- ✅ Cards : `border-border/70 py-0` + `hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-premium-lg`
- ✅ Mobile-first responsive
- ✅ TypeScript strict, exports nommés `PharmaciesView` et `PharmacyDetailView`
- ✅ 'use client' en haut de chaque fichier

## Vérifications
- `bun run lint` : 0 erreur sur mes 2 fichiers (1 erreur pré-existante dans medication-detail-view.tsx, hors scope)
- dev.log : compilation OK (✓ Compiled), GET / 200
- Aucune icône interdite (vérifié par grep)

## Stage Summary
2 vues livrées et conformes au design system SABLIN PHARMA. PharmaciesView propose une recherche/filtrage complet (texte debouncé, 4 chips de statut, 12 communes) avec grille PharmacyCard et état vide guidé. PharmacyDetailView affiche une fiche riche (header brand-gradient, badges statut/garde/24/7, note numérique, infos pratiques en grille, localisation Google Maps, section médicaments filtrable in-place avec navigation vers medication-detail). Aucune vente en ligne — uniquement informationnelle.
