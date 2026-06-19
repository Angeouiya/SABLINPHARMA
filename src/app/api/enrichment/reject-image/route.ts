import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePharmacyPermission } from "@/lib/pharmacy-access";

export async function POST(req: NextRequest) {
  const access = requirePharmacyPermission(req, "admin.medications.update");
  if (access.response) return access.response;
  const body = await req.json().catch(() => ({}));
  const imageId = String(body.imageId ?? "").trim();
  const candidateId = String(body.candidateId ?? "").trim();
  if (!imageId && !candidateId) return NextResponse.json({ error: "Image ou candidat obligatoire." }, { status: 400 });
  const [image, candidate] = await Promise.all([
    imageId
      ? db.medicationImage.update({
          where: { id: imageId },
          data: { validationStatus: "Refusée", validatedBy: access.session?.name ?? access.role ?? null, validatedAt: new Date() },
        })
      : null,
    candidateId
      ? db.enrichmentCandidate.update({
          where: { id: candidateId },
          data: { status: "Refusé", reviewedBy: access.session?.name ?? access.role ?? null, reviewedAt: new Date() },
        })
      : null,
  ]);
  return NextResponse.json({ image, candidate, message: "Image refusée et bloquée côté public." });
}
