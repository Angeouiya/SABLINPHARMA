-- Add temporary paid feature access records for user-side credit gates.
-- This table stores only authorizations created after a successful server-side credit debit.

CREATE TABLE IF NOT EXISTS "UserFeatureAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "featureKey" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "creditCost" INTEGER NOT NULL,
    "fcfaEquivalent" INTEGER NOT NULL DEFAULT 0,
    "transactionId" TEXT,
    "idempotencyKey" TEXT,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Actif',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserFeatureAccess_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserFeatureAccess_idempotencyKey_key" ON "UserFeatureAccess"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "UserFeatureAccess_userId_idx" ON "UserFeatureAccess"("userId");
CREATE INDEX IF NOT EXISTS "UserFeatureAccess_featureKey_idx" ON "UserFeatureAccess"("featureKey");
CREATE INDEX IF NOT EXISTS "UserFeatureAccess_entityType_entityId_idx" ON "UserFeatureAccess"("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "UserFeatureAccess_expiresAt_idx" ON "UserFeatureAccess"("expiresAt");
CREATE INDEX IF NOT EXISTS "UserFeatureAccess_transactionId_idx" ON "UserFeatureAccess"("transactionId");

ALTER TABLE "UserFeatureAccess" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "UserFeatureAccess" FROM anon, authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'UserFeatureAccess_userId_fkey'
  ) THEN
    ALTER TABLE "UserFeatureAccess"
      ADD CONSTRAINT "UserFeatureAccess_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
