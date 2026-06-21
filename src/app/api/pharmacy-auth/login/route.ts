import { NextRequest, NextResponse } from "next/server";
import { authenticateProfessionalAccount } from "@/lib/professional-auth";
import { PHARMACY_SESSION_COOKIE, professionalCookieOptions } from "@/lib/professional-sessions";
import { rejectLargeBody, textField, validationErrorResponse } from "@/lib/security/input";
import { z } from "zod";

const professionalLoginSchema = z.object({
  identifier: textField(160).optional(),
  email: textField(160).optional(),
  phone: textField(40).optional(),
  password: z.preprocess((value) => (value == null ? undefined : String(value)), z.string().max(256).optional()),
  demo: z.boolean().optional(),
  role: textField(80).optional(),
});

export async function POST(req: NextRequest) {
  const largeBody = rejectLargeBody(req);
  if (largeBody) return largeBody;
  const body = professionalLoginSchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return validationErrorResponse();
  const auth = await authenticateProfessionalAccount({
    req,
    kind: "pharmacy",
    identifier: body.data.identifier ?? body.data.email ?? body.data.phone,
    password: body.data.password,
    demo: body.data.demo,
    fallbackRole: body.data.role,
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
