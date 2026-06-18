import { NextRequest, NextResponse } from "next/server";
import { authenticateProfessionalAccount } from "@/lib/professional-auth";
import { ADMIN_SESSION_COOKIE, professionalCookieOptions } from "@/lib/professional-sessions";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const auth = await authenticateProfessionalAccount({
    req,
    kind: "admin",
    identifier: body.identifier ?? body.email ?? body.phone,
    password: body.password,
    fallbackRole: body.role,
  });
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const response = NextResponse.json({
    ok: true,
    role: auth.session.role,
    accountStatus: auth.session.accountStatus,
    permissions: auth.session.permissions,
  });
  response.cookies.set(ADMIN_SESSION_COOKIE, auth.sessionValue, professionalCookieOptions());
  return response;
}
