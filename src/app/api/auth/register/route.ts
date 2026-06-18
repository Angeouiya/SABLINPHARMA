import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { attachSession, hashPassword } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = (body.name ?? "").toString().trim();
    const email = (body.email ?? "").toString().trim().toLowerCase();
    const password = (body.password ?? "").toString();
    const phone = (body.phone ?? "").toString().trim() || null;
    const commune = (body.commune ?? "").toString().trim() || null;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Veuillez remplir tous les champs obligatoires." },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 6 caractères." },
        { status: 400 }
      );
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet e-mail." },
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
