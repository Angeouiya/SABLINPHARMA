import { NextRequest, NextResponse } from "next/server";
import { parseMultipartImport, requireMarketplaceAccess } from "@/lib/marketplace-api";

export async function POST(req: NextRequest) {
  const parsed = await parseMultipartImport(req);
  if (parsed.response) return parsed.response;
  const { response } = requireMarketplaceAccess(req, "import_inventory", parsed.pharmacySlug);
  if (response) return response;
  return NextResponse.json({
    upload: {
      fileName: parsed.file.name,
      fileType: parsed.file.name.split(".").pop()?.toUpperCase(),
      totalRows: parsed.preview.totalRows,
      status: "Aperçu prêt",
    },
    preview: parsed.preview,
    rows: parsed.rows,
  });
}
