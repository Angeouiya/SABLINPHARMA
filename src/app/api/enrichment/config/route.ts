import { NextRequest, NextResponse } from "next/server";
import { getEnrichmentConfig } from "@/lib/enrichment/config";
import { getExternalEnrichmentAdminStatus, recordExternalEnrichmentTest } from "@/lib/enrichment/enrichment-service";
import { googleImageSearchProvider } from "@/lib/enrichment/google-image-search-provider";
import { requirePharmacyPermission } from "@/lib/pharmacy-access";

export async function GET(req: NextRequest) {
  const access = requirePharmacyPermission(req, "admin.medications.read");
  if (access.response) return access.response;
  const status = await getExternalEnrichmentAdminStatus();
  return NextResponse.json({ status });
}

export async function POST(req: NextRequest) {
  const access = requirePharmacyPermission(req, "admin.medications.update");
  if (access.response) return access.response;
  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "test");
  if (action !== "test") {
    return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
  }

  const config = getEnrichmentConfig();
  if (config.providerStatus !== "active") {
    await recordExternalEnrichmentTest({ ok: false, message: config.reason });
    return NextResponse.json({
      ok: false,
      status: await getExternalEnrichmentAdminStatus(),
      message: config.reason,
    });
  }

  const test = await googleImageSearchProvider.searchImages(
    {
      name: "Paracétamol",
      genericName: "Paracétamol",
      dosage: "500 mg",
      form: "Comprimé",
      packaging: "Boîte",
    },
    { maxResults: 1 }
  );
  const ok = test.provider === "Google Custom Search API";
  await recordExternalEnrichmentTest({
    ok,
    message: ok ? "Test Google/Web réussi." : test.message,
  });

  return NextResponse.json({
    ok,
    status: await getExternalEnrichmentAdminStatus(),
    candidatesFound: test.candidates.length,
    message: ok ? "Configuration Google/Web testée côté serveur." : test.message,
  });
}

