import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hasPharmacyPermission, requirePharmacyPermission } from "@/lib/pharmacy-access";
import { IMPORT_TEMPLATE_COLUMNS, PUBLIC_AVAILABILITY_STATUSES } from "@/lib/pharmacy-platform";
import {
  createEnrichmentRecords,
  seedDefaultEnrichmentProviders,
  type ImportedMedicationRow,
} from "@/lib/medication-enrichment";
import { syncInventory } from "@/lib/inventory-sync";

const ACCEPTED_FILE_TYPES = new Set([
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

function splitLine(line: string) {
  return line.includes(";") ? line.split(";") : line.split(",");
}

function normalize(value: string) {
  return value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function parseImportColumns(line: string, lineNumber: number): ImportedMedicationRow & {
  price?: string;
  status?: string;
  threshold?: string;
  updatedAt?: string;
} {
  const columns = splitLine(line).map((value) => value.trim());
  const hasEnrichmentColumns = columns.length >= 13;
  if (hasEnrichmentColumns) {
    const [
      name = "",
      genericName = "",
      dosage = "",
      form = "",
      packaging = "",
      manufacturer = "",
      barcode = "",
      price = "",
      status = "",
      quantity = "",
      threshold = "",
      updatedAt = "",
      remark = "",
    ] = columns;
    return { lineNumber, name, genericName, dosage, form, packaging, manufacturer, barcode, price, status, quantity, threshold, updatedAt, remark };
  }
  const [name = "", genericName = "", dosage = "", form = "", packaging = "", price = "", status = "", quantity = "", threshold = "", updatedAt = "", remark = ""] = columns;
  return { lineNumber, name, genericName, dosage, form, packaging, price, status, quantity, threshold, updatedAt, remark };
}

function parseDataRows(text: string) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const dataLines = lines.length > 1 ? lines.slice(1) : [];
  return dataLines.map((line, index) => parseImportColumns(line, index + 2));
}

function analyzeRows(text: string, medicationNames: string[]) {
  const rows = parseDataRows(text);
  const known = new Set(medicationNames.map(normalize));
  let validRows = 0;
  let invalidRows = 0;
  let recognizedMedications = 0;
  let unknownMedications = 0;
  let duplicateRows = 0;
  let missingPrices = 0;
  let invalidPrices = 0;
  let invalidStatuses = 0;
  let missingDosages = 0;
  let missingForms = 0;
  const seen = new Set<string>();
  const preview = rows.slice(0, 20).map((row) => {
    const name = row.name ?? "";
    const dci = row.genericName ?? "";
    const dosage = row.dosage ?? "";
    const form = row.form ?? "";
    const packaging = row.packaging ?? "";
    const manufacturer = row.manufacturer ?? "";
    const barcode = row.barcode ?? "";
    const priceRaw = row.price ?? "";
    const status = row.status ?? "";
    const quantity = row.quantity ?? "";
    const threshold = row.threshold ?? "";
    const updatedAt = row.updatedAt ?? "";
    const remark = row.remark ?? "";
    const key = normalize(`${name}|${dosage}|${form}`);
    const errors: string[] = [];
    if (!name.trim()) errors.push("Nom médicament manquant");
    if (!dosage.trim()) {
      missingDosages += 1;
      errors.push("Dosage manquant");
    }
    if (!form.trim()) {
      missingForms += 1;
      errors.push("Forme manquante");
    }
    if (!priceRaw.trim()) {
      missingPrices += 1;
      errors.push("Prix manquant");
    } else if (!Number.isFinite(Number(priceRaw)) || Number(priceRaw) <= 0) {
      invalidPrices += 1;
      errors.push("Prix invalide");
    }
    if (!(PUBLIC_AVAILABILITY_STATUSES as readonly string[]).includes(status.trim())) {
      invalidStatuses += 1;
      errors.push("Statut invalide");
    }
    if (known.has(normalize(name))) {
      recognizedMedications += 1;
    } else {
      unknownMedications += 1;
      errors.push("Médicament non reconnu");
    }
    if (seen.has(key)) {
      duplicateRows += 1;
      errors.push("Doublon");
    }
    seen.add(key);
    if (errors.length) invalidRows += 1;
    else validRows += 1;
    return { line: row.lineNumber, name, dci, dosage, form, packaging, manufacturer, barcode, price: priceRaw, status, quantity, threshold, updatedAt, remark, errors };
  });

  return {
    totalRows: rows.length,
    validRows,
    invalidRows: invalidRows + Math.max(0, rows.length - preview.length),
    recognizedMedications,
    unknownMedications,
    duplicateRows,
    missingPrices,
    invalidPrices,
    invalidStatuses,
    missingDosages,
    missingForms,
    preview,
  };
}

async function resolvePharmacy(req: NextRequest, pharmacySlug: string) {
  const access = requirePharmacyPermission(req, "import_inventory");
  if (access.response) return { access, response: access.response, pharmacy: null };

  if (!pharmacySlug && !hasPharmacyPermission(access.role, "view_all_pharmacies")) {
    return {
      access,
      response: NextResponse.json({ error: "Une pharmacie doit importer uniquement son propre inventaire." }, { status: 403 }),
      pharmacy: null,
    };
  }
  const effectiveSlug = pharmacySlug || access.session?.pharmacySlug || "";
  if (!hasPharmacyPermission(access.role, "view_all_pharmacies") && access.session?.kind === "pharmacy" && access.session.pharmacySlug !== effectiveSlug) {
    return {
      access,
      response: NextResponse.json({ error: "Une pharmacie ne peut importer que pour elle-même." }, { status: 403 }),
      pharmacy: null,
    };
  }
  const pharmacy = await db.pharmacy.findUnique({ where: { slug: effectiveSlug } });
  if (!pharmacy) {
    return { access, response: NextResponse.json({ error: "Pharmacie introuvable." }, { status: 404 }), pharmacy: null };
  }
  return { access, response: null, pharmacy };
}

export async function GET(req: NextRequest) {
  const access = requirePharmacyPermission(req, "import_inventory");
  if (access.response) return access.response;

  const { searchParams } = new URL(req.url);
  const pharmacySlug = searchParams.get("pharmacySlug") ?? undefined;
  const imports = await db.pharmacyImport.findMany({
    where: pharmacySlug ? { pharmacy: { slug: pharmacySlug } } : hasPharmacyPermission(access.role, "view_all_pharmacies") ? {} : { pharmacy: { slug: access.session?.pharmacySlug } },
    include: { pharmacy: { select: { name: true, slug: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    templateColumns: IMPORT_TEMPLATE_COLUMNS,
    acceptedStatuses: PUBLIC_AVAILABILITY_STATUSES,
    acceptedFormats: ["XLSX", "XLS", "CSV"],
    imports,
  });
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Import attendu en multipart/form-data." }, { status: 400 });
  }
  const form = await req.formData();
  const pharmacySlug = String(form.get("pharmacySlug") ?? "").trim();
  const { access, response, pharmacy } = await resolvePharmacy(req, pharmacySlug);
  if (response) return response;
  if (!pharmacy) return NextResponse.json({ error: "Pharmacie introuvable." }, { status: 404 });

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier import obligatoire." }, { status: 400 });
  }
  const ext = file.name.split(".").pop()?.toLowerCase();
  const isAcceptedExtension = ext === "csv" || ext === "xls" || ext === "xlsx";
  if (!isAcceptedExtension && !ACCEPTED_FILE_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Format import non autorisé. Utilisez XLSX, XLS ou CSV." }, { status: 400 });
  }

  const medications = await db.medication.findMany({ select: { name: true } });
  const text = ext === "csv" || file.type === "text/csv" ? await file.text() : "";
  const importedRows = text ? parseDataRows(text) : [];
  await seedDefaultEnrichmentProviders();
  const report = text
    ? analyzeRows(text, medications.map((item) => item.name))
    : {
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        recognizedMedications: 0,
        unknownMedications: 0,
        duplicateRows: 0,
        missingPrices: 0,
        invalidPrices: 0,
        invalidStatuses: 0,
        missingDosages: 0,
        missingForms: 0,
        preview: [],
      };
  const status = report.invalidRows > 0 ? "Terminé avec erreurs" : "Terminé";
  const source = hasPharmacyPermission(access.role, "view_all_pharmacies") ? "Import administrateur" : "Import pharmacie";
  const importLog = await db.pharmacyImport.create({
    data: {
      pharmacyId: pharmacy.id,
      fileName: file.name,
      fileType: ext?.toUpperCase() ?? "CSV",
      authorRole: access.role ?? "Pharmacien responsable",
      authorName: access.session?.name ?? null,
      source,
      status,
      totalRows: report.totalRows,
      validRows: report.validRows,
      invalidRows: report.invalidRows,
      recognizedMedications: report.recognizedMedications,
      unknownMedications: report.unknownMedications,
      duplicateRows: report.duplicateRows,
      missingPrices: report.missingPrices,
      invalidPrices: report.invalidPrices,
      invalidStatuses: report.invalidStatuses,
      missingDosages: report.missingDosages,
      missingForms: report.missingForms,
      reportJson: JSON.stringify(report),
      completedAt: new Date(),
    },
  });

  const enrichmentRows = text
    ? await createEnrichmentRecords({
        importId: importLog.id,
        pharmacyId: pharmacy.id,
        rows: importedRows,
      })
    : [];
  const syncReport = importedRows.length
    ? await syncInventory({
        pharmacyId: pharmacy.id,
        rows: importedRows,
        triggerType: "import",
        sourceSystem: source,
        mode: "validate_before_publish",
        actor: access.session?.name ?? null,
      })
    : null;
  const enrichmentSummary = {
    enrichmentRowsCreated: enrichmentRows.length,
    certainMatches: enrichmentRows.filter((row) => row.matchLevel === "Correspondance certaine").length,
    validationRequired: enrichmentRows.filter((row) => row.enrichmentRequired).length,
  };
  const syncSummary = syncReport
    ? {
        syncJobId: syncReport.jobId,
        syncStatus: syncReport.status,
        syncConflicts: syncReport.conflicts,
        syncWarnings: syncReport.warnings,
        syncRecognizedMedications: syncReport.recognizedMedications,
        syncUnknownMedications: syncReport.unknownMedications,
      }
    : {};
  const enrichedReport = { ...report, ...enrichmentSummary, ...syncSummary };
  await db.pharmacyImport.update({
    where: { id: importLog.id },
    data: { reportJson: JSON.stringify(enrichedReport) },
  });

  await db.professionalActionLog.create({
    data: {
      scope: hasPharmacyPermission(access.role, "view_all_pharmacies") ? "admin" : "pharmacy",
      action: "inventory-import",
      label: "Import inventaire",
      entityType: "pharmacy-import",
      entityId: importLog.id,
      pharmacyId: pharmacy.id,
      pharmacySlug: pharmacy.slug,
      actorRole: access.role,
      status: status === "Terminé" ? "réussi" : "à vérifier",
      message: "Rapport d’import inventaire généré.",
      source,
      details: JSON.stringify(enrichedReport),
    },
  });

  return NextResponse.json({ import: { ...importLog, reportJson: JSON.stringify(enrichedReport) }, report: enrichedReport }, { status: 201 });
}
