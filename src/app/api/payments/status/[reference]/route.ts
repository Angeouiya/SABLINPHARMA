import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { expireStalePayment, PAYMENT_STATUS_LABELS, type PaymentStatus } from "@/lib/payment-security";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { reference } = await params;
  await expireStalePayment(reference);
  const payment = await db.payment.findUnique({ where: { reference } });
  if (!payment || payment.userId !== user.id) {
    return NextResponse.json({ error: "Paiement introuvable." }, { status: 404 });
  }
  const status = payment.status as PaymentStatus;
  return NextResponse.json({
    reference: payment.reference,
    status,
    statusLabel: PAYMENT_STATUS_LABELS[status] ?? payment.status,
    amount: payment.amount,
    productType: payment.productType,
    expectedCredits: payment.expectedCredits,
    passOrdonnance: payment.passOrdonnance,
    riskStatus: payment.riskStatus,
    message:
      status === "SUCCESS"
        ? payment.productType === "pass_ordonnance"
          ? "Paiement confirmé. Votre Pass Ordonnance Unique est actif."
          : "Paiement confirmé. Vos crédits ont été ajoutés."
        : status === "PENDING" || status === "PROCESSING" || status === "INITIATED"
          ? "Paiement en cours de vérification. Les crédits seront ajoutés après confirmation."
          : status === "SUSPICIOUS" || status === "MANUAL_REVIEW"
            ? "Paiement en vérification. Contactez le support si nécessaire."
            : "Paiement non confirmé. Aucun crédit n’a été ajouté.",
  });
}
