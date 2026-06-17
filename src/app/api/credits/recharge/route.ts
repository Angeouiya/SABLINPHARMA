import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";

// Recharge credits via Mobile Money (mock)
const PACKS: Record<number, { credits: number; label: string }> = {
  200: { credits: 2, label: "Pack Découverte" },
  500: { credits: 6, label: "Pack Standard" },
  1000: { credits: 13, label: "Pack Plus" },
  2000: { credits: 28, label: "Pack Famille" },
};

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const amount = parseInt(body.amount, 10);
    const pack = PACKS[amount];

    if (!pack) {
      return NextResponse.json({ error: "Pack invalide" }, { status: 400 });
    }

    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      select: { credits: true },
    });
    const balance = (fullUser?.credits ?? 0) + pack.credits;

    await db.user.update({
      where: { id: user.id },
      data: { credits: balance },
    });

    const tx = await db.creditTransaction.create({
      data: {
        userId: user.id,
        type: "recharge",
        amount: pack.credits,
        description: `${pack.label} — ${amount} FCFA (${body.provider ?? "mobile_money"})`,
        balanceAfter: balance,
      },
    });

    // Create payment record
    await db.payment.create({
      data: {
        userId: user.id,
        amount,
        method: "mobile_money",
        provider: body.provider ?? "orange",
        reference: `SPL-RECHARGE-${Date.now()}`,
        status: "success",
      },
    });

    return NextResponse.json({ success: true, balance, credits: pack.credits, transaction: tx });
  } catch {
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
