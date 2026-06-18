import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePharmacyPermission } from "@/lib/pharmacy-access";
import { writeAudit } from "@/lib/professional-auth";

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function extensionFromFile(file: File) {
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "bin";
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const pharmacySlug = String(form.get("pharmacySlug") ?? "").trim();
  const medicationId = String(form.get("medicationId") ?? "").trim();
  const access = requirePharmacyPermission(req, "pharmacy.images.create", { pharmacySlug });
  if (access.response) return access.response;

  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Photo médicament obligatoire." }, { status: 400 });
  if (!medicationId || !pharmacySlug) return NextResponse.json({ error: "Médicament et pharmacie obligatoires." }, { status: 400 });
  if (!ALLOWED_MIME_TYPES.has(file.type)) return NextResponse.json({ error: "Format autorisé : JPEG, PNG ou WEBP." }, { status: 400 });
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "Fichier trop lourd. Taille maximale : 8 Mo." }, { status: 400 });

  const [pharmacy, medication] = await Promise.all([
    db.pharmacy.findUnique({ where: { slug: pharmacySlug } }),
    db.medication.findUnique({ where: { id: medicationId } }),
  ]);
  if (!pharmacy || !medication) return NextResponse.json({ error: "Pharmacie ou médicament introuvable." }, { status: 404 });

  const ext = extensionFromFile(file);
  const safeName = `medication-${medication.slug}-${randomUUID()}.${ext}`;
  const relativeDir = `/uploads/medications/${medication.slug}`;
  const diskDir = path.join(process.cwd(), "public", "uploads", "medications", medication.slug);
  await mkdir(diskDir, { recursive: true });
  await writeFile(path.join(diskDir, safeName), Buffer.from(await file.arrayBuffer()));

  const image = await db.medicationImage.create({
    data: {
      medicationId: medication.id,
      url: `${relativeDir}/${safeName}`,
      storagePath: `${relativeDir}/${safeName}`,
      sourceName: pharmacy.name,
      sourceUrl: `/pharmacies/${pharmacy.slug}`,
      imageType: "pharmacy_photo",
      licenseType: "Image fournie par la pharmacie",
      commercialUseAllowed: false,
      modificationAllowed: false,
      isPrimary: false,
      width: null,
      height: null,
      confidenceScore: 60,
      validationStatus: "En attente",
    },
  });
  await writeAudit({
    req,
    platform: access.session?.kind ?? "pharmacy",
    action: "medication-photo-submitted",
    entityType: "medication-image",
    entityId: image.id,
    pharmacyId: pharmacy.id,
    actorAccountId: access.session?.accountId,
    actorName: access.session?.name,
    actorRole: access.role ?? undefined,
    newValue: { medication: medication.name, fileName: file.name },
  });
  return NextResponse.json({ image, message: "Photo envoyée. Publication après validation administrative uniquement." }, { status: 201 });
}
