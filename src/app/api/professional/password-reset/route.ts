import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateToken, hashPassword, hashToken, passwordStrength } from "@/lib/security/passwords";
import { revokeProfessionalSession, writeAudit } from "@/lib/professional-auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const identifier = String(body.identifier ?? body.email ?? body.phone ?? "").trim().toLowerCase();
  const account = identifier
    ? await db.professionalAccount.findFirst({ where: { OR: [{ email: identifier }, { phone: identifier }] } })
    : null;
  if (account) {
    const token = generateToken();
    await db.passwordResetToken.create({
      data: {
        accountId: account.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    });
    await writeAudit({
      req,
      platform: account.kind,
      action: "password-reset-requested",
      actorAccountId: account.id,
      actorName: account.name,
      actorRole: account.role,
    });
  }
  return NextResponse.json({
    ok: true,
    message: "Si un compte correspond à ces informations, un lien de réinitialisation sera envoyé.",
  });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const token = String(body.token ?? "");
  const password = String(body.password ?? "");
  const confirmation = String(body.confirmation ?? body.confirmPassword ?? "");
  if (!token || !password || password !== confirmation) {
    return NextResponse.json({ error: "Jeton et confirmation du mot de passe obligatoires." }, { status: 400 });
  }
  const strength = passwordStrength(password);
  if (!strength.valid) return NextResponse.json({ error: strength.message }, { status: 400 });

  const reset = await db.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { account: true },
  });
  if (!reset || reset.status !== "ACTIVE" || reset.expiresAt < new Date()) {
    return NextResponse.json({ error: "Lien expiré ou déjà utilisé." }, { status: 400 });
  }
  await db.professionalAccount.update({
    where: { id: reset.accountId },
    data: {
      passwordHash: hashPassword(password),
      lastPasswordChangeAt: new Date(),
      mustResetPassword: false,
      sessionVersion: { increment: 1 },
    },
  });
  await db.passwordResetToken.update({
    where: { id: reset.id },
    data: { status: "USED", usedAt: new Date() },
  });
  const sessions = await db.professionalSessionRecord.findMany({
    where: { accountId: reset.accountId, status: "ACTIVE" },
    select: { id: true },
  });
  for (const session of sessions) await revokeProfessionalSession(session.id, reset.accountId);
  await writeAudit({
    req,
    platform: reset.account.kind,
    action: "password-reset-completed",
    actorAccountId: reset.account.id,
    actorName: reset.account.name,
    actorRole: reset.account.role,
  });
  return NextResponse.json({ ok: true });
}
