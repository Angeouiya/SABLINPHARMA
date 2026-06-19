import { NextRequest, NextResponse } from "next/server";
import { parseMultipartImport, requireMarketplaceAccess } from "@/lib/marketplace-api";

export async function POST(req: NextRequest) {
  const parsed = await parseMultipartImport(req);
  if (parsed.response) return parsed.response;
  const { response } = requireMarketplaceAccess(req, "import_inventory", parsed.pharmacySlug);
  if (response) return response;
  return NextResponse.json({
    fileName: parsed.file.name,
    rows: parsed.rows,
    detectedColumns: parsed.preview.detectedColumns,
    totalRows: parsed.preview.totalRows,
  });
}
