import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { canPublishMedicationImage } from "@/lib/enrichment/publication-guard";
import { requirePharmacyPermission } from "@/lib/pharmacy-access";

export async function POST(req: NextRequest) {
  const access = requirePharmacyPermission(req, "admin.medications.update");
  if (access.response) return access.response;
  const body = await req.json().catch(() => ({}));
  const medicationId = String(body.medicationId ?? "").trim();
  const imageId = String(body.imageId ?? "").trim();
  const descriptionId = String(body.descriptionId ?? "").trim();
  if (!medicationId && !imageId && !descriptionId) {
    return NextResponse.json({ error: "Élément à publier obligatoire." }, { status: 400 });
  }

  const existingImage = imageId ? await db.medicationImage.findUnique({ where: { id: imageId } }) : null;
  if (imageId && !existingImage) {
    return NextResponse.json({ error: "Image introuvable." }, { status: 404 });
  }
  if (existingImage) {
    const publication = canPublishMedicationImage(existingImage);
    if (!publication.allowed) return NextResponse.json({ error: publication.reason }, { status: 400 });
  }
  const image = existingImage
    ? await db.medicationImage.update({
        where: { id: existingImage.id },
        data: { validationStatus: "Publiée", isPrimary: true, validatedBy: access.session?.name ?? access.role ?? null, validatedAt: new Date() },
      })
    : null;
  const description = descriptionId
    ? await db.medicationDescription.update({
        where: { id: descriptionId },
        data: { validationStatus: "Publiée", validatedBy: access.session?.name ?? access.role ?? null, validatedAt: new Date() },
      })
    : null;
  const targetMedicationId = medicationId || image?.medicationId || description?.medicationId;
  const medication = targetMedicationId
    ? await db.medication.update({
        where: { id: targetMedicationId },
        data: {
          verificationStatus: "Publié",
          status: "Actif",
          imageUrl: image?.url,
          shortDescription: description?.shortText,
          description: description?.longText ?? description?.shortText,
          verifiedAt: new Date(),
          verifiedBy: access.session?.name ?? access.role ?? null,
        },
      })
    : null;
  return NextResponse.json({ medication, image, description, message: "Produit enrichi publié côté marketplace utilisateur." });
}
