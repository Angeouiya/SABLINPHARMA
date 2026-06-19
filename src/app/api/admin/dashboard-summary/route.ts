import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePharmacyPermission } from "@/lib/pharmacy-access";

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function staleDate(days = 5) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export async function GET(req: NextRequest) {
  const access = requirePharmacyPermission(req, "admin.dashboard.read");
  if (access.response) return access.response;

  const today = startOfToday();
  const stale = staleDate();

  const [
    totalUsers,
    usersWithCredits,
    activeUsers,
    totalCreditsSold,
    transactionsToday,
    totalPharmacies,
    validatedPharmacies,
    pendingPharmacies,
    suspendedPharmacies,
    referencedMedications,
    medicationRequestsPending,
    recentImports,
    staleData,
    pendingConfirmations,
    pendingUserRequests,
    totalInventoryRows,
    reliableInventoryRows,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { credits: { gt: 0 } } }),
    db.user.count({ where: { OR: [{ history: { some: { createdAt: { gte: staleDate(30) } } } }, { creditTransactions: { some: { createdAt: { gte: staleDate(30) } } } }] } }),
    db.creditTransaction.aggregate({ where: { type: "recharge", status: "réussi" }, _sum: { amount: true } }),
    db.creditTransaction.count({ where: { createdAt: { gte: today } } }),
    db.pharmacy.count(),
    db.pharmacy.count({ where: { accountStatus: "Validée" } }),
    db.pharmacy.count({ where: { accountStatus: { in: ["En attente", "En attente de validation", "Incomplète"] } } }),
    db.pharmacy.count({ where: { accountStatus: "Suspendue" } }),
    db.medication.count({ where: { status: "Actif" } }),
    db.medicationAddRequest.count({ where: { status: { in: ["En attente", "En analyse"] } } }),
    db.pharmacyImport.count({ where: { createdAt: { gte: staleDate(7) } } }),
    db.pharmacyMedication.count({ where: { OR: [{ lastUpdatedAt: { lt: stale } }, { reliabilityLevel: { in: ["Ancien", "À vérifier", "Incomplet"] } }] } }),
    db.pharmacyRequest.count({ where: { requestType: { contains: "confirmation" }, status: { in: ["Nouvelle", "Reçue", "Acceptée", "En cours"] } } }),
    db.pharmacyRequest.count({ where: { status: { in: ["Nouvelle", "Reçue", "Acceptée", "En cours"] } } }),
    db.pharmacyMedication.count(),
    db.pharmacyMedication.count({ where: { reliabilityLevel: "Confirmé", lastUpdatedAt: { gte: stale } } }),
  ]);

  const quality = totalInventoryRows > 0 ? Math.round((reliableInventoryRows / totalInventoryRows) * 100) : 0;

  return NextResponse.json({
    totalUsers,
    activeUsers,
    usersWithCredits,
    totalCreditsSold: totalCreditsSold._sum.amount ?? 0,
    transactionsToday,
    totalPharmacies,
    validatedPharmacies,
    pendingPharmacies,
    suspendedPharmacies,
    referencedMedications,
    medicationRequestsPending,
    recentImports,
    staleData,
    pendingConfirmations,
    pendingUserRequests,
    dataQualityPercent: quality,
  });
}
