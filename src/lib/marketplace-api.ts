import { NextRequest, NextResponse } from "next/server";
import { hasPharmacyPermission, requirePharmacyPermission, type PharmacyPermission } from "@/lib/pharmacy-access";
import {
  buildMarketplacePreview,
  confirmMarketplaceImport,
  extractMarketplaceRowsFromBuffer,
  validateMarketplaceImportFile,
  type MarketplaceParsedRow,
} from "@/lib/marketplace-engine";

export function requestedProfessionalKind(req: NextRequest) {
  return req.headers.get("x-sablin-session-kind") === "admin" ? "admin" : "pharmacy";
}

export function requireMarketplaceAccess(
  req: NextRequest,
  permission: PharmacyPermission,
  pharmacySlug?: string | null
) {
  const access = requirePharmacyPermission(req, permission, { pharmacySlug });
  if (access.response) return { access, response: access.response, pharmacySlug: null };
  const effectiveSlug = pharmacySlug || access.session?.activePharmacySlug || access.session?.pharmacySlug || null;
  if (!effectiveSlug && !hasPharmacyPermission(access.role, "view_all_pharmacies")) {
    return {
      access,
      response: NextResponse.json({ error: "Pharmacie cible obligatoire." }, { status: 400 }),
      pharmacySlug: null,
    };
  }
  if (
    access.session?.kind === "pharmacy" &&
    effectiveSlug &&
    access.session.pharmacySlug !== effectiveSlug &&
    !hasPharmacyPermission(access.role, "view_all_pharmacies")
  ) {
    return {
      access,
      response: NextResponse.json({ error: "Une pharmacie ne peut gérer que son propre inventaire." }, { status: 403 }),
      pharmacySlug: null,
    };
  }
  return { access, response: null, pharmacySlug: effectiveSlug };
}

export async function parseMultipartImport(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return { response: NextResponse.json({ error: "Requête multipart/form-data attendue." }, { status: 400 }) };
  }
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return { response: NextResponse.json({ error: "Fichier inventaire obligatoire." }, { status: 400 }) };
  }
  const validation = validateMarketplaceImportFile({ fileName: file.name, mimeType: file.type, size: file.size });
  if (!validation.ok) {
    return { response: NextResponse.json({ error: validation.error }, { status: 400 }) };
  }
  const pharmacySlug = String(form.get("pharmacySlug") ?? "").trim();
  const accessCheck = requireMarketplaceAccess(req, "import_inventory", pharmacySlug);
  if (accessCheck.response) return { response: accessCheck.response };
  if (!accessCheck.pharmacySlug) {
    return { response: NextResponse.json({ error: "Pharmacie cible obligatoire pour importer un inventaire." }, { status: 400 }) };
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const rows = await extractMarketplaceRowsFromBuffer({ buffer, fileName: file.name, mimeType: file.type });
    const preview = await buildMarketplacePreview({ fileName: file.name, fileType: file.name.split(".").pop() ?? "CSV", rows });
    return {
      form,
      file,
      pharmacySlug: accessCheck.pharmacySlug ?? pharmacySlug,
      rows,
      preview,
      access: accessCheck.access,
      response: null,
    };
  } catch (error) {
    return {
      response: NextResponse.json(
        { error: error instanceof Error ? error.message : "Fichier impossible à traiter." },
        { status: 400 }
      ),
    };
  }
}

export async function confirmImportFromRequest(req: NextRequest) {
  if ((req.headers.get("content-type") ?? "").includes("multipart/form-data")) {
    const parsed = await parseMultipartImport(req);
    if (parsed.response) return { response: parsed.response };
    const result = await confirmMarketplaceImport({
      pharmacySlug: parsed.pharmacySlug,
      fileName: parsed.file.name,
      fileType: parsed.file.name.split(".").pop() ?? "CSV",
      rows: parsed.rows,
      role: hasPharmacyPermission(parsed.access.role, "view_all_pharmacies") ? "admin" : "pharmacy",
      actorName: parsed.access.session?.name ?? null,
      actorRole: parsed.access.role ?? null,
    });
    return { result, response: null };
  }

  const body = await req.json().catch(() => ({}));
  const pharmacySlug = String(body.pharmacySlug ?? "").trim();
  const { access, response, pharmacySlug: effectiveSlug } = requireMarketplaceAccess(req, "import_inventory", pharmacySlug);
  if (response) return { response };
  const rows = Array.isArray(body.rows) ? (body.rows as MarketplaceParsedRow[]) : [];
  if (!rows.length) {
    return { response: NextResponse.json({ error: "Aucune ligne importée à confirmer." }, { status: 400 }) };
  }
  const result = await confirmMarketplaceImport({
    pharmacySlug: effectiveSlug ?? pharmacySlug,
    fileName: String(body.fileName ?? "inventaire-sablin.csv"),
    fileType: String(body.fileType ?? "CSV"),
    rows,
    role: hasPharmacyPermission(access.role, "view_all_pharmacies") ? "admin" : "pharmacy",
    actorName: access.session?.name ?? null,
    actorRole: access.role ?? null,
  });
  return { result, response: null };
}
