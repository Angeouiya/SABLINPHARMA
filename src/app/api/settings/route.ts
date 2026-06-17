import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth/guard";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({
      settings: {
        pushAlerts: true,
        dutyAlerts: true,
        priceAlerts: false,
        promoAlerts: true,
        emailRecap: false,
        language: "fr",
        theme: "light",
        defaultCommune: null,
      },
    });
  }
  let settings = await db.userSettings.findUnique({ where: { userId } });
  if (!settings) {
    settings = await db.userSettings.create({ data: { userId } });
  }
  return NextResponse.json({ settings });
}

export async function PATCH(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json(
      { error: "Vous devez être connecté." },
      { status: 401 }
    );
  }
  try {
    const body = await req.json();
    const data: Record<string, unknown> = {};
    const allowed = [
      "pushAlerts",
      "dutyAlerts",
      "priceAlerts",
      "promoAlerts",
      "emailRecap",
      "language",
      "theme",
      "defaultCommune",
    ];
    for (const k of allowed) {
      if (k in body) data[k] = body[k];
    }
    const settings = await db.userSettings.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data } as never,
    });
    return NextResponse.json({ settings });
  } catch {
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
