import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ user: null, pass: null });
  }

  const pass = await db.passOrdonnance.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const fullUser = await db.user.findUnique({
    where: { id: user.id },
    select: { credits: true },
  });

  return NextResponse.json({
    user: { ...user, credits: fullUser?.credits ?? 0 },
    pass:
      pass && pass.active && (pass.status === "active" || pass.status === "linked")
        ? pass
        : null,
    passStatus: pass?.status ?? "none",
  });
}
