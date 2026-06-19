import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/session";
import { buildResetUrl, sendPasswordResetEmail } from "@/lib/email";
import { generateToken, hashToken } from "@/lib/security/passwords";
import { rejectLargeBody, textField, validationErrorResponse } from "@/lib/security/input";
import { emailIsValid, normalizeEmail } from "@/lib/user-contact";
import { z } from "zod";

const RESET_TTL_MINUTES = 30;
const resetRequestSchema = z.object({ email: textField(160) });
const resetConfirmSchema = z.object({
  token: textField(256),
  password: z.preprocess((value) => String(value ?? ""), z.string().min(1).max(256)),
  confirmation: z.preprocess((value) => String(value ?? ""), z.string().min(1).max(256)).optional(),
  confirmPassword: z.preprocess((value) => String(value ?? ""), z.string().min(1).max(256)).optional(),
});

export async function POST(req: NextRequest) {
  const largeBody = rejectLargeBody(req);
  if (largeBody) return largeBody;
  const body = resetRequestSchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return validationErrorResponse();
  const email = normalizeEmail(body.data.email);

  if (!email || !emailIsValid(email)) {
    return NextResponse.json({ error: "Veuillez saisir un e-mail valide." }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { email } });
  if (user) {
    await db.userPasswordResetToken.updateMany({
      where: { userId: user.id, status: "ACTIVE" },
      data: { status: "REVOKED" },
    });
    const token = generateToken();
    await db.userPasswordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000),
      },
    });
    await sendPasswordResetEmail({
      to: email,
      name: user.name,
      platform: "Utilisateur",
      resetUrl: buildResetUrl(req.nextUrl.origin, token, "user"),
    });
  }

  return NextResponse.json({
    ok: true,
    message: "Si cet e-mail correspond à un compte, un lien de réinitialisation SABLIN PHARMA sera envoyé.",
  });
}

export async function PATCH(req: NextRequest) {
  const largeBody = rejectLargeBody(req);
  if (largeBody) return largeBody;
  const body = resetConfirmSchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return validationErrorResponse();
  const token = body.data.token;
  const password = body.data.password;
  const confirmation = body.data.confirmation ?? body.data.confirmPassword ?? "";

  if (!token || !password || password !== confirmation) {
    return NextResponse.json({ error: "Lien et confirmation du mot de passe obligatoires." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Le mot de passe doit contenir au moins 8 caractères." }, { status: 400 });
  }

  const reset = await db.userPasswordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!reset || reset.status !== "ACTIVE" || reset.expiresAt < new Date()) {
    return NextResponse.json({ error: "Lien expiré ou déjà utilisé." }, { status: 400 });
  }

  await db.$transaction([
    db.user.update({
      where: { id: reset.userId },
      data: { password: hashPassword(password) },
    }),
    db.userPasswordResetToken.update({
      where: { id: reset.id },
      data: { status: "USED", usedAt: new Date() },
    }),
    db.notification.create({
      data: {
        userId: reset.userId,
        title: "Mot de passe modifié",
        message: "Votre mot de passe SABLIN PHARMA a été modifié avec succès.",
        type: "info",
        icon: "ShieldCheck",
      },
    }),
  ]);

  return NextResponse.json({ ok: true, message: "Mot de passe modifié avec succès." });
}
