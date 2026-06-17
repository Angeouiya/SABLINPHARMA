import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth/guard";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ favorites: [] });
  const favorites = await db.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ favorites });
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
    if (!body.kind || !body.slug || !body.label) {
      return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
    }
    const fav = await db.favorite.upsert({
      where: {
        userId_kind_slug: {
          userId,
          kind: body.kind,
          slug: body.slug,
        },
      },
      update: { label: body.label, meta: body.meta ?? null },
      create: {
        userId,
        kind: body.kind,
        slug: body.slug,
        label: body.label,
        meta: body.meta ?? null,
      },
    });
    return NextResponse.json({ favorite: fav, added: true });
  } catch {
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const kind = searchParams.get("kind");
  const slug = searchParams.get("slug");
  if (kind && slug) {
    await db.favorite.deleteMany({
      where: { userId, kind, slug },
    });
  } else {
    await db.favorite.deleteMany({ where: { userId } });
  }
  return NextResponse.json({ ok: true });
}
