import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hasPharmacyPermission, requirePharmacyPermission } from "@/lib/pharmacy-access";
import { requestedProfessionalKind } from "@/lib/marketplace-api";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const kind = requestedProfessionalKind(req);
  const pharmacySlug = searchParams.get("pharmacySlug") ?? undefined;
  const access = requirePharmacyPermission(req, kind === "admin" ? "admin.medications.read" : "pharmacy.inventory.read", { pharmacySlug });
  if (access.response) return access.response;
  const where = hasPharmacyPermission(access.role, "view_all_pharmacies")
    ? pharmacySlug
      ? { inventoryImportRow: { pharmacy: { slug: pharmacySlug } } }
      : {}
    : { inventoryImportRow: { pharmacy: { slug: access.session?.pharmacySlug } } };
  const jobs = await db.enrichmentJob.findMany({
    where,
    include: {
      medication: { select: { id: true, name: true, slug: true, dosage: true, form: true } },
      inventoryImportRow: { include: { pharmacy: { select: { name: true, slug: true } } } },
      candidates: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ jobs });
}
