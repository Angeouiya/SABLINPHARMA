import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePharmacyPermission } from "@/lib/pharmacy-access";

export async function POST(req: NextRequest) {
  const access = requirePharmacyPermission(req, "admin.medications.update");
  if (access.response) return access.response;
  const body = await req.json().catch(() => ({}));
  const imageId = String(body.imageId ?? "").trim();
  if (!imageId) return NextResponse.json({ error: "Image obligatoire." }, { status: 400 });
  const image = await db.medicationImage.update({
    where: { id: imageId },
    data: {
      validationStatus: "Validée",
      licenseType: String(body.licenseType ?? "Licence vérifiée"),
      licenseUrl: String(body.licenseUrl ?? "") || null,
      attributionText: String(body.attributionText ?? "") || null,
      commercialUseAllowed: Boolean(body.commercialUseAllowed),
      validatedBy: access.session?.name ?? access.role ?? null,
      validatedAt: new Date(),
    },
  });
  return NextResponse.json({ image, message: "Image validée. Publication séparée obligatoire." });
}
