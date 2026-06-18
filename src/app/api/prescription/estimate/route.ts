import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { CREDIT_COSTS } from "@/lib/restrictions";
import { validatePassOrdonnance } from "@/lib/restrictions-server";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    const body = await req.json();
    const rawItems = body.items ?? [];
    const items: { medicationId?: string; slug?: string; quantity?: number }[] =
      Array.isArray(rawItems) ? rawItems : [];
    const ordonnanceId =
      typeof body.ordonnanceId === "string"
        ? body.ordonnanceId
        : items
            .map((item) => `${item.medicationId ?? item.slug ?? "unknown"}:${item.quantity ?? 1}`)
            .sort()
            .join("|");

    const activePass = await db.passOrdonnance.findFirst({
      where: {
        userId: user.id,
        active: true,
        status: { in: ["active", "linked"] },
      },
      orderBy: { createdAt: "desc" },
    });
    const recentPaidEstimate = await db.creditTransaction.findFirst({
      where: {
        userId: user.id,
        type: "debit",
        amount: -CREDIT_COSTS.estimatePrescription,
        status: "réussi",
        createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) },
        OR: [
          { description: { contains: "Estimer" } },
          { description: { contains: "ordonnance" } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    if (!activePass && !recentPaidEstimate) {
      return NextResponse.json(
        {
          error:
            "Résultat indisponible. Utilisez vos crédits ou un Pass Ordonnance Unique pour débloquer cette estimation.",
        },
        { status: 402 }
      );
    }

    if (activePass) {
      const passValidation = await validatePassOrdonnance(user.id, ordonnanceId);
      if (!passValidation.allowed) {
        return NextResponse.json({ error: passValidation.message }, { status: 402 });
      }
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Veuillez ajouter au moins un médicament à votre ordonnance." },
        { status: 400 }
      );
    }

    const lines: Array<{
      medication: {
        id: string;
        name: string;
        slug: string;
        form: string;
        dosage: string;
        packSize: string;
        requiresRx: boolean;
      };
      quantity: number;
      unitMin: number;
      unitMax: number;
      lineMin: number;
      lineMax: number;
      pharmacyCount: number;
    }> = [];
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
