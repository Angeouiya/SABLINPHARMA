import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { createPaymentIntent } from "@/lib/payment-security";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const body = await req.json().catch(() => ({}));
    const amount = Number(body.amount ?? 500);
    const purchaseType = body.purchaseType ?? body.type ?? (body.passOrdonnance ? "pass_ordonnance" : "credit_pack");
    const result = await createPaymentIntent({
      userId: user.id,
      purchaseType,
      amount,
      provider: body.provider ?? "paydunya",
      idempotencyKey: req.headers.get("x-idempotency-key") ?? body.idempotencyKey,
      req,
      metadata: body,
    });

    return NextResponse.json({
      payment: result.payment,
      checkoutUrl: result.checkoutUrl,
      message: "Paiement en cours de vérification. Aucun service n’est débloqué avant confirmation officielle.",
    });
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la création de l’intention de paiement." },
      { status: 400 }
    );
  }
}
