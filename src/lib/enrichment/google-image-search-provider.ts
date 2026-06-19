import { getActiveGoogleCredentials, getEnrichmentConfig, type EnrichmentConfigStatus } from "@/lib/enrichment/config";
import { logEnrichment } from "@/lib/enrichment/logger";
import { normalizeText } from "@/lib/medication-enrichment";

export type GoogleImageSearchMedicationInput = {
  id?: string;
  name: string;
  genericName?: string | null;
  dosage?: string | null;
  form?: string | null;
  packaging?: string | null;
  packSize?: string | null;
  manufacturer?: string | null;
};

export type EnrichmentImageCandidate = {
  title: string;
  imageUrl: string;
  sourceUrl: string;
  sourceName: string;
  width: number | null;
  height: number | null;
  format: string;
  text: string;
  licenseType: string;
  licenseUrl: string | null;
  commercialUseAllowed: boolean;
  score: number;
  status: "À vérifier" | "Refusé";
  validationStatus: "À vérifier";
  provider: "Google Custom Search API";
};

export type GoogleImageSearchResult = {
  provider: "Google Custom Search API" | "Fallback interne SABLIN PHARMA";
  query: string;
  candidates: EnrichmentImageCandidate[];
  configStatus: EnrichmentConfigStatus;
  message: string;
};

function compactText(parts: Array<string | null | undefined>) {
  return parts
    .map((part) => String(part ?? "").trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildGoogleImageQuery(input: GoogleImageSearchMedicationInput) {
  return compactText([
    input.name,
    input.genericName,
    input.dosage,
    input.form,
    input.packaging || input.packSize,
    input.manufacturer,
    "médicament",
  ]);
}

function safeHostname(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, "") || "Source web";
  } catch {
    return "Source web";
  }
}

function candidateScore(
  medication: GoogleImageSearchMedicationInput,
  text: string
) {
  const haystack = normalizeText(text);
  let score = 40;
  if (medication.name && haystack.includes(normalizeText(medication.name))) score += 20;
  if (medication.genericName && haystack.includes(normalizeText(medication.genericName))) score += 15;
  if (medication.dosage && haystack.includes(normalizeText(medication.dosage))) score += 15;
  if (medication.form && haystack.includes(normalizeText(medication.form))) score += 8;
  if (medication.manufacturer && haystack.includes(normalizeText(medication.manufacturer))) score += 5;
  return Math.min(score, 100);
}

export class GoogleImageSearchProvider {
  async searchImages(
    medication: GoogleImageSearchMedicationInput,
    options: { maxResults?: number } = {}
  ): Promise<GoogleImageSearchResult> {
    const query = buildGoogleImageQuery(medication);
    const credentials = getActiveGoogleCredentials();
    const configStatus = credentials?.status ?? getEnrichmentConfig();

    if (!credentials) {
      logEnrichment("info", configStatus.reason);
      return {
        provider: "Fallback interne SABLIN PHARMA",
        query,
        candidates: [],
        configStatus,
        message: configStatus.reason,
      };
    }

    const resultLimit = Math.min(options.maxResults ?? configStatus.maxResults, configStatus.maxResults, 10);
    const url = new URL("https://www.googleapis.com/customsearch/v1");
    url.searchParams.set("key", credentials.apiKey);
    url.searchParams.set("cx", credentials.searchEngineId);
    url.searchParams.set("searchType", "image");
    url.searchParams.set("safe", "active");
    url.searchParams.set("num", String(resultLimit));
    url.searchParams.set("q", query);

    try {
      const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(9000) });
      if (!res.ok) {
        logEnrichment("warn", "Google enrichment request failed: provider unavailable", { status: res.status });
        return {
          provider: "Fallback interne SABLIN PHARMA",
          query,
          candidates: [],
          configStatus,
          message: "Google enrichment request failed: provider unavailable",
        };
      }

      const json = await res.json();
      const items = Array.isArray(json.items) ? json.items : [];
      const candidates = items
        .map((item: Record<string, unknown>): EnrichmentImageCandidate | null => {
          const image = typeof item.image === "object" && item.image ? item.image as Record<string, unknown> : {};
          const imageUrl = String(item.link ?? "");
          if (!imageUrl) return null;
          const sourceUrl = String(image.contextLink ?? item.displayLink ?? item.link ?? "");
          const title = String(item.title ?? "");
          const text = compactText([String(item.snippet ?? ""), title, sourceUrl, imageUrl]);
          const score = candidateScore(medication, text);
          return {
            title,
            imageUrl,
            sourceUrl,
            sourceName: safeHostname(sourceUrl),
            width: Number(image.width ?? 0) || null,
            height: Number(image.height ?? 0) || null,
            format: String(item.mime ?? ""),
            text,
            licenseType: "Licence à confirmer",
            licenseUrl: null,
            commercialUseAllowed: false,
            score,
            status: score >= configStatus.confidenceThreshold ? "À vérifier" : "Refusé",
            validationStatus: "À vérifier",
            provider: "Google Custom Search API",
          };
        })
        .filter((candidate): candidate is EnrichmentImageCandidate => Boolean(candidate));

      return {
        provider: "Google Custom Search API",
        query,
        candidates,
        configStatus,
        message: candidates.length ? "Images candidates trouvées. Validation admin obligatoire." : "Aucun candidat image trouvé.",
      };
    } catch {
      logEnrichment("warn", "Google enrichment request failed: provider unavailable");
      return {
        provider: "Fallback interne SABLIN PHARMA",
        query,
        candidates: [],
        configStatus,
        message: "Google enrichment request failed: provider unavailable",
      };
    }
  }
}

export const googleImageSearchProvider = new GoogleImageSearchProvider();

