import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hasPharmacyPermission, requirePharmacyPermission } from "@/lib/pharmacy-access";

function staleDate(days = 5) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export async function GET(req: NextRequest) {
  const requestedSlug = req.nextUrl.searchParams.get("pharmacySlug");
  const access = requirePharmacyPermission(req, "view_own_dashboard", { pharmacySlug: requestedSlug });
  if (access.response) return access.response;

  const canManageAll = hasPharmacyPermission(access.role, "view_all_pharmacies");
  const pharmacySlug = canManageAll ? requestedSlug || access.session?.pharmacySlug : access.session?.pharmacySlug;
  if (!pharmacySlug) {
    return NextResponse.json({ error: "Pharmacie introuvable pour cette session." }, { status: 400 });
  }

  const pharmacy = await db.pharmacy.findUnique({
    where: { slug: pharmacySlug },
    select: { id: true, name: true, accountStatus: true, isOnDuty: true, lastDataUpdate: true, dataQuality: true, qualityScore: true },
  });
  if (!pharmacy) {
    return NextResponse.json({ error: "Pharmacie introuvable." }, { status: 404 });
  }

  const stale = staleDate(pharmacy.accountStatus === "Validée" ? 5 : 3);
  const [
    medicationCount,
    staleAvailabilityCount,
    receivedRequests,
    pendingRequests,
    pendingConfirmations,
    priceToCheck,
    totalRows,
    reliableRows,
  ] = await Promise.all([
    db.pharmacyMedication.count({ where: { pharmacyId: pharmacy.id } }),
    db.pharmacyMedication.count({
      where: {
        pharmacyId: pharmacy.id,
        OR: [{ lastUpdatedAt: { lt: stale } }, { reliabilityLevel: { in: ["Ancien", "À vérifier", "Incomplet"] } }, { availabilityStatus: "À confirmer" }],
      },
    }),
    db.pharmacyRequest.count({ where: { pharmacyId: pharmacy.id } }),
    db.pharmacyRequest.count({ where: { pharmacyId: pharmacy.id, status: { in: ["Nouvelle", "Reçue", "Acceptée", "En cours"] } } }),
    db.pharmacyRequest.count({ where: { pharmacyId: pharmacy.id, requestType: { contains: "confirmation" }, status: { in: ["Nouvelle", "Reçue", "Acceptée", "En cours"] } } }),
    db.pharmacyMedication.count({
      where: {
        pharmacyId: pharmacy.id,
        OR: [{ priceReliabilityLevel: { in: ["Ancien", "À vérifier", "Incomplet"] } }, { priceUpdatedAt: null }],
      },
    }),
    db.pharmacyMedication.count({ where: { pharmacyId: pharmacy.id } }),
    db.pharmacyMedication.count({ where: { pharmacyId: pharmacy.id, reliabilityLevel: "Confirmé", lastUpdatedAt: { gte: stale } } }),
  ]);

  const qualityPercent = totalRows > 0 ? Math.round((reliableRows / totalRows) * 100) : pharmacy.qualityScore || 0;

  return NextResponse.json({
    pharmacy: {
      name: pharmacy.name,
      status: pharmacy.accountStatus,
      isOnDuty: pharmacy.isOnDuty,
      lastDataUpdate: pharmacy.lastDataUpdate,
      dataQuality: pharmacy.dataQuality,
    },
    medicationCount,
    staleAvailabilityCount,
    receivedRequests,
    pendingRequests,
    pendingConfirmations,
    dutyStatus: pharmacy.isOnDuty ? "Actif" : "Inactif",
    dataQualityPercent: qualityPercent,
    lastDataUpdateLabel: pharmacy.lastDataUpdate
      ? new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(pharmacy.lastDataUpdate)
      : "Non renseignée",
    priceToCheck,
  });
}
