export type EnrichmentProviderStatus = "active" | "disabled" | "misconfigured";

export type EnrichmentProviderMode = "google_web" | "internal_fallback";

export type EnrichmentConfigStatus = {
  externalEnrichmentEnabled: boolean;
  googleApiConfigured: boolean;
  googleSearchEngineConfigured: boolean;
  providerStatus: EnrichmentProviderStatus;
  mode: EnrichmentProviderMode;
  reason: string;
  dailyLimit: number;
  confidenceThreshold: number;
  maxResults: number;
};

type EnvLike = Record<string, string | undefined>;

function readPositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : fallback;
}

export function getEnrichmentConfig(env: EnvLike = process.env): EnrichmentConfigStatus {
  const externalEnrichmentEnabled = env.ENABLE_EXTERNAL_ENRICHMENT === "true";
  const googleApiConfigured = Boolean(env.GOOGLE_SEARCH_API_KEY?.trim());
  const googleSearchEngineConfigured = Boolean(env.GOOGLE_SEARCH_ENGINE_ID?.trim());
  const dailyLimit = readPositiveInteger(env.ENRICHMENT_DAILY_LIMIT, 100);
  const confidenceThreshold = readPositiveInteger(env.ENRICHMENT_CONFIDENCE_THRESHOLD, 85);
  const maxResults = Math.min(readPositiveInteger(env.ENRICHMENT_MAX_RESULTS, 5), 10);

  if (!externalEnrichmentEnabled) {
    return {
      externalEnrichmentEnabled,
      googleApiConfigured,
      googleSearchEngineConfigured,
      providerStatus: "disabled",
      mode: "internal_fallback",
      reason: "External enrichment disabled: ENABLE_EXTERNAL_ENRICHMENT is not true",
      dailyLimit,
      confidenceThreshold,
      maxResults,
    };
  }

  if (!googleApiConfigured && !googleSearchEngineConfigured) {
    return {
      externalEnrichmentEnabled,
      googleApiConfigured,
      googleSearchEngineConfigured,
      providerStatus: "misconfigured",
      mode: "internal_fallback",
      reason: "External enrichment disabled: missing GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_ENGINE_ID",
      dailyLimit,
      confidenceThreshold,
      maxResults,
    };
  }

  if (!googleApiConfigured) {
    return {
      externalEnrichmentEnabled,
      googleApiConfigured,
      googleSearchEngineConfigured,
      providerStatus: "misconfigured",
      mode: "internal_fallback",
      reason: "External enrichment disabled: missing GOOGLE_SEARCH_API_KEY",
      dailyLimit,
      confidenceThreshold,
      maxResults,
    };
  }

  if (!googleSearchEngineConfigured) {
    return {
      externalEnrichmentEnabled,
      googleApiConfigured,
      googleSearchEngineConfigured,
      providerStatus: "misconfigured",
      mode: "internal_fallback",
      reason: "External enrichment disabled: missing GOOGLE_SEARCH_ENGINE_ID",
      dailyLimit,
      confidenceThreshold,
      maxResults,
    };
  }

  return {
    externalEnrichmentEnabled,
    googleApiConfigured,
    googleSearchEngineConfigured,
    providerStatus: "active",
    mode: "google_web",
    reason: "Google/Web enrichment active",
    dailyLimit,
    confidenceThreshold,
    maxResults,
  };
}

export function getActiveGoogleCredentials(env: EnvLike = process.env) {
  const status = getEnrichmentConfig(env);
  if (status.providerStatus !== "active") return null;
  return {
    apiKey: env.GOOGLE_SEARCH_API_KEY?.trim() ?? "",
    searchEngineId: env.GOOGLE_SEARCH_ENGINE_ID?.trim() ?? "",
    status,
  };
}

