import { db } from "@/lib/db";
import { normalizeText } from "@/lib/medication-enrichment";

export type ProhibitedMedicationMatchInput = {
  name?: string | null;
  genericName?: string | null;
  medicationName?: string | null;
  dosage?: string | null;
  form?: string | null;
  barcode?: string | null;
};

export type ProhibitedMedicationRule = {
  id: string;
  name: string;
  normalizedName: string;
  reason: string | null;
};

function searchableText(input: ProhibitedMedicationMatchInput) {
  return normalizeText(
    [
      input.name,
      input.genericName,
      input.medicationName,
      input.dosage,
      input.form,
      input.barcode,
    ]
      .filter(Boolean)
      .join(" ")
  );
}

function matchesTerm(source: string, term: string) {
  if (!source || !term) return false;
  if (source === term) return true;
  const sourceTokens = ` ${source} `;
  const termTokens = ` ${term} `;
  return sourceTokens.includes(termTokens);
}

export async function getActiveProhibitedMedicationRules(): Promise<ProhibitedMedicationRule[]> {
  return db.prohibitedMedicationTerm.findMany({
    where: { active: true },
    select: { id: true, name: true, normalizedName: true, reason: true },
    orderBy: { name: "asc" },
  });
}

export function findProhibitedMedicationMatch(
  input: ProhibitedMedicationMatchInput,
  rules: ProhibitedMedicationRule[]
) {
  const source = searchableText(input);
  return rules.find((rule) => matchesTerm(source, rule.normalizedName)) ?? null;
}

export async function addProhibitedMedicationTerm(input: {
  name: string;
  reason?: string | null;
  createdBy?: string | null;
}) {
  const name = input.name.trim().replace(/\s+/g, " ");
  const normalizedName = normalizeText(name);
  if (!name || normalizedName.length < 2) {
    throw new Error("Nom du médicament interdit obligatoire.");
  }

  return db.prohibitedMedicationTerm.upsert({
    where: { normalizedName },
    update: {
      name,
      reason: input.reason?.trim() || null,
      active: true,
      disabledAt: null,
      disabledBy: null,
    },
    create: {
      name,
      normalizedName,
      reason: input.reason?.trim() || null,
      createdBy: input.createdBy ?? null,
    },
  });
}

export async function disableProhibitedMedicationTerm(input: {
  id: string;
  disabledBy?: string | null;
}) {
  return db.prohibitedMedicationTerm.update({
    where: { id: input.id },
    data: {
      active: false,
      disabledAt: new Date(),
      disabledBy: input.disabledBy ?? null,
    },
  });
}
