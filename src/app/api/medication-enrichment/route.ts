import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getExternalEnrichmentAdminStatus } from "@/lib/enrichment/enrichment-service";
import { canPublishMedicationImage } from "@/lib/enrichment/publication-guard";
import { hasPharmacyPermission, requirePharmacyPermission } from "@/lib/pharmacy-access";
import { ensurePlaceholderImage, matchMedicationInReferential, normalizeImportedRow, seedDefaultEnrichmentProviders } from "@/lib/medication-enrichment";
import { writeAudit } from "@/lib/professional-auth";

type CandidateImageDetails = {
  width?: number | null;
  height?: number | null;
  licenseUrl?: string | null;
  text?: string | null;
};

function getKind(req: NextRequest) {
  return req.headers.get("x-sablin-session-kind") === "admin" ? "admin" : "pharmacy";
}

async function ensureAccess(req: NextRequest, pharmacySlug?: string | null) {
  const isAdmin = getKind(req) === "admin";
  return requirePharmacyPermission(req, isAdmin ? "admin.medications.read" : "pharmacy.inventory.read", { pharmacySlug });
}

export async function GET(req: NextRequest) {
  await seedDefaultEnrichmentProviders();
  const { searchParams } = new URL(req.url);
  const pharmacySlug = searchParams.get("pharmacySlug");
  const access = await ensureAccess(req, pharmacySlug);
  if (access.response) return access.response;
  const isAdmin = hasPharmacyPermission(access.role, "admin.medications.read");
  const whereRows = isAdmin
    ? pharmacySlug
      ? { pharmacy: { slug: pharmacySlug } }
      : {}
    : { pharmacy: { slug: access.session?.activePharmacySlug ?? access.session?.pharmacySlug } };

  const [rows, jobs, candidates, images, descriptions, providers, externalEnrichment] = await Promise.all([
    db.inventoryImportRow.findMany({
      where: whereRows,
      include: {
        pharmacy: { select: { name: true, slug: true } },
        medication: { select: { id: true, name: true, slug: true, dosage: true, form: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
    db.enrichmentJob.findMany({
      where: isAdmin ? {} : { inventoryImportRow: whereRows },
      include: { medication: true, inventoryImportRow: { include: { pharmacy: true } } },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
    db.enrichmentCandidate.findMany({
      where: isAdmin ? {} : { job: { inventoryImportRow: whereRows } },
      include: {
        job: { include: { inventoryImportRow: { include: { pharmacy: true } } } },
        proposedMedication: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.medicationImage.findMany({
      where: isAdmin ? {} : { validationStatus: { in: ["En attente", "À vérifier"] } },
      include: { medication: true },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
    db.medicationDescription.findMany({
      where: isAdmin ? {} : { validationStatus: { in: ["Brouillon automatique", "À vérifier"] } },
      include: { medication: true },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
    db.enrichmentProviderConfig.findMany({ orderBy: [{ providerType: "asc" }, { priority: "asc" }] }),
    getExternalEnrichmentAdminStatus(),
  ]);

  return NextResponse.json({
    rows,
    jobs,
    candidates,
    images,
    descriptions,
    providers,
    externalEnrichment,
    rules: {
      automaticPublication:
        "Publication automatique uniquement pour un médicament déjà référencé, correspondance exacte, dosage et forme identiques, image déjà validée et licence validée.",
      warning:
        "Une image web inconnue ou sans licence ne peut jamais être publiée automatiquement.",
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const pharmacySlug = String(body.pharmacySlug ?? "").trim() || null;
  const access = await ensureAccess(req, pharmacySlug);
  if (access.response) return access.response;
  const normalized = normalizeImportedRow({
    lineNumber: Number(body.lineNumber ?? 1),
    name: String(body.name ?? ""),
    genericName: String(body.genericName ?? body.dci ?? ""),
    dosage: String(body.dosage ?? ""),
    form: String(body.form ?? ""),
    packaging: String(body.packaging ?? ""),
    manufacturer: String(body.manufacturer ?? ""),
    barcode: String(body.barcode ?? ""),
    remark: String(body.remark ?? ""),
  });
  const { best, candidates } = await matchMedicationInReferential(normalized);
  const job = await db.enrichmentJob.create({
    data: {
      medicationId: best.medicationId ?? null,
      provider: "Référentiel interne SABLIN PHARMA",
      status: best.level === "Correspondance certaine" ? "Validé" : "Validation requise",
      query: [normalized.commercialName, normalized.dosage, normalized.form, normalized.packaging, normalized.manufacturer].filter(Boolean).join(" "),
      confidenceScore: best.score,
      attempts: 1,
      startedAt: new Date(),
      completedAt: new Date(),
    },
  });
  for (const candidate of candidates) {
    await db.enrichmentCandidate.create({
      data: {
        jobId: job.id,
        candidateType: "medication_match",
        proposedMedicationId: candidate.medicationId ?? null,
        score: candidate.score,
        matchDetails: JSON.stringify(candidate),
        status: candidate.level === "Correspondance certaine" ? "Validé" : "À vérifier",
      },
    });
  }
  await writeAudit({
    req,
    platform: access.session?.kind ?? "pharmacy",
    action: "enrichment-started",
    entityType: "enrichment-job",
    entityId: job.id,
    actorAccountId: access.session?.accountId,
    actorName: access.session?.name,
    actorRole: access.role ?? undefined,
    newValue: { normalized, best },
  });
  return NextResponse.json({ job, best }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "").trim();
  const access = requirePharmacyPermission(req, "admin.medications.update");
  if (access.response) return access.response;

  if (action === "validate-match") {
    const candidate = await db.enrichmentCandidate.findUnique({
      where: { id: String(body.candidateId ?? "") },
      include: { job: { include: { inventoryImportRow: true } }, proposedMedication: true },
    });
    if (!candidate?.proposedMedicationId) return NextResponse.json({ error: "Candidat introuvable." }, { status: 404 });
    await db.enrichmentCandidate.update({
      where: { id: candidate.id },
      data: { status: "Validé", reviewedBy: access.session?.name ?? access.role ?? null, reviewedAt: new Date() },
    });
    if (candidate.job.inventoryImportRowId) {
      await db.inventoryImportRow.update({
        where: { id: candidate.job.inventoryImportRowId },
        data: {
          medicationId: candidate.proposedMedicationId,
          matchScore: candidate.score,
          matchLevel: candidate.score >= 95 ? "Correspondance certaine" : "Correspondance probable",
          status: "Validé",
          enrichmentRequired: false,
        },
      });
    }
    await db.enrichmentJob.update({ where: { id: candidate.jobId }, data: { medicationId: candidate.proposedMedicationId, status: "Validé", completedAt: new Date() } });
    await writeAudit({ req, platform: "admin", action: "enrichment-match-validated", entityType: "enrichment-candidate", entityId: candidate.id, actorAccountId: access.session?.accountId, actorName: access.session?.name, actorRole: access.role ?? undefined });
    return NextResponse.json({ ok: true });
  }

  if (action === "refuse-candidate") {
    await db.enrichmentCandidate.update({
      where: { id: String(body.candidateId ?? "") },
      data: { status: "Refusé", reviewedBy: access.session?.name ?? access.role ?? null, reviewedAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "validate-image" || action === "publish-image") {
    const imageId = String(body.imageId ?? "");
    const existingImage = await db.medicationImage.findUnique({ where: { id: imageId } });
    if (!existingImage) return NextResponse.json({ error: "Image introuvable." }, { status: 404 });
    if (action === "publish-image") {
      const publication = canPublishMedicationImage(existingImage);
      if (!publication.allowed) return NextResponse.json({ error: publication.reason }, { status: 400 });
    }
    const image = await db.medicationImage.update({
      where: { id: imageId },
      data: {
        validationStatus: action === "publish-image" ? "Publiée" : "Validée",
        validatedBy: access.session?.name ?? access.role ?? null,
        validatedAt: new Date(),
        isPrimary: Boolean(body.isPrimary),
        commercialUseAllowed: Boolean(body.commercialUseAllowed ?? true),
      },
    });
    if (image.isPrimary || action === "publish-image") {
      await db.medication.update({
        where: { id: image.medicationId },
        data: { imageUrl: image.url, verificationStatus: "Validé", verifiedAt: new Date(), verifiedBy: access.session?.name ?? access.role ?? null },
      });
    }
    return NextResponse.json({ image });
  }

  if (action === "promote-image-candidate") {
    const candidate = await db.enrichmentCandidate.findUnique({
      where: { id: String(body.candidateId ?? "") },
      include: { job: true },
    });
    if (!candidate?.imageUrl || candidate.candidateType !== "image") {
      return NextResponse.json({ error: "Image candidate introuvable." }, { status: 404 });
    }
    const medicationId = candidate.job.medicationId;
    if (!medicationId) {
      return NextResponse.json({ error: "Aucun médicament associé à cette image candidate." }, { status: 400 });
    }
    let details: CandidateImageDetails = {};
    if (candidate.matchDetails) {
      try {
        details = JSON.parse(candidate.matchDetails) as CandidateImageDetails;
      } catch {
        details = {};
      }
    }
    const existing = await db.medicationImage.findFirst({
      where: {
        medicationId,
        OR: [
          { url: candidate.imageUrl },
          { originalUrl: candidate.imageUrl },
        ],
      },
    });
    const image = existing ?? (await db.medicationImage.create({
      data: {
        medicationId,
        url: candidate.imageUrl,
        originalUrl: candidate.imageUrl,
        sourceName: candidate.sourceName ?? "Source web",
        sourceUrl: candidate.sourceUrl,
        imageType: "web_candidate",
        licenseType: candidate.licenseType ?? "Licence à confirmer",
        licenseUrl: details.licenseUrl ?? null,
        attributionText: details.text ?? null,
        commercialUseAllowed: false,
        modificationAllowed: false,
        isPrimary: false,
        isPlaceholder: false,
        width: Number(details.width ?? 0) || null,
        height: Number(details.height ?? 0) || null,
        confidenceScore: candidate.score,
        validationStatus: "À vérifier",
      },
    }));
    await db.enrichmentCandidate.update({
      where: { id: candidate.id },
      data: {
        status: "Validé",
        reviewedBy: access.session?.name ?? access.role ?? null,
        reviewedAt: new Date(),
      },
    });
    await writeAudit({
      req,
      platform: "admin",
      action: "enrichment-image-candidate-promoted",
      entityType: "medication-image",
      entityId: image.id,
      actorAccountId: access.session?.accountId,
      actorName: access.session?.name,
      actorRole: access.role ?? undefined,
      newValue: { candidateId: candidate.id, sourceName: candidate.sourceName, score: candidate.score },
    });
    return NextResponse.json({ image, message: "Image candidate préparée pour validation." });
  }

  if (action === "use-placeholder") {
    let medicationId = String(body.medicationId ?? "").trim();
    const candidateId = String(body.candidateId ?? "").trim();
    if (!medicationId && candidateId) {
      const candidate = await db.enrichmentCandidate.findUnique({
        where: { id: candidateId },
        include: { job: true },
      });
      medicationId = candidate?.job.medicationId ?? "";
    }
    if (!medicationId) return NextResponse.json({ error: "Médicament obligatoire pour utiliser le placeholder." }, { status: 400 });
    const placeholder = await ensurePlaceholderImage(medicationId);
    if (!placeholder) return NextResponse.json({ error: "Placeholder impossible pour ce médicament." }, { status: 404 });
    await writeAudit({
      req,
      platform: "admin",
      action: "enrichment-placeholder-used",
      entityType: "medication-image",
      entityId: placeholder.id,
      actorAccountId: access.session?.accountId,
      actorName: access.session?.name,
      actorRole: access.role ?? undefined,
    });
    return NextResponse.json({ image: placeholder, message: "Placeholder SABLIN PHARMA utilisé." });
  }

  if (action === "validate-description" || action === "publish-description") {
    const description = await db.medicationDescription.update({
      where: { id: String(body.descriptionId ?? "") },
      data: {
        validationStatus: action === "publish-description" ? "Publiée" : "Validée",
        validatedBy: access.session?.name ?? access.role ?? null,
        validatedAt: new Date(),
      },
    });
    if (action === "publish-description") {
      await db.medication.update({
        where: { id: description.medicationId },
        data: { shortDescription: description.shortText, description: description.longText ?? description.shortText, verifiedAt: new Date(), verifiedBy: access.session?.name ?? access.role ?? null },
      });
    }
    return NextResponse.json({ description });
  }

  if (action === "relaunch") {
    const job = await db.enrichmentJob.update({
      where: { id: String(body.jobId ?? "") },
      data: { status: "Analyse", attempts: { increment: 1 }, startedAt: new Date(), errorMessage: null },
    });
    return NextResponse.json({ job });
  }

  if (action === "publish-medication") {
    const medication = await db.medication.update({
      where: { id: String(body.medicationId ?? "") },
      data: { verificationStatus: "Publié", status: "Actif", verifiedAt: new Date(), verifiedBy: access.session?.name ?? access.role ?? null },
    });
    return NextResponse.json({ medication });
  }

  return NextResponse.json({ error: "Action d’enrichissement inconnue." }, { status: 400 });
}
