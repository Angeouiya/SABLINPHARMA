import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { INTERNAL_MEDIA_TYPES, PUBLIC_MEDIA_TYPES } from "@/lib/pharmacy-platform";
import { hasPharmacyPermission, requirePharmacyPermission } from "@/lib/pharmacy-access";

function normalizeVisibility(value: unknown) {
  const visibility = String(value ?? "internal");
  return ["public", "admin_only", "internal"].includes(visibility) ? visibility : "internal";
}

function isPublicEligible(media: {
  type: string;
  visibility: string;
  containsSensitiveData: boolean;
}) {
  return (
    media.visibility === "public" &&
    !media.containsSensitiveData &&
    PUBLIC_MEDIA_TYPES.includes(media.type as never)
  );
}

async function refreshPharmacyImage(pharmacyId: string) {
  const featured = await db.pharmacyMedia.findFirst({
    where: {
      pharmacyId,
      isPublic: true,
      isValidated: true,
      validationStatus: "Validée",
      visibility: "public",
      containsSensitiveData: false,
      type: { in: [...PUBLIC_MEDIA_TYPES] },
    },
    orderBy: [{ isPrimary: "desc" }, { displayOrder: "asc" }, { createdAt: "desc" }],
  });

  await db.pharmacy.update({
    where: { id: pharmacyId },
    data: {
      imageUrl: featured?.url ?? null,
      lastDataUpdate: new Date(),
      dataQuality: featured ? "Données à jour" : "Données incomplètes",
    },
  });
}

async function logMediaAction(params: {
  access: ReturnType<typeof requirePharmacyPermission>;
  mediaId: string;
  pharmacyId: string;
  pharmacySlug: string;
  action: string;
  label: string;
  status?: string;
  message?: string;
  oldValue?: unknown;
  newValue?: unknown;
}) {
  await db.professionalActionLog.create({
    data: {
      scope: params.access.session?.kind ?? "pharmacy",
      action: params.action,
      label: params.label,
      entityType: "media",
      entityId: params.mediaId,
      pharmacyId: params.pharmacyId,
      pharmacySlug: params.pharmacySlug,
      actorRole: params.access.role ?? null,
      status: params.status ?? "réussi",
      message: params.message ?? null,
      oldValue: params.oldValue ? JSON.stringify(params.oldValue) : null,
      newValue: params.newValue ? JSON.stringify(params.newValue) : null,
      source: params.access.session?.kind === "admin" ? "Administration SABLIN" : "Espace Pharmacie",
      sessionId: params.access.session
        ? `${params.access.session.kind}:${params.access.session.createdAt}`
        : null,
    },
  });
}

export async function GET(req: NextRequest) {
  const access = requirePharmacyPermission(req, "manage_own_profile");
  if (access.response) return access.response;

  const { searchParams } = new URL(req.url);
  const pharmacySlug = searchParams.get("pharmacySlug");
  if (!pharmacySlug && !hasPharmacyPermission(access.role, "view_all_pharmacies")) {
    return NextResponse.json(
      { error: "Une pharmacie doit consulter uniquement ses propres médias." },
      { status: 403 }
    );
  }
  if (
    pharmacySlug &&
    !hasPharmacyPermission(access.role, "view_all_pharmacies") &&
    access.session?.kind === "pharmacy" &&
    access.session.pharmacySlug !== pharmacySlug
  ) {
    return NextResponse.json(
      { error: "Une pharmacie ne peut consulter que ses propres médias." },
      { status: 403 }
    );
  }

  const media = await db.pharmacyMedia.findMany({
    where: {
      ...(pharmacySlug ? { pharmacy: { slug: pharmacySlug } } : {}),
      ...(hasPharmacyPermission(access.role, "view_all_pharmacies")
        ? {}
        : { visibility: { not: "admin_only" }, containsSensitiveData: false }),
    },
    include: { pharmacy: { select: { name: true, slug: true, accountStatus: true } } },
    orderBy: [{ pharmacy: { name: "asc" } }, { createdAt: "desc" }],
  });

  return NextResponse.json({ media });
}

