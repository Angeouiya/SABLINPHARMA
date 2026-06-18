# SABLIN PHARMA Supabase

Ce dossier contient les migrations PostgreSQL/Supabase de production.

## Mise en production

1. Renseigner `DATABASE_URL` avec l'URL PostgreSQL Supabase.
2. Appliquer les migrations :

```bash
npm run db:supabase:push:url -- "$DATABASE_URL"
```

ou avec un projet Supabase lié :

```bash
npx supabase link --project-ref <PROJECT_REF>
npm run db:supabase:push
```

3. Initialiser les données MVP :

```bash
npm run db:seed
```

4. Mettre `DATABASE_URL` dans Vercel en production, preview et development.

Les tables publiques ont RLS activé. L'application accède aux données uniquement côté serveur via Prisma.
