-- Allow public users to register with either an email, a phone number, or both.
-- Existing data is preserved. Phone numbers are normalized before adding a
-- unique index so login by phone remains reliable.

UPDATE "User"
SET "phone" = NULLIF(regexp_replace("phone", '[\s\-.]', '', 'g'), '')
WHERE "phone" IS NOT NULL;

ALTER TABLE "User"
  ALTER COLUMN "email" DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "User_phone_key" ON "User"("phone");

ALTER TABLE "User"
  ADD CONSTRAINT "User_contact_required_check"
  CHECK ("email" IS NOT NULL OR "phone" IS NOT NULL);
