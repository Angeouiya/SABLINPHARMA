import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { attachSession, hashPassword } from "@/lib/auth/session";
import { optionalTextField, rejectLargeBody, textField, validationErrorResponse } from "@/lib/security/input";
import { emailIsValid, normalizeEmail, normalizePhone, phoneIsValid } from "@/lib/user-contact";
import { z } from "zod";

const registerSchema = z.object({
  name: textField(120),
  email: optionalTextField(160),
  phone: optionalTextField(40),
  password: z.preprocess((value) => String(value ?? ""), z.string().min(1).max(256)),
  commune: optionalTextField(120),
});

export async function POST(req: NextRequest) {
  const largeBody = rejectLargeBody(req);
  if (largeBody) return largeBody;
  try {
    const body = registerSchema.safeParse(await req.json().catch(() => ({})));
    if (!body.success) return validationErrorResponse();
    const name = body.data.name;
    const email = normalizeEmail(body.data.email);
    const password = body.data.password;
    const phone = normalizePhone(body.data.phone);
    const commune = body.data.commune;

    if (!name || !password || (!email && !phone)) {
      return NextResponse.json(
        { error: "Veuillez saisir votre nom, un téléphone ou un Gmail, puis votre mot de passe." },
        { status: 400 }
      );
    }
    if (email && !emailIsValid(email)) {
      return NextResponse.json(
        { error: "Format d'e-mail invalide.", field: "email" },
        { status: 400 }
      );
    }
    if (phone && !phoneIsValid(phone)) {
      return NextResponse.json(
        { error: "Numéro de téléphone invalide. Exemple : 07 00 00 00 00.", field: "phone" },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères." },
        { status: 400 }
      );
    }

    const existing = await db.user.findFirst({
      where: {
        OR: [
          email ? { email } : null,
          phone ? { phone } : null,
        ].filter(Boolean) as Array<{ email: string } | { phone: string }>,
      },
    });
    if (existing) {
      const field = email && existing.email === email ? "email" : "phone";
      return NextResponse.json(
        {
          error:
            field === "email"
              ? "Un compte existe déjà avec cet e-mail."
              : "Un compte existe déjà avec ce numéro de téléphone.",
          field,
        },
        { status: 409 }
      );
    }

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashPassword(password),
        phone,
        commune,
      },
      select: { id: true, name: true, email: true, phone: true, commune: true },
    });

    const response = NextResponse.json({ user });
    return attachSession(response, user.id);
  } catch (e) {
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'inscription." },
      { status: 500 }
    );
  }
}
