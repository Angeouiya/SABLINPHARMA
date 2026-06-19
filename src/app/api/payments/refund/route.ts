import { NextRequest, NextResponse } from "next/server";
import { refundPayment, requireAdminPaymentAccess } from "@/lib/payment-security";

export async function POST(req: NextRequest) {
  const access = requireAdminPaymentAccess(req, true);
  if (!access.allowed || !access.session) return NextResponse.json({ error: access.error }, { status: access.status });
  const body = await req.json().catch(() => ({}));
  const reference = String(body.reference ?? "");
  const reason = String(body.reason ?? "").trim();
  if (!reference || reason.length < 8) {
    return NextResponse.json({ error: "Référence et motif de remboursement obligatoires." }, { status: 400 });
  }
  const result = await refundPayment(reference, access.session, reason);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
