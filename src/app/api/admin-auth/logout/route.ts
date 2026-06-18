import { NextRequest, NextResponse } from "next/server";
import { revokeProfessionalSession, writeAudit } from "@/lib/professional-auth";
import { ADMIN_SESSION_COOKIE, decodeProfessionalSession } from "@/lib/professional-sessions";

export async function POST(req: NextRequest) {
  const session = decodeProfessionalSession(req.cookies.get(ADMIN_SESSION_COOKIE)?.value);
  await revokeProfessionalSession(session?.sessionId, session?.accountId);
  if (session) {
    await writeAudit({
      req,
      platform: "admin",
      action: "logout",
      actorAccountId: session.accountId,
      actorName: session.name,
      actorRole: session.role,
      sessionId: session.sessionId,
    });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
