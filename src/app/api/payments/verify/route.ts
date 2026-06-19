import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { verifyPayment } from "@/lib/payment-security";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const reference = String(body.reference ?? "");
  if (!reference) return NextResponse.json({ error: "Référence obligatoire." }, { status: 400 });

  const payment = await db.payment.findUnique({ where: { reference } });
  if (!payment || payment.userId !== user.id) {
    return NextResponse.json({ error: "Paiement introuvable." }, { status: 404 });
  }

  const result = await verifyPayment(reference);
  return NextResponse.json(result);
}
