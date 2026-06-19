import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUserCreditAccess } from "@/lib/credit-gates";
import { isOpenNow } from "@/lib/format";
import { isPublicPharmacyMedia, publicAvailabilityStatus } from "@/lib/pharmacy-platform";
import { pharmacyRatingLabel } from "@/lib/pharmacy-ratings";
import { buildMedicationPlaceholderUrl } from "@/lib/medication-enrichment";

function safePharmacyMedia(media: {
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
  const med = await db.medication.findUnique({
    where: { slug },
    include: {
      category: true,
      images: {
        where: { validationStatus: "Publiée" },
        orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
      },
      descriptions: {
        where: { validationStatus: "Publiée" },
        orderBy: [{ validatedAt: "desc" }, { createdAt: "desc" }],
      },
      pharmacies: {
        include: { pharmacy: { include: { media: true } } },
        where: {
          publicationStatus: "Publiée",
          pharmacy: {
            accountStatus: "Validée",
            publicationStatus: "Publiée",
          },
        },
        orderBy: { price: "asc" },
      },
    },
  });

  if (!med) {
    return NextResponse.json({ error: "Médicament introuvable" }, { status: 404 });
  }

  const [pharmacyAccess, pricesAccess] = await Promise.all([
    getCurrentUserCreditAccess({
      featureKey: "seeMedicationPharmacies",
      entityType: "medication",
      entityId: med.id,
    }),
    getCurrentUserCreditAccess({
      featureKey: "seeDetailedPrices",
      entityType: "medication",
      entityId: med.id,
    }),
  ]);

  const pharmacies = pharmacyAccess.isUnlocked
    ? med.pharmacies.map((pm) => {
      const publicMedia = pm.pharmacy.media.filter(isPublicPharmacyMedia);
      const logo = publicMedia.find((media) => media.type === "logo");
      const facade = publicMedia.find((media) => media.type === "facade" || media.type === "exterior");
      const cover = publicMedia.find((media) => media.type === "cover");
      return ({
      id: pm.pharmacy.id,
      name: pm.pharmacy.name,
      slug: pm.pharmacy.slug,
      address: pm.pharmacy.address,
      commune: pm.pharmacy.commune,
      phone: "Contact verrouillé",
      whatsapp: "Contact verrouillé",
      hoursWeekday: pm.pharmacy.hoursWeekday,
      hoursSaturday: pm.pharmacy.hoursSaturday,
      hoursSunday: pm.pharmacy.hoursSunday,
      isOpen247: pm.pharmacy.isOpen247,
      isOnDuty: pm.pharmacy.isOnDuty,
      latitude: pm.pharmacy.latitude,
      longitude: pm.pharmacy.longitude,
      rating: pm.pharmacy.rating,
      ratingCount: pm.pharmacy.ratingCount,
      ratingLabel: pharmacyRatingLabel(pm.pharmacy.ratingCount),
      imageUrl: cover?.url ?? facade?.url ?? logo?.url ?? pm.pharmacy.imageUrl,
      logoUrl: logo?.url ?? null,
      facadeUrl: facade?.url ?? null,
      coverImageUrl: cover?.url ?? null,
      publicMedia: publicMedia.map(safePharmacyMedia),
      price: pricesAccess.isUnlocked ? pm.price : null,
      priceLocked: !pricesAccess.isUnlocked,
      inStock: pm.inStock,
      availabilityStatus: publicAvailabilityStatus({
        status: pm.availabilityStatus,
        reliabilityLevel: pm.reliabilityLevel,
        lastUpdatedAt: pm.lastUpdatedAt,
        publicationStatus: pm.publicationStatus,
        staleDays: pm.pharmacy.dataFreshnessStaleDays,
      }),
      dataSource: pm.dataSource,
      reliabilityLevel: pm.reliabilityLevel,
      lastUpdatedAt: pm.lastUpdatedAt,
      openNow: isOpenNow(pm.pharmacy),
    });
    })
    .sort((a, b) => {
      if (a.inStock !== b.inStock) return a.inStock ? -1 : 1;
      return (a.price ?? Number.MAX_SAFE_INTEGER) - (b.price ?? Number.MAX_SAFE_INTEGER);
    })
    : [];

  const primaryImage = med.images.find((image) => image.validationStatus === "Publiée") ?? med.images[0];
  const placeholderUrl = buildMedicationPlaceholderUrl({
    name: med.name,
    genericName: med.genericName,
    dosage: med.dosage,
    form: med.form,
  });
  const validatedDescription = med.descriptions.find((description) => description.validationStatus === "Publiée") ?? med.descriptions[0];

  return NextResponse.json({
    id: med.id,
    name: med.name,
    slug: med.slug,
    genericName: med.genericName,
    categoryId: med.categoryId,
    category: med.category,
    form: med.form,
    dosage: med.dosage,
    packSize: med.packSize,
    packaging: med.packaging ?? med.packSize,
    manufacturer: med.manufacturer,
    barcode: med.barcode ? "Référencé" : null,
    description: validatedDescription?.shortText ?? med.shortDescription ?? med.description,
    longDescription: validatedDescription?.longText ?? null,
    imageUrl: primaryImage?.url ?? placeholderUrl,
    gallery: med.images.map((image) => ({
      id: image.id,
      url: image.url,
      sourceName: image.sourceName,
      sourceUrl: image.sourceUrl,
      imageType: image.imageType,
      licenseType: image.licenseType,
      attributionText: image.attributionText,
      isPrimary: image.isPrimary,
      isPlaceholder: image.isPlaceholder,
      validationStatus: image.validationStatus,
    })),
    imageBadge: primaryImage
      ? primaryImage.isPlaceholder
        ? "Image illustrative"
        : primaryImage.imageType === "pharmacy_photo"
          ? "Photo fournie par une pharmacie"
          : "Photo officielle"
      : "Image illustrative",
    informationBadge: "Information générale",
    sourceName: validatedDescription?.sourceName ?? primaryImage?.sourceName ?? "Référentiel médicaments SABLIN PHARMA",
    verifiedAt: med.verifiedAt,
    verificationStatus: med.verificationStatus,
    safetyNotice:
      "L’apparence de l’emballage peut varier selon le fabricant, le conditionnement ou la date de production. Vérifiez toujours le nom, la DCI, le dosage et la forme avec votre pharmacien.",
    requiresRx: med.requiresRx,
    avgPrice: pricesAccess.isUnlocked ? med.avgPrice : null,
    priceLocked: !pricesAccess.isUnlocked,
    priceLabel: pricesAccess.isUnlocked
      ? "Prix débloqué"
      : "Prix verrouillé — 1 crédit",
    createdAt: med.createdAt,
    pharmaciesAccess: pharmacyAccess.locked,
    pricesAccess: pricesAccess.locked,
    pharmacies,
  });
}
