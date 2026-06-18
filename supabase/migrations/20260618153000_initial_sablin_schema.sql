-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password" TEXT NOT NULL,
    "commune" TEXT,
    "avatarColor" TEXT NOT NULL DEFAULT '#0c7a50',
    "credits" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "iconName" TEXT NOT NULL,
    "color" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Medication" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "genericName" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "form" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "dosageUnit" TEXT,
    "packSize" TEXT NOT NULL,
    "packaging" TEXT,
    "presentation" TEXT,
    "manufacturer" TEXT,
    "barcode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Côte d''Ivoire',
    "referenceCode" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'À vérifier',
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "confidenceLevel" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Actif',
    "description" TEXT NOT NULL,
    "shortDescription" TEXT,
    "imageUrl" TEXT,
    "requiresRx" BOOLEAN NOT NULL DEFAULT false,
    "avgPrice" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Medication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pharmacy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tradeName" TEXT,
    "slug" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "commune" TEXT NOT NULL,
    "district" TEXT,
    "phone" TEXT NOT NULL,
    "whatsapp" TEXT,
    "professionalEmail" TEXT,
    "managerName" TEXT,
    "managerRole" TEXT,
    "authorizationNumber" TEXT,
    "landmark" TEXT,
    "coverageZone" TEXT,
    "description" TEXT,
    "creationSource" TEXT NOT NULL DEFAULT 'Création administrateur',
    "accountStatus" TEXT NOT NULL DEFAULT 'Validée',
    "publicationStatus" TEXT NOT NULL DEFAULT 'Publiée',
    "publishProvisional" BOOLEAN NOT NULL DEFAULT false,
    "dataQuality" TEXT NOT NULL DEFAULT 'Données à jour',
    "servicesCsv" TEXT,
    "internalIdentifier" TEXT,
    "internalNotes" TEXT,
    "validationComment" TEXT,
    "suspensionReason" TEXT,
    "validatedAt" TIMESTAMP(3),
    "validatedBy" TEXT,
    "publicationUpdatedAt" TIMESTAMP(3),
    "dataFreshnessWarningDays" INTEGER NOT NULL DEFAULT 3,
    "dataFreshnessStaleDays" INTEGER NOT NULL DEFAULT 5,
    "qualityScore" INTEGER NOT NULL DEFAULT 0,
    "lastDataUpdate" TIMESTAMP(3),
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Abidjan',
    "hoursMonday" TEXT,
    "hoursTuesday" TEXT,
    "hoursWednesday" TEXT,
    "hoursThursday" TEXT,
    "hoursFriday" TEXT,
    "hoursSaturdayDetailed" TEXT,
    "hoursSundayDetailed" TEXT,
    "hoursWeekday" TEXT NOT NULL,
    "hoursSaturday" TEXT NOT NULL,
    "hoursSunday" TEXT NOT NULL,
    "specialHoursMessage" TEXT,
    "isOpen247" BOOLEAN NOT NULL DEFAULT false,
    "exceptionalClosureStart" TIMESTAMP(3),
    "exceptionalClosureEnd" TIMESTAMP(3),
    "exceptionalOpeningMessage" TEXT,
    "isOnDuty" BOOLEAN NOT NULL DEFAULT false,
    "dutyPeriod" TEXT,
    "dutyStartAt" TIMESTAMP(3),
    "dutyEndAt" TIMESTAMP(3),
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 4.5,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pharmacy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PharmacyMedia" (
    "id" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "altText" TEXT,
    "url" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "usage" TEXT,
    "validationStatus" TEXT NOT NULL DEFAULT 'En attente',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isValidated" BOOLEAN NOT NULL DEFAULT false,
    "containsSensitiveData" BOOLEAN NOT NULL DEFAULT false,
    "uploadedByRole" TEXT NOT NULL DEFAULT 'Administrateur SABLIN',
    "uploadedByName" TEXT,
    "originalFileName" TEXT,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "rejectedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PharmacyMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PharmacyMedication" (
    "id" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "medicationId" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "availabilityStatus" TEXT NOT NULL DEFAULT 'Disponible',
    "dataSource" TEXT NOT NULL DEFAULT 'Saisie administrateur',
    "reliabilityLevel" TEXT NOT NULL DEFAULT 'Confirmé',
    "internalQuantity" INTEGER,
    "lowStockThreshold" INTEGER,
    "autoStatusEnabled" BOOLEAN NOT NULL DEFAULT false,
    "publicationStatus" TEXT NOT NULL DEFAULT 'Publiée',
    "priceUpdatedAt" TIMESTAMP(3),
    "priceSource" TEXT,
    "priceReliabilityLevel" TEXT NOT NULL DEFAULT 'Confirmé',
    "pricePublicationStatus" TEXT NOT NULL DEFAULT 'Publiée',
    "modifiedByRole" TEXT,
    "modifiedByName" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "internalRemark" TEXT,
    "remark" TEXT,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PharmacyMedication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PharmacyImport" (
    "id" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL DEFAULT 'CSV',
    "authorRole" TEXT NOT NULL,
    "authorName" TEXT,
    "source" TEXT NOT NULL DEFAULT 'Import pharmacie',
    "status" TEXT NOT NULL DEFAULT 'En préparation',
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "validRows" INTEGER NOT NULL DEFAULT 0,
    "invalidRows" INTEGER NOT NULL DEFAULT 0,
    "recognizedMedications" INTEGER NOT NULL DEFAULT 0,
    "unknownMedications" INTEGER NOT NULL DEFAULT 0,
    "duplicateRows" INTEGER NOT NULL DEFAULT 0,
    "missingPrices" INTEGER NOT NULL DEFAULT 0,
    "invalidPrices" INTEGER NOT NULL DEFAULT 0,
    "invalidStatuses" INTEGER NOT NULL DEFAULT 0,
    "missingDosages" INTEGER NOT NULL DEFAULT 0,
    "missingForms" INTEGER NOT NULL DEFAULT 0,
    "reportJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "PharmacyImport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicationAddRequest" (
    "id" TEXT NOT NULL,
    "pharmacyId" TEXT,
    "medicationId" TEXT,
    "proposedName" TEXT NOT NULL,
    "genericName" TEXT,
    "dosage" TEXT,
    "form" TEXT,
    "packaging" TEXT,
    "manufacturer" TEXT,
    "photoUrl" TEXT,
    "remark" TEXT,
    "status" TEXT NOT NULL DEFAULT 'En attente',
    "createdByRole" TEXT NOT NULL DEFAULT 'Pharmacien responsable',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MedicationAddRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicationAlias" (
    "id" TEXT NOT NULL,
    "medicationId" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "normalizedAlias" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'Référentiel SABLIN PHARMA',
    "language" TEXT NOT NULL DEFAULT 'fr',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MedicationAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicationImage" (
    "id" TEXT NOT NULL,
    "medicationId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "storagePath" TEXT,
    "originalUrl" TEXT,
    "sourceName" TEXT NOT NULL DEFAULT 'SABLIN PHARMA',
    "sourceUrl" TEXT,
    "imageType" TEXT NOT NULL DEFAULT 'placeholder',
    "licenseType" TEXT NOT NULL DEFAULT 'Image interne SABLIN PHARMA',
    "licenseUrl" TEXT,
    "attributionText" TEXT,
    "commercialUseAllowed" BOOLEAN NOT NULL DEFAULT false,
    "modificationAllowed" BOOLEAN NOT NULL DEFAULT false,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isPlaceholder" BOOLEAN NOT NULL DEFAULT false,
    "width" INTEGER,
    "height" INTEGER,
    "fileHash" TEXT,
    "perceptualHash" TEXT,
    "confidenceScore" INTEGER NOT NULL DEFAULT 0,
    "validationStatus" TEXT NOT NULL DEFAULT 'À vérifier',
    "validatedBy" TEXT,
    "validatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MedicationImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicationDescription" (
    "id" TEXT NOT NULL,
    "medicationId" TEXT NOT NULL,
    "shortText" TEXT NOT NULL,
    "longText" TEXT,
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "sourceVersion" TEXT,
    "generatedByAI" BOOLEAN NOT NULL DEFAULT false,
    "validationStatus" TEXT NOT NULL DEFAULT 'À vérifier',
    "confidenceScore" INTEGER NOT NULL DEFAULT 0,
    "validatedBy" TEXT,
    "validatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicationDescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryImportRow" (
    "id" TEXT NOT NULL,
    "importId" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "originalJson" TEXT NOT NULL,
    "normalizedJson" TEXT NOT NULL,
    "correctionJson" TEXT,
    "medicationId" TEXT,
    "matchScore" INTEGER NOT NULL DEFAULT 0,
    "matchLevel" TEXT NOT NULL DEFAULT 'Aucune correspondance',
    "status" TEXT NOT NULL DEFAULT 'En attente',
    "errorsJson" TEXT,
    "warningsJson" TEXT,
    "enrichmentRequired" BOOLEAN NOT NULL DEFAULT true,
    "processedBy" TEXT NOT NULL DEFAULT 'Moteur SABLIN PHARMA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryImportRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnrichmentJob" (
    "id" TEXT NOT NULL,
    "medicationId" TEXT,
    "inventoryImportRowId" TEXT,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'En attente',
    "query" TEXT NOT NULL,
    "confidenceScore" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnrichmentJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnrichmentCandidate" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "candidateType" TEXT NOT NULL,
    "proposedMedicationId" TEXT,
    "imageUrl" TEXT,
    "sourceUrl" TEXT,
    "sourceName" TEXT,
    "licenseType" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "matchDetails" TEXT,
    "status" TEXT NOT NULL DEFAULT 'À vérifier',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnrichmentCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnrichmentProviderConfig" (
    "id" TEXT NOT NULL,
    "providerType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 10,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "quotaDaily" INTEGER NOT NULL DEFAULT 0,
    "requestLimit" INTEGER NOT NULL DEFAULT 0,
    "timeoutMs" INTEGER NOT NULL DEFAULT 8000,
    "maxRetries" INTEGER NOT NULL DEFAULT 2,
    "lastSuccessAt" TIMESTAMP(3),
    "lastErrorAt" TIMESTAMP(3),
    "lastErrorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnrichmentProviderConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryConnection" (
    "id" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "connectorType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'En attente',
    "configurationEncrypted" TEXT,
    "primaryMethod" TEXT NOT NULL DEFAULT 'Saisie manuelle',
    "fallbackMethod" TEXT,
    "frequency" TEXT NOT NULL DEFAULT 'Manuelle',
    "lastSyncAt" TIMESTAMP(3),
    "nextSyncAt" TIMESTAMP(3),
    "lastSuccessAt" TIMESTAMP(3),
    "lastErrorAt" TIMESTAMP(3),
    "lastErrorMessage" TEXT,
    "healthStatus" TEXT NOT NULL DEFAULT 'À configurer',
    "lastRowsReceived" INTEGER NOT NULL DEFAULT 0,
    "lastRowsValid" INTEGER NOT NULL DEFAULT 0,
    "lastRowsRejected" INTEGER NOT NULL DEFAULT 0,
    "lastRecognizedMedications" INTEGER NOT NULL DEFAULT 0,
    "lastUnknownMedications" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventorySyncJob" (
    "id" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "connectionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Planifiée',
    "triggerType" TEXT NOT NULL DEFAULT 'manual',
    "priority" INTEGER NOT NULL DEFAULT 5,
    "scheduledAt" TIMESTAMP(3),
    "nextRetryAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "validRows" INTEGER NOT NULL DEFAULT 0,
    "invalidRows" INTEGER NOT NULL DEFAULT 0,
    "recognizedMedications" INTEGER NOT NULL DEFAULT 0,
    "unknownMedications" INTEGER NOT NULL DEFAULT 0,
    "createdProducts" INTEGER NOT NULL DEFAULT 0,
    "updatedProducts" INTEGER NOT NULL DEFAULT 0,
    "outOfStockProducts" INTEGER NOT NULL DEFAULT 0,
    "priceChanges" INTEGER NOT NULL DEFAULT 0,
    "conflicts" INTEGER NOT NULL DEFAULT 0,
    "warnings" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "reportJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventorySyncJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventorySyncRow" (
    "id" TEXT NOT NULL,
    "syncJobId" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "sourceProductId" TEXT,
    "originalData" TEXT NOT NULL,
    "normalizedData" TEXT NOT NULL,
    "medicationId" TEXT,
    "matchingScore" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'À vérifier',
    "errors" TEXT,
    "warnings" TEXT,
    "actionTaken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventorySyncRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductMapping" (
    "id" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "connectionId" TEXT,
    "sourceSystem" TEXT NOT NULL,
    "sourceProductId" TEXT NOT NULL,
    "sourceBarcode" TEXT,
    "medicationId" TEXT NOT NULL,
    "confidenceScore" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'À vérifier',
    "validatedBy" TEXT,
    "validatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryConflict" (
    "id" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "syncJobId" TEXT,
    "medicationId" TEXT,
    "conflictType" TEXT NOT NULL,
    "currentValue" TEXT,
    "incomingValue" TEXT,
    "currentSource" TEXT,
    "incomingSource" TEXT,
    "riskLevel" TEXT NOT NULL DEFAULT 'À vérifier',
    "status" TEXT NOT NULL DEFAULT 'Ouvert',
    "proposedAction" TEXT,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryConflict_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PharmacyRequest" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "medicationId" TEXT,
    "prescriptionId" TEXT,
    "requestType" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Nouvelle',
    "priority" TEXT NOT NULL DEFAULT 'Normale',
    "userMessage" TEXT,
    "requestedQuantity" TEXT,
    "dosage" TEXT,
    "form" TEXT,
    "packaging" TEXT,
    "preferredResponse" TEXT,
    "creditCost" INTEGER NOT NULL,
    "fcfaEquivalent" INTEGER NOT NULL,
    "transactionId" TEXT,
    "idempotencyKey" TEXT,
    "assignedToId" TEXT,
    "assignedToName" TEXT,
    "assignedAt" TIMESTAMP(3),
    "assignedBy" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "refundEligible" BOOLEAN NOT NULL DEFAULT false,
    "disputeAllowedUntil" TIMESTAMP(3),
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PharmacyRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PharmacyRequestResponse" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "responderId" TEXT,
    "responderName" TEXT,
    "responderRole" TEXT NOT NULL,
    "availabilityStatus" TEXT,
    "confirmedPrice" INTEGER,
    "packaging" TEXT,
    "responseMessage" TEXT NOT NULL,
    "validUntil" TIMESTAMP(3),
    "dataSource" TEXT NOT NULL DEFAULT 'Saisie pharmacie',
    "updateInventory" BOOLEAN NOT NULL DEFAULT false,
    "oldInventoryValue" TEXT,
    "newInventoryValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PharmacyRequestResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactUnlock" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "unlockType" TEXT NOT NULL,
    "creditCost" INTEGER NOT NULL,
    "fcfaEquivalent" INTEGER NOT NULL DEFAULT 0,
    "transactionId" TEXT,
    "idempotencyKey" TEXT,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Actif',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactUnlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestStatusHistory" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "previousStatus" TEXT,
    "newStatus" TEXT NOT NULL,
    "changedBy" TEXT,
    "changedByRole" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestDispute" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Nouveau',
    "assignedAdminId" TEXT,
    "resolution" TEXT,
    "refundTransactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "RequestDispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestRefund" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "creditAmount" INTEGER NOT NULL,
    "fcfaEquivalent" INTEGER NOT NULL DEFAULT 0,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'En attente',
    "idempotencyKey" TEXT NOT NULL,
    "transactionId" TEXT,
    "processedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "RequestRefund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessionalActionLog" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "pharmacyId" TEXT,
    "pharmacySlug" TEXT,
    "actorRole" TEXT,
    "status" TEXT NOT NULL DEFAULT 'réussi',
    "message" TEXT,
    "details" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "source" TEXT,
    "sessionId" TEXT,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfessionalActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessionalSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfessionalSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessionalAccount" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "passwordHash" TEXT,
    "role" TEXT NOT NULL,
    "permissionsJson" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "mustResetPassword" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorRecommended" BOOLEAN NOT NULL DEFAULT false,
    "sessionVersion" INTEGER NOT NULL DEFAULT 1,
    "lastLoginAt" TIMESTAMP(3),
    "lastPasswordChangeAt" TIMESTAMP(3),
    "suspendedReason" TEXT,
    "internalNotes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfessionalAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessionalPharmacyMembership" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "permissionsJson" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'Actif',
    "attachedBy" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfessionalPharmacyMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessionalInvitation" (
    "id" TEXT NOT NULL,
    "pharmacyId" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "permissionsJson" TEXT NOT NULL DEFAULT '[]',
    "tokenHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'En attente',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdByAccountId" TEXT,
    "createdByRole" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfessionalInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessionalSessionRecord" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "sessionVersion" INTEGER NOT NULL,
    "activePharmacyId" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,

    CONSTRAINT "ProfessionalSessionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityNotification" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "recipientAccountId" TEXT,
    "recipientUserId" TEXT,
    "pharmacyId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'non_lue',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "pharmacyId" TEXT,
    "actorAccountId" TEXT,
    "actorName" TEXT,
    "actorRole" TEXT,
    "result" TEXT NOT NULL DEFAULT 'réussi',
    "oldValue" TEXT,
    "newValue" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "sessionId" TEXT,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'pass',
    "status" TEXT NOT NULL DEFAULT 'active',
    "amount" INTEGER NOT NULL DEFAULT 500,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "amount" INTEGER NOT NULL,
    "method" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'success',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'Bell',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "query" TEXT,
    "slug" TEXT,
    "label" TEXT NOT NULL,
    "meta" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "meta" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pushAlerts" BOOLEAN NOT NULL DEFAULT true,
    "dutyAlerts" BOOLEAN NOT NULL DEFAULT true,
    "priceAlerts" BOOLEAN NOT NULL DEFAULT false,
    "promoAlerts" BOOLEAN NOT NULL DEFAULT true,
    "emailRecap" BOOLEAN NOT NULL DEFAULT false,
    "language" TEXT NOT NULL DEFAULT 'fr',
    "theme" TEXT NOT NULL DEFAULT 'light',
    "defaultCommune" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "fcfaEquivalent" INTEGER NOT NULL DEFAULT 0,
    "balanceBefore" INTEGER NOT NULL DEFAULT 0,
    "balanceAfter" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'réussi',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PassOrdonnance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'active',
    "ordonnanceId" TEXT,
    "price" INTEGER NOT NULL DEFAULT 500,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PassOrdonnance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Medication_slug_key" ON "Medication"("slug");

-- CreateIndex
CREATE INDEX "Medication_genericName_idx" ON "Medication"("genericName");

-- CreateIndex
CREATE INDEX "Medication_dosage_idx" ON "Medication"("dosage");

-- CreateIndex
CREATE INDEX "Medication_form_idx" ON "Medication"("form");

-- CreateIndex
CREATE INDEX "Medication_manufacturer_idx" ON "Medication"("manufacturer");

-- CreateIndex
CREATE INDEX "Medication_barcode_idx" ON "Medication"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "Pharmacy_slug_key" ON "Pharmacy"("slug");

-- CreateIndex
CREATE INDEX "MedicationAlias_normalizedAlias_idx" ON "MedicationAlias"("normalizedAlias");

-- CreateIndex
CREATE INDEX "MedicationAlias_medicationId_idx" ON "MedicationAlias"("medicationId");

-- CreateIndex
CREATE INDEX "MedicationImage_medicationId_idx" ON "MedicationImage"("medicationId");

-- CreateIndex
CREATE INDEX "MedicationImage_fileHash_idx" ON "MedicationImage"("fileHash");

-- CreateIndex
CREATE INDEX "MedicationImage_perceptualHash_idx" ON "MedicationImage"("perceptualHash");

-- CreateIndex
CREATE INDEX "MedicationImage_validationStatus_idx" ON "MedicationImage"("validationStatus");

-- CreateIndex
CREATE INDEX "MedicationDescription_medicationId_idx" ON "MedicationDescription"("medicationId");

-- CreateIndex
CREATE INDEX "MedicationDescription_validationStatus_idx" ON "MedicationDescription"("validationStatus");

-- CreateIndex
CREATE INDEX "InventoryImportRow_importId_idx" ON "InventoryImportRow"("importId");

-- CreateIndex
CREATE INDEX "InventoryImportRow_pharmacyId_idx" ON "InventoryImportRow"("pharmacyId");

-- CreateIndex
CREATE INDEX "InventoryImportRow_medicationId_idx" ON "InventoryImportRow"("medicationId");

-- CreateIndex
CREATE INDEX "InventoryImportRow_matchLevel_idx" ON "InventoryImportRow"("matchLevel");

-- CreateIndex
CREATE INDEX "InventoryImportRow_status_idx" ON "InventoryImportRow"("status");

-- CreateIndex
CREATE INDEX "EnrichmentJob_status_idx" ON "EnrichmentJob"("status");

-- CreateIndex
CREATE INDEX "EnrichmentJob_provider_idx" ON "EnrichmentJob"("provider");

-- CreateIndex
CREATE INDEX "EnrichmentJob_medicationId_idx" ON "EnrichmentJob"("medicationId");

-- CreateIndex
CREATE INDEX "EnrichmentJob_inventoryImportRowId_idx" ON "EnrichmentJob"("inventoryImportRowId");

-- CreateIndex
CREATE INDEX "EnrichmentCandidate_jobId_idx" ON "EnrichmentCandidate"("jobId");

-- CreateIndex
CREATE INDEX "EnrichmentCandidate_candidateType_idx" ON "EnrichmentCandidate"("candidateType");

-- CreateIndex
CREATE INDEX "EnrichmentCandidate_status_idx" ON "EnrichmentCandidate"("status");

-- CreateIndex
CREATE INDEX "EnrichmentCandidate_proposedMedicationId_idx" ON "EnrichmentCandidate"("proposedMedicationId");

-- CreateIndex
CREATE UNIQUE INDEX "EnrichmentProviderConfig_name_key" ON "EnrichmentProviderConfig"("name");

-- CreateIndex
CREATE INDEX "EnrichmentProviderConfig_providerType_idx" ON "EnrichmentProviderConfig"("providerType");

-- CreateIndex
CREATE INDEX "EnrichmentProviderConfig_active_idx" ON "EnrichmentProviderConfig"("active");

-- CreateIndex
CREATE INDEX "InventoryConnection_pharmacyId_idx" ON "InventoryConnection"("pharmacyId");

-- CreateIndex
CREATE INDEX "InventoryConnection_connectorType_idx" ON "InventoryConnection"("connectorType");

-- CreateIndex
CREATE INDEX "InventoryConnection_status_idx" ON "InventoryConnection"("status");

-- CreateIndex
CREATE INDEX "InventorySyncJob_pharmacyId_idx" ON "InventorySyncJob"("pharmacyId");

-- CreateIndex
CREATE INDEX "InventorySyncJob_connectionId_idx" ON "InventorySyncJob"("connectionId");

-- CreateIndex
CREATE INDEX "InventorySyncJob_status_idx" ON "InventorySyncJob"("status");

-- CreateIndex
CREATE INDEX "InventorySyncJob_scheduledAt_idx" ON "InventorySyncJob"("scheduledAt");

-- CreateIndex
CREATE INDEX "InventorySyncRow_syncJobId_idx" ON "InventorySyncRow"("syncJobId");

-- CreateIndex
CREATE INDEX "InventorySyncRow_pharmacyId_idx" ON "InventorySyncRow"("pharmacyId");

-- CreateIndex
CREATE INDEX "InventorySyncRow_medicationId_idx" ON "InventorySyncRow"("medicationId");

-- CreateIndex
CREATE INDEX "InventorySyncRow_status_idx" ON "InventorySyncRow"("status");

-- CreateIndex
CREATE INDEX "InventorySyncRow_sourceProductId_idx" ON "InventorySyncRow"("sourceProductId");

-- CreateIndex
CREATE INDEX "ProductMapping_sourceBarcode_idx" ON "ProductMapping"("sourceBarcode");

-- CreateIndex
CREATE INDEX "ProductMapping_medicationId_idx" ON "ProductMapping"("medicationId");

-- CreateIndex
CREATE INDEX "ProductMapping_status_idx" ON "ProductMapping"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ProductMapping_pharmacyId_sourceSystem_sourceProductId_key" ON "ProductMapping"("pharmacyId", "sourceSystem", "sourceProductId");

-- CreateIndex
CREATE INDEX "InventoryConflict_pharmacyId_idx" ON "InventoryConflict"("pharmacyId");

-- CreateIndex
CREATE INDEX "InventoryConflict_syncJobId_idx" ON "InventoryConflict"("syncJobId");

-- CreateIndex
CREATE INDEX "InventoryConflict_medicationId_idx" ON "InventoryConflict"("medicationId");

-- CreateIndex
CREATE INDEX "InventoryConflict_conflictType_idx" ON "InventoryConflict"("conflictType");

-- CreateIndex
CREATE INDEX "InventoryConflict_status_idx" ON "InventoryConflict"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PharmacyRequest_reference_key" ON "PharmacyRequest"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "PharmacyRequest_idempotencyKey_key" ON "PharmacyRequest"("idempotencyKey");

-- CreateIndex
CREATE INDEX "PharmacyRequest_reference_idx" ON "PharmacyRequest"("reference");

-- CreateIndex
CREATE INDEX "PharmacyRequest_userId_idx" ON "PharmacyRequest"("userId");

-- CreateIndex
CREATE INDEX "PharmacyRequest_pharmacyId_idx" ON "PharmacyRequest"("pharmacyId");

-- CreateIndex
CREATE INDEX "PharmacyRequest_status_idx" ON "PharmacyRequest"("status");

-- CreateIndex
CREATE INDEX "PharmacyRequest_requestType_idx" ON "PharmacyRequest"("requestType");

-- CreateIndex
CREATE INDEX "PharmacyRequest_expiresAt_idx" ON "PharmacyRequest"("expiresAt");

-- CreateIndex
CREATE INDEX "PharmacyRequest_createdAt_idx" ON "PharmacyRequest"("createdAt");

-- CreateIndex
CREATE INDEX "PharmacyRequest_transactionId_idx" ON "PharmacyRequest"("transactionId");

-- CreateIndex
CREATE INDEX "PharmacyRequestResponse_requestId_idx" ON "PharmacyRequestResponse"("requestId");

-- CreateIndex
CREATE INDEX "PharmacyRequestResponse_createdAt_idx" ON "PharmacyRequestResponse"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ContactUnlock_idempotencyKey_key" ON "ContactUnlock"("idempotencyKey");

-- CreateIndex
CREATE INDEX "ContactUnlock_userId_idx" ON "ContactUnlock"("userId");

-- CreateIndex
CREATE INDEX "ContactUnlock_pharmacyId_idx" ON "ContactUnlock"("pharmacyId");

-- CreateIndex
CREATE INDEX "ContactUnlock_unlockType_idx" ON "ContactUnlock"("unlockType");

-- CreateIndex
CREATE INDEX "ContactUnlock_expiresAt_idx" ON "ContactUnlock"("expiresAt");

-- CreateIndex
CREATE INDEX "ContactUnlock_transactionId_idx" ON "ContactUnlock"("transactionId");

-- CreateIndex
CREATE INDEX "RequestStatusHistory_requestId_idx" ON "RequestStatusHistory"("requestId");

-- CreateIndex
CREATE INDEX "RequestStatusHistory_createdAt_idx" ON "RequestStatusHistory"("createdAt");

-- CreateIndex
CREATE INDEX "RequestDispute_requestId_idx" ON "RequestDispute"("requestId");

-- CreateIndex
CREATE INDEX "RequestDispute_userId_idx" ON "RequestDispute"("userId");

-- CreateIndex
CREATE INDEX "RequestDispute_status_idx" ON "RequestDispute"("status");

-- CreateIndex
CREATE INDEX "RequestDispute_createdAt_idx" ON "RequestDispute"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RequestRefund_idempotencyKey_key" ON "RequestRefund"("idempotencyKey");

-- CreateIndex
CREATE INDEX "RequestRefund_requestId_idx" ON "RequestRefund"("requestId");

-- CreateIndex
CREATE INDEX "RequestRefund_userId_idx" ON "RequestRefund"("userId");

-- CreateIndex
CREATE INDEX "RequestRefund_status_idx" ON "RequestRefund"("status");

-- CreateIndex
CREATE INDEX "RequestRefund_createdAt_idx" ON "RequestRefund"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionalSetting_key_key" ON "ProfessionalSetting"("key");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionalAccount_email_key" ON "ProfessionalAccount"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionalAccount_phone_key" ON "ProfessionalAccount"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionalPharmacyMembership_accountId_pharmacyId_key" ON "ProfessionalPharmacyMembership"("accountId", "pharmacyId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_reference_key" ON "Payment"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_kind_slug_key" ON "Favorite"("userId", "kind", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- AddForeignKey
ALTER TABLE "Medication" ADD CONSTRAINT "Medication_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacyMedia" ADD CONSTRAINT "PharmacyMedia_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacyMedication" ADD CONSTRAINT "PharmacyMedication_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacyMedication" ADD CONSTRAINT "PharmacyMedication_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "Medication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacyImport" ADD CONSTRAINT "PharmacyImport_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationAddRequest" ADD CONSTRAINT "MedicationAddRequest_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationAddRequest" ADD CONSTRAINT "MedicationAddRequest_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "Medication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationAlias" ADD CONSTRAINT "MedicationAlias_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "Medication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationImage" ADD CONSTRAINT "MedicationImage_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "Medication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationDescription" ADD CONSTRAINT "MedicationDescription_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "Medication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryImportRow" ADD CONSTRAINT "InventoryImportRow_importId_fkey" FOREIGN KEY ("importId") REFERENCES "PharmacyImport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryImportRow" ADD CONSTRAINT "InventoryImportRow_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryImportRow" ADD CONSTRAINT "InventoryImportRow_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "Medication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrichmentJob" ADD CONSTRAINT "EnrichmentJob_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "Medication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrichmentJob" ADD CONSTRAINT "EnrichmentJob_inventoryImportRowId_fkey" FOREIGN KEY ("inventoryImportRowId") REFERENCES "InventoryImportRow"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrichmentCandidate" ADD CONSTRAINT "EnrichmentCandidate_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "EnrichmentJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrichmentCandidate" ADD CONSTRAINT "EnrichmentCandidate_proposedMedicationId_fkey" FOREIGN KEY ("proposedMedicationId") REFERENCES "Medication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryConnection" ADD CONSTRAINT "InventoryConnection_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventorySyncJob" ADD CONSTRAINT "InventorySyncJob_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventorySyncJob" ADD CONSTRAINT "InventorySyncJob_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "InventoryConnection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventorySyncRow" ADD CONSTRAINT "InventorySyncRow_syncJobId_fkey" FOREIGN KEY ("syncJobId") REFERENCES "InventorySyncJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventorySyncRow" ADD CONSTRAINT "InventorySyncRow_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventorySyncRow" ADD CONSTRAINT "InventorySyncRow_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "Medication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMapping" ADD CONSTRAINT "ProductMapping_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMapping" ADD CONSTRAINT "ProductMapping_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "InventoryConnection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMapping" ADD CONSTRAINT "ProductMapping_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "Medication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryConflict" ADD CONSTRAINT "InventoryConflict_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryConflict" ADD CONSTRAINT "InventoryConflict_syncJobId_fkey" FOREIGN KEY ("syncJobId") REFERENCES "InventorySyncJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryConflict" ADD CONSTRAINT "InventoryConflict_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "Medication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacyRequest" ADD CONSTRAINT "PharmacyRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacyRequest" ADD CONSTRAINT "PharmacyRequest_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacyRequest" ADD CONSTRAINT "PharmacyRequest_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "Medication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacyRequestResponse" ADD CONSTRAINT "PharmacyRequestResponse_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "PharmacyRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactUnlock" ADD CONSTRAINT "ContactUnlock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactUnlock" ADD CONSTRAINT "ContactUnlock_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestStatusHistory" ADD CONSTRAINT "RequestStatusHistory_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "PharmacyRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestDispute" ADD CONSTRAINT "RequestDispute_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "PharmacyRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestDispute" ADD CONSTRAINT "RequestDispute_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestRefund" ADD CONSTRAINT "RequestRefund_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "PharmacyRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestRefund" ADD CONSTRAINT "RequestRefund_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalActionLog" ADD CONSTRAINT "ProfessionalActionLog_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalPharmacyMembership" ADD CONSTRAINT "ProfessionalPharmacyMembership_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "ProfessionalAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalPharmacyMembership" ADD CONSTRAINT "ProfessionalPharmacyMembership_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalInvitation" ADD CONSTRAINT "ProfessionalInvitation_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalInvitation" ADD CONSTRAINT "ProfessionalInvitation_createdByAccountId_fkey" FOREIGN KEY ("createdByAccountId") REFERENCES "ProfessionalAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalSessionRecord" ADD CONSTRAINT "ProfessionalSessionRecord_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "ProfessionalAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "ProfessionalAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorAccountId_fkey" FOREIGN KEY ("actorAccountId") REFERENCES "ProfessionalAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchHistory" ADD CONSTRAINT "SearchHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PassOrdonnance" ADD CONSTRAINT "PassOrdonnance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
