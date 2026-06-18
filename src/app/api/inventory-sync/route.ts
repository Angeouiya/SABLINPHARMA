import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  SYNC_FREQUENCIES,
  SYNC_METHODS,
  createInventoryConnection,
  decryptConnectorConfig,
  encryptConnectorConfig,
  seedDefaultInventoryConnections,
  syncInventory,
  testInventoryConnection,
} from "@/lib/inventory-sync";
import { hasPharmacyPermission, requirePharmacyPermission } from "@/lib/pharmacy-access";
import type { ImportedMedicationRow } from "@/lib/medication-enrichment";

function requestedKind(req: NextRequest) {
  const value = req.headers.get("x-sablin-session-kind");
  return value === "admin" || value === "pharmacy" ? value : undefined;
}

function requireSyncAccess(req: NextRequest, operation: "read" | "write" = "read", pharmacySlug?: string | null) {
  const kind = requestedKind(req);
  const permission =
    kind === "admin"
      ? operation === "write"
        ? "admin.imports.manage"
        : "admin.imports.read"
      : operation === "write"
        ? "pharmacy.inventory.import"
        : "pharmacy.inventory.read";
  return requirePharmacyPermission(req, permission, { pharmacySlug });
}

function isAdmin(role: Parameters<typeof hasPharmacyPermission>[0]) {
  return hasPharmacyPermission(role, "admin.imports.read") || hasPharmacyPermission(role, "admin.pharmacies.manage_context");
}

function safeConfiguration(value?: string | null) {
  const config = decryptConnectorConfig(value);
  const safe: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(config)) {
    safe[key] = /secret|token|key|password|motdepasse|clientSecret/i.test(key) ? "••••••••" : item;
  }
  return safe;
}

function serializeConnection(connection: {
  id: string;
  pharmacy?: { name: string; slug: string; commune: string; district?: string | null } | null;
  connectorType: string;
  name: string;
  status: string;
  configurationEncrypted?: string | null;
  primaryMethod: string;
  fallbackMethod?: string | null;
  frequency: string;
  lastSyncAt?: Date | null;
  nextSyncAt?: Date | null;
  lastSuccessAt?: Date | null;
  lastErrorAt?: Date | null;
  lastErrorMessage?: string | null;
  healthStatus: string;
  lastRowsReceived: number;
  lastRowsValid: number;
  lastRowsRejected: number;
  lastRecognizedMedications: number;
  lastUnknownMedications: number;
  createdBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: connection.id,
    pharmacy: connection.pharmacy,
    connectorType: connection.connectorType,
    name: connection.name,
    status: connection.status,
    primaryMethod: connection.primaryMethod,
    fallbackMethod: connection.fallbackMethod,
    frequency: connection.frequency,
    lastSyncAt: connection.lastSyncAt,
    nextSyncAt: connection.nextSyncAt,
    lastSuccessAt: connection.lastSuccessAt,
    lastErrorAt: connection.lastErrorAt,
    lastErrorMessage: connection.lastErrorMessage,
    healthStatus: connection.healthStatus,
    lastRowsReceived: connection.lastRowsReceived,
    lastRowsValid: connection.lastRowsValid,
    lastRowsRejected: connection.lastRowsRejected,
    lastRecognizedMedications: connection.lastRecognizedMedications,
    lastUnknownMedications: connection.lastUnknownMedications,
    createdBy: connection.createdBy,
    createdAt: connection.createdAt,
    updatedAt: connection.updatedAt,
    safeConfiguration: safeConfiguration(connection.configurationEncrypted),
  };
}

async function resolvePharmacyForAccess(req: NextRequest, pharmacySlug?: string | null) {
  const access = requireSyncAccess(req, "read", pharmacySlug);
  if (access.response) return { access, response: access.response, pharmacy: null };
  const admin = isAdmin(access.role);
  const effectiveSlug = pharmacySlug || (admin ? null : access.session?.pharmacySlug);
  if (!admin && access.session?.kind === "pharmacy" && pharmacySlug && access.session.pharmacySlug !== pharmacySlug) {
    return {
      access,
      response: NextResponse.json({ error: "Une pharmacie ne peut consulter que sa propre synchronisation." }, { status: 403 }),
      pharmacy: null,
    };
  }
  if (!effectiveSlug) return { access, response: null, pharmacy: null };
  const pharmacy = await db.pharmacy.findUnique({ where: { slug: effectiveSlug } });
  if (!pharmacy) {
    return { access, response: NextResponse.json({ error: "Pharmacie introuvable." }, { status: 404 }), pharmacy: null };
  }
  await seedDefaultInventoryConnections(pharmacy.id, access.session?.name);
  return { access, response: null, pharmacy };
}

