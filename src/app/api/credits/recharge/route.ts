import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { CREDIT_PACKS } from "@/lib/restrictions";
import { createPaymentIntent } from "@/lib/payment-security";

// Recharge credits via PayDunya. Les moyens Mobile Money sont choisis sur PayDunya.
const PACKS = Object.fromEntries(CREDIT_PACKS.map((pack) => [pack.amount, pack]));

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const amount = parseInt(body.amount, 10);
    const pack = PACKS[amount];

    if (!pack) {
      return NextResponse.json({ error: "Pack invalide" }, { status: 400 });
    }

    const result = await createPaymentIntent({
      userId: user.id,
      purchaseType: "credit_pack",
      amount,
      provider: body.provider ?? "paydunya",
      idempotencyKey: req.headers.get("x-idempotency-key") ?? body.idempotencyKey,
      req,
      metadata: body,
    });

    return NextResponse.json({
      success: true,
      pending: true,
      credits: pack.credits,
      reference: result.payment.reference,
      checkoutUrl: result.checkoutUrl,
      status: result.payment.status,
      message: "Paiement en cours de vérification. Les crédits seront ajoutés après confirmation officielle.",
    });
  } catch {
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
