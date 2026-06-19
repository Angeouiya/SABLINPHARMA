import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hasPharmacyPermission, requirePharmacyPermission } from "@/lib/pharmacy-access";
import { IMPORT_TEMPLATE_COLUMNS, PUBLIC_AVAILABILITY_STATUSES } from "@/lib/pharmacy-platform";
import { confirmImportFromRequest } from "@/lib/marketplace-api";

export async function GET(req: NextRequest) {
  const access = requirePharmacyPermission(req, "import_inventory");
  if (access.response) return access.response;

  const { searchParams } = new URL(req.url);
  const pharmacySlug = searchParams.get("pharmacySlug") ?? undefined;
  const imports = await db.pharmacyImport.findMany({
    where: pharmacySlug
      ? { pharmacy: { slug: pharmacySlug } }
      : hasPharmacyPermission(access.role, "view_all_pharmacies")
        ? {}
        : { pharmacy: { slug: access.session?.pharmacySlug } },
    include: { pharmacy: { select: { name: true, slug: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    templateColumns: IMPORT_TEMPLATE_COLUMNS,
    acceptedStatuses: PUBLIC_AVAILABILITY_STATUSES,
    acceptedFormats: ["XLSX", "XLS", "CSV", "DOCX", "PPTX"],
    imports,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { result, response } = await confirmImportFromRequest(req);
    if (response) return response;
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Import inventaire impossible." },
      { status: 400 }
    );
  }
}
