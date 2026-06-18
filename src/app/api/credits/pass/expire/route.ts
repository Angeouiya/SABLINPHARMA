import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { expirePassOrdonnance } from "@/lib/restrictions-server";

export async function POST() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const result = await expirePassOrdonnance(user.id);
  return NextResponse.json({
    success: true,
    hasPass: false,
    passStatus: result.status,
    message: result.message,
  });
}
