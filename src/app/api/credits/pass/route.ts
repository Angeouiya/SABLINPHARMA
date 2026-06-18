import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { PASS_ORDONNANCE_PRICE } from "@/lib/restrictions";

// Achat du Pass Ordonnance Unique (500 FCFA) — valable pour une seule ordonnance. Expire après utilisation.
const PASS_PRICE = PASS_ORDONNANCE_PRICE;

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const provider = typeof body.provider === "string" ? body.provider : "orange";

    // Vérifier qu'il n'a pas déjà un pass actif
    const existing = await db.passOrdonnance.findFirst({
      where: { userId: user.id, active: true, status: { in: ["active", "linked"] } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Vous avez déjà un Pass Ordonnance Unique actif." },
        { status: 400 }
      );
    }

    // Créer le pass
    const pass = await db.passOrdonnance.create({
      data: {
        userId: user.id,
        active: true,
        status: "active",
        price: PASS_PRICE,
      },
    });

    // Enregistrer le paiement
    await db.payment.create({
      data: {
        userId: user.id,
        amount: PASS_PRICE,
        method: "mobile_money",
        provider,
        reference: `SPL-PASS-${Date.now()}`,
        status: "success",
      },
    });

    // Transaction crédit (type "pass", amount 0 car pas de crédits ajoutés)
    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      select: { credits: true },
    });
    const balance = fullUser?.credits ?? 0;
    await db.creditTransaction.create({
      data: {
        userId: user.id,
        type: "pass",
        amount: 0,
        description: `Pass Ordonnance Unique — ${PASS_PRICE} FCFA (${provider})`,
        fcfaEquivalent: PASS_PRICE,
        balanceBefore: balance,
        balanceAfter: balance,
        status: "réussi",
      },
    });

    return NextResponse.json({
      success: true,
      pass,
      hasPass: true,
      price: PASS_PRICE,
    });
  } catch {
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
