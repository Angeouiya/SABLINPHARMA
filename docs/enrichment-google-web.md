# Enrichissement images externe SABLIN PHARMA

Le moteur d'images externe est prêt côté serveur, mais il reste contrôlé par variables d'environnement. Sans fournisseur externe disponible, SABLIN PHARMA continue à fonctionner avec le référentiel interne, les images déjà validées et le placeholder officiel.

Google Custom Search JSON API peut retourner `403 PERMISSION_DENIED` sur les nouveaux projets parce que Google a fermé cette API aux nouveaux clients. Pour éviter ce blocage, le moteur SABLIN utilise maintenant une chaîne de fournisseurs :

1. Google Custom Search API si le projet Google est autorisé ;
2. Brave Search API si `BRAVE_SEARCH_API_KEY` est configuré ;
3. Openverse/Wikimedia, utilisable sans clé pour des images à licence ouverte ;
4. fallback interne et placeholder SABLIN PHARMA.

## Activation

Configurer les variables côté serveur uniquement :

```env
IMAGE_SEARCH_PROVIDER=auto
GOOGLE_SEARCH_API_KEY=
GOOGLE_SEARCH_ENGINE_ID=
BRAVE_SEARCH_API_KEY=
OPENVERSE_ENRICHMENT_ENABLED=true
ENABLE_EXTERNAL_ENRICHMENT=true
ENRICHMENT_DAILY_LIMIT=100
ENRICHMENT_CONFIDENCE_THRESHOLD=85
```

La valeur `ENABLE_EXTERNAL_ENRICHMENT` doit être strictement égale à `true`. Toute autre valeur garde le système en mode fallback interne.

`IMAGE_SEARCH_PROVIDER` accepte :

- `auto` : Google si disponible, puis Brave, puis Openverse ;
- `google` : Google uniquement ;
- `brave` : Brave uniquement ;
- `openverse` : Openverse/Wikimedia uniquement ;
- `internal` : fallback interne uniquement.

## Fallback

Ordre utilisé quand Google/Web est désactivé, incomplet ou indisponible :

1. image déjà publiée et validée dans le référentiel SABLIN PHARMA ;
2. image publiée et validée fournie par une pharmacie ;
3. image interne SABLIN PHARMA ;
4. placeholder SABLIN PHARMA ;
5. statut public `Image du produit non disponible`.

Les imports, la marketplace et les plateformes Utilisateur, Pharmacie et Admin ne doivent jamais planter si Google n’est pas configuré.

## Validation des images web

Une image trouvée via Google, Brave ou Openverse reste une candidate Admin avec le statut `À vérifier`. Elle ne peut pas être publiée côté utilisateur tant que la correspondance produit, la licence et l’usage autorisé n’ont pas été validés.

Une image à licence inconnue, à confirmer ou interdite reste bloquée. En cas de doute, utiliser le placeholder SABLIN PHARMA.

## Sécurité des clés

Les clés Google et Brave ne doivent jamais être exposées dans le navigateur, dans les composants React client, dans les logs publics ou dans les réponses API. Les appels externes passent uniquement par les routes serveur et les services sous `src/lib/enrichment`.

Les logs autorisés indiquent seulement l’état opérationnel, par exemple :

- `External enrichment disabled: missing GOOGLE_SEARCH_API_KEY`
- `External enrichment disabled: ENABLE_EXTERNAL_ENRICHMENT is not true`
- `Google enrichment request failed: provider unavailable`
- `Openverse API used for medication image candidates`
- `Fallback placeholder used for medication image`
