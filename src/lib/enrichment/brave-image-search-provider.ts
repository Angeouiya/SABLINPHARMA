import { getEnrichmentConfig } from "@/lib/enrichment/config";
import { logEnrichment } from "@/lib/enrichment/logger";
import {
  buildGoogleImageQuery,
  candidateScore,
  compactText,
  type EnrichmentImageCandidate,
  type GoogleImageSearchMedicationInput,
  type GoogleImageSearchResult,
  safeHostname,
} from "@/lib/enrichment/google-image-search-provider";

type BraveImageResult = {
  title?: string;
  url?: string;
  source?: string;
  page_url?: string;
  image_url?: string;
  thumbnail?: { src?: string };
  properties?: {
    url?: string;
    image_url?: string;
    placeholder?: string;
    width?: number;
    height?: number;
    format?: string;
  };
  meta_url?: { hostname?: string; path?: string };
};

function readBraveApiKey(env: Record<string, string | undefined> = process.env) {
  return env.BRAVE_SEARCH_API_KEY?.trim() ?? "";
}

export class BraveImageSearchProvider {
  async searchImages(
    medication: GoogleImageSearchMedicationInput,
    options: { maxResults?: number } = {}
  ): Promise<GoogleImageSearchResult> {
    const configStatus = getEnrichmentConfig();
    const apiKey = readBraveApiKey();
    const query = buildGoogleImageQuery(medication);
    if (!configStatus.externalEnrichmentEnabled || !apiKey) {
      return {
        provider: "Fallback interne SABLIN PHARMA",
        query,
        candidates: [],
        configStatus,
        message: "Brave Search enrichment disabled: missing BRAVE_SEARCH_API_KEY",
      };
    }

    const resultLimit = Math.min(options.maxResults ?? configStatus.maxResults, configStatus.maxResults, 20);
    const url = new URL("https://api.search.brave.com/res/v1/images/search");
    url.searchParams.set("q", query);
    url.searchParams.set("count", String(resultLimit));
    url.searchParams.set("country", "ALL");
    url.searchParams.set("search_lang", "fr");
    url.searchParams.set("safesearch", "strict");

    try {
      const res = await fetch(url, {
        cache: "no-store",
        signal: AbortSignal.timeout(9000),
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip",
          "X-Subscription-Token": apiKey,
        },
      });

      if (!res.ok) {
        logEnrichment("warn", "Brave enrichment request failed: provider unavailable", { status: res.status });
        return {
          provider: "Fallback interne SABLIN PHARMA",
          query,
          candidates: [],
          configStatus,
          message: "Brave enrichment request failed: provider unavailable",
        };
      }

      const json = await res.json() as { results?: BraveImageResult[] };
      const items = Array.isArray(json.results) ? json.results : [];
      const candidates = items
        .map((item): EnrichmentImageCandidate | null => {
          const imageUrl = item.properties?.url ?? item.properties?.image_url ?? item.image_url ?? item.url ?? "";
          if (!imageUrl) return null;
          const sourceUrl = item.page_url ?? item.source ?? item.url ?? imageUrl;
          const text = compactText([item.title, sourceUrl, imageUrl, item.meta_url?.hostname]);
          const score = candidateScore(medication, text);
          return {
            title: item.title ?? "Image candidate Brave",
            imageUrl,
            sourceUrl,
            sourceName: item.meta_url?.hostname ?? safeHostname(sourceUrl),
            width: Number(item.properties?.width ?? 0) || null,
            height: Number(item.properties?.height ?? 0) || null,
            format: String(item.properties?.format ?? ""),
            text,
            licenseType: "Licence à confirmer",
            licenseUrl: null,
            commercialUseAllowed: false,
            score,
            status: score >= configStatus.confidenceThreshold ? "À vérifier" : "Refusé",
            validationStatus: "À vérifier",
            provider: "Brave Search API",
          };
        })
        .filter((candidate): candidate is EnrichmentImageCandidate => Boolean(candidate));

      return {
        provider: "Brave Search API",
        query,
        candidates,
        configStatus,
        message: candidates.length
          ? "Images candidates Brave trouvées. Validation admin obligatoire."
          : "Aucun candidat image Brave trouvé.",
      };
    } catch {
      logEnrichment("warn", "Brave enrichment request failed: provider unavailable");
      return {
        provider: "Fallback interne SABLIN PHARMA",
        query,
        candidates: [],
        configStatus,
        message: "Brave enrichment request failed: provider unavailable",
      };
    }
  }
}

export const braveImageSearchProvider = new BraveImageSearchProvider();
