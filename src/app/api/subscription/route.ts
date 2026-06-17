import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ subscription: null });
  }
  const subscription = await db.subscription.findUnique({
    where: { userId: user.id },
  });
  const isPremium =
    !!subscription &&
    subscription.status === "active" &&
    (!subscription.endDate || new Date(subscription.endDate) > new Date());
  return NextResponse.json({ subscription: isPremium ? subscription : null });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "Vous devez être connecté pour vous abonner." },
      { status: 401 }
    );
  }
  try {
    const body = await req.json();
    const reference = body.reference ?? `SPL-${Date.now()}`;
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    const subscription = await db.subscription.upsert({
      where: { userId: user.id },
      update: {
        status: "active",
        amount: 500,
        startDate: new Date(),
        endDate,
      },
      create: {
        userId: user.id,
        plan: "premium",
        status: "active",
        amount: 500,
        startDate: new Date(),
        endDate,
      },
    });

    await db.payment.create({
      data: {
        userId: user.id,
        amount: 500,
        method: body.method ?? "mobile_money",
        provider: body.provider ?? "orange",
        reference,
        status: "success",
      },
    });

    return NextResponse.json({ subscription });
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de l'activation de l'abonnement." },
      { status: 500 }
    );
  }
}
