import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { PASS_ORDONNANCE_PRICE } from "@/lib/restrictions";
import { createPaymentIntent } from "@/lib/payment-security";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ subscription: null, pass: null });
  }
  const pass = await db.passOrdonnance.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({
    subscription: null,
    pass:
      pass && pass.active && (pass.status === "active" || pass.status === "linked")
        ? pass
        : null,
    passStatus: pass?.status ?? "none",
  });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "Vous devez être connecté pour acheter un Pass Ordonnance Unique." },
      { status: 401 }
    );
  }
  try {
    const body = await req.json().catch(() => ({}));

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
      amount: PASS_ORDONNANCE_PRICE,
      provider: body.provider ?? "paydunya",
      idempotencyKey: req.headers.get("x-idempotency-key") ?? body.idempotencyKey,
      req,
      metadata: body,
    });

    return NextResponse.json({
      subscription: null,
      pending: true,
      hasPass: false,
      reference: result.payment.reference,
      checkoutUrl: result.checkoutUrl,
      status: result.payment.status,
      message: "Paiement en cours de vérification. Le Pass sera activé uniquement après confirmation PayDunya.",
    });
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la création du paiement du Pass Ordonnance Unique." },
      { status: 500 }
    );
  }
}