export async function POST(req: NextRequest) {
  const access = requirePharmacyPermission(req, "manage_own_profile");
  if (access.response) return access.response;

  const body = await req.json();
  const pharmacySlug = String(body.pharmacySlug ?? "").trim();
  const pharmacyId = String(body.pharmacyId ?? "").trim();
  const url = String(body.url ?? "").trim();
  const type = String(body.type ?? "facade").trim();
  const visibility = normalizeVisibility(body.visibility);
  const isAdminOnlyType = INTERNAL_MEDIA_TYPES.includes(type as never);

  if (!url || (!pharmacyId && !pharmacySlug)) {
    return NextResponse.json(
      { error: "Pharmacie et URL du média sont obligatoires." },
      { status: 400 }
    );
  }

  if (isAdminOnlyType && !hasPharmacyPermission(access.role, "view_all_pharmacies")) {
    return NextResponse.json(
      { error: "Les documents administratifs sont réservés à l’administration SABLIN PHARMA." },
      { status: 403 }
    );
  }

  const pharmacy = await db.pharmacy.findFirst({
    where: pharmacyId ? { id: pharmacyId } : { slug: pharmacySlug },
  });
  if (!pharmacy) {
    return NextResponse.json({ error: "Pharmacie introuvable." }, { status: 404 });
  }

  const isPublicType = PUBLIC_MEDIA_TYPES.includes(type as never);
  const isValidated = Boolean(body.isValidated) && hasPharmacyPermission(access.role, "validate_pharmacy");
  const containsSensitiveData = Boolean(body.containsSensitiveData);
  const isPublic = Boolean(body.isPublic) && isPublicType && visibility === "public" && isValidated && !containsSensitiveData;
  const isPrimary = Boolean(body.isPrimary);

  const media = await db.pharmacyMedia.create({
    data: {
      pharmacyId: pharmacy.id,
      type,
      title: String(body.title ?? "Image pharmacie").trim(),
      description: String(body.description ?? "").trim() || null,
      altText: String(body.altText ?? body.title ?? "Image pharmacie").trim(),
      url,
      visibility,
      usage: String(body.usage ?? "").trim() || null,
      validationStatus: isValidated ? "Validée" : "En attente",
      displayOrder: Number(body.displayOrder ?? 0),
      isPrimary,
      isPublic,
      isValidated,
      containsSensitiveData,
      uploadedByRole: access.role ?? "Pharmacien responsable",
      uploadedByName: access.session?.name ?? null,
      originalFileName: String(body.originalFileName ?? "").trim() || null,
      mimeType: String(body.mimeType ?? "").trim() || null,
      fileSize: body.fileSize ? Number(body.fileSize) : null,
    },
  });

  if (media.isPublic && (media.isPrimary || ["facade", "logo", "cover", "exterior", "entrance"].includes(media.type))) {
    await db.pharmacy.update({
      where: { id: pharmacy.id },
      data: {
        imageUrl: media.url,
        lastDataUpdate: new Date(),
        dataQuality: "Données à jour",
      },
    });
  }

  return NextResponse.json({ media }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const access = requirePharmacyPermission(req, "manage_own_profile");
  if (access.response) return access.response;

  const body = await req.json();
  const mediaId = String(body.mediaId ?? body.id ?? "").trim();
  const action = String(body.action ?? "update").trim();
  if (!mediaId) {
    return NextResponse.json({ error: "Identifiant du média obligatoire." }, { status: 400 });
  }

  const media = await db.pharmacyMedia.findUnique({
    where: { id: mediaId },
    include: { pharmacy: { select: { id: true, slug: true, name: true } } },
  });
  if (!media) {
    return NextResponse.json({ error: "Média introuvable." }, { status: 404 });
  }

  const isAdmin = hasPharmacyPermission(access.role, "validate_pharmacy");
  const isOwner =
    access.session?.kind === "pharmacy" &&
    access.session.pharmacySlug === media.pharmacy.slug;
  if (!isAdmin && !isOwner) {
    return NextResponse.json(
      { error: "Vous ne pouvez modifier que les médias de votre pharmacie." },
      { status: 403 }
    );
  }

  const oldValue = {
    title: media.title,
    visibility: media.visibility,
    validationStatus: media.validationStatus,
    isPublic: media.isPublic,
    isPrimary: media.isPrimary,
    displayOrder: media.displayOrder,
  };

  const data: Record<string, unknown> = {};
  const title = String(body.title ?? "").trim();
  const description = String(body.description ?? "").trim();
  const altText = String(body.altText ?? "").trim();
  const rejectedReason = String(body.rejectedReason ?? body.reason ?? "").trim();
  const visibility = body.visibility === undefined ? media.visibility : normalizeVisibility(body.visibility);
  const displayOrder = Number(body.displayOrder);

  if (title) data.title = title;
  if (body.description !== undefined) data.description = description || null;
  if (body.altText !== undefined) data.altText = altText || media.title;
  if (Number.isFinite(displayOrder)) data.displayOrder = displayOrder;

  if (body.visibility !== undefined) {
    if (!isAdmin && visibility === "admin_only") {
      return NextResponse.json(
        { error: "La visibilité admin uniquement est réservée à l’administration SABLIN PHARMA." },
        { status: 403 }
      );
    }
    data.visibility = visibility;
    if (!isAdmin && visibility === "public") {
      data.validationStatus = "En attente";
      data.isValidated = false;
      data.isPublic = false;
    }
  }

  if (body.containsSensitiveData !== undefined) {
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Seule l’administration peut modifier le statut confidentiel d’un média." },
        { status: 403 }
      );
    }
    data.containsSensitiveData = Boolean(body.containsSensitiveData);
  }

  if (action === "validate" || action === "publish") {
    if (!isAdmin) {
      return NextResponse.json({ error: "Publication réservée à l’administration SABLIN PHARMA." }, { status: 403 });
    }
    const nextMedia = {
      type: media.type,
      visibility: visibility,
      containsSensitiveData: Boolean(data.containsSensitiveData ?? media.containsSensitiveData),
    };
    const canBePublic = isPublicEligible(nextMedia);
    data.visibility = visibility === "admin_only" ? "internal" : visibility;
    data.validationStatus = "Validée";
    data.isValidated = true;
    data.isPublic = canBePublic;
    data.rejectedReason = null;
  }

  if (action === "hide") {
    if (!isAdmin) {
      return NextResponse.json({ error: "Masquage réservé à l’administration SABLIN PHARMA." }, { status: 403 });
    }
    data.validationStatus = "Masquée";
    data.isPublic = false;
  }

  if (action === "refuse") {
    if (!isAdmin) {
      return NextResponse.json({ error: "Refus réservé à l’administration SABLIN PHARMA." }, { status: 403 });
    }
    data.validationStatus = "Refusée";
    data.isValidated = false;
    data.isPublic = false;
    data.rejectedReason = rejectedReason || "Image refusée par l’administration SABLIN PHARMA.";
  }

  if (action === "archive") {
    data.validationStatus = "Archivée";
    data.isPublic = false;
    data.isPrimary = false;
  }

  if (action === "set-primary") {
    if (!isAdmin && media.validationStatus === "Validée") {
      return NextResponse.json(
        { error: "Seule l’administration peut définir une image publique principale." },
        { status: 403 }
      );
    }
    data.isPrimary = true;
  }

  if (action === "set-primary" || body.isPrimary === true) {
    await db.pharmacyMedia.updateMany({
      where: { pharmacyId: media.pharmacyId, id: { not: media.id } },
      data: { isPrimary: false },
    });
  }

  const updated = await db.pharmacyMedia.update({
    where: { id: media.id },
    data,
    include: { pharmacy: { select: { name: true, slug: true, accountStatus: true } } },
  });

  await refreshPharmacyImage(media.pharmacyId);
  await logMediaAction({
    access,
    mediaId: media.id,
    pharmacyId: media.pharmacyId,
    pharmacySlug: media.pharmacy.slug,
    action,
    label: "Gestion média pharmacie",
    message: `${updated.title} — ${updated.validationStatus}`,
    oldValue,
    newValue: {
      title: updated.title,
      visibility: updated.visibility,
      validationStatus: updated.validationStatus,
      isPublic: updated.isPublic,
      isPrimary: updated.isPrimary,
      displayOrder: updated.displayOrder,
    },
  });

  return NextResponse.json({ media: updated });
}

