import { db } from "@/lib/db";

export const PUBLISHED_PHARMACY_RATING_STATUS = "Publiée";

export function parsePharmacyRating(value: unknown) {
  const rating = Math.round(Number(value));
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    throw new Error("La note doit être comprise entre 1 et 5.");
  }
  return rating;
}

export function pharmacyRatingLabel(count: number) {
  if (count <= 0) return "Note initiale";
  return `${count} avis vérifié${count > 1 ? "s" : ""}`;
}

export function anonymizeRatingAuthor(name?: string | null) {
  if (!name?.trim()) return "Utilisateur SABLIN";
  const [firstName, secondName] = name.trim().split(/\s+/);
  if (!secondName) return firstName;
  return `${firstName} ${secondName.charAt(0).toUpperCase()}.`;
}

export async function recalculatePharmacyRating(pharmacyId: string) {
  const aggregate = await db.pharmacyRating.aggregate({
    where: {
      pharmacyId,
      status: PUBLISHED_PHARMACY_RATING_STATUS,
    },
    _avg: { rating: true },
    _count: { _all: true },
  });

  const ratingCount = aggregate._count._all;
  const rating = ratingCount > 0 ? Number((aggregate._avg.rating ?? 0).toFixed(1)) : 0;

  const updated = await db.pharmacy.update({
    where: { id: pharmacyId },
    data: ratingCount > 0 ? { rating, ratingCount } : { ratingCount: 0 },
    select: { rating: true, ratingCount: true },
  });

  return {
    rating: updated.rating,
    ratingCount: updated.ratingCount,
    ratingLabel: pharmacyRatingLabel(updated.ratingCount),
  };
}

export async function getPharmacyRatingSummary(pharmacyId: string, userId?: string | null) {
  const [pharmacy, aggregate, currentUserRating] = await Promise.all([
    db.pharmacy.findUnique({
      where: { id: pharmacyId },
      select: { rating: true, ratingCount: true },
    }),
    db.pharmacyRating.aggregate({
      where: {
        pharmacyId,
        status: PUBLISHED_PHARMACY_RATING_STATUS,
      },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    userId
      ? db.pharmacyRating.findUnique({
          where: { userId_pharmacyId: { userId, pharmacyId } },
          select: { rating: true, comment: true },
        })
      : Promise.resolve(null),
  ]);

  const liveCount = aggregate._count._all;
  const storedCount = pharmacy?.ratingCount ?? 0;
  const ratingCount = liveCount > 0 ? liveCount : storedCount;
  const rating =
    liveCount > 0
      ? Number((aggregate._avg.rating ?? 0).toFixed(1))
      : Number((pharmacy?.rating ?? 0).toFixed(1));

  return {
    rating,
    ratingCount,
    ratingLabel: pharmacyRatingLabel(ratingCount),
    currentUserRating: currentUserRating?.rating ?? null,
    currentUserComment: currentUserRating?.comment ?? "",
  };
}
