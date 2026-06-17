import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    const body = await req.json();
    const method = (body.method ?? "mobile_money").toString();
    const provider = (body.provider ?? "orange").toString();
    const reference = `SPL-${Date.now()}`;
    const amount = parseInt(body.amount ?? "500", 10);

    const payment = await db.payment.create({
      data: {
        userId: user?.id,
        amount,
        method,
        provider,
        reference,
        status: "success",
      },
    });

    return NextResponse.json({ payment });
  } catch {
    return NextResponse.json(
      { error: "Erreur lors du traitement du paiement." },
      { status: 500 }
    );
  }
}
