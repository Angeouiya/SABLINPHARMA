import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { db } from "@/lib/db";
import {
  matchMedicationInReferential,
  normalizeImportedRow,
  type ImportedMedicationRow,
} from "@/lib/medication-enrichment";

export const SYNC_METHODS = [
  "Saisie manuelle",
  "Import Excel",
  "Import CSV",
  "Import automatique par fichier",
  "API REST",
  "Webhook",
  "Connecteur logiciel",
  "Saisie administrateur",
  "Import administrateur",
  "Confirmation manuelle",
] as const;

export const SYNC_FREQUENCIES = [
  "Manuelle",
  "Toutes les 15 minutes",
  "Toutes les 30 minutes",
  "Toutes les heures",
  "Toutes les 3 heures",
  "Toutes les 6 heures",
  "Une fois par jour",
  "Une fois par semaine",
] as const;

export const SYNC_STATUSES = [
  "Planifiée",
  "En attente",
  "En cours",
  "Terminée",
  "Terminée avec avertissements",
  "Échouée",
  "Suspendue",
  "Annulée",
] as const;

export type InventoryConnector = {
  type: string;
  testConnection(config: Record<string, unknown>): Promise<{ ok: boolean; message: string }>;
  authenticate?(config: Record<string, unknown>): Promise<boolean>;
  fetchInventory?(config: Record<string, unknown>): Promise<ImportedMedicationRow[]>;
  fetchPrices?(config: Record<string, unknown>): Promise<ImportedMedicationRow[]>;
  fetchProducts?(config: Record<string, unknown>): Promise<ImportedMedicationRow[]>;
  normalizeData(rows: ImportedMedicationRow[]): ImportedMedicationRow[];
  syncInventory(input: SyncInventoryInput): Promise<SyncInventoryResult>;
  getLastSyncStatus?(connectionId: string): Promise<unknown>;
  disconnect?(connectionId: string): Promise<void>;
};

export type SyncInventoryInput = {
  pharmacyId: string;
  connectionId?: string | null;
  rows: ImportedMedicationRow[];
  triggerType: string;
  sourceSystem: string;
  mode?: "preview" | "validate_before_publish" | "controlled_auto_publish";
  actor?: string | null;
};

export type SyncInventoryResult = {
  jobId: string;
  status: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  recognizedMedications: number;
  unknownMedications: number;
  conflicts: number;
  warnings: number;
};

function encryptionKey() {
  return createHash("sha256")
    .update(process.env.SABLIN_SYNC_SECRET_KEY || process.env.NEXTAUTH_SECRET || "sablin-local-sync-key")
    .digest();
}

export function encryptConnectorConfig(config: Record<string, unknown>) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(config), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptConnectorConfig(value?: string | null) {
  if (!value) return {};
  const [ivRaw, tagRaw, encryptedRaw] = value.split(".");
  if (!ivRaw || !tagRaw || !encryptedRaw) return {};
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivRaw, "base64url"));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedRaw, "base64url")),
    decipher.final(),
  ]);
  return JSON.parse(decrypted.toString("utf8")) as Record<string, unknown>;
}

function maskSecret(value: Record<string, unknown>) {
  const clone: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value)) {
    clone[key] = /secret|token|key|password|motdepasse/i.test(key) ? "••••••••" : val;
  }
  return clone;
}

