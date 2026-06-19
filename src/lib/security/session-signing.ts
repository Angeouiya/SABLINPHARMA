import { createHmac, timingSafeEqual } from "crypto";

const SIGNED_SESSION_VERSION = "v1";

function sessionSecret() {
  const secret = process.env.SABLIN_SESSION_SECRET || process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (secret?.trim()) return secret.trim();
  if (process.env.NODE_ENV === "production") {
    throw new Error("SABLIN_SESSION_SECRET is required in production.");
  }
  return "sablin-local-session-secret-change-me";
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(encodedPayload: string) {
  return createHmac("sha256", sessionSecret()).update(encodedPayload).digest("base64url");
}

export function encodeSignedSession(payload: Record<string, unknown>) {
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  return `${SIGNED_SESSION_VERSION}.${encodedPayload}.${sign(encodedPayload)}`;
}

export function decodeSignedSession<T extends Record<string, unknown>>(value?: string | null): T | null {
  if (!value) return null;
  const [version, encodedPayload, signature] = value.split(".");
  if (version !== SIGNED_SESSION_VERSION || !encodedPayload || !signature) return null;

  const expected = sign(encodedPayload);
  const actualBuffer = Buffer.from(signature, "base64url");
  const expectedBuffer = Buffer.from(expected, "base64url");
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null;
  }

  try {
    return JSON.parse(base64UrlDecode(encodedPayload)) as T;
  } catch {
    return null;
  }
}
