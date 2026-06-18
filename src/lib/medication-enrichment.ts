import { db } from "@/lib/db";

export type ImportedMedicationRow = {
  lineNumber: number;
  name?: string;
  genericName?: string;
  dosage?: string;
  form?: string;
  packaging?: string;
  manufacturer?: string;
  barcode?: string;
  price?: string;
  quantity?: string;
  status?: string;
  remark?: string;
};

export type NormalizedMedicationRow = {
  commercialName: string;
  normalizedName: string;
  genericName: string;
  normalizedGenericName: string;
  dosage: string;
  dosageValue?: string;
  dosageUnit?: string;
  form: string;
  normalizedForm: string;
  packaging: string;
  manufacturer: string;
  normalizedManufacturer: string;
  barcode: string;
  correctionProposals: string[];
};

export type MatchResult = {
  medicationId?: string;
  score: number;
  level: "Correspondance certaine" | "Correspondance probable" | "Correspondance ambiguë" | "Aucune correspondance" | "Conflit de données";
  exactFields: string[];
  differentFields: string[];
  missingFields: string[];
  reason: string;
  requiresAdminValidation: boolean;
};

export type MedicationDataProvider = {
  name: string;
  enabled: boolean;
  searchMedication(row: NormalizedMedicationRow): Promise<unknown[]>;
};

export type ImageSearchProvider = {
  name: string;
  enabled: boolean;
  searchImages(row: NormalizedMedicationRow): Promise<unknown[]>;
};

export type LicenseVerificationProvider = {
  name: string;
  enabled: boolean;
  verifyLicense(candidate: unknown): Promise<unknown>;
};

export type DescriptionProvider = {
  name: string;
  enabled: boolean;
  buildDescription(row: NormalizedMedicationRow): Promise<unknown>;
};

const FORM_ALIASES: Record<string, string> = {
  comprime: "Comprimé",
  comprimes: "Comprimé",
  cp: "Comprimé",
  gelule: "Gélule",
  gelules: "Gélule",
  sirop: "Sirop",
  suspension: "Suspension",
  creme: "Crème",
  pommade: "Pommade",
  solution: "Solution",
  injectable: "Injectable",
  injection: "Injectable",
  suppositoire: "Suppositoire",
  gouttes: "Gouttes",
};