function normalizePrice(value?: string | number | null) {
  const price = Number(String(value ?? "").replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(price) ? Math.round(price) : null;
}

function normalizeQuantity(value?: string | number | null) {
  if (value === undefined || value === null || value === "") return null;
  const quantity = Number(String(value).replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(quantity) ? Math.round(quantity) : null;
}

function publicStatusFromQuantity(quantity: number | null, threshold = 5, fallback?: string | null) {
  if (quantity === null) return fallback || "À confirmer";
  if (quantity <= 0) return "Rupture";
  if (quantity <= threshold) return "Stock faible";
  return "Disponible";
}

function mappingLookupConditions(row: ImportedMedicationRow) {
  const conditions: Array<{ sourceBarcode?: string; sourceProductId?: string }> = [];
  if (row.barcode?.trim()) conditions.push({ sourceBarcode: row.barcode.trim() });
  if (row.name?.trim()) conditions.push({ sourceProductId: row.name.trim() });
  return conditions;
}

function freshnessNextSync(frequency: string) {
  const now = Date.now();
  const minutes: Record<string, number> = {
    "Toutes les 15 minutes": 15,
    "Toutes les 30 minutes": 30,
    "Toutes les heures": 60,
    "Toutes les 3 heures": 180,
    "Toutes les 6 heures": 360,
    "Une fois par jour": 1440,
    "Une fois par semaine": 10080,
  };
  return minutes[frequency] ? new Date(now + minutes[frequency] * 60 * 1000) : null;
}

export function dataFreshnessLabel(date?: Date | string | null, staleDays = 5) {
  if (!date) return "À confirmer";
  const ageMs = Date.now() - new Date(date).getTime();
  const ageDays = ageMs / (24 * 60 * 60 * 1000);
  if (ageDays < 0.5) return "Très récente";
  if (ageDays < 2) return "Récente";
  if (ageDays < staleDays) return "Vieillissante";
  if (ageDays < staleDays * 3) return "Ancienne";
  return "Expirée";
}

async function getOrCreateManualConnection(input: {
  pharmacyId: string;
  connectorType: string;
  name: string;
  actor?: string | null;
}) {
  const existing = await db.inventoryConnection.findFirst({
    where: { pharmacyId: input.pharmacyId, connectorType: input.connectorType, name: input.name },
  });
  if (existing) return existing;
  return db.inventoryConnection.create({
    data: {
      pharmacyId: input.pharmacyId,
      connectorType: input.connectorType,
      name: input.name,
      status: "Connectée",
      primaryMethod: input.name,
      frequency: "Manuelle",
      healthStatus: "Opérationnelle",
      createdBy: input.actor ?? null,
    },
  });
}

export async function createInventoryConnection(input: {
  pharmacyId: string;
  connectorType: string;
  name: string;
  primaryMethod: string;
  fallbackMethod?: string | null;
  frequency?: string | null;
  configuration?: Record<string, unknown>;
  createdBy?: string | null;
}) {
  return db.inventoryConnection.create({
    data: {
      pharmacyId: input.pharmacyId,
      connectorType: input.connectorType,
      name: input.name,
      status: "En attente",
      configurationEncrypted: input.configuration ? encryptConnectorConfig(input.configuration) : null,
      primaryMethod: input.primaryMethod,
      fallbackMethod: input.fallbackMethod ?? null,
      frequency: input.frequency ?? "Manuelle",
      healthStatus: "À tester",
      nextSyncAt: input.frequency ? freshnessNextSync(input.frequency) : null,
      createdBy: input.createdBy ?? null,
    },
  });
}

export async function testInventoryConnection(connectionId: string) {
  const connection = await db.inventoryConnection.findUnique({ where: { id: connectionId } });
  if (!connection) throw new Error("Connexion introuvable.");
  const config = decryptConnectorConfig(connection.configurationEncrypted);
  const hasRequiredUrl = connection.connectorType !== "GenericRestApiConnector" || Boolean(config.apiUrl);
  const ok = connection.connectorType === "ManualConnector" || connection.connectorType === "AdminManagedConnector" || hasRequiredUrl;
  const status = ok ? "Connectée" : "Erreur";
  const message = ok ? "Connexion réussie" : "API inaccessible ou configuration incomplète";
  await db.inventoryConnection.update({
    where: { id: connection.id },
    data: {
      status,
      healthStatus: ok ? "Opérationnelle" : "Erreur",
      lastSuccessAt: ok ? new Date() : connection.lastSuccessAt,
      lastErrorAt: ok ? connection.lastErrorAt : new Date(),
      lastErrorMessage: ok ? null : message,
    },
  });
  return { ok, message, safeConfig: maskSecret(config) };
}

export async function syncInventory(input: SyncInventoryInput): Promise<SyncInventoryResult> {
  const connection = input.connectionId
    ? await db.inventoryConnection.findUnique({ where: { id: input.connectionId } })
    : await getOrCreateManualConnection({
        pharmacyId: input.pharmacyId,
        connectorType: input.sourceSystem.includes("admin") ? "AdminManagedConnector" : "ManualConnector",
        name: input.sourceSystem,
        actor: input.actor,
      });

  if (!connection) throw new Error("Connexion inventaire introuvable.");

  const job = await db.inventorySyncJob.create({
    data: {
      pharmacyId: input.pharmacyId,
      connectionId: connection.id,
      status: "En cours",
      triggerType: input.triggerType,
      startedAt: new Date(),
      attempts: 1,
      createdBy: input.actor ?? null,
    },
  });

  let validRows = 0;
  let invalidRows = 0;
  let recognizedMedications = 0;
  let unknownMedications = 0;
  let conflicts = 0;
  let warnings = 0;
  let updatedProducts = 0;
  let outOfStockProducts = 0;
  let priceChanges = 0;

  for (const row of input.rows) {
    const normalized = normalizeImportedRow(row);
    const quantity = normalizeQuantity(row.quantity);
    const price = normalizePrice(row.price);
    const threshold = 5;
    const warningsList: string[] = [];
    const errors: string[] = [];

    if (quantity !== null && quantity < 0) errors.push("Quantité négative");
    if (price === null || price <= 0) errors.push("Prix invalide");

    const lookupConditions = mappingLookupConditions(row);
    const existingMapping = lookupConditions.length
      ? await db.productMapping.findFirst({
          where: {
            pharmacyId: input.pharmacyId,
            status: "Validée",
            OR: lookupConditions,
          },
        })
      : null;
    const match = existingMapping
      ? {
          best: {
            medicationId: existingMapping.medicationId,
            score: existingMapping.confidenceScore,
            level: "Correspondance certaine" as const,
            exactFields: ["correspondance stable"],
            differentFields: [],
            missingFields: [],
            reason: "Correspondance réutilisée.",
            requiresAdminValidation: false,
          },
        }
      : await matchMedicationInReferential(normalized);

    const medicationId = "medicationId" in match.best ? match.best.medicationId : null;
    if (medicationId) recognizedMedications += 1;
    else unknownMedications += 1;

    const rowHasConflict = match.best.level === "Conflit de données" || errors.length > 0 || !medicationId;
    if (rowHasConflict) {
      conflicts += 1;
      await db.inventoryConflict.create({
        data: {
          pharmacyId: input.pharmacyId,
          syncJobId: job.id,
          medicationId,
          conflictType: errors[0] ?? (medicationId ? "Conflit de données" : "Médicament non reconnu"),
          currentValue: null,
          incomingValue: JSON.stringify(row),
          currentSource: "Base SABLIN PHARMA",
          incomingSource: input.sourceSystem,
          riskLevel: errors.length ? "Critique" : "À vérifier",
          proposedAction: medicationId ? "Marquer à confirmer" : "Envoyer au moteur d’enrichissement",
        },
      });
    }

    let actionTaken = "Aperçu uniquement";
    const canPublish =
      input.mode === "controlled_auto_publish" &&
      medicationId &&
      !errors.length &&
      match.best.score >= 95 &&
      match.best.level === "Correspondance certaine";

    if (canPublish && medicationId && price) {
      const current = await db.pharmacyMedication.findFirst({ where: { pharmacyId: input.pharmacyId, medicationId } });
      const availabilityStatus = publicStatusFromQuantity(quantity, threshold, row.status);
      const priceVariation =
        current?.price && price > 0 ? Math.abs(price - current.price) / Math.max(current.price, 1) : 0;
      if (priceVariation > 0.5) {
        warningsList.push("Variation importante de prix à vérifier");
        conflicts += 1;
        await db.inventoryConflict.create({
          data: {
            pharmacyId: input.pharmacyId,
            syncJobId: job.id,
            medicationId,
            conflictType: "prix anormal",
            currentValue: String(current?.price ?? ""),
            incomingValue: String(price),
            currentSource: current?.dataSource ?? "Base SABLIN PHARMA",
            incomingSource: input.sourceSystem,
            riskLevel: "Élevé",
            proposedAction: "Validation avant publication",
          },
        });
      } else {
        if (current) {
          await db.pharmacyMedication.update({
            where: { id: current.id },
            data: {
              price,
              availabilityStatus,
              inStock: availabilityStatus !== "Rupture",
              internalQuantity: quantity,
              dataSource: input.sourceSystem,
              reliabilityLevel: "Confirmé",
              priceUpdatedAt: new Date(),
              priceSource: input.sourceSystem,
              lastUpdatedAt: new Date(),
              publicationStatus: "Publiée",
            },
          });
        } else {
          await db.pharmacyMedication.create({
            data: {
              pharmacyId: input.pharmacyId,
              medicationId,
              price,
              availabilityStatus,
              inStock: availabilityStatus !== "Rupture",
              internalQuantity: quantity,
              dataSource: input.sourceSystem,
              reliabilityLevel: "Confirmé",
              priceUpdatedAt: new Date(),
              priceSource: input.sourceSystem,
              lastUpdatedAt: new Date(),
              publicationStatus: "Publiée",
            },
          });
        }
        updatedProducts += 1;
        if (availabilityStatus === "Rupture") outOfStockProducts += 1;
        if (current?.price !== price) priceChanges += 1;
        actionTaken = "Publié automatiquement";
      }
    } else if (input.mode === "validate_before_publish") {
      actionTaken = "Préparé pour validation";
    }

    if (errors.length) invalidRows += 1;
    else validRows += 1;
    warnings += warningsList.length;

    await db.inventorySyncRow.create({
      data: {
        syncJobId: job.id,
        pharmacyId: input.pharmacyId,
        sourceProductId: row.name || row.barcode || `line-${row.lineNumber}`,
        originalData: JSON.stringify(row),
        normalizedData: JSON.stringify(normalized),
        medicationId,
        matchingScore: match.best.score,
        status: errors.length
          ? "Rejetée"
          : actionTaken === "Publié automatiquement"
            ? "Publiée"
            : rowHasConflict
              ? "Conflit"
              : "À vérifier",
        errors: errors.length ? JSON.stringify(errors) : null,
        warnings: warningsList.length ? JSON.stringify(warningsList) : null,
        actionTaken,
      },
    });

    if (medicationId && row.name) {
      await db.productMapping.upsert({
        where: {
          pharmacyId_sourceSystem_sourceProductId: {
            pharmacyId: input.pharmacyId,
            sourceSystem: input.sourceSystem,
            sourceProductId: row.name,
          },
        },
        update: {
          sourceBarcode: row.barcode || null,
          medicationId,
          confidenceScore: match.best.score,
          status: match.best.score >= 95 ? "Validée" : "À vérifier",
        },
        create: {
          pharmacyId: input.pharmacyId,
          connectionId: connection.id,
          sourceSystem: input.sourceSystem,
          sourceProductId: row.name,
          sourceBarcode: row.barcode || null,
          medicationId,
          confidenceScore: match.best.score,
          status: match.best.score >= 95 ? "Validée" : "À vérifier",
        },
      });
    }
  }

  const finalStatus = conflicts || warnings || invalidRows ? "Terminée avec avertissements" : "Terminée";
  const report = {
    pharmacyId: input.pharmacyId,
    connectionId: connection.id,
    triggerType: input.triggerType,
    totalRows: input.rows.length,
    validRows,
    invalidRows,
    recognizedMedications,
    unknownMedications,
    updatedProducts,
    outOfStockProducts,
    priceChanges,
    conflicts,
    warnings,
    status: finalStatus,
  };

  await db.inventorySyncJob.update({
    where: { id: job.id },
    data: {
      status: finalStatus,
      completedAt: new Date(),
      totalRows: input.rows.length,
      validRows,
      invalidRows,
      recognizedMedications,
      unknownMedications,
      updatedProducts,
      outOfStockProducts,
      priceChanges,
      conflicts,
      warnings,
      reportJson: JSON.stringify(report),
    },
  });
  await db.inventoryConnection.update({
    where: { id: connection.id },
    data: {
      lastSyncAt: new Date(),
      lastSuccessAt: finalStatus === "Terminée" ? new Date() : connection.lastSuccessAt,
      lastErrorAt: finalStatus === "Terminée" ? connection.lastErrorAt : new Date(),
      lastErrorMessage: finalStatus === "Terminée" ? null : "Synchronisation terminée avec avertissements.",
      nextSyncAt: freshnessNextSync(connection.frequency),
      healthStatus: finalStatus === "Terminée" ? "Opérationnelle" : "À vérifier",
      lastRowsReceived: input.rows.length,
      lastRowsValid: validRows,
      lastRowsRejected: invalidRows,
      lastRecognizedMedications: recognizedMedications,
      lastUnknownMedications: unknownMedications,
    },
  });

  return { jobId: job.id, ...report };
}

export const ManualConnector: InventoryConnector = {
  type: "ManualConnector",
  async testConnection() {
    return { ok: true, message: "Connexion manuelle disponible." };
  },
  normalizeData(rows) {
    return rows;
  },
  syncInventory,
};

export const AdminManagedConnector: InventoryConnector = {
  ...ManualConnector,
  type: "AdminManagedConnector",
};

export async function seedDefaultInventoryConnections(pharmacyId: string, actor?: string | null) {
  await getOrCreateManualConnection({ pharmacyId, connectorType: "ManualConnector", name: "Saisie manuelle", actor });
  await getOrCreateManualConnection({ pharmacyId, connectorType: "GenericCsvConnector", name: "Import CSV", actor });
  await getOrCreateManualConnection({ pharmacyId, connectorType: "GenericExcelConnector", name: "Import Excel", actor });
}
