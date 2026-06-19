import { NextRequest, NextResponse } from "next/server";
import {
  getPaymentProvider,
  listPaymentSecurityDashboard,
  processProviderConfirmation,
  requireAdminPaymentAccess,
} from "@/lib/payment-security";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const access = requireAdminPaymentAccess(req);
  if (!access.allowed) return NextResponse.json({ error: access.error }, { status: access.status });
  return NextResponse.json(await listPaymentSecurityDashboard());
}

export async function POST(req: NextRequest) {
  const access = requireAdminPaymentAccess(req);
  if (!access.allowed) return NextResponse.json({ error: access.error }, { status: access.status });
  const body = await req.json().catch(() => ({}));
  const reference = String(body.reference ?? "");
  if (!reference) return NextResponse.json({ error: "Référence obligatoire." }, { status: 400 });
  const payment = await db.payment.findUnique({ where: { reference } });
  if (!payment) return NextResponse.json({ error: "Paiement introuvable." }, { status: 404 });
  const provider = getPaymentProvider(payment.provider);
  const verification = await provider.reconcilePayment(reference);
  const result = await processProviderConfirmation({
    reference,
    providerReference: verification.providerReference,
    amount: verification.amount,
    currency: verification.currency,
    status: verification.status,
    signatureValid: true,
    actor: access.session,
    manualReason: "Réconciliation admin auprès du prestataire.",
  });
  return NextResponse.json(result);
}
