# Activation Google/Web pour SABLIN PHARMA

Ce document sert de checklist pour activer le moteur de recherche d'images Google/Web côté serveur.

## Pages ouvertes dans Edge

- Google Cloud API Library : `https://console.cloud.google.com/apis/library/customsearch.googleapis.com`
- Google Cloud Credentials : `https://console.cloud.google.com/apis/credentials`
- Google Programmable Search Engine : `https://programmablesearchengine.google.com/controlpanel/all`
- Vercel Environment Variables : `https://vercel.com/ouiya-tech/sablin-pharma/settings/environment-variables`
- Supabase Functions Secrets : `https://supabase.com/dashboard/project/pztpdigzgukntmvfsqmt/settings/functions`

## Valeurs nécessaires

Il faut récupérer exactement deux valeurs Google :

- `GOOGLE_SEARCH_API_KEY` : clé API serveur créée dans Google Cloud.
- `GOOGLE_SEARCH_ENGINE_ID` : identifiant du moteur Programmable Search Engine.

Puis activer :

- `ENABLE_EXTERNAL_ENRICHMENT=true`

Note : selon la documentation Google actuelle, le moteur a besoin d'un Programmable Search Engine et d'une API key. Google indique aussi que Custom Search JSON API peut ne plus être disponible pour certains nouveaux clients. Si ton compte Google Cloud retourne `403 PERMISSION_DENIED`, SABLIN PHARMA bascule vers Openverse/Wikimedia ou Brave Search si une clé Brave est configurée.

## Règles de sécurité

- Ne jamais mettre ces clés dans un fichier `.env` commité.
- Ne jamais mettre ces clés dans une variable `NEXT_PUBLIC_`.
- Ne jamais afficher les clés dans le navigateur ou dans les logs.
- Les images Google/Web restent en validation Admin avant publication.

## Commandes de configuration quand les clés sont disponibles

Remplacer les valeurs par les vraies clés, sans guillemets publics ni capture d'ecran.

### Vercel production

```powershell
"VRAIE_CLE_GOOGLE" | npx --yes vercel@latest env add GOOGLE_SEARCH_API_KEY production
"VRAI_SEARCH_ENGINE_ID" | npx --yes vercel@latest env add GOOGLE_SEARCH_ENGINE_ID production
"true" | npx --yes vercel@latest env update ENABLE_EXTERNAL_ENRICHMENT production
```

Si une variable existe déjà, utiliser `vercel env update` au lieu de `vercel env add`.

### Supabase secrets

```powershell
npx --yes supabase@latest secrets set GOOGLE_SEARCH_API_KEY="VRAIE_CLE_GOOGLE" GOOGLE_SEARCH_ENGINE_ID="VRAI_SEARCH_ENGINE_ID" ENABLE_EXTERNAL_ENRICHMENT="true" --project-ref pztpdigzgukntmvfsqmt
```

## Alternative quand Google est bloque

Openverse/Wikimedia est maintenant intégré comme fournisseur autorisé sans clé API. Pour l'utiliser en production :

```powershell
npx --yes vercel@latest env add IMAGE_SEARCH_PROVIDER production --value "auto" --yes --sensitive
npx --yes vercel@latest env add OPENVERSE_ENRICHMENT_ENABLED production --value "true" --yes --sensitive
npx --yes vercel@latest env update ENABLE_EXTERNAL_ENRICHMENT production --value "true" --yes --sensitive
npx --yes supabase@latest secrets set IMAGE_SEARCH_PROVIDER="auto" OPENVERSE_ENRICHMENT_ENABLED="true" ENABLE_EXTERNAL_ENRICHMENT="true" --project-ref pztpdigzgukntmvfsqmt
```

Brave Search peut être ajouté plus tard avec :

```powershell
npx --yes vercel@latest env add BRAVE_SEARCH_API_KEY production --value "VRAIE_CLE_BRAVE" --yes --sensitive
npx --yes supabase@latest secrets set BRAVE_SEARCH_API_KEY="VRAIE_CLE_BRAVE" --project-ref pztpdigzgukntmvfsqmt
```

## Test après activation

1. Redéployer Vercel en production.
2. Ouvrir `/admin/enrichissement-medicaments`.
3. Cliquer sur `Tester la configuration`.
4. Vérifier que l'etat indique la chaîne active : Google, Brave ou Openverse.
5. Lancer un enrichissement sur un médicament sans image.
6. Vérifier que les images candidates restent en statut `À vérifier` avant validation admin.

## Mode fallback si Google n'est pas prêt

Tant que les clés ne sont pas configurées, le système reste fonctionnel avec :

1. image déjà validée dans le référentiel SABLIN PHARMA ;
2. image validée fournie par une pharmacie ;
3. image interne SABLIN PHARMA ;
4. placeholder SABLIN PHARMA.
