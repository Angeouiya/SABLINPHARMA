import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isOpenNow } from "@/lib/format";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const commune = searchParams.get("commune");
  const filter = searchParams.get("filter"); // "open" | "on-duty" | "247"

  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { address: { contains: q } },
      { commune: { contains: q } },
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
      _count: { select: { medications: true } },
    },
    orderBy: [{ isOnDuty: "desc" }, { rating: "desc" }],
  });

  let result = pharmacies.map((p) => ({
    ...p,
    medicationCount: p._count.medications,
    openNow: isOpenNow(p),
  }));

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
