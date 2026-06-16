import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ user: null, subscription: null });
  }

  const subscription = await db.subscription.findUnique({
    where: { userId: user.id },
  });

  const isPremium =
    !!subscription &&
    subscription.status === "active" &&
    (!subscription.endDate || new Date(subscription.endDate) > new Date());

  return NextResponse.json({
    user,
    subscription: isPremium ? subscription : null,
  });
}