export async function DELETE(req: NextRequest) {
  const access = requirePharmacyPermission(req, "manage_own_profile");
  if (access.response) return access.response;

  const { searchParams } = new URL(req.url);
  const mediaId = String(searchParams.get("mediaId") ?? "").trim();
  if (!mediaId) {
    return NextResponse.json({ error: "Identifiant du média obligatoire." }, { status: 400 });
  }

  const media = await db.pharmacyMedia.findUnique({
    where: { id: mediaId },
    include: { pharmacy: { select: { id: true, slug: true, name: true } } },
  });
  if (!media) {
    return NextResponse.json({ error: "Média introuvable." }, { status: 404 });
  }

  const isAdmin = hasPharmacyPermission(access.role, "validate_pharmacy");
  const isOwner =
    access.session?.kind === "pharmacy" &&
    access.session.pharmacySlug === media.pharmacy.slug &&
    media.visibility !== "admin_only" &&
    !media.containsSensitiveData;
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "Suppression non autorisée pour ce média." }, { status: 403 });
  }

  await db.pharmacyMedia.delete({ where: { id: media.id } });
  await refreshPharmacyImage(media.pharmacyId);
  await logMediaAction({
    access,
    mediaId: media.id,
    pharmacyId: media.pharmacyId,
    pharmacySlug: media.pharmacy.slug,
    action: "delete",
    label: "Suppression média pharmacie",
    message: media.title,
    oldValue: {
      title: media.title,
      visibility: media.visibility,
      validationStatus: media.validationStatus,
      isPublic: media.isPublic,
    },
  });

  return NextResponse.json({ ok: true });
}
