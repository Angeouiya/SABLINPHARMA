import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUserCreditAccess } from "@/lib/credit-gates";
import { isOpenNow } from "@/lib/format";
import { isPublicPharmacyMedia, publicAvailabilityStatus } from "@/lib/pharmacy-platform";
import { pharmacyRatingLabel } from "@/lib/pharmacy-ratings";

function safeMedia(media: {
  id: string;
  type: string;
  title: string;
  description: string | null;
  altText: string | null;
  url: string;
  usage: string | null;
  displayOrder: number;
  isPrimary: boolean;
}) {
  return {
    id: media.id,
    type: media.type,
    title: media.title,
    description: media.description,
    altText: media.altText,
    url: media.url,
    usage: media.usage,
    displayOrder: media.displayOrder,
    isPrimary: media.isPrimary,
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const pharma = await db.pharmacy.findFirst({
    where: {
      slug,
      accountStatus: "Validée",
      publicationStatus: "Publiée",
    },
    include: {
      media: { orderBy: [{ isPrimary: "desc" }, { displayOrder: "asc" }, { createdAt: "desc" }] },
      medications: {
        where: { publicationStatus: "Publiée" },
        include: { medication: { include: { category: true } } },
        orderBy: { medication: { name: "asc" } },
      },
    },
  });

  if (!pharma) {
    return NextResponse.json({ error: "Pharmacie introuvable" }, { status: 404 });
  }

  const [inventoryAccess, pricesAccess] = await Promise.all([
    getCurrentUserCreditAccess({
      featureKey: "seePharmacyInventory",
      entityType: "pharmacy",
      entityId: pharma.id,
    }),
    getCurrentUserCreditAccess({
      featureKey: "seeDetailedPrices",
      entityType: "pharmacy",
      entityId: pharma.id,
    }),
  ]);

  const medications = inventoryAccess.isUnlocked ? pharma.medications.map((pm) => ({
    id: pm.medication.id,
    name: pm.medication.name,
    slug: pm.medication.slug,
    genericName: pm.medication.genericName,
    form: pm.medication.form,
    dosage: pm.medication.dosage,
    packSize: pm.medication.packSize,
    requiresRx: pm.medication.requiresRx,
    category: pm.medication.category,
    price: pricesAccess.isUnlocked ? pm.price : null,
    priceLocked: !pricesAccess.isUnlocked,
    inStock: pm.inStock,
    availabilityStatus: publicAvailabilityStatus({
      status: pm.availabilityStatus,
      reliabilityLevel: pm.reliabilityLevel,
      lastUpdatedAt: pm.lastUpdatedAt,
      publicationStatus: pm.publicationStatus,
      staleDays: pharma.dataFreshnessStaleDays,
    }),
    freshnessLabel: publicAvailabilityStatus({
      status: pm.availabilityStatus,
      reliabilityLevel: pm.reliabilityLevel,
      lastUpdatedAt: pm.lastUpdatedAt,
      publicationStatus: pm.publicationStatus,
      staleDays: pharma.dataFreshnessStaleDays,
    }) === "À confirmer" ? "À confirmer" : "Mis à jour récemment",
    dataSource: pm.dataSource,
    reliabilityLevel: pm.reliabilityLevel,
    lastUpdatedAt: pm.lastUpdatedAt,
  })) : [];

  const publicMedia = pharma.media.filter(isPublicPharmacyMedia);
  const primary = publicMedia.find((media) => media.isPrimary);
  const logo = publicMedia.find((media) => media.type === "logo");
  const facade = publicMedia.find((media) => media.type === "facade" || media.type === "exterior");
  const cover = publicMedia.find((media) => media.type === "cover");

  return NextResponse.json({
    id: pharma.id,
    name: pharma.name,
    tradeName: pharma.tradeName,
    slug: pharma.slug,
    address: pharma.address,
    commune: pharma.commune,
    district: pharma.district,
    landmark: pharma.landmark,
    coverageZone: pharma.coverageZone,
    description: pharma.description,
    phone: "Contact verrouillé",
    whatsapp: "Contact verrouillé",
    hoursWeekday: pharma.hoursWeekday,
    hoursSaturday: pharma.hoursSaturday,
    hoursSunday: pharma.hoursSunday,
    specialHoursMessage: pharma.specialHoursMessage,
    isOpen247: pharma.isOpen247,
    isOnDuty: pharma.isOnDuty,
    dutyPeriod: pharma.dutyPeriod,
    latitude: pharma.latitude,
    longitude: pharma.longitude,
    rating: pharma.rating,
    ratingCount: pharma.ratingCount,
    ratingLabel: pharmacyRatingLabel(pharma.ratingCount),
    imageUrl: primary?.url ?? cover?.url ?? facade?.url ?? logo?.url ?? pharma.imageUrl,
    logoUrl: logo?.url ?? null,
    facadeUrl: facade?.url ?? null,
    coverImageUrl: cover?.url ?? null,
    publicMedia: publicMedia.map(safeMedia),
    openNow: isOpenNow(pharma),
    inventoryAccess: inventoryAccess.locked,
    pricesAccess: pricesAccess.locked,
    medications,
  });
}
