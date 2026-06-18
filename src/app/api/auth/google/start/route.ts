import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";

const GOOGLE_STATE_COOKIE = "sablin_google_oauth_state";

function redirectToAuth(req: NextRequest, reason: string) {
  const url = new URL("/connexion", req.nextUrl.origin);
  url.searchParams.set("authError", reason);
  return NextResponse.redirect(url);
}

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return redirectToAuth(req, "google_not_configured");
  }

  const state = randomBytes(24).toString("hex");
  const redirectUri = `${req.nextUrl.origin}/api/auth/google/callback`;
  const googleUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleUrl.searchParams.set("client_id", clientId);
  googleUrl.searchParams.set("redirect_uri", redirectUri);
  googleUrl.searchParams.set("response_type", "code");
  googleUrl.searchParams.set("scope", "openid email profile");
  googleUrl.searchParams.set("state", state);
  googleUrl.searchParams.set("prompt", "select_account");

  const response = NextResponse.redirect(googleUrl);
  response.cookies.set(GOOGLE_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: req.nextUrl.protocol === "https:",
    path: "/",
    maxAge: 10 * 60,
  });
  return response;
}
