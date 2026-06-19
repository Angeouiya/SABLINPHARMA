import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { lockedFeaturePayload } from "@/lib/credit-gates";
import { isOpenNow } from "@/lib/format";
import { isPublicPharmacyMedia } from "@/lib/pharmacy-platform";

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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const commune = searchParams.get("commune");
  const filter = searchParams.get("filter"); // "open" | "on-duty" | "247"

  const where: Record<string, unknown> = {
    accountStatus: "Validée",
    publicationStatus: "Publiée",
  };
  if (q) {
    where.AND = [
      {
        OR: [
          { name: { contains: q } },
          { address: { contains: q } },
          { commune: { contains: q } },
          { district: { contains: q } },
        ],
      },
    ];
  }
  if (commune) {
    where.commune = commune;
  }
  if (filter === "on-duty") {
    where.isOnDuty = true;
  }
  if (filter === "247") {
    where.isOpen247 = true;
  }

  const pharmacies = await db.pharmacy.findMany({
    where,
    include: {
      media: { orderBy: [{ isPrimary: "desc" }, { displayOrder: "asc" }, { createdAt: "desc" }] },
    },
    orderBy: [{ isOnDuty: "desc" }, { rating: "desc" }],
  });

  let result = pharmacies.map((p) => {
    const publicMedia = p.media.filter(isPublicPharmacyMedia);
    const primary = publicMedia.find((media) => media.isPrimary);
    const logo = publicMedia.find((media) => media.type === "logo");
    const facade = publicMedia.find((media) => media.type === "facade" || media.type === "exterior");
    const cover = publicMedia.find((media) => media.type === "cover");
    return {
      id: p.id,
      name: p.name,
      tradeName: p.tradeName,
      slug: p.slug,
      address: p.address,
      commune: p.commune,
      district: p.district,
      landmark: p.landmark,
      coverageZone: p.coverageZone,
      description: p.description,
      phone: "Contact verrouillé",
      whatsapp: "Contact verrouillé",
      hoursWeekday: p.hoursWeekday,
      hoursSaturday: p.hoursSaturday,
      hoursSunday: p.hoursSunday,
      specialHoursMessage: p.specialHoursMessage,
      isOpen247: p.isOpen247,
      isOnDuty: p.isOnDuty,
      dutyPeriod: p.dutyPeriod,
      latitude: p.latitude,
      longitude: p.longitude,
      rating: p.rating,
      imageUrl: primary?.url ?? cover?.url ?? facade?.url ?? logo?.url ?? p.imageUrl,
      logoUrl: logo?.url ?? null,
      facadeUrl: facade?.url ?? null,
      coverImageUrl: cover?.url ?? null,
      publicMedia: publicMedia.map(safeMedia),
      inventoryLocked: true,
      inventoryLabel: "Voir la liste des médicaments — 1 crédit",
      inventoryAccess: lockedFeaturePayload({
        featureKey: "seePharmacyInventory",
        isAuthenticated: false,
      }),
      openNow: isOpenNow(p),
    };
  });

  if (filter === "open") {
    result = result.filter((p) => p.openNow);
  }

  return NextResponse.json(result);
}

export async function POST() {
  // Communes list for filter dropdown
  const communes = await db.pharmacy.findMany({
    select: { commune: true },
    distinct: ["commune"],
    orderBy: { commune: "asc" },
  });
  return NextResponse.json(communes.map((c) => c.commune));
}
