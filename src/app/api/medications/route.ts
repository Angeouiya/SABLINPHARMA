import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { lockedFeaturePayload } from "@/lib/credit-gates";
import { buildMedicationPlaceholderUrl } from "@/lib/medication-enrichment";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const category = searchParams.get("category");
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);

  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { genericName: { contains: q } },
    ];
  }
  if (category) {
    where.category = { slug: category };
  }

  const meds = await db.medication.findMany({
    where,
    include: {
      category: true,
      images: {
        where: { validationStatus: "Publiée" },
        orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
      },
      descriptions: {
        where: { validationStatus: "Publiée" },
        orderBy: [{ validatedAt: "desc" }, { createdAt: "desc" }],
        take: 1,
      },
    },
    orderBy: { name: "asc" },
    take: limit,
  });

  const result = meds.map((m) => {
    const image = m.images.find((item) => item.validationStatus === "Publiée") ?? m.images[0];
    const description = m.descriptions[0];
    const imageUrl = image?.url ?? buildMedicationPlaceholderUrl({
      name: m.name,
      genericName: m.genericName,
      dosage: m.dosage,
      form: m.form,
    });
    return ({
    id: m.id,
    name: m.name,
    slug: m.slug,
    genericName: m.genericName,
    categoryId: m.categoryId,
    category: m.category,
    form: m.form,
    dosage: m.dosage,
    packSize: m.packSize,
    description: description?.shortText ?? m.shortDescription ?? m.description,
    imageUrl,
    imageBadge: image
      ? image.isPlaceholder
        ? "Image illustrative"
        : image.imageType === "pharmacy_photo"
          ? "Photo fournie par une pharmacie"
          : "Photo officielle"
      : "Image illustrative",
    imageAttribution: image?.attributionText ?? null,
    informationBadge: description ? "Informations vérifiées" : "Informations à confirmer",
    verificationStatus: m.verificationStatus,
    requiresRx: m.requiresRx,
    avgPrice: m.avgPrice,
    createdAt: m.createdAt,
    availabilityLocked: true,
    availabilityLabel: "Disponibilité verrouillée — 1 crédit",
    pharmacyCountLocked: true,
    access: lockedFeaturePayload({
      featureKey: "seeMedicationPharmacies",
      isAuthenticated: false,
    }),
  });
  });

  return NextResponse.json(result);
}
