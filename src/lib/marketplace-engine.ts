import JSZip from "jszip";
import { db } from "@/lib/db";
import {
  buildMedicationPlaceholderUrl,
  createEnrichmentRecords,
  ensurePlaceholderImage,
  matchMedicationInReferential,
  normalizeImportedRow,
  normalizeText,
  seedDefaultEnrichmentProviders,
  type ImportedMedicationRow,
} from "@/lib/medication-enrichment";
import { searchImageCandidatesWithFallback } from "@/lib/enrichment/enrichment-service";
import { PUBLIC_AVAILABILITY_STATUSES } from "@/lib/pharmacy-platform";
import { syncInventory } from "@/lib/inventory-sync";
import {
  findProhibitedMedicationMatch,
  getActiveProhibitedMedicationRules,
} from "@/lib/prohibited-medications";

export const MARKETPLACE_IMPORT_MAX_BYTES = Number(process.env.MARKETPLACE_IMPORT_MAX_BYTES ?? 12 * 1024 * 1024);

const ACCEPTED_EXTENSIONS = new Set(["csv", "xlsx", "xls", "docx", "pptx"]);
const ACCEPTED_MIME_TYPES = new Set([
  "text/csv",
  "application/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

const COLUMN_ALIASES: Record<string, string[]> = {
  name: ["produit", "article", "designation", "désignation", "nom", "nom medicament", "nom médicament", "medicament", "médicament", "nom commercial", "product", "name"],
  genericName: ["dci", "denomination commune", "dénomination commune", "generique", "générique", "principe actif", "substance"],
  dosage: ["dosage", "dose", "concentration", "teneur"],
  form: ["forme", "forme pharmaceutique", "type", "presentation", "présentation"],
  packaging: ["conditionnement", "boite", "boîte", "pack", "packaging", "format"],
  manufacturer: ["laboratoire", "fabricant", "manufacturer", "marque"],
  barcode: ["code-barres", "code barres", "barcode", "ean", "reference", "référence", "sku"],
  price: ["prix", "pu", "prix vente", "prix de vente", "montant", "tarif"],
  quantity: ["stock", "qte", "qté", "quantite", "quantité", "disponible", "qty"],
  status: ["etat", "état", "disponibilite", "disponibilité", "statut", "status"],
  updatedAt: ["date mise a jour", "date mise à jour", "maj", "mise a jour", "mise à jour", "date"],
  remark: ["remarque", "commentaire", "note", "observation"],
};

const DEFAULT_COLUMN_ORDER = ["name", "genericName", "dosage", "form", "packaging", "price", "status", "quantity", "updatedAt", "remark"];

export type MarketplaceImportRole = "admin" | "pharmacy";

export type MarketplaceParsedRow = ImportedMedicationRow & {
  price?: string;
  quantity?: string;
  status?: string;
  updatedAt?: string;
  originalValues: Record<string, string>;
  sourceFile: string;
  sourceSheet?: string;
  detectedColumns: Record<string, string>;
};

export type MarketplacePreviewRow = {
  lineNumber: number;
  name: string;
  genericName: string;
  dosage: string;
  form: string;
  packaging: string;
  manufacturer: string;
  barcode: string;
  imageUrl: string;
  imageBadge: string;
  price: string;
  normalizedPrice: number | null;
  quantity: string;
  status: string;
  normalizedStatus: string;
  updatedAt: string;
  remark: string;
  errors: string[];
  warnings: string[];
  matchScore: number;
  matchLevel: string;
  medicationId?: string;
  medicationName?: string;
  confidenceLabel: string;
  publicationDecision: "Prêt à publier" | "Validation admin requise" | "Référentiel requis" | "Bloqué";
  publicationReason: string;
  prohibitedTerm?: string;
  blockedReason?: string;
  correctionProposals: string[];
};

export type MarketplacePreview = {
  fileName: string;
  fileType: string;
  sourceKind: "csv" | "xlsx" | "xls" | "docx" | "pptx";
  totalRows: number;
  validRows: number;
  incompleteRows: number;
  invalidRows: number;
  duplicateRows: number;
  recognizedMedications: number;
  unknownMedications: number;
  missingPrices: number;
  missingDosages: number;
  missingForms: number;
  invalidStatuses: number;
  prohibitedRows: number;
  rows: MarketplacePreviewRow[];
  detectedColumns: Record<string, string>;
  acceptedStatuses: readonly string[];
  marketplaceRules: {
    noMedicineSales: string;
    imageValidation: string;
    publicStock: string;
    priceNotice: string;
  };
};

function isPreviewRowSafeForPublication(
  row: Pick<MarketplacePreviewRow, "errors" | "normalizedPrice" | "matchScore" | "matchLevel" | "prohibitedTerm">
) {
  return (
    row.errors.length === 0 &&
    !row.prohibitedTerm &&
    row.normalizedPrice !== null &&
    row.matchScore >= 95 &&
    row.matchLevel === "Correspondance certaine"
  );
}

function fileExtension(fileName: string) {
  return fileName.split(".").pop()?.trim().toLowerCase() ?? "";
}

export function validateMarketplaceImportFile(input: { fileName: string; mimeType?: string | null; size: number }) {
  const ext = fileExtension(input.fileName);
  if (!ACCEPTED_EXTENSIONS.has(ext)) {
    return { ok: false, error: "Format non autorisé. Utilisez CSV, XLSX, XLS, DOCX ou PPTX." };
  }
  if (input.mimeType && input.mimeType !== "application/octet-stream" && !ACCEPTED_MIME_TYPES.has(input.mimeType)) {
    return { ok: false, error: "Type de fichier non reconnu pour le moteur Marketplace." };
  }
  if (input.size <= 0) return { ok: false, error: "Le fichier est vide." };
  if (input.size > MARKETPLACE_IMPORT_MAX_BYTES) {
    return {
      ok: false,
      error: `Fichier trop lourd. Taille maximale : ${Math.round(MARKETPLACE_IMPORT_MAX_BYTES / 1024 / 1024)} Mo.`,
    };
  }
  return { ok: true, error: null };
}

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function stripXmlTags(value: string) {
  return decodeXml(value.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function sanitizeCell(value: unknown) {
  return String(value ?? "")
    .replace(/\u0000/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeHeader(value: string) {
  return normalizeText(value).replace(/[^\w%]+/g, " ").trim();
}

function splitCsvLine(line: string, delimiter: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }
    if (char === delimiter && !quoted) {
      cells.push(sanitizeCell(current));
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(sanitizeCell(current));
  return cells;
}

function detectDelimiter(text: string) {
  const sample = text.split(/\r?\n/).find((line) => line.trim()) ?? "";
  const delimiters = [";", ",", "\t"];
  return delimiters
    .map((delimiter) => ({ delimiter, count: splitCsvLine(sample, delimiter).length }))
    .sort((a, b) => b.count - a.count)[0]?.delimiter ?? ";";
}

function parseDelimitedText(text: string) {
  const clean = text.replace(/^\uFEFF/, "");
  const delimiter = detectDelimiter(clean);
  return clean
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => splitCsvLine(line, delimiter));
}

function columnIndexFromRef(ref: string) {
  const letters = ref.replace(/[^A-Z]/g, "");
  let index = 0;
  for (const letter of letters) {
    index = index * 26 + (letter.charCodeAt(0) - 64);
  }
  return Math.max(0, index - 1);
}

function extractXmlTexts(xml: string) {
  const texts: string[] = [];
  for (const match of xml.matchAll(/<[^:>]*:?t(?:\s[^>]*)?>([\s\S]*?)<\/[^:>]*:?t>/g)) {
    texts.push(decodeXml(match[1]));
  }
  return texts.map(sanitizeCell).filter(Boolean);
}

async function parseXlsx(buffer: Buffer, fileName: string) {
  const zip = await JSZip.loadAsync(buffer);
  const sharedXml = await zip.file("xl/sharedStrings.xml")?.async("string");
  const sharedStrings = sharedXml ? extractXmlTexts(sharedXml) : [];
  const worksheetFiles = Object.keys(zip.files)
    .filter((name) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(name))
    .sort();

  const rows: string[][] = [];
  for (const worksheetPath of worksheetFiles) {
    const xml = await zip.file(worksheetPath)?.async("string");
    if (!xml) continue;
    for (const rowMatch of xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
      const row: string[] = [];
      for (const cellMatch of rowMatch[1].matchAll(/<c([^>]*)>([\s\S]*?)<\/c>/g)) {
        const attrs = cellMatch[1];
        const body = cellMatch[2];
        const ref = attrs.match(/\sr="([^"]+)"/)?.[1] ?? "";
        const type = attrs.match(/\st="([^"]+)"/)?.[1] ?? "";
        const value = body.match(/<v[^>]*>([\s\S]*?)<\/v>/)?.[1] ?? extractXmlTexts(body).join(" ");
        const index = ref ? columnIndexFromRef(ref) : row.length;
        row[index] = type === "s" ? sharedStrings[Number(value)] ?? "" : sanitizeCell(decodeXml(value));
      }
      if (row.some(Boolean)) rows.push(row.map((cell) => sanitizeCell(cell)));
    }
  }
  if (!rows.length) throw new Error(`Aucune ligne exploitable détectée dans ${fileName}.`);
  return rows;
}

async function parseDocx(buffer: Buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const xml = await zip.file("word/document.xml")?.async("string");
  if (!xml) throw new Error("Document Word invalide ou corrompu.");

  const tableRows: string[][] = [];
  for (const rowMatch of xml.matchAll(/<w:tr[\s\S]*?>([\s\S]*?)<\/w:tr>/g)) {
    const cells = [...rowMatch[1].matchAll(/<w:tc[\s\S]*?>([\s\S]*?)<\/w:tc>/g)]
      .map((cell) => extractXmlTexts(cell[1]).join(" "))
      .map(sanitizeCell)
      .filter(Boolean);
    if (cells.length) tableRows.push(cells);
  }
  if (tableRows.length) return tableRows;

  const lines = [...xml.matchAll(/<w:p[\s\S]*?>([\s\S]*?)<\/w:p>/g)]
    .map((paragraph) => extractXmlTexts(paragraph[1]).join(" "))
    .map(sanitizeCell)
    .filter(Boolean);
  return rowsFromLooseLines(lines);
}

async function parsePptx(buffer: Buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
    .sort();
  const tableRows: string[][] = [];
  const looseLines: string[] = [];

  for (const slidePath of slideFiles) {
    const xml = await zip.file(slidePath)?.async("string");
    if (!xml) continue;
    for (const rowMatch of xml.matchAll(/<a:tr[\s\S]*?>([\s\S]*?)<\/a:tr>/g)) {
      const cells = [...rowMatch[1].matchAll(/<a:tc[\s\S]*?>([\s\S]*?)<\/a:tc>/g)]
        .map((cell) => extractXmlTexts(cell[1]).join(" "))
        .map(sanitizeCell)
        .filter(Boolean);
      if (cells.length) tableRows.push(cells);
    }
    looseLines.push(...extractXmlTexts(xml));
  }
  if (tableRows.length) return tableRows;
  return rowsFromLooseLines(looseLines);
}

function rowsFromLooseLines(lines: string[]) {
  const rows = lines
    .map((line) => {
      if (line.includes(";")) return line.split(";").map(sanitizeCell);
      if (line.includes("\t")) return line.split("\t").map(sanitizeCell);
      if (/\s{2,}/.test(line)) return line.split(/\s{2,}/).map(sanitizeCell);
      const price = line.match(/\b(\d[\d\s.]{1,})\s*(?:f|fcfa|xof)?\b/i)?.[1] ?? "";
      const status = PUBLIC_AVAILABILITY_STATUSES.find((item) => normalizeText(line).includes(normalizeText(item))) ?? "";
      return [line.replace(price, "").replace(status, "").trim(), "", "", "", "", price, status].map(sanitizeCell);
    })
    .filter((row) => row.some(Boolean));
  return rows;
}

function parseHtmlTable(text: string) {
  const rows: string[][] = [];
  for (const rowMatch of text.matchAll(/<tr[\s\S]*?>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...rowMatch[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)]
      .map((cell) => stripXmlTags(cell[1]))
      .map(sanitizeCell)
      .filter(Boolean);
    if (cells.length) rows.push(cells);
  }
  return rows;
}

export async function extractMarketplaceRowsFromBuffer(input: {
  buffer: Buffer;
  fileName: string;
  mimeType?: string | null;
}) {
  const ext = fileExtension(input.fileName);
  const validation = validateMarketplaceImportFile({ fileName: input.fileName, mimeType: input.mimeType, size: input.buffer.length });
  if (!validation.ok) throw new Error(validation.error ?? "Fichier invalide.");

  if (ext === "csv") return rowsToImportedRows(parseDelimitedText(input.buffer.toString("utf8")), input.fileName, ext);
  if (ext === "xlsx") return rowsToImportedRows(await parseXlsx(input.buffer, input.fileName), input.fileName, ext);
  if (ext === "docx") return rowsToImportedRows(await parseDocx(input.buffer), input.fileName, ext);
  if (ext === "pptx") return rowsToImportedRows(await parsePptx(input.buffer), input.fileName, ext);

  const asText = input.buffer.toString("utf8");
  const htmlRows = parseHtmlTable(asText);
  if (htmlRows.length) return rowsToImportedRows(htmlRows, input.fileName, ext || "xls");
  const rows = parseDelimitedText(asText).filter((row) => row.length > 1);
  if (rows.length) return rowsToImportedRows(rows, input.fileName, ext || "xls");
  throw new Error("Ancien fichier XLS binaire non lisible dans le moteur sécurisé. Enregistrez-le en XLSX ou CSV avant import.");
}

function resolveColumnMap(header: string[]) {
  const detected: Record<string, string> = {};
  const normalizedHeaders = header.map(normalizeHeader);
  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    const matchIndex = normalizedHeaders.findIndex((cell) => aliases.some((alias) => cell === normalizeHeader(alias) || cell.includes(normalizeHeader(alias))));
    if (matchIndex >= 0) detected[field] = header[matchIndex] || String(matchIndex);
  }
  return detected;
}

function looksLikeHeader(row: string[]) {
  const normalized = row.map(normalizeHeader).join(" ");
  return Object.values(COLUMN_ALIASES).flat().some((alias) => normalized.includes(normalizeHeader(alias)));
}

function rowsToImportedRows(rows: string[][], fileName: string, sourceKind: string): MarketplaceParsedRow[] {
  const [first = [], ...remaining] = rows;
  const hasHeader = looksLikeHeader(first);
  const header = hasHeader ? first : DEFAULT_COLUMN_ORDER;
  const dataRows = hasHeader ? remaining : rows;
  const detected = resolveColumnMap(header);
  const headerIndexes = new Map(header.map((label, index) => [label, index]));
  const fieldToIndex = (field: string) => {
    const detectedLabel = detected[field];
    if (detectedLabel && headerIndexes.has(detectedLabel)) return headerIndexes.get(detectedLabel) ?? -1;
    if (hasHeader) return -1;
    const fallback = DEFAULT_COLUMN_ORDER.indexOf(field);
    return fallback >= 0 ? fallback : -1;
  };

  return dataRows
    .map((row, index) => {
      const value = (field: string) => {
        const idx = fieldToIndex(field);
        return idx >= 0 ? sanitizeCell(row[idx]) : "";
      };
      const originalValues: Record<string, string> = {};
      header.forEach((label, colIndex) => {
        if (row[colIndex]) originalValues[label || `Colonne ${colIndex + 1}`] = sanitizeCell(row[colIndex]);
      });
      return {
        lineNumber: index + (hasHeader ? 2 : 1),
        name: value("name"),
        genericName: value("genericName"),
        dosage: value("dosage"),
        form: value("form"),
        packaging: value("packaging"),
        manufacturer: value("manufacturer"),
        barcode: value("barcode"),
        price: value("price"),
        quantity: value("quantity"),
        status: value("status"),
        updatedAt: value("updatedAt"),
        remark: value("remark"),
        originalValues,
        sourceFile: fileName,
        sourceSheet: sourceKind.toUpperCase(),
        detectedColumns: detected,
      };
    })
    .filter((row) => Object.values(row.originalValues).some(Boolean));
}

function normalizeStatus(status?: string | null) {
  const normalized = normalizeText(status);
  if (!normalized) return "À confirmer";
  const exact = PUBLIC_AVAILABILITY_STATUSES.find((item) => normalizeText(item) === normalized);
  if (exact) return exact;
  if (normalized.includes("dispo") || normalized.includes("oui") || normalized.includes("stock")) return "Disponible";
  if (normalized.includes("faible") || normalized.includes("bas")) return "Stock faible";
  if (normalized.includes("rupture") || normalized.includes("non")) return "Rupture";
  return "À confirmer";
}

function normalizePrice(price?: string | null) {
  const raw = String(price ?? "").replace(/\s+/g, "").replace(/[^\d,.]/g, "").replace(",", ".");
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? Math.round(value) : null;
}

function confidenceLabel(score: number) {
  if (score >= 95) return "Très fiable";
  if (score >= 80) return "Validation admin recommandée";
  if (score >= 60) return "Ambigu - validation obligatoire";
  return "Non reconnu";
}

export async function buildMarketplacePreview(input: {
  fileName: string;
  fileType: string;
  rows: MarketplaceParsedRow[];
}) {
  await seedDefaultEnrichmentProviders();
  const prohibitedRules = await getActiveProhibitedMedicationRules();
  let validRows = 0;
  let invalidRows = 0;
  let incompleteRows = 0;
  let duplicateRows = 0;
  let recognizedMedications = 0;
  let unknownMedications = 0;
  let missingPrices = 0;
  let missingDosages = 0;
  let missingForms = 0;
  let invalidStatuses = 0;
  let prohibitedRows = 0;
  let imageCandidateLookups = 0;
  const maxPreviewImageLookups = Math.max(0, Number(process.env.MARKETPLACE_PREVIEW_IMAGE_LOOKUPS ?? 12));
  const seen = new Set<string>();

  const previewRows: MarketplacePreviewRow[] = [];
  for (const row of input.rows) {
    const normalized = normalizeImportedRow(row);
    const status = normalizeStatus(row.status);
    const price = normalizePrice(row.price);
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!row.name?.trim()) errors.push("Nom du médicament manquant");
    if (!normalized.dosage) {
      missingDosages += 1;
      warnings.push("Dosage manquant ou à confirmer");
    }
    if (!normalized.form) {
      missingForms += 1;
      warnings.push("Forme pharmaceutique manquante ou à confirmer");
    }
    if (price === null) {
      missingPrices += 1;
      warnings.push("Prix indicatif manquant");
    }
    if (row.status && !PUBLIC_AVAILABILITY_STATUSES.some((item) => normalizeText(item) === normalizeText(row.status))) {
      invalidStatuses += 1;
      warnings.push("Statut normalisé automatiquement");
    }
    const key = normalizeText(`${row.name}|${normalized.dosage}|${normalized.form}|${row.packaging}`);
    if (key && seen.has(key)) {
      duplicateRows += 1;
      warnings.push("Doublon détecté dans le fichier");
    }
    seen.add(key);

    const { best } = await matchMedicationInReferential(normalized);
    const isRecognized = Boolean(best.medicationId && best.score >= 60 && best.level !== "Aucune correspondance");
    if (isRecognized) recognizedMedications += 1;
    else {
      unknownMedications += 1;
      warnings.push("À valider dans le référentiel SABLIN PHARMA");
    }

    const medication = isRecognized && best.medicationId
      ? await db.medication.findUnique({
          where: { id: best.medicationId },
          select: {
            name: true,
            genericName: true,
            dosage: true,
            form: true,
            images: {
              where: { validationStatus: "Publiée" },
              orderBy: [{ isPlaceholder: "asc" }, { isPrimary: "desc" }, { createdAt: "desc" }],
              take: 1,
            },
          },
        })
      : null;
    const prohibitedMatch = findProhibitedMedicationMatch(
      {
        name: row.name,
        genericName: row.genericName,
        medicationName: medication?.name,
        dosage: normalized.dosage,
        form: normalized.form,
        barcode: normalized.barcode,
      },
      prohibitedRules
    );
    if (prohibitedMatch) {
      prohibitedRows += 1;
      errors.push(`Médicament interdit : ${prohibitedMatch.name}`);
    }
    const image = medication?.images[0];
    let imageUrl = image?.url ?? buildMedicationPlaceholderUrl({
      name: medication?.name ?? normalized.commercialName ?? row.name ?? "Médicament",
      genericName: medication?.genericName ?? normalized.genericName,
      dosage: medication?.dosage ?? normalized.dosage,
      form: medication?.form ?? normalized.form,
    });
    let imageBadge = image
      ? image.isPlaceholder
        ? "Image illustrative"
        : image.imageType === "pharmacy_photo"
          ? "Photo pharmacie validée"
          : "Image validée"
      : "Image illustrative";
    if (medication && !image && imageCandidateLookups < maxPreviewImageLookups) {
      imageCandidateLookups += 1;
      const imageSearch = await searchImageCandidatesWithFallback({
        id: best.medicationId,
        name: medication.name,
        genericName: medication.genericName,
        dosage: medication.dosage,
        form: medication.form,
      });
      const candidate = imageSearch.candidates[0];
      if (candidate?.imageUrl) {
        imageUrl = candidate.imageUrl;
        imageBadge = "Image candidate à vérifier";
      } else {
        imageUrl = imageSearch.fallbackImageUrl;
        imageBadge = imageSearch.fallbackSource.includes("Placeholder")
          ? "Image illustrative"
          : imageSearch.fallbackSource;
      }
    }
    if (errors.length) invalidRows += 1;
    else if (warnings.length) incompleteRows += 1;
    else validRows += 1;
    const publicationDecision = errors.length
      ? "Bloqué"
      : isPreviewRowSafeForPublication({
          errors,
          normalizedPrice: price,
          matchScore: best.score,
          matchLevel: best.level,
          prohibitedTerm: prohibitedMatch?.name,
        })
        ? "Prêt à publier"
        : isRecognized
          ? "Validation admin requise"
          : "Référentiel requis";
    const publicationReason =
      prohibitedMatch
        ? `Retiré automatiquement : ${prohibitedMatch.name} est dans la liste des médicaments interdits.`
        : publicationDecision === "Prêt à publier"
        ? "Correspondance certaine, prix valide et aucune erreur bloquante."
        : publicationDecision === "Référentiel requis"
          ? "Médicament non reconnu : validation ou fusion dans le référentiel nécessaire."
          : publicationDecision === "Bloqué"
            ? "Ligne bloquée jusqu’à correction des erreurs."
            : "La ligne reste contrôlée avant publication marketplace.";

    previewRows.push({
      lineNumber: row.lineNumber,
      name: row.name ?? "",
      genericName: row.genericName ?? "",
      dosage: normalized.dosage,
      form: normalized.form,
      packaging: normalized.packaging,
      manufacturer: normalized.manufacturer,
      barcode: normalized.barcode,
      imageUrl,
      imageBadge,
      price: row.price ?? "",
      normalizedPrice: price,
      quantity: row.quantity ?? "",
      status: row.status ?? "",
      normalizedStatus: status,
      updatedAt: row.updatedAt ?? "",
      remark: row.remark ?? "",
      errors,
      warnings,
      matchScore: best.score,
      matchLevel: best.level,
      medicationId: isRecognized ? best.medicationId : undefined,
      medicationName: medication?.name,
      confidenceLabel: confidenceLabel(best.score),
      publicationDecision,
      publicationReason,
      prohibitedTerm: prohibitedMatch?.name,
      blockedReason: prohibitedMatch ? prohibitedMatch.reason ?? "Médicament interdit par l’administration SABLIN." : undefined,
      correctionProposals: normalized.correctionProposals,
    });
  }

  return {
    fileName: input.fileName,
    fileType: input.fileType,
    sourceKind: fileExtension(input.fileName) as MarketplacePreview["sourceKind"],
    totalRows: input.rows.length,
    validRows,
    incompleteRows,
    invalidRows,
    duplicateRows,
    recognizedMedications,
    unknownMedications,
    missingPrices,
    missingDosages,
    missingForms,
    invalidStatuses,
    prohibitedRows,
    rows: previewRows,
    detectedColumns: input.rows[0]?.detectedColumns ?? {},
    acceptedStatuses: PUBLIC_AVAILABILITY_STATUSES,
    marketplaceRules: {
      noMedicineSales: "SABLIN PHARMA affiche les disponibilités et prix indicatifs sans vente directe, panier, livraison ni paiement médicament.",
      imageValidation: "Les images web restent bloquées tant que la licence et la correspondance médicament ne sont pas validées par l’Admin.",
      publicStock: "Le public voit uniquement Disponible, Stock faible, Rupture ou À confirmer. Les quantités internes restent privées.",
      priceNotice: "Prix indicatif, à confirmer auprès de la pharmacie.",
    },
  } satisfies MarketplacePreview;
}

export async function confirmMarketplaceImport(input: {
  pharmacySlug: string;
  fileName: string;
  fileType: string;
  rows: MarketplaceParsedRow[];
  publishLineNumbers?: number[];
  mode?: "publish_selected" | "auto_publish_safe" | "draft";
  role: MarketplaceImportRole;
  actorName?: string | null;
  actorRole?: string | null;
}) {
  const pharmacy = await db.pharmacy.findUnique({ where: { slug: input.pharmacySlug } });
  if (!pharmacy) throw new Error("Pharmacie introuvable.");
  const preview = await buildMarketplacePreview({ fileName: input.fileName, fileType: input.fileType, rows: input.rows });
  const requestedPublishLines = input.mode === "draft"
    ? new Set<number>()
    : input.publishLineNumbers
      ? new Set(input.publishLineNumbers.map(Number).filter(Number.isFinite))
      : new Set(preview.rows.map((row) => row.lineNumber));
  const safePublishLines = new Set(
    preview.rows
      .filter((row) => requestedPublishLines.has(row.lineNumber) && isPreviewRowSafeForPublication(row))
      .map((row) => row.lineNumber)
  );
  const selectedButNeedsValidation = preview.rows.filter(
    (row) => requestedPublishLines.has(row.lineNumber) && !safePublishLines.has(row.lineNumber)
  ).length;
  const draftRows = preview.rows.filter((row) => !requestedPublishLines.has(row.lineNumber)).length;
  const source = input.role === "admin" ? "Import administrateur" : "Import pharmacie";
  const status = input.mode === "draft"
    ? "Enregistré sans publication"
    : preview.invalidRows > 0 || preview.incompleteRows > 0 || selectedButNeedsValidation > 0 || draftRows > 0
      ? "Terminé avec contrôles"
      : "Terminé";
  const importLog = await db.pharmacyImport.create({
    data: {
      pharmacyId: pharmacy.id,
      fileName: input.fileName,
      fileType: input.fileType.toUpperCase(),
      authorRole: input.actorRole ?? (input.role === "admin" ? "Administrateur SABLIN" : "Pharmacien responsable"),
      authorName: input.actorName ?? null,
      source,
      status,
      totalRows: preview.totalRows,
      validRows: preview.validRows,
      invalidRows: preview.invalidRows + preview.incompleteRows,
      recognizedMedications: preview.recognizedMedications,
      unknownMedications: preview.unknownMedications,
      duplicateRows: preview.duplicateRows,
      missingPrices: preview.missingPrices,
      invalidStatuses: preview.invalidStatuses,
      missingDosages: preview.missingDosages,
      missingForms: preview.missingForms,
      reportJson: JSON.stringify(preview),
      completedAt: new Date(),
    },
  });

  const rowsForCore: ImportedMedicationRow[] = input.rows.map((row) => ({
    lineNumber: row.lineNumber,
    name: row.name,
    genericName: row.genericName,
    dosage: row.dosage,
    form: row.form,
    packaging: row.packaging,
    manufacturer: row.manufacturer,
    barcode: row.barcode,
    price: row.price,
    quantity: row.quantity,
    status: normalizeStatus(row.status),
    remark: row.remark,
  }));

  const enrichmentRows = await createEnrichmentRecords({
    importId: importLog.id,
    pharmacyId: pharmacy.id,
    rows: rowsForCore,
    provider: "Moteur Marketplace & Enrichissement SABLIN",
  });
  await Promise.all(preview.rows.map((row) => {
    const nextStatus = safePublishLines.has(row.lineNumber)
      ? "Publié"
      : requestedPublishLines.has(row.lineNumber)
        ? row.prohibitedTerm
          ? "Bloqué"
          : "Non publié"
        : "Retiré";
    return db.inventoryImportRow.updateMany({
      where: {
        importId: importLog.id,
        lineNumber: row.lineNumber,
      },
      data: {
        status: nextStatus,
        warningsJson: JSON.stringify([
          ...row.warnings,
          ...(safePublishLines.has(row.lineNumber) ? [] : [row.publicationReason]),
        ]),
      },
    });
  }));
  const rowsToPublish = rowsForCore.filter((row) => safePublishLines.has(row.lineNumber));
  const syncReport = rowsToPublish.length
    ? await syncInventory({
        pharmacyId: pharmacy.id,
        rows: rowsToPublish,
        triggerType: "import",
        sourceSystem: source,
        mode: "controlled_auto_publish",
        actor: input.actorName ?? null,
      })
    : {
        jobId: null,
        status: "Aucune publication",
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        recognizedMedications: 0,
        unknownMedications: 0,
        updatedProducts: 0,
        outOfStockProducts: 0,
        priceChanges: 0,
        conflicts: 0,
        warnings: 0,
      };
  await startMarketplaceEnrichment({
    medicationIds: preview.rows.map((row) => row.medicationId).filter(Boolean) as string[],
    actorName: input.actorName ?? null,
    provider: "Moteur Marketplace & Enrichissement SABLIN",
  });

  const report = {
    ...preview,
    enrichmentRowsCreated: enrichmentRows.length,
    syncJobId: syncReport.jobId,
    syncStatus: syncReport.status,
    selectedRows: requestedPublishLines.size,
    safePublishedRows: safePublishLines.size,
    draftRows,
    notPublishedRows: selectedButNeedsValidation + draftRows,
    prohibitedRows: preview.prohibitedRows,
    selectedButNeedsValidation,
    syncPublishedProducts: syncReport.updatedProducts,
    syncOutOfStockProducts: syncReport.outOfStockProducts,
    syncPriceChanges: syncReport.priceChanges,
    syncPendingValidation: Math.max(
      0,
      syncReport.totalRows - syncReport.updatedProducts
    ),
    syncConflicts: syncReport.conflicts,
    syncWarnings: syncReport.warnings,
    syncPublicationRule:
      "Publication autonome contrôlée : les lignes sûres et autorisées sont publiées automatiquement. Les médicaments interdits sont retirés automatiquement. Les lignes ambiguës restent non publiées jusqu’à correction ou validation admin.",
  };
  await db.pharmacyImport.update({
    where: { id: importLog.id },
    data: { reportJson: JSON.stringify(report) },
  });
  await db.professionalActionLog.create({
    data: {
      scope: input.role,
      action: "marketplace-import-confirmed",
      label: "Import Marketplace & Enrichissement",
      entityType: "pharmacy-import",
      entityId: importLog.id,
      pharmacyId: pharmacy.id,
      pharmacySlug: pharmacy.slug,
      actorRole: input.actorRole ?? input.role,
      status: status === "Terminé" ? "réussi" : "à vérifier",
      message: "Import multi-format confirmé, synchronisé et envoyé au moteur d’enrichissement.",
      source,
      details: JSON.stringify(report),
    },
  });
  return { import: importLog, report };
}

export function buildEnrichmentQuery(input: {
  name: string;
  genericName?: string | null;
  dosage?: string | null;
  form?: string | null;
  packaging?: string | null;
  manufacturer?: string | null;
}) {
  return [
    input.name,
    input.genericName,
    input.dosage,
    input.form,
    input.packaging,
    input.manufacturer,
    "médicament",
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function searchImageCandidatesForMedication(medicationId: string) {
  const medication = await db.medication.findUnique({ where: { id: medicationId } });
  if (!medication) throw new Error("Médicament introuvable.");
  return searchImageCandidatesWithFallback(medication);
}

function buildStructuredDescription(medication: {
  name: string;
  genericName: string;
  dosage: string;
  form: string;
  packSize: string;
  manufacturer?: string | null;
  category?: { name: string } | null;
}) {
  const parts = [
    `${medication.name} est référencé sur SABLIN PHARMA avec la DCI ${medication.genericName || "à confirmer"}.`,
    `Présentation : ${medication.form} ${medication.dosage}${medication.packSize ? `, ${medication.packSize}` : ""}.`,
    medication.category?.name ? `Catégorie : ${medication.category.name}.` : "",
    medication.manufacturer ? `Fabricant ou laboratoire renseigné : ${medication.manufacturer}.` : "",
    "Les informations présentées sont indicatives et ne remplacent pas le conseil d’un pharmacien ou d’un professionnel de santé.",
  ].filter(Boolean);
  return parts.join(" ");
}

export async function startMarketplaceEnrichment(input: {
  medicationIds: string[];
  actorName?: string | null;
  provider?: string;
}) {
  await seedDefaultEnrichmentProviders();
  const uniqueIds = [...new Set(input.medicationIds)].filter(Boolean);
  const jobs: Awaited<ReturnType<typeof db.enrichmentJob.create>>[] = [];
  for (const medicationId of uniqueIds) {
    const medication = await db.medication.findUnique({
      where: { id: medicationId },
      include: { category: true },
    });
    if (!medication) continue;
    const query = buildEnrichmentQuery(medication);
    const job = await db.enrichmentJob.create({
      data: {
        medicationId,
        provider: input.provider ?? "Moteur Marketplace & Enrichissement SABLIN",
        status: "Recherche interne",
        query,
        attempts: 1,
        startedAt: new Date(),
      },
    });
    jobs.push(job);

    await ensurePlaceholderImage(medicationId);

    const search = await searchImageCandidatesForMedication(medicationId).catch((error: Error) => ({
      provider: "Erreur fournisseur image",
      query,
      candidates: [],
      message: error.message,
      fallbackImageUrl: buildMedicationPlaceholderUrl(medication),
      fallbackSource: "Placeholder SABLIN PHARMA",
    }));

    if ("candidates" in search) {
      for (const candidate of search.candidates.slice(0, 5)) {
        await db.enrichmentCandidate.create({
          data: {
            jobId: job.id,
            candidateType: "image",
            imageUrl: candidate.imageUrl,
            sourceUrl: candidate.sourceUrl,
            sourceName: candidate.sourceName,
            licenseType: candidate.licenseType,
            score: candidate.score,
            matchDetails: JSON.stringify(candidate),
            status: candidate.status,
          },
        });
        if (candidate.status !== "Refusé") {
          const existingImage = await db.medicationImage.findFirst({
            where: {
              medicationId,
              OR: [
                { url: candidate.imageUrl },
                { originalUrl: candidate.imageUrl },
              ],
            },
          });
          if (!existingImage) {
            await db.medicationImage.create({
              data: {
                medicationId,
                url: candidate.imageUrl,
                originalUrl: candidate.imageUrl,
                sourceName: candidate.sourceName,
                sourceUrl: candidate.sourceUrl,
                imageType: "web_candidate",
                licenseType: candidate.licenseType,
                licenseUrl: candidate.licenseUrl,
                attributionText: candidate.text,
                commercialUseAllowed: false,
                modificationAllowed: false,
                isPrimary: false,
                isPlaceholder: false,
                width: candidate.width,
                height: candidate.height,
                confidenceScore: candidate.score,
                validationStatus: "À vérifier",
              },
            });
          }
        }
      }
      if (search.candidates.length === 0) {
        await ensurePlaceholderImage(medicationId);
      }
    }

    const existingDescription = await db.medicationDescription.findFirst({ where: { medicationId, validationStatus: { in: ["Validée", "Publiée"] } } });
    if (!existingDescription) {
      await db.medicationDescription.create({
        data: {
          medicationId,
          shortText: buildStructuredDescription(medication),
          longText: buildStructuredDescription(medication),
          sourceName: "Données structurées SABLIN PHARMA",
          generatedByAI: false,
          validationStatus: "À vérifier",
          confidenceScore: 80,
        },
      });
    }

    const imageCount = await db.enrichmentCandidate.count({ where: { jobId: job.id, candidateType: "image" } });
    await db.enrichmentJob.update({
      where: { id: job.id },
      data: {
        status: imageCount > 0 ? "Validation requise" : "Candidats trouvés",
        confidenceScore: imageCount > 0 ? 80 : 60,
        errorMessage: imageCount > 0 ? null : search.message,
        completedAt: new Date(),
      },
    });
  }
  return jobs;
}