export function normalizeText(value?: string | null) {
  return String(value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, " ")
    .replace(/[^a-zA-Z0-9%/.,+\-\s]/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function publicText(value?: string | null) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function extractDosage(value: string) {
  const source = normalizeText(value).replace(",", ".");
  const match = source.match(/(\d+(?:\.\d+)?)\s*(mg|g|mcg|ug|µg|ml|l|ui|iu|%)\b/);
  if (!match) return {};
  return {
    value: match[1],
    unit: match[2].replace("ug", "µg").replace("iu", "UI").toUpperCase(),
    label: `${match[1]} ${match[2].replace("ug", "µg").replace("iu", "UI").toUpperCase()}`,
  };
}

function normalizeForm(value?: string | null) {
  const normalized = normalizeText(value);
  if (!normalized) return "";
  for (const [alias, form] of Object.entries(FORM_ALIASES)) {
    if (normalized.includes(alias)) return form;
  }
  return publicText(value);
}

function tokenScore(a: string, b: string) {
  const left = new Set(normalizeText(a).split(" ").filter((token) => token.length > 2));
  const right = new Set(normalizeText(b).split(" ").filter((token) => token.length > 2));
  if (!left.size || !right.size) return 0;
  const intersection = [...left].filter((token) => right.has(token)).length;
  return Math.round((intersection / Math.max(left.size, right.size)) * 100);
}

export function normalizeImportedRow(row: ImportedMedicationRow): NormalizedMedicationRow {
  const inferredDosage = extractDosage(`${row.name ?? ""} ${row.dosage ?? ""}`);
  const inferredForm = normalizeForm(`${row.form ?? ""} ${row.name ?? ""}`);
  const dosage = publicText(row.dosage) || inferredDosage.label || "";
  const form = publicText(row.form) || inferredForm || "";
  const correctionProposals: string[] = [];
  if (!row.dosage && inferredDosage.label) correctionProposals.push(`Dosage détecté : ${inferredDosage.label}`);
  if (!row.form && inferredForm) correctionProposals.push(`Forme détectée : ${inferredForm}`);

  return {
    commercialName: publicText(row.name),
    normalizedName: normalizeText(row.name),
    genericName: publicText(row.genericName),
    normalizedGenericName: normalizeText(row.genericName),
    dosage,
    dosageValue: inferredDosage.value,
    dosageUnit: inferredDosage.unit,
    form,
    normalizedForm: normalizeText(form),
    packaging: publicText(row.packaging),
    manufacturer: publicText(row.manufacturer),
    normalizedManufacturer: normalizeText(row.manufacturer),
    barcode: publicText(row.barcode).replace(/\s+/g, ""),
    correctionProposals,
  };
}

function compareMedication(
  row: NormalizedMedicationRow,
  medication: {
    id: string;
    name: string;
    genericName: string;
    dosage: string;
    form: string;
    packSize: string;
    packaging?: string | null;
    manufacturer?: string | null;
    barcode?: string | null;
    aliases?: { normalizedAlias: string }[];
  }
): MatchResult {
  let score = 0;
  const exactFields: string[] = [];
  const differentFields: string[] = [];
  const missingFields: string[] = [];

  const medicationName = normalizeText(medication.name);
  const medicationGeneric = normalizeText(medication.genericName);
  const medicationDosage = normalizeText(medication.dosage);
  const medicationForm = normalizeText(medication.form);
  const medicationPackaging = normalizeText(medication.packaging || medication.packSize);
  const medicationManufacturer = normalizeText(medication.manufacturer);

  if (row.barcode && medication.barcode && row.barcode === medication.barcode) {
    score += 55;
    exactFields.push("code-barres");
  }

  if (row.normalizedName && row.normalizedName === medicationName) {
    score += 25;
    exactFields.push("nom commercial");
  } else if (row.normalizedName && medication.aliases?.some((alias) => alias.normalizedAlias === row.normalizedName)) {
    score += 22;
    exactFields.push("alias");
  } else {
    const overlap = tokenScore(row.normalizedName, medicationName);
    if (overlap >= 70) {
      score += Math.min(18, Math.round(overlap / 6));
      differentFields.push("nom proche mais non exact");
    }
  }

  if (row.normalizedGenericName && row.normalizedGenericName === medicationGeneric) {
    score += 18;
    exactFields.push("DCI");
  } else if (row.normalizedGenericName) {
    differentFields.push("DCI");
  } else {
    missingFields.push("DCI");
  }

  if (row.dosage && normalizeText(row.dosage) === medicationDosage) {
    score += 15;
    exactFields.push("dosage");
  } else if (row.dosage && medication.dosage) {
    differentFields.push("dosage");
  } else {
    missingFields.push("dosage");
  }

  if (row.normalizedForm && row.normalizedForm === medicationForm) {
    score += 12;
    exactFields.push("forme");
  } else if (row.normalizedForm && medication.form) {
    differentFields.push("forme");
  } else {
    missingFields.push("forme");
  }

  if (row.normalizedManufacturer && medicationManufacturer && row.normalizedManufacturer === medicationManufacturer) {
    score += 5;
    exactFields.push("fabricant");
  } else if (row.normalizedManufacturer && medicationManufacturer) {
    differentFields.push("fabricant");
  } else if (!row.normalizedManufacturer) {
    missingFields.push("fabricant");
  }

  if (row.packaging && medicationPackaging && normalizeText(row.packaging) === medicationPackaging) {
    score += 3;
    exactFields.push("conditionnement");
  } else if (row.packaging && medicationPackaging) {
    differentFields.push("conditionnement");
  } else if (!row.packaging) {
    missingFields.push("conditionnement");
  }

  const hardConflict = differentFields.includes("dosage") || differentFields.includes("forme");
  const boundedScore = hardConflict ? Math.min(score, 79) : Math.min(score, 100);
  const level: MatchResult["level"] = hardConflict
    ? "Conflit de données"
    : boundedScore >= 95
      ? "Correspondance certaine"
      : boundedScore >= 80
        ? "Correspondance probable"
        : boundedScore >= 60
          ? "Correspondance ambiguë"
          : "Aucune correspondance";

  return {
    medicationId: medication.id,
    score: boundedScore,
    level,
    exactFields,
    differentFields,
    missingFields,
    reason:
      level === "Conflit de données"
        ? "Dosage ou forme en conflit : validation automatique interdite."
        : exactFields.length
          ? `Correspondance proposée via ${exactFields.join(", ")}.`
          : "Aucun identifiant fort trouvé.",
    requiresAdminValidation: level !== "Correspondance certaine",
  };
}

export async function matchMedicationInReferential(row: NormalizedMedicationRow) {
  const medications = await db.medication.findMany({
    include: { aliases: true },
    take: 5000,
  });
  const matches = medications
    .map((medication) => compareMedication(row, medication))
    .sort((a, b) => b.score - a.score);
  const best = matches[0];
  if (!best || best.score < 40) {
    return {
      best: {
        score: 0,
        level: "Aucune correspondance" as const,
        exactFields: [],
        differentFields: [],
        missingFields: ["référentiel"],
        reason: "Aucun médicament suffisamment proche dans le référentiel SABLIN PHARMA.",
        requiresAdminValidation: true,
      },
      candidates: [],
    };
  }
  return { best, candidates: matches.filter((match) => match.score >= 40).slice(0, 5) };
}

export function buildMedicationPlaceholderUrl(input: {
  name: string;
  genericName?: string | null;
  dosage?: string | null;
  form?: string | null;
}) {
  const params = new URLSearchParams({
    name: input.name,
    dci: input.genericName ?? "",
    dosage: input.dosage ?? "",
    form: input.form ?? "",
  });
  return `/api/medications/placeholder?${params.toString()}`;
}

export async function ensurePlaceholderImage(medicationId: string) {
  const medication = await db.medication.findUnique({ where: { id: medicationId } });
  if (!medication) return null;
  const existing = await db.medicationImage.findFirst({
    where: { medicationId, isPlaceholder: true },
  });
  if (existing) return existing;
  return db.medicationImage.create({
    data: {
      medicationId,
      url: buildMedicationPlaceholderUrl({
        name: medication.name,
        genericName: medication.genericName,
        dosage: medication.dosage,
        form: medication.form,
      }),
      sourceName: "SABLIN PHARMA",
      imageType: "placeholder",
      licenseType: "Image interne SABLIN PHARMA",
      commercialUseAllowed: true,
      modificationAllowed: true,
      isPlaceholder: true,
      width: 800,
      height: 800,
      confidenceScore: 100,
      validationStatus: "Publiée",
      validatedBy: "Moteur SABLIN PHARMA",
      validatedAt: new Date(),
    },
  });
}

export async function createEnrichmentRecords(input: {
  importId: string;
  pharmacyId: string;
  rows: ImportedMedicationRow[];
  provider?: string;
}) {
  const createdRows: Array<{ matchLevel: string; enrichmentRequired: boolean }> = [];
  for (const row of input.rows) {
    const normalized = normalizeImportedRow(row);
    const { best, candidates } = await matchMedicationInReferential(normalized);
    const shouldCreateJob = best.level !== "Correspondance certaine";
    const importRow = await db.inventoryImportRow.create({
      data: {
        importId: input.importId,
        pharmacyId: input.pharmacyId,
        lineNumber: row.lineNumber,
        originalJson: JSON.stringify(row),
        normalizedJson: JSON.stringify(normalized),
        correctionJson: JSON.stringify(normalized.correctionProposals),
        medicationId: best.medicationId ?? null,
        matchScore: best.score,
        matchLevel: best.level,
        status: shouldCreateJob ? "Validation requise" : "Validé",
        errorsJson: JSON.stringify(best.level === "Conflit de données" ? best.differentFields : []),
        warningsJson: JSON.stringify([...best.missingFields, ...best.differentFields]),
        enrichmentRequired: shouldCreateJob,
        processedBy: "Moteur SABLIN PHARMA",
      },
    });

    const job = await db.enrichmentJob.create({
      data: {
        medicationId: best.medicationId ?? null,
        inventoryImportRowId: importRow.id,
        provider: input.provider ?? "Référentiel interne SABLIN PHARMA",
        status: shouldCreateJob ? "Validation requise" : "Validé",
        query: [normalized.commercialName, normalized.dosage, normalized.form, normalized.packaging, normalized.manufacturer]
          .filter(Boolean)
          .join(" "),
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

    if (best.medicationId) {
      await ensurePlaceholderImage(best.medicationId);
    }
    createdRows.push(importRow);
  }
  return createdRows;
}

export async function seedDefaultEnrichmentProviders() {
  const providers = [
    {
      providerType: "MedicationDataProvider",
      name: "Référentiel interne SABLIN PHARMA",
      priority: 1,
      active: true,
      quotaDaily: 0,
      requestLimit: 0,
    },
    {
      providerType: "ImageSearchProvider",
      name: "Bibliothèque interne SABLIN PHARMA",
      priority: 2,
      active: true,
      quotaDaily: 0,
      requestLimit: 0,
    },
    {
      providerType: "ImageSearchProvider",
      name: "API image externe autorisée",
      priority: 20,
      active: false,
      quotaDaily: 0,
      requestLimit: 0,
    },
    {
      providerType: "LicenseVerificationProvider",
      name: "Vérification licence manuelle Admin",
      priority: 1,
      active: true,
      quotaDaily: 0,
      requestLimit: 0,
    },
    {
      providerType: "DescriptionProvider",
      name: "Descriptions structurées validées SABLIN",
      priority: 1,
      active: true,
      quotaDaily: 0,
      requestLimit: 0,
    },
  ];
  for (const provider of providers) {
    await db.enrichmentProviderConfig.upsert({
      where: { name: provider.name },
      update: provider,
      create: provider,
    });
  }
}
