import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePharmacyPermission } from "@/lib/pharmacy-access";

function staleDate(days = 5) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function isMissingGps(latitude: number | null | undefined, longitude: number | null | undefined) {
  return !latitude || !longitude || Math.abs(latitude) < 0.001 || Math.abs(longitude) < 0.001;
}

function isMissingHours(value?: string | null) {
  if (!value) return true;
  const normalized = value.toLowerCase();
  return normalized.includes("confirmer") || normalized.includes("non renseign");
}

function qualityStatus(input: {
  accountStatus: string;
  staleMedications: number;
  toConfirmMedications: number;
  missingPrices: number;
  missingGps: boolean;
  missingHours: boolean;
  pendingRequests: number;
}) {
  if (input.accountStatus !== "Validée") return "Validation requise";
  if (input.missingGps || input.missingHours) return "Données incomplètes";
  if (input.staleMedications > 0) return "Données anciennes";
  if (input.toConfirmMedications > 0) return "Disponibilités à confirmer";
  if (input.missingPrices > 0) return "Prix non renseignés";
  if (input.pendingRequests > 0) return "Demandes en attente";
  return "Données à jour";
}

export async function GET(req: NextRequest) {
  const access = requirePharmacyPermission(req, "admin.data_quality.read");
  if (access.response) return access.response;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const commune = searchParams.get("commune")?.trim() ?? "";
  const status = searchParams.get("status")?.trim() ?? "";
  const quality = searchParams.get("quality")?.trim() ?? "";
  const stale = staleDate();

  const pharmacies = await db.pharmacy.findMany({
    where: {
      ...(commune ? { commune } : {}),
      ...(status ? { accountStatus: status } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { commune: { contains: q } },
              { district: { contains: q } },
              { managerName: { contains: q } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      slug: true,
      commune: true,
      district: true,
      accountStatus: true,
      publicationStatus: true,
      dataQuality: true,
      qualityScore: true,
      creationSource: true,
      lastDataUpdate: true,
      latitude: true,
      longitude: true,
      hoursWeekday: true,
      hoursSaturday: true,
      hoursSunday: true,
      isOnDuty: true,
    },
    orderBy: [{ accountStatus: "asc" }, { lastDataUpdate: "asc" }, { name: "asc" }],
    take: 80,
  });

  const rows = await Promise.all(
    pharmacies.map(async (pharmacy) => {
      const [totalMedications, staleMedications, toConfirmMedications, missingPrices, pendingRequests, publicMedia] =
        await Promise.all([
          db.pharmacyMedication.count({ where: { pharmacyId: pharmacy.id } }),
          db.pharmacyMedication.count({
            where: {
              pharmacyId: pharmacy.id,
              OR: [
                { lastUpdatedAt: { lt: stale } },
                { reliabilityLevel: { in: ["Ancien", "À vérifier", "Incomplet"] } },
              ],
            },
          }),
          db.pharmacyMedication.count({
            where: {
              pharmacyId: pharmacy.id,
              OR: [{ availabilityStatus: "À confirmer" }, { publicationStatus: { in: ["Brouillon", "À vérifier"] } }],
            },
          }),
          db.pharmacyMedication.count({
            where: {
              pharmacyId: pharmacy.id,
              OR: [
                { price: { lte: 0 } },
                { priceUpdatedAt: null },
                { priceReliabilityLevel: { in: ["Ancien", "À vérifier", "Incomplet"] } },
              ],
            },
          }),
          db.pharmacyRequest.count({
            where: {
              pharmacyId: pharmacy.id,
              status: { in: ["Nouvelle", "Reçue", "Acceptée", "En cours"] },
            },
          }),
          db.pharmacyMedia.count({
            where: {
              pharmacyId: pharmacy.id,
              visibility: "public",
              isPublic: true,
              isValidated: true,
              validationStatus: { in: ["Validée", "Publiée"] },
            },
          }),
        ]);

      const missingGps = isMissingGps(pharmacy.latitude, pharmacy.longitude);
      const missingHours =
        isMissingHours(pharmacy.hoursWeekday) || isMissingHours(pharmacy.hoursSaturday) || isMissingHours(pharmacy.hoursSunday);
      const computedStatus = qualityStatus({
        accountStatus: pharmacy.accountStatus,
        staleMedications,
        toConfirmMedications,
        missingPrices,
        missingGps,
        missingHours,
        pendingRequests,
      });
      const issueCount =
        staleMedications + toConfirmMedications + missingPrices + pendingRequests + (missingGps ? 1 : 0) + (missingHours ? 1 : 0);
      const score = Math.max(0, Math.min(100, 100 - Math.min(issueCount * 6, 70)));

      return {
        id: pharmacy.id,
        name: pharmacy.name,
        slug: pharmacy.slug,
        commune: pharmacy.commune,
        district: pharmacy.district,
        accountStatus: pharmacy.accountStatus,
        publicationStatus: pharmacy.publicationStatus,
        dataQuality: computedStatus,
        storedDataQuality: pharmacy.dataQuality,
        qualityScore: pharmacy.qualityScore || score,
        computedScore: score,
        creationSource: pharmacy.creationSource,
        lastDataUpdate: pharmacy.lastDataUpdate,
        isOnDuty: pharmacy.isOnDuty,
        totalMedications,
        staleMedications,
        toConfirmMedications,
        missingPrices,
        pendingRequests,
        publicMedia,
        missingGps,
        missingHours,
      };
    })
  );

  const filteredRows = quality ? rows.filter((row) => row.dataQuality === quality || row.storedDataQuality === quality) : rows;
  const summaryRows = rows;
  const metrics = {
    oldData: summaryRows.filter((row) => row.staleMedications > 0 || row.dataQuality === "Données anciennes").length,
    toConfirm: summaryRows.reduce((sum, row) => sum + row.toConfirmMedications, 0),
    missingPrices: summaryRows.reduce((sum, row) => sum + row.missingPrices, 0),
    staleAvailability: summaryRows.reduce((sum, row) => sum + row.staleMedications, 0),
    missingHours: summaryRows.filter((row) => row.missingHours).length,
    missingGps: summaryRows.filter((row) => row.missingGps).length,
    nonValidated: summaryRows.filter((row) => row.accountStatus !== "Validée").length,
    pendingRequests: summaryRows.reduce((sum, row) => sum + row.pendingRequests, 0),
    averageScore: summaryRows.length
      ? Math.round(summaryRows.reduce((sum, row) => sum + row.computedScore, 0) / summaryRows.length)
      : 0,
  };

  return NextResponse.json({
    metrics,
    rows: filteredRows.slice(0, 50),
    generatedAt: new Date().toISOString(),
  });
}
