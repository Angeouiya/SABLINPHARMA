import { NextRequest, NextResponse } from "next/server";
import { authenticateProfessionalAccount } from "@/lib/professional-auth";
import { ADMIN_SESSION_COOKIE, professionalCookieOptions } from "@/lib/professional-sessions";
import { rejectLargeBody, textField, validationErrorResponse } from "@/lib/security/input";
import { z } from "zod";

const professionalLoginSchema = z.object({
  identifier: textField(160).optional(),
  email: textField(160).optional(),
  phone: textField(40).optional(),
  password: z.preprocess((value) => String(value ?? ""), z.string().min(1).max(256)),
  role: textField(80).optional(),
});

export async function POST(req: NextRequest) {
  const largeBody = rejectLargeBody(req);
  if (largeBody) return largeBody;
  const body = professionalLoginSchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return validationErrorResponse();
  const auth = await authenticateProfessionalAccount({
    req,
    kind: "admin",
    identifier: body.data.identifier ?? body.data.email ?? body.data.phone,
    password: body.data.password,
    fallbackRole: body.data.role,
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
