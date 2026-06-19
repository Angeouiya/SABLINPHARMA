import { NextRequest, NextResponse } from "next/server";
import { processProviderConfirmation, requireAdminPaymentAccess } from "@/lib/payment-security";

export async function POST(req: NextRequest) {
  const access = requireAdminPaymentAccess(req, true);
  if (!access.allowed || !access.session) return NextResponse.json({ error: access.error }, { status: access.status });
  const body = await req.json().catch(() => ({}));
  const confirmation = String(body.confirmation ?? "");
  const reason = String(body.reason ?? "").trim();
  if (confirmation !== "VALIDER" || reason.length < 12) {
    return NextResponse.json(
      { error: "Validation renforcée requise : saisissez VALIDER et un motif obligatoire." },
      { status: 400 }
    );
  }
  const result = await processProviderConfirmation({
    reference: String(body.reference ?? ""),
    providerReference: body.providerReference ?? null,
    amount: Number(body.amount),
    currency: body.currency ?? "XOF",
    status: "SUCCESS",
    signatureValid: true,
    actor: access.session,
    manualReason: reason,
  });
  return NextResponse.json(result);
}
