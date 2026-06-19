import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { attachSession, verifyPassword } from "@/lib/auth/session";
import { rejectLargeBody, textField, validationErrorResponse } from "@/lib/security/input";
import { emailIsValid, normalizeEmail, normalizePhone, phoneIsValid } from "@/lib/user-contact";
import { z } from "zod";

const loginSchema = z.object({
  identifier: textField(120).optional(),
  email: textField(120).optional(),
  phone: textField(40).optional(),
  password: z.preprocess((value) => String(value ?? ""), z.string().min(1).max(256)),
});

export async function POST(req: NextRequest) {
  const largeBody = rejectLargeBody(req);
  if (largeBody) return largeBody;
  try {
    const body = loginSchema.safeParse(await req.json().catch(() => ({})));
    if (!body.success) return validationErrorResponse();
    const identifier = (body.data.identifier ?? body.data.email ?? body.data.phone ?? "").trim();
    const password = body.data.password;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Veuillez saisir votre téléphone ou e-mail, puis votre mot de passe." },
        { status: 400 }
      );
    }

    const email = normalizeEmail(identifier);
    const phone = normalizePhone(identifier);
    const filters = [
      email && emailIsValid(email) ? { email } : null,
      phone && phoneIsValid(phone) ? { phone } : null,
    ].filter(Boolean) as Array<{ email: string } | { phone: string }>;

    if (filters.length === 0) {
      return NextResponse.json(
        { error: "Format invalide. Saisissez un e-mail ou un numéro de téléphone valide." },
        { status: 400 }
      );
    }

    const user = await db.user.findFirst({ where: { OR: filters } });
    if (!user || !verifyPassword(password, user.password)) {
      return NextResponse.json(
        { error: "Identifiant ou mot de passe incorrect." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        commune: user.commune,
      },
    });
    return attachSession(response, user.id);
  } catch {
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la connexion." },
      { status: 500 }
    );
  }
}
