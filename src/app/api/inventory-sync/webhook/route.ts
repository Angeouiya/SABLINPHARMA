import { createHash, createHmac } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptConnectorConfig, syncInventory } from "@/lib/inventory-sync";
import type { ImportedMedicationRow } from "@/lib/medication-enrichment";

function safeCompare(left: string, right: string) {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return result === 0;
}

function payloadHash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function isValidSignature(body: string, secret?: unknown, signature?: string | null) {
  if (!secret) return true;
  if (!signature) return false;
  const expected = `sha256=${createHmac("sha256", String(secret)).update(body).digest("hex")}`;
  return safeCompare(expected, signature);
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const payload = JSON.parse(rawBody || "{}") as {
    connectionId?: string;
    rows?: ImportedMedicationRow[];
    sourceSystem?: string;
    mode?: "preview" | "validate_before_publish" | "controlled_auto_publish";
  };
  const connectionId = String(payload.connectionId ?? "");
  if (!connectionId) {
    return NextResponse.json({ error: "Connexion webhook obligatoire." }, { status: 400 });
  }

  const connection = await db.inventoryConnection.findUnique({
    where: { id: connectionId },
    include: { pharmacy: true },
  });
  if (!connection || connection.status === "Suspendue" || connection.status === "Désactivée") {
    return NextResponse.json({ error: "Connexion webhook inactive ou introuvable." }, { status: 404 });
  }

  const config = decryptConnectorConfig(connection.configurationEncrypted);
  if (!isValidSignature(rawBody, config.webhookSecret, req.headers.get("x-sablin-signature"))) {
    await db.inventoryConnection.update({
      where: { id: connection.id },
      data: {
        status: "Erreur",
        healthStatus: "Signature invalide",
        lastErrorAt: new Date(),
        lastErrorMessage: "Signature webhook invalide",
      },
    });
    return NextResponse.json({ error: "Signature webhook invalide." }, { status: 401 });
  }

  const idempotencyKey =
    req.headers.get("idempotency-key") || req.headers.get("x-sablin-idempotency-key") || payloadHash(rawBody);
  const duplicate = await db.professionalActionLog.findFirst({
    where: { action: "inventory-webhook-received", entityId: idempotencyKey },
  });
  if (duplicate) {
    return NextResponse.json({ duplicate: true, message: "Webhook déjà traité." });
  }

  const rows = Array.isArray(payload.rows) ? payload.rows.slice(0, 1000) : [];
  if (!rows.length) {
    return NextResponse.json({ error: "Aucune ligne d’inventaire reçue." }, { status: 400 });
  }

  const result = await syncInventory({
    pharmacyId: connection.pharmacyId,
    connectionId: connection.id,
    rows,
    triggerType: "webhook",
    sourceSystem: payload.sourceSystem || connection.name,
    mode: payload.mode === "controlled_auto_publish" ? "controlled_auto_publish" : "validate_before_publish",
    actor: "Webhook serveur",
  });

  await db.professionalActionLog.create({
    data: {
      scope: "pharmacy",
      action: "inventory-webhook-received",
      label: "Webhook inventaire reçu",
      entityType: "inventory-webhook",
      entityId: idempotencyKey,
      pharmacyId: connection.pharmacyId,
      pharmacySlug: connection.pharmacy.slug,
      actorRole: "Connecteur logiciel",
      status: result.status === "Terminée" ? "réussi" : "à vérifier",
      message: "Synchronisation webhook traitée côté serveur.",
      source: "Service de synchronisation des inventaires",
      details: JSON.stringify({ connectionId: connection.id, jobId: result.jobId, totalRows: result.totalRows }),
    },
  });

  return NextResponse.json({ result }, { status: 201 });
}
