import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { INTERNAL_MEDIA_TYPES, PUBLIC_MEDIA_TYPES } from "@/lib/pharmacy-platform";
import { hasPharmacyPermission, requirePharmacyPermission } from "@/lib/pharmacy-access";

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function normalizeVisibility(value: FormDataEntryValue | null) {
  const visibility = String(value ?? "internal");
  return ["public", "admin_only", "internal"].includes(visibility) ? visibility : "internal";
}

function extensionFromFile(file: File) {
  const original = file.name.split(".").pop()?.toLowerCase();
  if (original && /^[a-z0-9]+$/.test(original)) return original;
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "bin";
}

export async function POST(req: NextRequest) {
  const access = requirePharmacyPermission(req, "manage_own_profile");
  if (access.response) return access.response;

  const form = await req.formData();
  const file = form.get("file");
  const pharmacySlug = String(form.get("pharmacySlug") ?? "").trim();
  const type = String(form.get("type") ?? "facade").trim();
  const title = String(form.get("title") ?? "Image pharmacie").trim();
  const description = String(form.get("description") ?? "").trim() || null;
  const altText = String(form.get("altText") ?? title).trim() || title;
  const visibility = normalizeVisibility(form.get("visibility"));
  const usage = String(form.get("usage") ?? "").trim() || null;
  const containsSensitiveData = String(form.get("containsSensitiveData") ?? "false") === "true";
  const isPrimary = String(form.get("isPrimary") ?? "false") === "true";
  const displayOrder = Number(form.get("displayOrder") ?? 0);

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
  }
  if (!pharmacySlug) {
    return NextResponse.json({ error: "Pharmacie obligatoire pour charger un média." }, { status: 400 });
  }
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Format non autorisé. Utilisez JPEG, JPG, PNG ou WEBP." }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Fichier trop lourd. Taille maximale : 8 Mo." }, { status: 400 });
  }
  if (
    !hasPharmacyPermission(access.role, "view_all_pharmacies") &&
    access.session?.kind === "pharmacy" &&
    access.session.pharmacySlug !== pharmacySlug
  ) {
    return NextResponse.json({ error: "Une pharmacie ne peut charger que ses propres photos." }, { status: 403 });
  }

  const isAdminOnlyType = INTERNAL_MEDIA_TYPES.includes(type as never);
  if ((isAdminOnlyType || visibility === "admin_only") && !hasPharmacyPermission(access.role, "view_all_pharmacies")) {
    return NextResponse.json(
      { error: "Les documents administratifs sont réservés à l’administration SABLIN PHARMA." },
      { status: 403 }
    );
  }

  const pharmacy = await db.pharmacy.findUnique({ where: { slug: pharmacySlug } });
  if (!pharmacy) {
    return NextResponse.json({ error: "Pharmacie introuvable." }, { status: 404 });
  }

  const ext = extensionFromFile(file);
  const safeName = `${type}-${randomUUID()}.${ext}`;
  const relativeDir = `/uploads/pharmacies/${pharmacy.slug}`;
  const diskDir = path.join(process.cwd(), "public", "uploads", "pharmacies", pharmacy.slug);
  await mkdir(diskDir, { recursive: true });

  const bytes = await file.arrayBuffer();
  await writeFile(path.join(diskDir, safeName), Buffer.from(bytes));

  const isAdmin = hasPharmacyPermission(access.role, "validate_pharmacy");
  const isPublicType = PUBLIC_MEDIA_TYPES.includes(type as never);
  const isImage = file.type.startsWith("image/");
  const isValidated = isAdmin || visibility !== "public" ? isAdmin : false;
  const validationStatus = isValidated ? "Validée" : "En attente";
  const isPublic =
    isAdmin &&
    isImage &&
    isPublicType &&
    visibility === "public" &&
    !containsSensitiveData;
  const url = `${relativeDir}/${safeName}`;

  const media = await db.pharmacyMedia.create({
    data: {
      pharmacyId: pharmacy.id,
      type,
      title,
      description,
      altText,
      url,
      visibility,
      usage,
      validationStatus,
      displayOrder: Number.isFinite(displayOrder) ? displayOrder : 0,
      isPrimary,
      isPublic,
      isValidated,
      containsSensitiveData: containsSensitiveData || !isImage,
      uploadedByRole: access.role ?? "Pharmacien responsable",
      uploadedByName: access.session?.role ?? access.role ?? null,
      originalFileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
    },
  });

  if (media.isPublic && (media.isPrimary || ["facade", "logo", "cover", "exterior", "entrance"].includes(media.type))) {
    await db.pharmacy.update({
      where: { id: pharmacy.id },
      data: { imageUrl: media.url, dataQuality: "Données à jour", lastDataUpdate: new Date() },
    });
  }

  return NextResponse.json({ media }, { status: 201 });
}
