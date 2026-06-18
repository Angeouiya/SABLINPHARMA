import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const SESSION_COOKIE = "sablin_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;
const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE,
};

export async function getSessionUser() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const decoded = JSON.parse(Buffer.from(raw, "base64").toString("utf-8"));
    if (!decoded?.userId) return null;
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        commune: true,
      },
    });
    return user;
  } catch {
    return null;
  }
}

export async function setSession(userId: string) {
  const cookieStore = await cookies();
  const payload = createSessionValue(userId);
  cookieStore.set(SESSION_COOKIE, payload, SESSION_COOKIE_OPTIONS);
}

export function createSessionValue(userId: string) {
  const payload = Buffer.from(
    JSON.stringify({ userId, ts: Date.now() }),
    "utf-8"
  ).toString("base64");
  return payload;
}

export function attachSession(response: NextResponse, userId: string) {
  response.cookies.set(SESSION_COOKIE, createSessionValue(userId), SESSION_COOKIE_OPTIONS);
  return response;
}

export function detachSession(response: NextResponse) {
  response.cookies.delete(SESSION_COOKIE);
  return response;
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

// Simple password hashing using Node crypto scrypt
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const hashBuf = Buffer.from(hash, "hex");
  const testBuf = scryptSync(password, salt, 64);
  if (hashBuf.length !== testBuf.length) return false;
  return timingSafeEqual(hashBuf, testBuf);
}
