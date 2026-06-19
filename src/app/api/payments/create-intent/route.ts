import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { createPaymentIntent, type PurchaseType } from "@/lib/payment-security";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Vous devez être connecté pour payer." }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const purchaseType = String(body.purchaseType ?? body.type ?? "") as PurchaseType;
    const amount = Number(body.amount);
    const idempotencyKey = req.headers.get("x-idempotency-key") ?? body.idempotencyKey ?? null;
    const result = await createPaymentIntent({
      userId: user.id,
      purchaseType,
      amount,
      provider: body.provider,
      idempotencyKey,
      req,
      metadata: {
        phone: body.phone,
        holderName: body.holderName,
      },
    });

    return NextResponse.json({
      success: true,
      payment: {
        reference: result.payment.reference,
        status: result.payment.status,
        amount: result.payment.amount,
        provider: result.payment.provider,
        productType: result.payment.productType,
        expectedCredits: result.payment.expectedCredits,
        expiresAt: result.payment.expiresAt,
        checkoutUrl: result.checkoutUrl,
      },
      duplicate: result.duplicate,
      message:
        "Paiement en cours de vérification. Aucun crédit ou Pass n’est activé avant confirmation officielle du prestataire.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Impossible de créer l’intention de paiement." },
      { status: 400 }
    );
  }
}
