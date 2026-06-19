import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hasPharmacyPermission, requirePharmacyPermission } from "@/lib/pharmacy-access";
import { requestedProfessionalKind } from "@/lib/marketplace-api";
import { startMarketplaceEnrichment } from "@/lib/marketplace-engine";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const kind = requestedProfessionalKind(req);
  const pharmacySlug = String(body.pharmacySlug ?? "").trim() || undefined;
  const access = requirePharmacyPermission(req, kind === "admin" ? "admin.medications.update" : "import_inventory", { pharmacySlug });
  if (access.response) return access.response;

  const directIds = Array.isArray(body.medicationIds)
    ? body.medicationIds.map(String)
    : body.medicationId
      ? [String(body.medicationId)]
      : [];
  const rowIds = Array.isArray(body.importRowIds) ? body.importRowIds.map(String) : [];
  const rows = rowIds.length
    ? await db.inventoryImportRow.findMany({
        where: hasPharmacyPermission(access.role, "view_all_pharmacies")
          ? { id: { in: rowIds } }
          : { id: { in: rowIds }, pharmacy: { slug: access.session?.pharmacySlug } },
        select: { medicationId: true },
      })
    : [];
  let medicationIds = [...directIds, ...rows.map((row) => row.medicationId).filter(Boolean) as string[]];
  if (!medicationIds.length && (body.missingImagesOnly === true || kind === "admin")) {
    const limit = Math.min(Math.max(Number(body.limit ?? 40), 1), 80);
    const medications = await db.medication.findMany({
      where: {
        status: "Actif",
        images: { none: { validationStatus: "Publiée", isPlaceholder: false } },
      },
      select: { id: true },
      orderBy: { name: "asc" },
      take: limit,
    });
    medicationIds = medications.map((medication) => medication.id);
  }
  if (!medicationIds.length) {
    return NextResponse.json({ error: "Aucun médicament à enrichir. Les produits disposent déjà d’images publiées ou aucun médicament n’est reconnu." }, { status: 400 });
  }

  try {
    const jobs = await startMarketplaceEnrichment({
      medicationIds,
      actorName: access.session?.name ?? null,
      provider: "Moteur Marketplace & Enrichissement SABLIN",
    });
    return NextResponse.json({ jobs, status: "Enrichissement lancé", count: jobs.length }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Enrichissement impossible." },
      { status: 400 }
    );
  }
}
