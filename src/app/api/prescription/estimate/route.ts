import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items: { medicationId?: string; slug?: string; quantity?: number }[] =
      body.items ?? [];

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Veuillez ajouter au moins un médicament à votre ordonnance." },
        { status: 400 }
      );
    }

    const lines = [];
    let totalMin = 0;
    let totalMax = 0;
    let availablePharmacies = new Set<string>();

    for (const item of items) {
      const qty = Math.max(1, parseInt(String(item.quantity ?? 1), 10) || 1);
      const med = await db.medication.findFirst({
        where: {
          OR: [{ id: item.medicationId ?? "" }, { slug: item.slug ?? "" }],
        },
        include: {
          pharmacies: { include: { pharmacy: true } },
        },
      });
      if (!med) continue;

      const prices = med.pharmacies
        .filter((pm) => pm.inStock)
        .map((pm) => pm.price)
        .sort((a, b) => a - b);

      const min = prices[0] ?? med.avgPrice;
      const max = prices[prices.length - 1] ?? med.avgPrice;

      med.pharmacies.forEach((pm) => {
        if (pm.inStock) availablePharmacies.add(pm.pharmacy.id);
      });

      lines.push({
        medication: {
          id: med.id,
          name: med.name,
          slug: med.slug,
          form: med.form,
          dosage: med.dosage,
          packSize: med.packSize,
          requiresRx: med.requiresRx,
        },
        quantity: qty,
        unitMin: min,
        unitMax: max,
        lineMin: min * qty,
        lineMax: max * qty,
        pharmacyCount: prices.length,
      });

      totalMin += min * qty;
      totalMax += max * qty;
    }

    return NextResponse.json({
      lines,
      totalMin,
      totalMax,
      availablePharmacies: availablePharmacies.size,
    });
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de l'estimation de l'ordonnance." },
      { status: 500 }
    );
  }
}
