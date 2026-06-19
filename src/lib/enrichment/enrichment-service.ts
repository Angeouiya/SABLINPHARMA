import { db } from "@/lib/db";
import { getEnrichmentConfig, type EnrichmentConfigStatus } from "@/lib/enrichment/config";
import { searchExternalImageCandidates } from "@/lib/enrichment/external-image-search-service";
import type { EnrichmentImageCandidate, GoogleImageSearchMedicationInput } from "@/lib/enrichment/google-image-search-provider";
import { logEnrichment } from "@/lib/enrichment/logger";
import { buildMedicationPlaceholderUrl, ensurePlaceholderImage } from "@/lib/medication-enrichment";

export type EnrichmentSearchWithFallback = {
  provider: string;
  query: string;
  candidates: EnrichmentImageCandidate[];
  fallbackImageUrl: string;
  fallbackSource: string;
  message: string;
  configStatus: EnrichmentConfigStatus;
};

function placeholderSource() {
  return "Placeholder SABLIN PHARMA";
}

async function findFallbackImage(medication: GoogleImageSearchMedicationInput) {
  if (!medication.id) return null;

  const publishedPrimary = await db.medicationImage.findFirst({
    where: {
      medicationId: medication.id,
      validationStatus: "Publiée",
      isPlaceholder: false,
      commercialUseAllowed: true,
    },
    orderBy: [{ isPrimary: "desc" }, { confidenceScore: "desc" }, { createdAt: "desc" }],
  });
  if (publishedPrimary) return { url: publishedPrimary.url, source: publishedPrimary.sourceName };

  const pharmacyImage = await db.medicationImage.findFirst({
    where: {
      medicationId: medication.id,
      validationStatus: "Publiée",
      imageType: "pharmacy_photo",
      commercialUseAllowed: true,
    },
    orderBy: [{ confidenceScore: "desc" }, { createdAt: "desc" }],
  });
  if (pharmacyImage) return { url: pharmacyImage.url, source: pharmacyImage.sourceName };

  const internalImage = await db.medicationImage.findFirst({
    where: {
      medicationId: medication.id,
      validationStatus: "Publiée",
      sourceName: { contains: "SABLIN" },
    },
    orderBy: [{ isPlaceholder: "asc" }, { confidenceScore: "desc" }, { createdAt: "desc" }],
  });
  if (internalImage) return { url: internalImage.url, source: internalImage.sourceName };

  const placeholder = await ensurePlaceholderImage(medication.id);
  if (placeholder) return { url: placeholder.url, source: placeholderSource() };

  return null;
}

export async function searchImageCandidatesWithFallback(
  medication: GoogleImageSearchMedicationInput
): Promise<EnrichmentSearchWithFallback> {
  const externalSearch = await searchExternalImageCandidates(medication);
  const fallback = await findFallbackImage(medication);
  const fallbackImageUrl = fallback?.url ?? buildMedicationPlaceholderUrl(medication);
  const fallbackSource = fallback?.source ?? placeholderSource();

  if (!externalSearch.candidates.length) {
    logEnrichment("info", "Fallback placeholder used for medication image", {
      medicationId: medication.id,
      providerStatus: externalSearch.configStatus.providerStatus,
    });
  }

  return {
    provider: externalSearch.provider,
    query: externalSearch.query,
    candidates: externalSearch.candidates,
    fallbackImageUrl,
    fallbackSource,
    message: externalSearch.candidates.length
      ? externalSearch.message
      : `${externalSearch.message}. ${fallbackSource} utilisé.`,
    configStatus: externalSearch.configStatus,
  };
}

export async function getExternalEnrichmentAdminStatus() {
  const config = getEnrichmentConfig();
  const provider = await db.enrichmentProviderConfig.findFirst({
    where: { name: "API image externe autorisée" },
    select: { lastSuccessAt: true, lastErrorAt: true, lastErrorMessage: true, active: true },
  }).catch(() => null);

  return {
    ...config,
    modeLabel: config.mode === "google_web" ? "Google/Web actif" : "Fallback interne",
    lastTest: provider?.lastSuccessAt
      ? {
          status: "success",
          at: provider.lastSuccessAt.toISOString(),
          message: "Dernier test réussi.",
        }
      : {
          status: "not_run",
          at: null,
          message: "Aucun test récent enregistré.",
        },
    lastError: provider?.lastErrorMessage ?? null,
    lastErrorAt: provider?.lastErrorAt?.toISOString() ?? null,
    adminMessage:
      config.providerStatus === "active"
        ? `L’enrichissement externe est actif côté serveur via ${config.activeProviders.join(", ")}. Les images web restent en validation Admin avant publication.`
        : "L’enrichissement externe est prêt côté serveur, mais il fonctionne actuellement en mode fallback interne/placeholder. Activez Openverse, Brave Search ou Google côté serveur pour lancer les recherches externes.",
  };
}

export async function recordExternalEnrichmentTest(input: {
  ok: boolean;
  message: string;
}) {
  await db.enrichmentProviderConfig.upsert({
    where: { name: "API image externe autorisée" },
    update: input.ok
      ? { active: true, lastSuccessAt: new Date(), lastErrorMessage: null, lastErrorAt: null }
      : { active: false, lastErrorMessage: input.message, lastErrorAt: new Date() },
    create: {
      providerType: "ImageSearchProvider",
      name: "API image externe autorisée",
      priority: 20,
      active: input.ok,
      quotaDaily: getEnrichmentConfig().dailyLimit,
      requestLimit: getEnrichmentConfig().maxResults,
      lastSuccessAt: input.ok ? new Date() : null,
      lastErrorAt: input.ok ? null : new Date(),
      lastErrorMessage: input.ok ? null : input.message,
    },
  });
}