async function resolveWritablePharmacy(req: NextRequest, pharmacySlug?: string | null, pharmacyId?: string | null) {
  const access = requireSyncAccess(req, "write", pharmacySlug);
  if (access.response) return { access, response: access.response, pharmacy: null };
  const admin = isAdmin(access.role);
  const effectiveSlug = pharmacySlug || (admin ? null : access.session?.pharmacySlug);
  if (!admin && access.session?.kind === "pharmacy" && effectiveSlug && access.session.pharmacySlug !== effectiveSlug) {
    return {
      access,
      response: NextResponse.json({ error: "Une pharmacie ne peut modifier que sa propre synchronisation." }, { status: 403 }),
      pharmacy: null,
    };
  }
  const pharmacy = pharmacyId
    ? await db.pharmacy.findUnique({ where: { id: pharmacyId } })
    : effectiveSlug
      ? await db.pharmacy.findUnique({ where: { slug: effectiveSlug } })
      : null;
  if (!pharmacy) {
    return { access, response: NextResponse.json({ error: "Pharmacie introuvable." }, { status: 404 }), pharmacy: null };
  }
  if (!admin && access.session?.kind === "pharmacy" && access.session.pharmacySlug !== pharmacy.slug) {
    return {
      access,
      response: NextResponse.json({ error: "Une pharmacie ne peut gérer que sa propre pharmacie." }, { status: 403 }),
      pharmacy: null,
    };
  }
  await seedDefaultInventoryConnections(pharmacy.id, access.session?.name);
  return { access, response: null, pharmacy };
}

async function ensureConnectionAccess(req: NextRequest, connectionId: string, operation: "read" | "write" = "read") {
  const access = requireSyncAccess(req, operation);
  if (access.response) return { access, response: access.response, connection: null };
  const connection = await db.inventoryConnection.findUnique({
    where: { id: connectionId },
    include: { pharmacy: { select: { id: true, name: true, slug: true, commune: true, district: true } } },
  });
  if (!connection) {
    return { access, response: NextResponse.json({ error: "Connexion introuvable." }, { status: 404 }), connection: null };
  }
  if (!isAdmin(access.role) && access.session?.kind === "pharmacy" && access.session.pharmacySlug !== connection.pharmacy.slug) {
    return {
      access,
      response: NextResponse.json({ error: "Connexion réservée à une autre pharmacie." }, { status: 403 }),
      connection: null,
    };
  }
  return { access, response: null, connection };
}

async function rowsFromCurrentInventory(pharmacyId: string): Promise<ImportedMedicationRow[]> {
  const items = await db.pharmacyMedication.findMany({
    where: { pharmacyId },
    include: { medication: true },
    take: 100,
    orderBy: { lastUpdatedAt: "desc" },
  });
  return items.map((item, index) => ({
    lineNumber: index + 1,
    name: item.medication.name,
    genericName: item.medication.genericName,
    dosage: item.medication.dosage,
    form: item.medication.form,
    packaging: item.medication.packaging ?? item.medication.packSize,
    manufacturer: item.medication.manufacturer ?? "",
    barcode: item.medication.barcode ?? "",
    price: String(item.price),
    status: item.availabilityStatus,
    quantity: item.internalQuantity === null || item.internalQuantity === undefined ? "" : String(item.internalQuantity),
    threshold: item.lowStockThreshold === null || item.lowStockThreshold === undefined ? "" : String(item.lowStockThreshold),
    updatedAt: item.lastUpdatedAt.toISOString(),
    remark: item.remark ?? "",
  }));
}

