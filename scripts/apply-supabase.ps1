param(
  [switch]$Seed
)

$ErrorActionPreference = "Stop"

$projectRef = "pztpdigzgukntmvfsqmt"

if ($env:DATABASE_URL) {
  $databaseUrl = $env:DATABASE_URL
} elseif ($env:SUPABASE_DB_PASSWORD) {
  $encodedPassword = [System.Uri]::EscapeDataString($env:SUPABASE_DB_PASSWORD)
  $databaseUrl = "postgresql://postgres:${encodedPassword}@db.${projectRef}.supabase.co:5432/postgres?sslmode=require"
} else {
  throw "Set DATABASE_URL or SUPABASE_DB_PASSWORD before running this script."
}

npx supabase db push --include-all --db-url $databaseUrl --yes

if ($Seed) {
  $env:DATABASE_URL = $databaseUrl
  npm run db:seed
}
