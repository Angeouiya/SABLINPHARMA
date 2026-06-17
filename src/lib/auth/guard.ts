import { getSessionUser } from "@/lib/auth/session";
import { NextResponse } from "next/server";

/** Returns the authenticated user id or a 401 response. */
export async function requireUserId(): Promise<string | null> {
  const user = await getSessionUser();
  return user?.id ?? null;
}

export function unauthorized() {
  return NextResponse.json(
    { error: "Vous devez être connecté pour effectuer cette action." },
    { status: 401 }
  );
}
