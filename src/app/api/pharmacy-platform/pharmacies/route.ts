import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { PHARMACY_ACCOUNT_STATUSES, PHARMACY_CREATION_SOURCES } from "@/lib/pharmacy-platform";
import { requirePharmacyPermission } from "@/lib/pharmacy-access";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function GET(req: NextRequest) {
  const access = requirePharmacyPermission(req, "view_all_pharmacies");
  if (access.response) return access.response;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const accountStatus = searchParams.get("accountStatus") || "all";
  const publicationStatus = searchParams.get("publicationStatus") || "all";
  const commune = searchParams.get("commune")?.trim() ?? "";
  const where: Prisma.PharmacyWhereInput = {
    ...(accountStatus === "pending"
      ? { accountStatus: { in: ["En attente", "En attente de validation", "Incomplète"] } }
      : accountStatus !== "all"
        ? { accountStatus }
        : {}),
    ...(publicationStatus !== "all" ? { publicationStatus } : {}),
    ...(commune ? { commune } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q } },
            { commune: { contains: q } },
            { district: { contains: q } },
            { managerName: { contains: q } },
            { professionalEmail: { contains: q } },
            { phone: { contains: q } },
          ],
        }
      : {}),
  };

  const [pharmacies, total, pending, validated, refused, suspended, incomplete, published, withPublicMedia, recentActions] = await Promise.all([
    db.pharmacy.findMany({
      where,
      orderBy: [{ accountStatus: "asc" }, { name: "asc" }],
      include: { media: true, _count: { select: { medications: true, userRequests: true, professionalMemberships: true } } },
      take: 180,
    }),
    db.pharmacy.count(),
    db.pharmacy.count({ where: { accountStatus: { in: ["En attente", "En attente de validation"] } } }),
    db.pharmacy.count({ where: { accountStatus: "Validée" } }),
    db.pharmacy.count({ where: { accountStatus: "Refusée" } }),
    db.pharmacy.count({ where: { accountStatus: "Suspendue" } }),
    db.pharmacy.count({ where: { accountStatus: "Incomplète" } }),
    db.pharmacy.count({ where: { publicationStatus: "Publiée" } }),
    db.pharmacy.count({ where: { media: { some: { visibility: "public", isPublic: true, isValidated: true } } } }),
    db.professionalActionLog.findMany({
      where: { scope: "admin", action: { in: ["validate-pharmacy", "refuse-pharmacy", "suspend-pharmacy", "review-documents"] } },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, label: true, action: true, status: true, actorRole: true, message: true, pharmacySlug: true, createdAt: true },
    }),
  ]);

  return NextResponse.json({
    pharmacies: pharmacies.map((pharmacy) => ({
      ...pharmacy,
      medicationCount: pharmacy._count.medications,
      requestCount: pharmacy._count.userRequests,
      teamCount: pharmacy._count.professionalMemberships,
      publicMediaCount: pharmacy.media.filter((media) => media.visibility === "public" && media.isPublic && media.isValidated).length,
      adminOnlyMediaCount: pharmacy.media.filter((media) => media.visibility === "admin_only" || media.containsSensitiveData).length,
    })),
    summary: {
      total,
      pending,
      validated,
      refused,
      suspended,
      incomplete,
      published,
      withPublicMedia,
      visible: pharmacies.length,
    },
    recentActions,
    filters: { q, accountStatus, publicationStatus, commune },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = String(body.name ?? "").trim();
  const commune = String(body.commune ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const address = String(body.address ?? "").trim();

  if (!name || !commune || !phone || !address) {
    return NextResponse.json(
      { error: "Nom, commune, téléphone et adresse sont obligatoires." },
      { status: 400 }
    );
  }

  const creationSource = PHARMACY_CREATION_SOURCES.includes(body.creationSource)
    ? body.creationSource
    : "Inscription directe pharmacie";
  if (creationSource === "Création administrateur") {
    const access = requirePharmacyPermission(req, "create_pharmacy");
    if (access.response) return access.response;
  }
  const accountStatus = PHARMACY_ACCOUNT_STATUSES.includes(body.accountStatus)
    ? body.accountStatus
    : creationSource === "Inscription directe pharmacie"
    ? "En attente de validation"
    : "Brouillon";
  const publicationStatus =
    accountStatus === "Validée" && Boolean(body.publishNow)
      ? "Publiée"
      : String(body.publicationStatus ?? "Non publiée");

  const pharmacy = await db.pharmacy.create({
    data: {
      name,
      tradeName: String(body.tradeName ?? "").trim() || null,
      slug: `${slugify(name)}-${Date.now()}`,
      commune,
      district: String(body.district ?? body.quartier ?? "").trim() || null,
      address,
      phone,
      whatsapp: String(body.whatsapp ?? phone).trim(),
      professionalEmail: String(body.email ?? "").trim() || null,
      managerName: String(body.managerName ?? body.responsable ?? "").trim() || null,
      managerRole: String(body.managerRole ?? body.fonction ?? "").trim() || null,
      authorizationNumber: String(body.authorizationNumber ?? "").trim() || null,
      landmark: String(body.landmark ?? body.repere ?? "").trim() || null,
      coverageZone: String(body.coverageZone ?? body.zoneCouverture ?? "").trim() || null,
      description: String(body.description ?? "").trim() || null,
      creationSource,
      accountStatus,
      publicationStatus,
      publishProvisional: false,
      dataQuality: "Données incomplètes",
      internalIdentifier: String(body.internalIdentifier ?? "").trim() || null,
      internalNotes: String(body.internalNotes ?? "").trim() || null,
      servicesCsv: String(body.servicesCsv ?? "").trim() || null,
      hoursWeekday: String(body.hoursWeekday ?? "08:00 - 22:00"),
      hoursSaturday: String(body.hoursSaturday ?? "08:00 - 20:00"),
      hoursSunday: String(body.hoursSunday ?? "09:00 - 13:00"),
      specialHoursMessage: String(body.specialHoursMessage ?? "").trim() || null,
      isOpen247: Boolean(body.isOpen247),
      isOnDuty: Boolean(body.isOnDuty),
      dutyPeriod: String(body.dutyPeriod ?? "").trim() || null,
      dutyStartAt: body.dutyStartAt ? new Date(String(body.dutyStartAt)) : null,
      dutyEndAt: body.dutyEndAt ? new Date(String(body.dutyEndAt)) : null,
      latitude: Number(body.latitude ?? 5.34),
      longitude: Number(body.longitude ?? -4.008),
      rating: 4.5,
      imageUrl: String(body.imageUrl ?? "").trim() || null,
      lastDataUpdate: new Date(),
      media: Array.isArray(body.media)
        ? {
            create: body.media.map((media: Record<string, unknown>) => ({
              type: String(media.type ?? "facade"),
              title: String(media.title ?? "Image pharmacie"),
              description: String(media.description ?? "").trim() || null,
              altText: String(media.altText ?? media.title ?? "Image pharmacie"),
              url: String(media.url ?? ""),
              visibility: String(media.visibility ?? "public"),
              usage: String(media.usage ?? "").trim() || null,
              validationStatus: Boolean(media.isValidated) ? "Validée" : "En attente",
              displayOrder: Number(media.displayOrder ?? 0),
              isPrimary: Boolean(media.isPrimary),
              isPublic: Boolean(media.isPublic),
              isValidated: Boolean(media.isValidated),
              containsSensitiveData: Boolean(media.containsSensitiveData),
              uploadedByRole: String(media.uploadedByRole ?? "Administrateur SABLIN"),
            })).filter((media: { url: string }) => media.url),
          }
        : undefined,
    },
  });

  return NextResponse.json({ pharmacy }, { status: 201 });
}
