import { getEnrichmentConfig, type EnrichmentConfigStatus } from "@/lib/enrichment/config";
import { logEnrichment } from "@/lib/enrichment/logger";
import {
  buildGoogleImageQuery,
  candidateScore,
  compactText,
  type EnrichmentImageCandidate,
  type GoogleImageSearchMedicationInput,
  type GoogleImageSearchResult,
} from "@/lib/enrichment/google-image-search-provider";
import { normalizeText } from "@/lib/medication-enrichment";

type OpenverseImage = {
  title?: string;
  url?: string;
  foreign_landing_url?: string;
  creator?: string;
  license?: string;
  license_version?: string;
  license_url?: string;
  provider?: string;
  source?: string;
  attribution?: string;
  mature?: boolean;
  width?: number;
  height?: number;
  filetype?: string;
  tags?: Array<{ name?: string } | string>;
};

function normalizeLicense(image: OpenverseImage) {
  const license = compactText([image.license, image.license_version]).toUpperCase();
  return license || "Licence à confirmer";
}

function isCommercialLicenseCandidate(image: OpenverseImage) {
  const license = String(image.license ?? "").toLowerCase();
  if (!license || !image.license_url) return false;
  return !license.includes("nc");
}

function sourceLabel(image: OpenverseImage) {
  const source = compactText([image.provider, image.source]);
  if (source) return `Openverse / ${source}`;
  return "Openverse";
}

function compactQuery(parts: Array<string | null | undefined>) {
  return compactText(parts).replace(/\s+/g, " ").trim();
}

function openverseQueries(input: GoogleImageSearchMedicationInput) {
  const detailed = buildGoogleImageQuery(input);
  const simpleName = compactQuery([input.name, input.dosage]);
  const simpleGeneric = compactQuery([input.genericName, input.dosage]);
  const normalizedName = normalizeText(simpleName).replace(/\s+/g, " ");
  const normalizedGeneric = normalizeText(simpleGeneric).replace(/\s+/g, " ");
  return [...new Set([detailed, simpleName, simpleGeneric, normalizedName, normalizedGeneric].filter(Boolean))];
}

export class OpenverseImageSearchProvider {
  async searchImages(
    medication: GoogleImageSearchMedicationInput,
    options: { maxResults?: number } = {}
  ): Promise<GoogleImageSearchResult> {
    const configStatus = getEnrichmentConfig();
    const query = buildGoogleImageQuery(medication);

    if (!configStatus.externalEnrichmentEnabled || !configStatus.openverseEnabled) {
      return {
        provider: "Fallback interne SABLIN PHARMA",
        query,
        candidates: [],
        configStatus,
        message: "Openverse enrichment disabled.",
      };
    }

    const resultLimit = Math.min(options.maxResults ?? configStatus.maxResults, configStatus.maxResults, 20);
    const queries = openverseQueries(medication);
    const messages: string[] = [];

    try {
      for (const activeQuery of queries) {
        const url = new URL("https://api.openverse.org/v1/images/");
        url.searchParams.set("q", activeQuery);
        url.searchParams.set("page_size", String(resultLimit));
        url.searchParams.set("mature", "false");

        const res = await fetch(url, {
          cache: "no-store",
          signal: AbortSignal.timeout(9000),
          headers: {
            Accept: "application/json",
            "User-Agent": "SABLINPHARMA/1.0 (support@sablin.ci)",
          },
        });

        if (!res.ok) {
          logEnrichment("warn", "Openverse enrichment request failed: provider unavailable", { status: res.status });
          messages.push(`Openverse ${res.status}`);
          continue;
        }

        const json = await res.json() as { results?: OpenverseImage[] };
        const items = Array.isArray(json.results) ? json.results : [];
        const candidates = items
          .filter((item) => item.url && !item.mature)
          .map((item): EnrichmentImageCandidate => {
            const sourceUrl = String(item.foreign_landing_url ?? item.url ?? "");
            const tags = Array.isArray(item.tags)
              ? item.tags.map((tag) => (typeof tag === "string" ? tag : tag.name ?? "")).join(" ")
              : "";
            const text = compactText([
              item.title,
              item.creator,
              tags,
              sourceUrl,
              item.attribution,
            ]);
            const score = candidateScore(medication, text);
            const licenseType = normalizeLicense(item);
            return {
              title: String(item.title ?? "Image candidate Openverse"),
              imageUrl: String(item.url),
              sourceUrl,
              sourceName: sourceLabel(item),
              width: Number(item.width ?? 0) || null,
              height: Number(item.height ?? 0) || null,
              format: String(item.filetype ?? ""),
              text,
              licenseType,
              licenseUrl: item.license_url ?? null,
              commercialUseAllowed: isCommercialLicenseCandidate(item),
              score,
              status: score >= configStatus.confidenceThreshold ? "À vérifier" : "Refusé",
              validationStatus: "À vérifier",
              provider: "Openverse API",
            };
          });

        if (candidates.length) {
          return {
            provider: "Openverse API",
            query: activeQuery,
            candidates,
            configStatus,
            message: "Images candidates Openverse trouvées. Validation admin obligatoire.",
          };
        }
        messages.push(`0 résultat pour "${activeQuery}"`);
      }

      return {
        provider: "Openverse API",
        query,
        candidates: [],
        configStatus,
        message: messages.length ? messages.join(" | ") : "Aucun candidat image Openverse trouvé.",
      };
    } catch {
      logEnrichment("warn", "Openverse enrichment request failed: provider unavailable");
      return {
        provider: "Fallback interne SABLIN PHARMA",
        query,
        candidates: [],
        configStatus,
        message: "Openverse enrichment request failed: provider unavailable",
      };
    }
  }
}

export const openverseImageSearchProvider = new OpenverseImageSearchProvider();
