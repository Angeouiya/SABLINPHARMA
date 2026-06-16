import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { medications: true } },
    },
  });
  return NextResponse.json(
    categories.map((c) => ({
      ...c,
      medicationCount: c._count.medications,
    }))
  );
}
