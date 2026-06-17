import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth/guard";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ history: [] });
  const history = await db.searchHistory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ history });
}

export async function POST(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json(
      { error: "Vous devez être connecté." },
      { status: 401 }
    );
  }
  try {
    const body = await req.json();
    if (!body.label) {
      return NextResponse.json({ error: "label requis" }, { status: 400 });
    }
    const item = await db.searchHistory.create({
      data: {
        userId,
        kind: body.kind ?? "medication",
        query: body.query ?? null,
        slug: body.slug ?? null,
        label: body.label,
        meta: body.meta ?? null,
      },
    });
    return NextResponse.json({ item });
  } catch {
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

export async function DELETE() {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  await db.searchHistory.deleteMany({ where: { userId } });
  return NextResponse.json({ ok: true });
}