async function logSyncAction(input: {
  scope: string;
  action: string;
  label: string;
  pharmacyId?: string | null;
  pharmacySlug?: string | null;
  entityType?: string;
  entityId?: string;
  actorRole?: string | null;
  actorName?: string | null;
  status?: string;
  message?: string;
  details?: unknown;
}) {
  await db.professionalActionLog.create({
    data: {
      scope: input.scope,
      action: input.action,
      label: input.label,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      pharmacyId: input.pharmacyId ?? null,
      pharmacySlug: input.pharmacySlug ?? null,
      actorRole: input.actorRole ?? null,
      status: input.status ?? "réussi",
      message: input.message ?? null,
      details: input.details ? JSON.stringify(input.details) : null,
      source: "Service de synchronisation des inventaires",
      comment: input.actorName ?? null,
    },
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pharmacySlug = searchParams.get("pharmacySlug");
  const { access, response, pharmacy } = await resolvePharmacyForAccess(req, pharmacySlug);
  if (response) return response;
  const admin = isAdmin(access.role);

  const pharmacyWhere = pharmacy ? { pharmacyId: pharmacy.id } : admin ? {} : { pharmacy: { slug: access.session?.pharmacySlug } };
  const [connections, jobs, conflicts, mappings] = await Promise.all([
    db.inventoryConnection.findMany({
      where: pharmacyWhere,
      include: { pharmacy: { select: { name: true, slug: true, commune: true, district: true } } },
      orderBy: { updatedAt: "desc" },
      take: 80,
    }),
    db.inventorySyncJob.findMany({
      where: pharmacyWhere,
      include: {
        pharmacy: { select: { name: true, slug: true, commune: true } },
        connection: { select: { name: true, connectorType: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
    db.inventoryConflict.findMany({
      where: pharmacyWhere,
      include: {
        pharmacy: { select: { name: true, slug: true, commune: true } },
        medication: { select: { name: true, dosage: true, form: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
    db.productMapping.findMany({
      where: pharmacyWhere,
      include: {
        pharmacy: { select: { name: true, slug: true } },
        medication: { select: { name: true, dosage: true, form: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 80,
    }),
  ]);

  return NextResponse.json({
    syncService: "Service de synchronisation des inventaires",
    methods: SYNC_METHODS,
    frequencies: SYNC_FREQUENCIES,
    pharmacy: pharmacy
      ? { id: pharmacy.id, name: pharmacy.name, slug: pharmacy.slug, commune: pharmacy.commune, status: pharmacy.accountStatus }
      : null,
    connections: connections.map(serializeConnection),
    jobs,
    conflicts,
    mappings,
    rules: {
      exactQuantityPublic: false,
      publicStatuses: ["Disponible", "Stock faible", "Rupture", "À confirmer"],
      unknownProducts: "Envoyés au moteur d’enrichissement et bloqués avant validation.",
      abnormalPrices: "Créent un conflit et restent à vérifier avant publication.",
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "");
  const pharmacySlug = body.pharmacySlug ? String(body.pharmacySlug) : undefined;
  const pharmacyId = body.pharmacyId ? String(body.pharmacyId) : undefined;

  if (action === "create-connection") {
    const { access, response, pharmacy } = await resolveWritablePharmacy(req, pharmacySlug, pharmacyId);
    if (response) return response;
    if (!pharmacy) return NextResponse.json({ error: "Pharmacie introuvable." }, { status: 404 });
    const connectorType = String(body.connectorType ?? "ManualConnector");
    const name = String(body.name ?? body.primaryMethod ?? connectorType).trim();
    const primaryMethod = String(body.primaryMethod ?? name).trim();
    if (!name || !primaryMethod) {
      return NextResponse.json({ error: "Nom et méthode principale obligatoires." }, { status: 400 });
    }
    const connection = await createInventoryConnection({
      pharmacyId: pharmacy.id,
      connectorType,
      name,
      primaryMethod,
      fallbackMethod: body.fallbackMethod ? String(body.fallbackMethod) : null,
      frequency: body.frequency ? String(body.frequency) : "Manuelle",
      configuration: typeof body.configuration === "object" && body.configuration ? body.configuration : {},
      createdBy: access.session?.name ?? null,
    });
    await logSyncAction({
      scope: isAdmin(access.role) ? "admin" : "pharmacy",
      action: "inventory-connection-created",
      label: "Connexion inventaire créée",
      pharmacyId: pharmacy.id,
      pharmacySlug: pharmacy.slug,
      entityType: "inventory-connection",
      entityId: connection.id,
      actorRole: access.role,
      actorName: access.session?.name,
      details: { connectorType, name, primaryMethod },
    });
    return NextResponse.json({ connection: serializeConnection({ ...connection, pharmacy }) }, { status: 201 });
  }

  if (action === "test-connection") {
    const connectionId = String(body.connectionId ?? "");
    const { access, response, connection } = await ensureConnectionAccess(req, connectionId, "write");
    if (response) return response;
    if (!connection) return NextResponse.json({ error: "Connexion introuvable." }, { status: 404 });
    const result = await testInventoryConnection(connection.id);
    await logSyncAction({
      scope: isAdmin(access.role) ? "admin" : "pharmacy",
      action: "inventory-connection-tested",
      label: "Connexion inventaire testée",
      pharmacyId: connection.pharmacy.id,
      pharmacySlug: connection.pharmacy.slug,
      entityType: "inventory-connection",
      entityId: connection.id,
      actorRole: access.role,
      actorName: access.session?.name,
      status: result.ok ? "réussi" : "échoué",
      message: result.message,
    });
    return NextResponse.json(result);
  }

  if (action === "sync-now") {
    const connectionId = body.connectionId ? String(body.connectionId) : "";
    const connectionAccess = connectionId ? await ensureConnectionAccess(req, connectionId, "write") : null;
    if (connectionAccess?.response) return connectionAccess.response;
    const { access, response, pharmacy } = connectionAccess?.connection
      ? { access: connectionAccess.access, response: null, pharmacy: await db.pharmacy.findUnique({ where: { id: connectionAccess.connection.pharmacy.id } }) }
      : await resolveWritablePharmacy(req, pharmacySlug, pharmacyId);
    if (response) return response;
    if (!pharmacy) return NextResponse.json({ error: "Pharmacie introuvable." }, { status: 404 });
    const rows = Array.isArray(body.rows) && body.rows.length ? (body.rows as ImportedMedicationRow[]) : await rowsFromCurrentInventory(pharmacy.id);
    if (!rows.length) {
      return NextResponse.json({ error: "Aucune ligne disponible pour synchroniser. Importez un fichier ou ajoutez des médicaments." }, { status: 400 });
    }
    const result = await syncInventory({
      pharmacyId: pharmacy.id,
      connectionId: connectionId || null,
      rows,
      triggerType: String(body.triggerType ?? "manual"),
      sourceSystem: String(body.sourceSystem ?? connectionAccess?.connection?.name ?? "Synchronisation manuelle"),
      mode: body.mode === "controlled_auto_publish" || body.mode === "preview" ? body.mode : "validate_before_publish",
      actor: access.session?.name ?? null,
    });
    await logSyncAction({
      scope: isAdmin(access.role) ? "admin" : "pharmacy",
      action: "inventory-sync-run",
      label: "Synchronisation inventaire lancée",
      pharmacyId: pharmacy.id,
      pharmacySlug: pharmacy.slug,
      entityType: "inventory-sync-job",
      entityId: result.jobId,
      actorRole: access.role,
      actorName: access.session?.name,
      status: result.status === "Terminée" ? "réussi" : "à vérifier",
      details: result,
    });
    return NextResponse.json({ result }, { status: 201 });
  }

  return NextResponse.json({ error: "Action de synchronisation inconnue." }, { status: 400 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "");

  if (action === "update-connection") {
    const connectionId = String(body.connectionId ?? "");
    const { access, response, connection } = await ensureConnectionAccess(req, connectionId, "write");
    if (response) return response;
    if (!connection) return NextResponse.json({ error: "Connexion introuvable." }, { status: 404 });
    const data: Record<string, unknown> = {};
    for (const field of ["name", "status", "primaryMethod", "fallbackMethod", "frequency", "healthStatus"] as const) {
      if (body[field] !== undefined) data[field] = String(body[field]);
    }
    if (body.configuration && typeof body.configuration === "object") {
      data.configurationEncrypted = encryptConnectorConfig(body.configuration as Record<string, unknown>);
    }
    if (body.frequency) {
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
      data.nextSyncAt = minutes[String(body.frequency)] ? new Date(now + minutes[String(body.frequency)] * 60 * 1000) : null;
    }
    const updated = await db.inventoryConnection.update({
      where: { id: connection.id },
      data,
      include: { pharmacy: { select: { name: true, slug: true, commune: true, district: true } } },
    });
    await logSyncAction({
      scope: isAdmin(access.role) ? "admin" : "pharmacy",
      action: "inventory-connection-updated",
      label: "Connexion inventaire modifiée",
      pharmacyId: connection.pharmacy.id,
      pharmacySlug: connection.pharmacy.slug,
      entityType: "inventory-connection",
      entityId: connection.id,
      actorRole: access.role,
      actorName: access.session?.name,
      details: { fields: Object.keys(data).filter((field) => field !== "configurationEncrypted") },
    });
    return NextResponse.json({ connection: serializeConnection(updated) });
  }

  if (action === "resolve-conflict") {
    const conflictId = String(body.conflictId ?? "");
    const access = requireSyncAccess(req, "write");
    if (access.response) return access.response;
    const conflict = await db.inventoryConflict.findUnique({
      where: { id: conflictId },
      include: { pharmacy: true, medication: true },
    });
    if (!conflict) return NextResponse.json({ error: "Conflit introuvable." }, { status: 404 });
    if (!isAdmin(access.role) && access.session?.kind === "pharmacy" && access.session.pharmacySlug !== conflict.pharmacy.slug) {
      return NextResponse.json({ error: "Conflit réservé à une autre pharmacie." }, { status: 403 });
    }
    const resolution = String(body.resolution ?? "Marquer à confirmer");
    await db.inventoryConflict.update({
      where: { id: conflict.id },
      data: {
        status: "Résolu",
        resolvedBy: access.session?.name ?? null,
        resolvedAt: new Date(),
        resolution,
      },
    });
    if (resolution === "Marquer à confirmer" && conflict.medicationId) {
      await db.pharmacyMedication.updateMany({
        where: { pharmacyId: conflict.pharmacyId, medicationId: conflict.medicationId },
        data: {
          availabilityStatus: "À confirmer",
          reliabilityLevel: "À vérifier",
          publicationStatus: "À vérifier",
          lastUpdatedAt: new Date(),
        },
      });
    }
    await logSyncAction({
      scope: isAdmin(access.role) ? "admin" : "pharmacy",
      action: "inventory-conflict-resolved",
      label: "Conflit de synchronisation résolu",
      pharmacyId: conflict.pharmacyId,
      pharmacySlug: conflict.pharmacy.slug,
      entityType: "inventory-conflict",
      entityId: conflict.id,
      actorRole: access.role,
      actorName: access.session?.name,
      details: { conflictType: conflict.conflictType, resolution },
    });
    return NextResponse.json({ ok: true, resolution });
  }

  if (action === "validate-mapping") {
    const mappingId = String(body.mappingId ?? "");
    const access = requireSyncAccess(req, "write");
    if (access.response) return access.response;
    const mapping = await db.productMapping.findUnique({ where: { id: mappingId }, include: { pharmacy: true } });
    if (!mapping) return NextResponse.json({ error: "Correspondance introuvable." }, { status: 404 });
    if (!isAdmin(access.role) && access.session?.kind === "pharmacy" && access.session.pharmacySlug !== mapping.pharmacy.slug) {
      return NextResponse.json({ error: "Correspondance réservée à une autre pharmacie." }, { status: 403 });
    }
    const updated = await db.productMapping.update({
      where: { id: mapping.id },
      data: { status: "Validée", validatedAt: new Date(), validatedBy: access.session?.name ?? null },
      include: { medication: true, pharmacy: true },
    });
    return NextResponse.json({ mapping: updated });
  }

  return NextResponse.json({ error: "Action de mise à jour inconnue." }, { status: 400 });
}
