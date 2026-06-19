import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hasPharmacyPermission, requirePharmacyPermission } from "@/lib/pharmacy-access";
import { requestedProfessionalKind } from "@/lib/marketplace-api";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const kind = requestedProfessionalKind(req);
  const access = requirePharmacyPermission(req, kind === "admin" ? "admin.medications.read" : "pharmacy.inventory.read");
  if (access.response) return access.response;
  const candidate = await db.enrichmentCandidate.findUnique({
    where: { id },
    include: {
      proposedMedication: true,
      job: { include: { medication: true, inventoryImportRow: { include: { pharmacy: true } } } },
    },
  });
  if (!candidate) return NextResponse.json({ error: "Candidat introuvable." }, { status: 404 });
  const rowPharmacySlug = candidate.job.inventoryImportRow?.pharmacy.slug;
  if (!hasPharmacyPermission(access.role, "view_all_pharmacies") && rowPharmacySlug && rowPharmacySlug !== access.session?.pharmacySlug) {
    return NextResponse.json({ error: "Accès réservé à votre pharmacie." }, { status: 403 });
  }
  return NextResponse.json({ candidate });
}
