# SABLIN PHARMA Supabase

Project ref: `umockhnaabuxdmeeyszy`

Ce dossier contient les migrations PostgreSQL/Supabase de production.

## Mise en production

1. Renseigner `DATABASE_URL` avec l'URL PostgreSQL Supabase.
2. Appliquer les migrations :

```bash
npm run db:supabase:push:url -- "$DATABASE_URL"
```

ou avec un projet Supabase lié :

```bash
npx supabase link --project-ref umockhnaabuxdmeeyszy
npm run db:supabase:push
```

Si la CLI Supabase n'est pas connectee, renseigner `DATABASE_URL` ou
`SUPABASE_DB_PASSWORD`, puis lancer :

```bash
npm run db:supabase:apply
```

Pour appliquer les migrations et initialiser les donnees MVP :

```bash
npm run db:supabase:apply:seed
```

3. Initialiser les données MVP :

```bash
npm run db:seed
```

4. Mettre `DATABASE_URL` dans Vercel en production, preview et development.

Les tables publiques ont RLS activé. L'application accède aux données uniquement côté serveur via Prisma.
