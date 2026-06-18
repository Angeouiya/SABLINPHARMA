import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { attachSession, hashPassword } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { normalizeEmail } from "@/lib/user-contact";

const GOOGLE_STATE_COOKIE = "sablin_google_oauth_state";

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleUserInfo = {
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
};

function redirectWithError(req: NextRequest, reason: string) {
  const url = new URL("/connexion", req.nextUrl.origin);
  url.searchParams.set("authError", reason);
  const response = NextResponse.redirect(url);
  response.cookies.delete(GOOGLE_STATE_COOKIE);
  return response;
}

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return redirectWithError(req, "google_not_configured");
  }

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const expectedState = req.cookies.get(GOOGLE_STATE_COOKIE)?.value;
  if (!code || !state || !expectedState || state !== expectedState) {
    return redirectWithError(req, "google_invalid_state");
  }

  const redirectUri = `${req.nextUrl.origin}/api/auth/google/callback`;
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });
  const token = (await tokenRes.json().catch(() => null)) as GoogleTokenResponse | null;
  if (!tokenRes.ok || !token?.access_token) {
    return redirectWithError(req, token?.error ?? "google_token_failed");
  }

  const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  const profile = (await profileRes.json().catch(() => null)) as GoogleUserInfo | null;
  const email = normalizeEmail(profile?.email);
  if (!profileRes.ok || !email || profile?.email_verified === false) {
    return redirectWithError(req, "google_email_unverified");
  }

  const name = profile?.name?.trim() || profile?.given_name?.trim() || "Utilisateur SABLIN";
  const user = await db.user.upsert({
    where: { email },
    update: { name },
    create: {
      name,
      email,
      password: hashPassword(randomUUID()),
      credits: 3,
    },
    select: { id: true },
  });

  const response = NextResponse.redirect(new URL("/", req.nextUrl.origin));
  response.cookies.delete(GOOGLE_STATE_COOKIE);
  return attachSession(response, user.id);
}
