import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePharmacyPermission } from "@/lib/pharmacy-access";
import { getPublicPlatformStats } from "@/lib/public-platform-stats";
import type { PlatformScope, PlatformSyncMetric, PlatformSyncOverview } from "@/lib/platform-ux-sync";

export const dynamic = "force-dynamic";

function staleDate(days = 5) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function scopeFromRequest(req: NextRequest): PlatformScope {
  const value = req.nextUrl.searchParams.get("scope");
  return value === "admin" || value === "pharmacy" || value === "user" ? value : "user";
}

function overview(scope: PlatformScope, metrics: PlatformSyncMetric[], pipelineChecks: string[], warnings: string[] = []): PlatformSyncOverview {
  return {
    scope,
    generatedAt: new Date().toISOString(),
    metrics,
    pipelineChecks,
    warnings,
  };
}

function unavailableOverview(scope: PlatformScope): PlatformSyncOverview {
  return overview(
    scope,
    [
      {
        label: "Base de données",
        value: "Indisponible",
        status: "À surveiller",
        detail: "Les règles UX restent actives, mais les compteurs réels n’ont pas pu être lus.",
      },
      {
        label: "Mode affichage",
        value: "Fallback",
        status: "Publication contrôlée",
        detail: "Le panneau conserve les flux et garde-fous sans exposer de données sensibles.",
      },
    ],
    [
      "Aucune donnée sensible n’est exposée pendant l’indisponibilité.",
      "Les compteurs seront réactualisés dès que la base répondra.",
    ],
    ["Aperçu dynamique temporairement indisponible."]
  );
}

function jsonOverview(result: PlatformSyncOverview | Response) {
  return result instanceof Response ? result : NextResponse.json(result);
}

async function publicOverview() {
  const { medications, pharmacies, onDutyPharmacies, publishedInventory, publicMedia } =
    await getPublicPlatformStats();

  return overview(
    "user",
    [
      { label: "Médicaments actifs", value: medications, status: "Synchronisé", detail: "Référentiel public sans prix détaillé gratuit." },
      { label: "Pharmacies visibles", value: pharmacies, status: "Publication contrôlée", detail: "Uniquement les pharmacies validées et publiées." },
      { label: "Pharmacies de garde", value: onDutyPharmacies, status: "Synchronisé", detail: "Source horaires et garde des espaces professionnels." },
      { label: "Lignes publiées", value: publishedInventory, status: "Verrouillé", detail: "Disponibilités et prix restent accessibles après crédit." },
      { label: "Photos publiques", value: publicMedia, status: "Contrôle admin", detail: "Images validées, sans document confidentiel." },
    ],
    [
      "Les contacts restent verrouillés par crédits.",
      "Les stocks exacts ne sont jamais publics.",
      "Les prix détaillés et pharmacies disponibles nécessitent un accès autorisé.",
    ]
  );
}

async function pharmacyOverview(req: NextRequest) {
  const requestedSlug = req.nextUrl.searchParams.get("pharmacySlug");
  const access = requirePharmacyPermission(req, "view_own_dashboard", { pharmacySlug: requestedSlug });
  if (access.response) return access.response;

  const pharmacySlug = requestedSlug || access.session?.pharmacySlug;
  if (!pharmacySlug) {
    return NextResponse.json({ error: "Pharmacie introuvable pour cette session." }, { status: 400 });
  }

  const pharmacy = await db.pharmacy.findUnique({
    where: { slug: pharmacySlug },
    select: { id: true, name: true, accountStatus: true, publicationStatus: true, isOnDuty: true, lastDataUpdate: true },
  });
  if (!pharmacy) return NextResponse.json({ error: "Pharmacie introuvable." }, { status: 404 });

  const stale = staleDate(pharmacy.accountStatus === "Validée" ? 5 : 3);
  const [inventoryRows, publishedRows, reviewRows, pendingRequests, publicMedia, lastImports] = await Promise.all([
    db.pharmacyMedication.count({ where: { pharmacyId: pharmacy.id } }),
    db.pharmacyMedication.count({
      where: {
        pharmacyId: pharmacy.id,
        publicationStatus: "Publiée",
        medication: { status: "Actif" },
      },
    }),
    db.pharmacyMedication.count({
      where: {
        pharmacyId: pharmacy.id,
        OR: [
          { lastUpdatedAt: { lt: stale } },
          { reliabilityLevel: { in: ["Ancien", "À vérifier", "Incomplet"] } },
          { publicationStatus: { in: ["Brouillon", "À vérifier"] } },
        ],
      },
    }),
    db.pharmacyRequest.count({ where: { pharmacyId: pharmacy.id, status: { in: ["Nouvelle", "Reçue", "Acceptée", "En cours"] } } }),
    db.pharmacyMedia.count({ where: { pharmacyId: pharmacy.id, visibility: "public", isPublic: true, isValidated: true } }),
    db.pharmacyImport.count({ where: { pharmacyId: pharmacy.id, createdAt: { gte: staleDate(7) } } }),
  ]);

  return overview(
    "pharmacy",
    [
      { label: "Pharmacie", value: pharmacy.name, status: pharmacy.accountStatus, detail: `Publication : ${pharmacy.publicationStatus}` },
      { label: "Médicaments suivis", value: inventoryRows, status: "Synchronisé", detail: "Données internes de cette pharmacie uniquement." },
      { label: "Lignes publiables", value: publishedRows, status: "Publication contrôlée", detail: "Alimente la marketplace sans afficher le stock exact." },
      { label: "À corriger", value: reviewRows, status: reviewRows > 0 ? "À surveiller" : "Synchronisé", detail: "Données anciennes, incomplètes ou non publiées." },
      { label: "Demandes ouvertes", value: pendingRequests, status: pendingRequests > 0 ? "À surveiller" : "Synchronisé", detail: "Conseils et confirmations reçues depuis l’utilisateur." },
      { label: "Photos publiques validées", value: publicMedia, status: "Contrôle admin", detail: "Logo, façade, extérieur ou couverture validés." },
      { label: "Imports récents", value: lastImports, status: "Synchronisé", detail: "Fichiers traités ces 7 derniers jours." },
    ],
    [
      "Une pharmacie ne voit que ses propres données.",
      "Les lignes sûres peuvent être publiées, les lignes ambiguës restent à corriger.",
      "Les documents administratifs ne sont jamais visibles côté utilisateur.",
    ],
    pharmacy.accountStatus !== "Validée" ? ["Compte non validé : publication utilisateur limitée."] : []
  );
}

