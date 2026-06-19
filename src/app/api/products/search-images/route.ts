import { NextRequest, NextResponse } from "next/server";
import { requirePharmacyPermission } from "@/lib/pharmacy-access";
import { requestedProfessionalKind } from "@/lib/marketplace-api";
import { searchImageCandidatesForMedication } from "@/lib/marketplace-engine";

export async function POST(req: NextRequest) {
  const kind = requestedProfessionalKind(req);
  const access = requirePharmacyPermission(req, kind === "admin" ? "admin.medications.read" : "pharmacy.inventory.read");
  if (access.response) return access.response;
  const body = await req.json().catch(() => ({}));
  const medicationId = String(body.medicationId ?? "").trim();
  if (!medicationId) return NextResponse.json({ error: "Médicament obligatoire." }, { status: 400 });
  try {
    const result = await searchImageCandidatesForMedication(medicationId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Recherche image impossible." },
      { status: 400 }
    );
  }
}
