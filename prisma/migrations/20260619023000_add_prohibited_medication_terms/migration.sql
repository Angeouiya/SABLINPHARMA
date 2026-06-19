CREATE TABLE "ProhibitedMedicationTerm" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "reason" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "disabledAt" TIMESTAMP(3),
  "disabledBy" TEXT,
  CONSTRAINT "ProhibitedMedicationTerm_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProhibitedMedicationTerm_normalizedName_key" ON "ProhibitedMedicationTerm"("normalizedName");
CREATE INDEX "ProhibitedMedicationTerm_active_idx" ON "ProhibitedMedicationTerm"("active");
CREATE INDEX "ProhibitedMedicationTerm_normalizedName_idx" ON "ProhibitedMedicationTerm"("normalizedName");
