import { braveImageSearchProvider } from "@/lib/enrichment/brave-image-search-provider";
import { getEnrichmentConfig } from "@/lib/enrichment/config";
import { googleImageSearchProvider, type GoogleImageSearchMedicationInput, type GoogleImageSearchResult } from "@/lib/enrichment/google-image-search-provider";
import { logEnrichment } from "@/lib/enrichment/logger";
import { openverseImageSearchProvider } from "@/lib/enrichment/openverse-image-search-provider";

type ProviderRunner = {
  name: string;
  run: () => Promise<GoogleImageSearchResult>;
};

function providersForConfig(
  medication: GoogleImageSearchMedicationInput,
  options: { maxResults?: number } = {}
): ProviderRunner[] {
  const config = getEnrichmentConfig();
  const preference = config.imageSearchProvider;
  const providers: ProviderRunner[] = [];

  if (preference === "google" || preference === "auto") {
    providers.push({
      name: "Google Custom Search API",
      run: () => googleImageSearchProvider.searchImages(medication, options),
    });
  }

  if (preference === "brave" || preference === "auto") {
    providers.push({
      name: "Brave Search API",
      run: () => braveImageSearchProvider.searchImages(medication, options),
    });
  }

  if (preference === "openverse" || preference === "auto") {
    providers.push({
      name: "Openverse API",
      run: () => openverseImageSearchProvider.searchImages(medication, options),
    });
  }

  return providers;
}

export async function searchExternalImageCandidates(
  medication: GoogleImageSearchMedicationInput,
  options: { maxResults?: number } = {}
): Promise<GoogleImageSearchResult> {
  const config = getEnrichmentConfig();
  if (config.providerStatus !== "active") {
    return {
      provider: "Fallback interne SABLIN PHARMA",
      query: [
        medication.name,
        medication.genericName,
        medication.dosage,
        medication.form,
        medication.packaging || medication.packSize,
        medication.manufacturer,
        "médicament",
      ].filter(Boolean).join(" "),
      candidates: [],
      configStatus: config,
      message: config.reason,
    };
  }

  const messages: string[] = [];
  for (const provider of providersForConfig(medication, options)) {
    const result = await provider.run();
    messages.push(`${provider.name}: ${result.message}`);
    if (result.candidates.length) {
      if (provider.name !== "Google Custom Search API") {
        logEnrichment("info", `${provider.name} used for medication image candidates`, { medicationId: medication.id });
      }
      return {
        ...result,
        message: `${result.message} Chaîne testée: ${messages.join(" | ")}`,
      };
    }
  }

  return {
    provider: "Fallback interne SABLIN PHARMA",
    query: [
      medication.name,
      medication.genericName,
      medication.dosage,
      medication.form,
      medication.packaging || medication.packSize,
      medication.manufacturer,
      "médicament",
    ].filter(Boolean).join(" "),
    candidates: [],
    configStatus: config,
    message: messages.length ? messages.join(" | ") : config.reason,
  };
}
