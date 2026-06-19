import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hasPharmacyPermission, requirePharmacyPermission } from "@/lib/pharmacy-access";

const editableFields = [
  "name",
  "managerName",
  "managerRole",
  "phone",
  "whatsapp",
  "professionalEmail",
  "authorizationNumber",
  "commune",
  "district",
  "address",
  "latitude",
  "longitude",
  "landmark",
  "coverageZone",
  "description",
] as const;

function completenessScore(pharmacy: Record<string, unknown>, mediaCount: number, medicationCount: number) {
  const required = ["name", "managerName", "managerRole", "phone", "commune", "district", "address", "latitude", "longitude"];
  const filled = required.filter((field) => {
    const value = pharmacy[field];
    return value !== null && value !== undefined && String(value).trim() !== "";
  }).length;
  const base = Math.round((filled / required.length) * 70);
  const mediaBonus = mediaCount > 0 ? 15 : 0;
  const medicationBonus = medicationCount > 0 ? 15 : 0;
  return Math.min(100, base + mediaBonus + medicationBonus);
}

async function resolvePharmacy(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const requestedSlug = searchParams.get("pharmacySlug");
  const access = requirePharmacyPermission(req, "pharmacy.profile.read", { pharmacySlug: requestedSlug });
  if (access.response) return { access, pharmacy: null };
  const pharmacySlug = requestedSlug || access.session?.pharmacySlug;
  const pharmacy = pharmacySlug
    ? await db.pharmacy.findUnique({
        where: { slug: pharmacySlug },
        include: { _count: { select: { media: true, medications: true } } },
      })
    : null;
  return { access, pharmacy };
}

export async function GET(req: NextRequest) {
  const { access, pharmacy } = await resolvePharmacy(req);
  if (access.response) return access.response;
  if (!pharmacy) return NextResponse.json({ error: "Pharmacie introuvable." }, { status: 404 });
  if (!hasPharmacyPermission(access.role, "view_all_pharmacies") && access.session?.kind === "pharmacy" && access.session.pharmacySlug !== pharmacy.slug) {
    return NextResponse.json({ error: "Une pharmacie ne peut consulter que son profil." }, { status: 403 });
  }

  return NextResponse.json({
    profile: {
      ...pharmacy,
      services: pharmacy.servicesCsv ? pharmacy.servicesCsv.split(";").map((item) => item.trim()).filter(Boolean) : [],
      mediaCount: pharmacy._count.media,
      medicationCount: pharmacy._count.medications,
      completenessScore: completenessScore(pharmacy as unknown as Record<string, unknown>, pharmacy._count.media, pharmacy._count.medications),
    },
  });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const pharmacySlug = String(body.pharmacySlug ?? "");
  const access = requirePharmacyPermission(req, "pharmacy.profile.update", { pharmacySlug });
  if (access.response) return access.response;
  const targetSlug = pharmacySlug || access.session?.pharmacySlug;
  const pharmacy = targetSlug ? await db.pharmacy.findUnique({ where: { slug: targetSlug } }) : null;
  if (!pharmacy) return NextResponse.json({ error: "Pharmacie introuvable." }, { status: 404 });
  if (!hasPharmacyPermission(access.role, "view_all_pharmacies") && access.session?.kind === "pharmacy" && access.session.pharmacySlug !== pharmacy.slug) {
    return NextResponse.json({ error: "Une pharmacie ne peut modifier que son profil." }, { status: 403 });
  }

  const data: Record<string, string | number | null> = {};
  for (const field of editableFields) {
    if (!(field in body)) continue;
    if (field === "latitude" || field === "longitude") {
      const numeric = Number(body[field]);
      if (!Number.isFinite(numeric)) return NextResponse.json({ error: `${field} invalide.` }, { status: 400 });
      data[field] = numeric;
    } else {
      data[field] = String(body[field] ?? "").trim() || null;
    }
  }
  if (typeof data.name === "string" && !data.name) return NextResponse.json({ error: "Le nom de la pharmacie est obligatoire." }, { status: 400 });
  if (Array.isArray(body.services)) {
    data.servicesCsv = body.services.map((item: unknown) => String(item).trim()).filter(Boolean).join(";");
  }

  const updated = await db.pharmacy.update({
    where: { id: pharmacy.id },
    data: {
      ...data,
      lastDataUpdate: new Date(),
      dataQuality: "Données à jour",
    },
    include: { _count: { select: { media: true, medications: true } } },
  });

  await db.professionalActionLog.create({
    data: {
      scope: "pharmacy",
      action: "pharmacy-profile-update",
      label: "Profil pharmacie mis à jour",
      entityType: "pharmacy",
      entityId: pharmacy.id,
      pharmacyId: pharmacy.id,
      pharmacySlug: pharmacy.slug,
      actorRole: access.role,
      status: "réussi",
      oldValue: JSON.stringify({
        name: pharmacy.name,
        commune: pharmacy.commune,
        district: pharmacy.district,
        address: pharmacy.address,
        servicesCsv: pharmacy.servicesCsv,
      }),
      newValue: JSON.stringify(data),
      message: "Profil pharmacie synchronisable côté utilisateur après validation.",
    },
  });

  return NextResponse.json({
    profile: {
      ...updated,
      services: updated.servicesCsv ? updated.servicesCsv.split(";").map((item) => item.trim()).filter(Boolean) : [],
      mediaCount: updated._count.media,
      medicationCount: updated._count.medications,
      completenessScore: completenessScore(updated as unknown as Record<string, unknown>, updated._count.media, updated._count.medications),
    },
  });
}
