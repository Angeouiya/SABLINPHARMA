import { NextResponse } from "next/server";
import { detachSession } from "@/lib/auth/session";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  return detachSession(response);
}
