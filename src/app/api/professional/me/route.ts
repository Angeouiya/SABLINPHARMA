import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  ADMIN_SESSION_COOKIE,
  PHARMACY_SESSION_COOKIE,
  decodeProfessionalSession,
} from "@/lib/professional-sessions";

export async function GET(req: NextRequest) {
  const kind = req.headers.get("x-sablin-session-kind");
  const cookie = kind === "admin" ? ADMIN_SESSION_COOKIE : PHARMACY_SESSION_COOKIE;
  const session = decodeProfessionalSession(req.cookies.get(cookie)?.value);
  if (!session?.accountId) {
    return NextResponse.json({ error: "Session expirée. Veuillez vous reconnecter." }, { status: 401 });
  }
  const account = await db.professionalAccount.findUnique({
    where: { id: session.accountId },
    include: { memberships: { include: { pharmacy: true } } },
  });
  if (!account || account.status !== "ACTIVE") {
    return NextResponse.json({ error: "Accès non autorisé." }, { status: 403 });
  }
  return NextResponse.json({
    session,
    account: {
      id: account.id,
      kind: account.kind,
      name: account.name,
      email: account.email,
      phone: account.phone,
      role: account.role,
      status: account.status,
      permissions: session.permissions ?? [],
      memberships: account.memberships.map((item) => ({
        pharmacyId: item.pharmacyId,
        pharmacySlug: item.pharmacy.slug,
        pharmacyName: item.pharmacy.name,
        role: item.role,
        status: item.status,
      })),
    },
  });
}