async function adminOverview(req: NextRequest) {
  const access = requirePharmacyPermission(req, "admin.dashboard.read");
  if (access.response) return access.response;

  const stale = staleDate();
  const [
    totalUsers,
    totalPharmacies,
    validatedPharmacies,
    pendingPharmacies,
    suspendedPharmacies,
    publishedInventory,
    reviewInventory,
    recentImports,
    pendingImportRows,
    publishedImportRows,
    imageCandidates,
    publishedImages,
    pendingRequests,
    suspiciousPayments,
    prohibitedTerms,
  ] = await Promise.all([
    db.user.count(),
    db.pharmacy.count(),
    db.pharmacy.count({ where: { accountStatus: "Validée" } }),
    db.pharmacy.count({ where: { accountStatus: { in: ["En attente", "En attente de validation", "Incomplète"] } } }),
    db.pharmacy.count({ where: { accountStatus: "Suspendue" } }),
    db.pharmacyMedication.count({
      where: {
        publicationStatus: "Publiée",
        pharmacy: { accountStatus: "Validée", publicationStatus: "Publiée" },
        medication: { status: "Actif" },
      },
    }),
    db.pharmacyMedication.count({
      where: {
        OR: [
          { lastUpdatedAt: { lt: stale } },
          { reliabilityLevel: { in: ["Ancien", "À vérifier", "Incomplet"] } },
          { publicationStatus: { in: ["Brouillon", "À vérifier"] } },
        ],
      },
    }),
    db.pharmacyImport.count({ where: { createdAt: { gte: staleDate(7) } } }),
    db.inventoryImportRow.count({ where: { status: { in: ["En attente", "Analyse", "Validation requise"] } } }),
    db.inventoryImportRow.count({ where: { status: "Publié" } }),
    db.medicationImage.count({ where: { validationStatus: { in: ["En attente", "À vérifier"] } } }),
    db.medicationImage.count({ where: { validationStatus: { in: ["Validée", "Publiée"] } } }),
    db.pharmacyRequest.count({ where: { status: { in: ["Nouvelle", "Reçue", "Acceptée", "En cours"] } } }),
    db.payment.count({ where: { OR: [{ status: { in: ["SUSPICIOUS", "MANUAL_REVIEW", "CHARGEBACK"] } }, { riskStatus: { in: ["Suspect", "Bloqué"] } }] } }),
    db.prohibitedMedicationTerm.count({ where: { active: true } }),
  ]);

  return overview(
    "admin",
    [
      { label: "Utilisateurs", value: totalUsers, status: "Synchronisé", detail: "Comptes publics, crédits et demandes." },
      { label: "Pharmacies", value: totalPharmacies, status: "Contrôle admin", detail: `${validatedPharmacies} validées, ${pendingPharmacies} en attente, ${suspendedPharmacies} suspendues.` },
      { label: "Lignes marketplace publiées", value: publishedInventory, status: "Publication contrôlée", detail: "Inventaires sûrs visibles après règles crédits." },
      { label: "Lignes à revoir", value: reviewInventory, status: reviewInventory > 0 ? "À surveiller" : "Synchronisé", detail: "Ancien, incomplet, à vérifier ou brouillon." },
      { label: "Imports récents", value: recentImports, status: "Synchronisé", detail: "Fichiers reçus ces 7 derniers jours." },
      { label: "Lignes import en validation", value: pendingImportRows, status: pendingImportRows > 0 ? "Contrôle admin" : "Synchronisé", detail: `${publishedImportRows} lignes déjà publiées.` },
      { label: "Images candidates", value: imageCandidates, status: imageCandidates > 0 ? "Contrôle admin" : "Synchronisé", detail: `${publishedImages} images validées ou publiées.` },
      { label: "Demandes utilisateurs ouvertes", value: pendingRequests, status: pendingRequests > 0 ? "À surveiller" : "Synchronisé", detail: "Conseils, confirmations et contacts." },
      { label: "Paiements à risque", value: suspiciousPayments, status: suspiciousPayments > 0 ? "Verrouillé" : "Synchronisé", detail: "Fraude, revue manuelle ou contestation." },
      { label: "Médicaments interdits actifs", value: prohibitedTerms, status: "Verrouillé", detail: "Retrait automatique avant publication." },
    ],
    [
      "Admin contrôle la publication multi-pharmacies.",
      "Pharmacie publie ses lignes sûres sans voir les autres pharmacies.",
      "Utilisateur voit seulement les données générales avant crédit.",
      "Paiement confirmé côté serveur avant crédit, pass ou service avancé.",
    ]
  );
}

export async function GET(req: NextRequest) {
  const scope = scopeFromRequest(req);
  try {
    if (scope === "admin") return jsonOverview(await adminOverview(req));
    if (scope === "pharmacy") return jsonOverview(await pharmacyOverview(req));
    const data = await publicOverview();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(unavailableOverview(scope));
  }
}
