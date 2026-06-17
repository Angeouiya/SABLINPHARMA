import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isOpenNow } from "@/lib/format";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const pharma = await db.pharmacy.findUnique({
    where: { slug },
    include: {
      medications: {
        include: { medication: { include: { category: true } } },
        orderBy: { medication: { name: "asc" } },
      },
    },
  });

  if (!pharma) {
    return NextResponse.json({ error: "Pharmacie introuvable" }, { status: 404 });
  }

  const medications = pharma.medications.map((pm) => ({
    id: pm.medication.id,
    name: pm.medication.name,
    slug: pm.medication.slug,
    genericName: pm.medication.genericName,
    form: pm.medication.form,
    dosage: pm.medication.dosage,
    packSize: pm.medication.packSize,
    requiresRx: pm.medication.requiresRx,
    category: pm.medication.category,
    price: pm.price,
    inStock: pm.inStock,
  }));

  return NextResponse.json({
    ...pharma,
    openNow: isOpenNow(pharma),
    medications,
  });
}
