import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { createPaymentIntent, type PurchaseType } from "@/lib/payment-security";
import { MAX_RECHARGE_AMOUNT, PASS_ORDONNANCE_PRICE } from "@/lib/restrictions";
import { optionalTextField, rejectLargeBody, textField, validationErrorResponse } from "@/lib/security/input";
import { z } from "zod";

const paymentIntentSchema = z.object({
  purchaseType: textField(80).optional(),
  type: textField(80).optional(),
  amount: z.coerce.number().int().positive().max(MAX_RECHARGE_AMOUNT),
  provider: optionalTextField(80),
  idempotencyKey: optionalTextField(160),
  phone: optionalTextField(40),
  holderName: optionalTextField(160),
});

export async function POST(req: NextRequest) {
  const largeBody = rejectLargeBody(req);
  if (largeBody) return largeBody;
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Vous devez être connecté pour payer." }, { status: 401 });
  }

  try {
    const body = paymentIntentSchema.safeParse(await req.json().catch(() => ({})));
    if (!body.success) return validationErrorResponse();
    const purchaseType = String(body.data.purchaseType ?? body.data.type ?? "") as PurchaseType;
    const amount = body.data.amount;
    if (purchaseType === "pass_ordonnance" && amount !== PASS_ORDONNANCE_PRICE) {
      return NextResponse.json({ error: "Le Pass Ordonnance Unique coûte 500 FCFA." }, { status: 400 });
    }
    const idempotencyKey = req.headers.get("x-idempotency-key") ?? body.data.idempotencyKey ?? null;
    const result = await createPaymentIntent({
      userId: user.id,
      purchaseType,
      amount,
      provider: body.data.provider,
      idempotencyKey,
      req,
      metadata: {
        phone: body.data.phone,
        holderName: body.data.holderName,
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
