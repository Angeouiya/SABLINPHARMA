import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { unauthorized } from "@/lib/auth/guard";
import {
  anonymizeRatingAuthor,
  getPharmacyRatingSummary,
  parsePharmacyRating,
  recalculatePharmacyRating,
} from "@/lib/pharmacy-ratings";

async function findPublishedPharmacy(slug: string) {
  return db.pharmacy.findFirst({
    where: {
      slug,
      accountStatus: "Validée",
      publicationStatus: "Publiée",
    },
    select: { id: true, name: true, slug: true },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const [{ slug }, user] = await Promise.all([params, getSessionUser()]);
  const pharmacy = await findPublishedPharmacy(slug);

  if (!pharmacy) {
    return NextResponse.json({ error: "Pharmacie introuvable" }, { status: 404 });
  }

  const [summary, recentRatings] = await Promise.all([
    getPharmacyRatingSummary(pharmacy.id, user?.id),
    db.pharmacyRating.findMany({
      where: {
        pharmacyId: pharmacy.id,
        status: "Publiée",
      },
      include: {
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return NextResponse.json({
    ...summary,
    canRate: Boolean(user),
    recentRatings: recentRatings.map((rating) => ({
      id: rating.id,
      rating: rating.rating,
      comment: rating.comment,
      author: anonymizeRatingAuthor(rating.user?.name),
      createdAt: rating.createdAt,
    })),
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const [{ slug }, user] = await Promise.all([params, getSessionUser()]);
  if (!user) return unauthorized();

  const pharmacy = await findPublishedPharmacy(slug);
  if (!pharmacy) {
    return NextResponse.json({ error: "Pharmacie introuvable" }, { status: 404 });
  }

  let payload: { rating?: unknown; comment?: unknown };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  }

  let rating: number;
  try {
    rating = parsePharmacyRating(payload.rating);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Note invalide." },
      { status: 400 }
    );
  }

  const comment =
    typeof payload.comment === "string" && payload.comment.trim()
      ? payload.comment.trim().slice(0, 500)
      : null;

  await db.pharmacyRating.upsert({
    where: {
      userId_pharmacyId: {
        userId: user.id,
        pharmacyId: pharmacy.id,
      },
    },
    update: {
      rating,
      comment,
      status: "Publiée",
      source: "Utilisateur",
    },
    create: {
      userId: user.id,
      pharmacyId: pharmacy.id,
      rating,
      comment,
      source: "Utilisateur",
      status: "Publiée",
    },
  });

  const summary = await recalculatePharmacyRating(pharmacy.id);

  return NextResponse.json({
    ...summary,
    currentUserRating: rating,
    currentUserComment: comment ?? "",
    message: "Votre note a été enregistrée.",
  });
}
