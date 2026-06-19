import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { writeAudit } from "@/lib/professional-auth";
import {
  ADMIN_SESSION_COOKIE,
  PHARMACY_SESSION_COOKIE,
  decodeProfessionalSession,
} from "@/lib/professional-sessions";
import { emailIsValid, normalizeEmail, normalizePhone, phoneIsValid } from "@/lib/user-contact";

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

export async function PATCH(req: NextRequest) {
  const kind = req.headers.get("x-sablin-session-kind");
  const cookie = kind === "admin" ? ADMIN_SESSION_COOKIE : PHARMACY_SESSION_COOKIE;
  const session = decodeProfessionalSession(req.cookies.get(cookie)?.value);
  if (!session?.accountId) {
    return NextResponse.json({ error: "Session expirée. Veuillez vous reconnecter." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const email = normalizeEmail(body.email);
  const phone = normalizePhone(body.phone);

  if (!name) return NextResponse.json({ error: "Le nom du compte est obligatoire." }, { status: 400 });
  if (!email && !phone) {
    return NextResponse.json({ error: "Conservez au moins un e-mail ou téléphone professionnel." }, { status: 400 });
  }
  if (email && !emailIsValid(email)) {
    return NextResponse.json({ error: "Format d'e-mail professionnel invalide." }, { status: 400 });
  }
  if (phone && !phoneIsValid(phone)) {
    return NextResponse.json({ error: "Numéro de téléphone professionnel invalide." }, { status: 400 });
  }

  const duplicate = await db.professionalAccount.findFirst({
    where: {
      id: { not: session.accountId },
      OR: [email ? { email } : null, phone ? { phone } : null].filter(Boolean) as Array<{ email: string } | { phone: string }>,
    },
  });
  if (duplicate) {
    return NextResponse.json({ error: "Cet e-mail ou téléphone est déjà utilisé par un autre compte professionnel." }, { status: 409 });
  }

  const account = await db.professionalAccount.update({
    where: { id: session.accountId },
    data: { name, email, phone },
    select: { id: true, kind: true, name: true, email: true, phone: true, role: true, status: true },
  });
  await writeAudit({
    req,
    platform: account.kind,
    action: "professional-identifiers-updated",
    actorAccountId: account.id,
    actorName: account.name,
    actorRole: account.role,
    newValue: { name: account.name, email: account.email, phone: account.phone },
  });

  return NextResponse.json({ ok: true, account });
}
