import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { PASS_ORDONNANCE_PRICE } from "@/lib/restrictions";
import { createPaymentIntent } from "@/lib/payment-security";
import { db } from "@/lib/db";

// Achat du Pass Ordonnance Unique (500 FCFA) — valable pour une seule ordonnance. Expire après utilisation.
const PASS_PRICE = PASS_ORDONNANCE_PRICE;

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const provider = typeof body.provider === "string" ? body.provider : "paydunya";

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

    const result = await createPaymentIntent({
      userId: user.id,
      purchaseType: "pass_ordonnance",
      amount: PASS_PRICE,
      provider,
      idempotencyKey: req.headers.get("x-idempotency-key") ?? body.idempotencyKey,
      req,
      metadata: body,
    });

    return NextResponse.json({
      success: true,
      pending: true,
      reference: result.payment.reference,
      checkoutUrl: result.checkoutUrl,
      status: result.payment.status,
      hasPass: false,
      price: PASS_PRICE,
      message: "Paiement en cours de vérification. Le Pass sera activé uniquement après confirmation officielle.",
    });
  } catch {
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
