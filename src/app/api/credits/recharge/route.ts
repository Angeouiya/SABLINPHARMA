import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getRechargeCreditsForAmount } from "@/lib/restrictions";
import { createPaymentIntent } from "@/lib/payment-security";

// Recharge credits via PayDunya. Les moyens Mobile Money sont choisis sur PayDunya.
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const amount =
      typeof body.amount === "number" ? body.amount : Number(String(body.amount ?? "").trim());
    const credits = getRechargeCreditsForAmount(amount);

    if (!credits) {
      return NextResponse.json({ error: "Montant de recharge invalide" }, { status: 400 });
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
      credits,
      reference: result.payment.reference,
      checkoutUrl: result.checkoutUrl,
      status: result.payment.status,
      message: "Paiement en cours de vérification. Les crédits seront ajoutés après confirmation officielle.",
    });
  } catch {
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
