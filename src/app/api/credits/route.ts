import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ credits: 0, transactions: [] });
  }
  const fullUser = await db.user.findUnique({
    where: { id: user.id },
    select: { credits: true },
  });
  const transactions = await db.creditTransaction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  const pass = await db.passOrdonnance.findFirst({
    where: { userId: user.id, active: true },
  });
  return NextResponse.json({
    credits: fullUser?.credits ?? 0,
    transactions,
    hasPass: !!pass,
  });
}
