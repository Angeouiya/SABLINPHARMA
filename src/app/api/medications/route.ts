import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

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
      pharmacies: true,
    },
    orderBy: { name: "asc" },
    take: limit,
  });

  const result = meds.map((m) => ({
    id: m.id,
    name: m.name,
    slug: m.slug,
    genericName: m.genericName,
    categoryId: m.categoryId,
    category: m.category,
    form: m.form,
    dosage: m.dosage,
    packSize: m.packSize,
    description: m.description,
    imageUrl: m.imageUrl,
    requiresRx: m.requiresRx,
    avgPrice: m.avgPrice,
    createdAt: m.createdAt,
    pharmacyCount: m.pharmacies.length,
  }));

  return NextResponse.json(result);
}
