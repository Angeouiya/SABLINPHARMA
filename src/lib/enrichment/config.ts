export type EnrichmentProviderStatus = "active" | "disabled" | "misconfigured";

export type EnrichmentProviderMode = "google_web" | "internal_fallback";

export type ImageSearchProviderPreference = "auto" | "google" | "brave" | "openverse" | "internal";

export type EnrichmentConfigStatus = {
  externalEnrichmentEnabled: boolean;
  googleApiConfigured: boolean;
  googleSearchEngineConfigured: boolean;
  braveApiConfigured: boolean;
  openverseEnabled: boolean;
  imageSearchProvider: ImageSearchProviderPreference;
  activeProviders: string[];
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

function readProviderPreference(value: string | undefined): ImageSearchProviderPreference {
  const provider = String(value ?? "auto").trim().toLowerCase();
  if (provider === "google" || provider === "brave" || provider === "openverse" || provider === "internal") {
    return provider;
  }
  return "auto";
}

export function getEnrichmentConfig(env: EnvLike = process.env): EnrichmentConfigStatus {
  const externalEnrichmentEnabled = env.ENABLE_EXTERNAL_ENRICHMENT === "true";
  const googleApiConfigured = Boolean(env.GOOGLE_SEARCH_API_KEY?.trim());
  const googleSearchEngineConfigured = Boolean(env.GOOGLE_SEARCH_ENGINE_ID?.trim());
  const braveApiConfigured = Boolean(env.BRAVE_SEARCH_API_KEY?.trim());
  const imageSearchProvider = readProviderPreference(env.IMAGE_SEARCH_PROVIDER);
  const openverseEnabled = env.OPENVERSE_ENRICHMENT_ENABLED !== "false";
  const dailyLimit = readPositiveInteger(env.ENRICHMENT_DAILY_LIMIT, 100);
  const confidenceThreshold = readPositiveInteger(env.ENRICHMENT_CONFIDENCE_THRESHOLD, 85);
  const maxResults = Math.min(readPositiveInteger(env.ENRICHMENT_MAX_RESULTS, 5), 10);
  const activeProviders = [
    imageSearchProvider === "google" || imageSearchProvider === "auto"
      ? googleApiConfigured && googleSearchEngineConfigured
        ? "Google Custom Search API"
        : null
      : null,
    imageSearchProvider === "brave" || imageSearchProvider === "auto"
      ? braveApiConfigured
        ? "Brave Search API"
        : null
      : null,
    imageSearchProvider === "openverse" || imageSearchProvider === "auto"
      ? openverseEnabled
        ? "Openverse API"
        : null
      : null,
  ].filter(Boolean) as string[];

  if (!externalEnrichmentEnabled) {
    return {
      externalEnrichmentEnabled,
      googleApiConfigured,
      googleSearchEngineConfigured,
      braveApiConfigured,
      openverseEnabled,
      imageSearchProvider,
      activeProviders: [],
      providerStatus: "disabled",
      mode: "internal_fallback",
      reason: "External enrichment disabled: ENABLE_EXTERNAL_ENRICHMENT is not true",
      dailyLimit,
      confidenceThreshold,
      maxResults,
    };
  }

  if (imageSearchProvider === "internal") {
    return {
      externalEnrichmentEnabled,
      googleApiConfigured,
      googleSearchEngineConfigured,
      braveApiConfigured,
      openverseEnabled,
      imageSearchProvider,
      activeProviders: [],
      providerStatus: "disabled",
      mode: "internal_fallback",
      reason: "External enrichment disabled: IMAGE_SEARCH_PROVIDER is internal",
      dailyLimit,
      confidenceThreshold,
      maxResults,
    };
  }

  if (imageSearchProvider === "google" && !googleApiConfigured && !googleSearchEngineConfigured) {
    return {
      externalEnrichmentEnabled,
      googleApiConfigured,
      googleSearchEngineConfigured,
      braveApiConfigured,
      openverseEnabled,
      imageSearchProvider,
      activeProviders,
      providerStatus: "misconfigured",
      mode: "internal_fallback",
      reason: "External enrichment disabled: missing GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_ENGINE_ID",
      dailyLimit,
      confidenceThreshold,
      maxResults,
    };
  }

  if (imageSearchProvider === "google" && !googleApiConfigured) {
    return {
      externalEnrichmentEnabled,
      googleApiConfigured,
      googleSearchEngineConfigured,
      braveApiConfigured,
      openverseEnabled,
      imageSearchProvider,
      activeProviders,
      providerStatus: "misconfigured",
      mode: "internal_fallback",
      reason: "External enrichment disabled: missing GOOGLE_SEARCH_API_KEY",
      dailyLimit,
      confidenceThreshold,
      maxResults,
    };
  }

  if (imageSearchProvider === "google" && !googleSearchEngineConfigured) {
    return {
      externalEnrichmentEnabled,
      googleApiConfigured,
      googleSearchEngineConfigured,
      braveApiConfigured,
      openverseEnabled,
      imageSearchProvider,
      activeProviders,
      providerStatus: "misconfigured",
      mode: "internal_fallback",
      reason: "External enrichment disabled: missing GOOGLE_SEARCH_ENGINE_ID",
      dailyLimit,
      confidenceThreshold,
      maxResults,
    };
  }

  if (imageSearchProvider === "brave" && !braveApiConfigured) {
    return {
      externalEnrichmentEnabled,
      googleApiConfigured,
      googleSearchEngineConfigured,
      braveApiConfigured,
      openverseEnabled,
      imageSearchProvider,
      activeProviders,
      providerStatus: "misconfigured",
      mode: "internal_fallback",
      reason: "External enrichment disabled: missing BRAVE_SEARCH_API_KEY",
      dailyLimit,
      confidenceThreshold,
      maxResults,
    };
  }

  if (imageSearchProvider === "openverse" && !openverseEnabled) {
    return {
      externalEnrichmentEnabled,
      googleApiConfigured,
      googleSearchEngineConfigured,
      braveApiConfigured,
      openverseEnabled,
      imageSearchProvider,
      activeProviders,
      providerStatus: "misconfigured",
      mode: "internal_fallback",
      reason: "External enrichment disabled: OPENVERSE_ENRICHMENT_ENABLED is false",
      dailyLimit,
      confidenceThreshold,
      maxResults,
    };
  }

  if (!activeProviders.length) {
    return {
      externalEnrichmentEnabled,
      googleApiConfigured,
      googleSearchEngineConfigured,
      braveApiConfigured,
      openverseEnabled,
      imageSearchProvider,
      activeProviders,
      providerStatus: "misconfigured",
      mode: "internal_fallback",
      reason: "External enrichment disabled: no image search provider is available",
      dailyLimit,
      confidenceThreshold,
      maxResults,
    };
  }

  return {
    externalEnrichmentEnabled,
    googleApiConfigured,
    googleSearchEngineConfigured,
    braveApiConfigured,
    openverseEnabled,
    imageSearchProvider,
    activeProviders,
    providerStatus: "active",
    mode: "google_web",
    reason: `External enrichment active: ${activeProviders.join(", ")}`,
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
