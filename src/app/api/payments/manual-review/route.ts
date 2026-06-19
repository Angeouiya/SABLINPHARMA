import { NextRequest, NextResponse } from "next/server";
import { markPaymentManualReview, requireAdminPaymentAccess } from "@/lib/payment-security";

export async function POST(req: NextRequest) {
  const access = requireAdminPaymentAccess(req);
  if (!access.allowed || !access.session) return NextResponse.json({ error: access.error }, { status: access.status });
  const body = await req.json().catch(() => ({}));
  const reference = String(body.reference ?? "");
  const reason = String(body.reason ?? "").trim();
  if (!reference || reason.length < 8) {
    return NextResponse.json({ error: "Référence et motif détaillé obligatoires." }, { status: 400 });
  }
  const payment = await markPaymentManualReview(reference, reason, access.session);
  return NextResponse.json({ success: true, payment });
}
