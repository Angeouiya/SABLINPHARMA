# Task 7-d — Auth & Profile Views (SABLIN PHARMA)

## Agent
Agent 7-d (Views Auth/Profile)

## Task
Construire 2 vues client pour SABLIN PHARMA :
- `src/components/views/auth-view.tsx` — Connexion / Inscription (split 2 colonnes)
- `src/components/views/profile-view.tsx` — Profil utilisateur (états connecté / non connecté)

## Work Log
- Lecture du worklog partagé et du design system (vert brand, shadow-premium, classes utilitaires bg-brand-gradient / bg-brand-light / text-brand / text-brand-dark).
- Vérification des stores `useNav` (params.authMode) et `useAuth` (user, premium, setUser, fetchMe, logout), du `Logo`, des helpers `formatDate`, des routes API `/api/auth/login`, `/api/auth/register`, `/api/me`, et des composants shadcn/ui disponibles (Tabs, Select, Switch, Avatar, Separator, Skeleton, Card, Button, Input, Label, Badge).
- **auth-view.tsx** :
  - Layout `grid lg:grid-cols-2` avec `min-h-[calc(100vh-4rem)]`.
  - Panneau gauche `bg-brand-gradient` caché sur mobile, Logo `variant="light"`, titre "Votre santé, simplifiée", liste de 4 bénéfices avec icône `CheckCircle2`, footer localisation.
  - Panneau droit : `Tabs` Connexion/Inscription (default = `params.authMode ?? 'login'`), bouton retour Accueil.
  - Onglet Connexion : email + password (toggle Eye/EyeOff), lien "Mot de passe oublié ?" (toast info), bouton "Se connecter" en `bg-brand-gradient`. Submit → `POST /api/auth/login`, succès → `setUser` + `fetchMe` + `toast.success` + `navigate('home')`, erreur → `toast.error`.
  - Onglet Inscription : name, email, phone optionnel, commune (Select 12 communes d'Abidjan), password + confirm (toggles), bouton "Créer mon compte". Submit → `POST /api/auth/register`, même flow succès/erreur.
  - Validation client : champs requis, email regex, password ≥ 6, confirm = password.
  - États loading via `Loader2` animé, bouton désactivé pendant la requête.
  - Footer "En continuant, vous acceptez nos conditions d'utilisation."
- **profile-view.tsx** :
  - Non connecté : Card centrée avec `CircleUser`, message, boutons "Se connecter" / "Créer un compte" → `navigate('auth', {authMode})`, lien retour Accueil.
  - Connecté : lien retour Accueil, en-tête profil sur fond `bg-brand-gradient` avec Avatar (initiales `bg-white/15 text-white`), nom, email, badge Premium (`Crown` amber) ou "Compte gratuit".
  - Stats : grid 3 colonnes (24 médicaments consultés, 7 ordonnances estimées, 3 pharmacies favorites) avec icônes Pill / ClipboardList / MapPin.
  - "Informations personnelles" : Card avec nom, email, téléphone, commune (composant `InfoRow` réutilisable), bouton "Modifier" (toast info).
  - "Abonnement" : fetch `/api/me` pour `subscription.endDate`. Si premium → "Premium actif" + `Crown` amber + date de fin + bouton "Gérer" → `navigate('subscription')`. Sinon → encart amber "Passez Premium — 500 FCFA/mois" + bouton "Découvrir".
  - "Préférences" : communes favorites en badges (Cocody, Plateau, Marcory) + bouton "+ Ajouter" (toast), 2 Switchs décoratifs (notifications générales, alertes pharmacies de garde) avec toasts.
  - Bouton "Se déconnecter" (outline, `LogOut`, rouge) → `logout()` + `toast.success` + `navigate('home')`, état loading `Loader2`.
  - Logo mark centré en footer de la vue.
- Respect strict des contraintes d'icônes : aucune étoile/feuille/bâtiment. Icônes utilisées : Mail, Lock, User, Phone, Eye, EyeOff, ChevronLeft, ChevronRight, CheckCircle2, Crown, LogOut, MapPin, CircleUser, ShieldCheck, Settings, Pill, ClipboardList, Bell, Loader2.
- TypeScript strict, exports nommés exacts `AuthView` et `ProfileView`, `'use client'`, `sonner` pour les toasts, pas de z-ai-web-dev-sdk côté client, pas de tests.
- `bun run lint` sur les 2 fichiers : 0 erreur / 0 warning (les erreurs restantes du repo sont dans d'autres vues, hors périmètre 7-d).

## Stage Summary
- 2 vues livrées et lint-clean : `auth-view.tsx` (connexion/inscription split 2 colonnes avec panneau brand) et `profile-view.tsx` (états connecté/non connecté, stats, infos personnelles, abonnement, préférences, déconnexion).
- Intégration complète des stores `useNav`/`useAuth` et des routes API existantes (login/register/me/logout).
- Design system respecté : vert brand dominant, `bg-brand-gradient`, `shadow-premium`, cartes `border-border/70`, mobile-first responsive, footer géré globalement.
- Contraintes d'icônes respectées (aucune étoile/feuille/bâtiment ; notes = texte/badges sans étoiles).
- Prêt pour intégration par l'orchestrateur avec les autres vues.
