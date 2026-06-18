import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { PASS_ORDONNANCE_PRICE } from "@/lib/restrictions";

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

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "Vous devez être connecté pour acheter un Pass Ordonnance Unique." },
      { status: 401 }
    );
  }
  try {
    const body = await req.json();
    const reference = body.reference ?? `SPL-${Date.now()}`;

    const existing = await db.passOrdonnance.findFirst({
      where: { userId: user.id, active: true, status: { in: ["active", "linked"] } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Vous avez déjà un Pass Ordonnance Unique actif." },
        { status: 400 }
      );
    }

    const pass = await db.passOrdonnance.create({
      data: {
        userId: user.id,
        active: true,
        status: "active",
        price: PASS_ORDONNANCE_PRICE,
      },
    });

    await db.payment.create({
      data: {
        userId: user.id,
        amount: PASS_ORDONNANCE_PRICE,
        method: body.method ?? "mobile_money",
        provider: body.provider ?? "orange",
        reference,
        status: "success",
      },
    });

    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      select: { credits: true },
    });

    await db.creditTransaction.create({
      data: {
        userId: user.id,
        type: "pass",
        amount: 0,
        description: `Pass Ordonnance Unique — ${PASS_ORDONNANCE_PRICE} FCFA (${body.provider ?? "orange"})`,
        fcfaEquivalent: PASS_ORDONNANCE_PRICE,
        balanceBefore: fullUser?.credits ?? 0,
        balanceAfter: fullUser?.credits ?? 0,
        status: "réussi",
      },
    });

    return NextResponse.json({ subscription: null, pass, hasPass: true });
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de l'activation du Pass Ordonnance Unique." },
      { status: 500 }
    );
  }
}
