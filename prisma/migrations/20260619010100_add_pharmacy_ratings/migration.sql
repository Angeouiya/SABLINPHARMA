ALTER TABLE "Pharmacy" ADD COLUMN IF NOT EXISTS "ratingCount" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "PharmacyRating" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "pharmacyId" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "source" TEXT NOT NULL DEFAULT 'Utilisateur',
  "status" TEXT NOT NULL DEFAULT 'Publiée',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PharmacyRating_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PharmacyRating_userId_pharmacyId_key" ON "PharmacyRating"("userId", "pharmacyId");
CREATE INDEX IF NOT EXISTS "PharmacyRating_pharmacyId_idx" ON "PharmacyRating"("pharmacyId");
CREATE INDEX IF NOT EXISTS "PharmacyRating_userId_idx" ON "PharmacyRating"("userId");
CREATE INDEX IF NOT EXISTS "PharmacyRating_status_idx" ON "PharmacyRating"("status");
CREATE INDEX IF NOT EXISTS "PharmacyRating_createdAt_idx" ON "PharmacyRating"("createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PharmacyRating_userId_fkey'
  ) THEN
    ALTER TABLE "PharmacyRating"
      ADD CONSTRAINT "PharmacyRating_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PharmacyRating_pharmacyId_fkey'
  ) THEN
    ALTER TABLE "PharmacyRating"
      ADD CONSTRAINT "PharmacyRating_pharmacyId_fkey"
      FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
