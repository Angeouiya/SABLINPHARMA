import { NextRequest, NextResponse } from "next/server";
import { authenticateProfessionalAccount } from "@/lib/professional-auth";
import { PHARMACY_SESSION_COOKIE, professionalCookieOptions } from "@/lib/professional-sessions";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const auth = await authenticateProfessionalAccount({
    req,
    kind: "pharmacy",
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
    status: auth.session.pharmacyStatus,
    accountStatus: auth.session.accountStatus,
    activePharmacySlug: auth.session.activePharmacySlug,
    allowedPharmacySlugs: auth.session.allowedPharmacySlugs,
    permissions: auth.session.permissions,
  });
  response.cookies.set(PHARMACY_SESSION_COOKIE, auth.sessionValue, professionalCookieOptions());
  return response;
}
