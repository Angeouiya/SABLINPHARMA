import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isOpenNow } from "@/lib/format";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const med = await db.medication.findUnique({
    where: { slug },
    include: {
      category: true,
      pharmacies: {
        include: { pharmacy: true },
        orderBy: { price: "asc" },
      },
    },
  });

  if (!med) {
    return NextResponse.json({ error: "Médicament introuvable" }, { status: 404 });
  }

  const pharmacies = med.pharmacies
    .map((pm) => ({
      id: pm.pharmacy.id,
      name: pm.pharmacy.name,
      slug: pm.pharmacy.slug,
      address: pm.pharmacy.address,
      commune: pm.pharmacy.commune,
      phone: pm.pharmacy.phone,
      hoursWeekday: pm.pharmacy.hoursWeekday,
      hoursSaturday: pm.pharmacy.hoursSaturday,
      hoursSunday: pm.pharmacy.hoursSunday,
      isOpen247: pm.pharmacy.isOpen247,
      isOnDuty: pm.pharmacy.isOnDuty,
      latitude: pm.pharmacy.latitude,
      longitude: pm.pharmacy.longitude,
      rating: pm.pharmacy.rating,
      imageUrl: pm.pharmacy.imageUrl,
      price: pm.price,
      inStock: pm.inStock,
      openNow: isOpenNow(pm.pharmacy),
    }))
    .sort((a, b) => {
      if (a.inStock !== b.inStock) return a.inStock ? -1 : 1;
      return a.price - b.price;
    });

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
    description: med.description,
    imageUrl: med.imageUrl,
    requiresRx: med.requiresRx,
    avgPrice: med.avgPrice,
    createdAt: med.createdAt,
    pharmacies,
  });
}
