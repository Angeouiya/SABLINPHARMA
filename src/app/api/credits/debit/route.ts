import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";

// Debit credits for a paid action
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const amount = parseInt(body.amount, 10);
    const description = body.description ?? "Action payante";

    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      select: { credits: true },
    });
    const balance = fullUser?.credits ?? 0;

    if (balance < amount) {
      return NextResponse.json(
        { error: "Solde insuffisant", balance, needed: amount },
        { status: 402 }
      );
    }

    const newBalance = balance - amount;
    await db.user.update({
      where: { id: user.id },
      data: { credits: newBalance },
    });

    const tx = await db.creditTransaction.create({
      data: {
        userId: user.id,
        type: "debit",
        amount: -amount,
        description,
        balanceAfter: newBalance,
      },
    });

    return NextResponse.json({ success: true, balance: newBalance, transaction: tx });
  } catch {
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
