# Task ID: 601-a — wallet-view.tsx enrichment (SABLIN PHARMA)

## Agent
subagent (modifications SABLIN PHARMA — wallet-view.tsx)

## Task
Enrichir `src/components/views/wallet-view.tsx` avec 6 nouvelles sections pédagogiques en français :
1. Bloc "Votre portefeuille de crédits" en haut (avant les packs)
2. Section "À quoi servent mes crédits ?" (après les packs, avant les tarifs) — 3 catégories avec CreditCost
3. Section "Ce qui est gratuit" — liste avec badges "Gratuit" verts
4. Section "Ce qui nécessite des crédits" — liste avec coûts
5. Section FAQ "Questions sur les crédits" (à la fin, avant le footer) avec Accordion
6. Historique des transactions amélioré — chaque transaction affiche date, action, coût en crédits, équivalent FCFA, solde avant, solde après, statut

## Files modified
- `src/components/views/wallet-view.tsx` (~685 → ~880 lignes, MultiEdit 5 opérations atomiques)

## Imports ajoutés
- `HelpCircle, Pill, Search` depuis `lucide-react`
- `Accordion, AccordionItem, AccordionTrigger, AccordionContent` depuis `@/components/ui/accordion`

## Architecture finale des sections (ordre top → bottom)
1. HEADER (h1 "Votre portefeuille de crédits")
2. VOTRE PORTEFEUILLE DE CRÉDITS (Card bg-brand-light : solde + valeur approx + badge 1 crédit = 100 FCFA + boutons Recharger/Voir services payants + bloc Pass Ordonnance)
3. MESSAGES PÉDAGOGIQUES (3 InfoNotes conservées)
4. PACKS DE RECHARGE (packsRef, CREDIT_PACKS, 4 cards)
5. **NOUVEAU** — À QUOI SERVENT MES CRÉDITS ? (3 cards : Médicaments/Ordonnance/Pharmacies avec CreditCost + PassBadge)
6. PASS ORDONNANCE (Card bg-amber-50)
7. FONCTIONNALITÉS & TARIFS (tariffsRef, table FREE_FEATURES + PAID_FEATURES)
8. **NOUVEAU** — CE QUI EST GRATUIT (8 items avec badges "Gratuit" verts solides)
9. **NOUVEAU** — CE QUI NÉCESSITE DES CRÉDITS (10 items avec coûts CreditCost + PassBadge + CTA Recharger/Pass)
10. HISTORIQUE DES CRÉDITS (historyRef, transactions enrichies : date/action/coût/FCFA/solde avant/solde après/statut)
11. **NOUVEAU** — FAQ QUESTIONS SUR LES CRÉDITS (Accordion 6 items)
12. ASSISTANCE (Card support)

## Sections supprimées
- "Services de contact pharmacie" (ancien) — redondant avec "Ce qui nécessite des crédits"
- "Services bloqués sans crédits" (ancien) — redondant avec "Ce qui nécessite des crédits"

## Détails techniques
- `FCFA_PER_CREDIT = 100` (déjà défini en haut du fichier)
- `balanceBefore = t.balanceAfter - t.amount` (calcul dérivé car le schéma DB CreditTransaction ne stocke que balanceAfter)
- `fcfaEquiv = Math.abs(t.amount) * FCFA_PER_CREDIT` (équivalent FCFA)
- Statut toujours "Réussie" car les transactions en DB sont créées après succès
- Accordion type="single" collapsible (un seul item ouvert à la fois)

## Contraintes respectées
- ✅ Aucune couleur dégradée (uniquement couleurs pleines : bg-brand, bg-brand-light, bg-amber-50/100/500, bg-success-light, bg-success, bg-muted/30, ou opacités simples)
- ✅ Texte lisible (text-foreground, text-brand-dark, text-amber-900, text-success avec contrastes suffisants)
- ✅ Tout en français
- ✅ Composants existants réutilisés (Card, Button, Badge, Heading, Eyebrow, Muted, CreditCost, PassBadge, Accordion, SectionTitle, InfoNote, EmptyState, Skeleton)
- ✅ Responsive (grid lg:grid-cols-3, sm:grid-cols-2, sm:flex-row)

## Vérifications
- `bun run lint` → 0 erreur, 0 warning (après suppression imports inutilisés MessageCircle/MapPin en 2e passe)
- `dev.log` → compilations réussies (✓ Compiled in 159ms / 173ms / 210ms / 203ms / 365ms / 206ms), toutes routes API 200, aucune runtime error
- Page `/` compile en 114ms puis 57ms
