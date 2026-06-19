"use client";

import { CheckCircle2, RotateCcw, ShieldCheck, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type ConfirmableImportRow = {
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
  updatedAt?: string;
  remark?: string;
  originalValues?: Record<string, string>;
  sourceFile?: string;
  sourceSheet?: string;
  detectedColumns?: Record<string, string>;
};

export type ImportPreviewLine = {
  lineNumber: number;
  name: string;
  genericName: string;
  dosage: string;
  form: string;
  price: string;
  normalizedPrice: number | null;
  quantity: string;
  status: string;
  normalizedStatus: string;
  errors: string[];
  warnings: string[];
  matchScore: number;
  matchLevel: string;
  medicationName?: string;
  confidenceLabel: string;
};

export type ImportPreviewData = {
  totalRows: number;
  validRows: number;
  incompleteRows: number;
  invalidRows: number;
  recognizedMedications: number;
  unknownMedications: number;
  duplicateRows: number;
  missingPrices: number;
  invalidStatuses: number;
  rows?: ImportPreviewLine[];
  confirmableRows?: ConfirmableImportRow[];
};

function isSafePublishRow(row: ImportPreviewLine) {
  return (
    row.errors.length === 0 &&
    row.normalizedPrice !== null &&
    row.matchScore >= 95 &&
    row.matchLevel === "Correspondance certaine"
  );
}

export function safePublishLineNumbers(preview: ImportPreviewData | null) {
  return new Set((preview?.rows ?? []).filter(isSafePublishRow).map((row) => row.lineNumber));
}

export function selectedConfirmableRows(preview: ImportPreviewData | null, selectedLineNumbers: Set<number>) {
  return (preview?.confirmableRows ?? []).filter((row) => selectedLineNumbers.has(row.lineNumber));
}

export function ImportValidationPanel({
  preview,
  selectedLineNumbers,
  onSelectionChange,
}: {
  preview: ImportPreviewData;
  selectedLineNumbers: Set<number>;
  onSelectionChange: (next: Set<number>) => void;
}) {
  const rows = preview.rows ?? [];
  const safeRows = rows.filter(isSafePublishRow);
  const selectedCount = selectedLineNumbers.size;

  const selectAll = () => onSelectionChange(new Set(rows.map((row) => row.lineNumber)));
  const selectSafe = () => onSelectionChange(new Set(safeRows.map((row) => row.lineNumber)));
  const clearAll = () => onSelectionChange(new Set());
  const toggleLine = (lineNumber: number) => {
    const next = new Set(selectedLineNumbers);
    if (next.has(lineNumber)) next.delete(lineNumber);
    else next.add(lineNumber);
    onSelectionChange(next);
  };

  return (
    <Card className="mt-4 border-border/70 p-4 shadow-card">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-base font-extrabold text-foreground">Validation avant publication marketplace</h3>
          <p className="mt-1 max-w-3xl text-sm font-medium leading-relaxed text-muted-foreground">
            Sélectionnez uniquement les produits qui doivent alimenter la marketplace utilisateur. Les lignes retirées
            ne seront pas publiées et resteront hors de la validation de cet import.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className="border-0 bg-brand text-white">{selectedCount} sélectionnée(s)</Badge>
          <Badge variant="outline" className="border-brand/30 bg-white text-brand-dark">{safeRows.length} sûre(s)</Badge>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Button type="button" className="bg-brand text-white hover:bg-brand-dark" onClick={selectSafe}>
          <ShieldCheck className="size-4" /> Publier lignes sûres
        </Button>
        <Button type="button" variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={selectAll}>
          <CheckCircle2 className="size-4" /> Tout sélectionner
        </Button>
        <Button type="button" variant="outline" className="border-border text-foreground hover:bg-muted" onClick={clearAll}>
          <XCircle className="size-4" /> Tout retirer
        </Button>
        <Button type="button" variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={selectSafe}>
          <RotateCcw className="size-4" /> Réinitialiser sûr
        </Button>
      </div>

      <div className="mt-4 grid gap-3">
        {rows.slice(0, 80).map((row) => {
          const selected = selectedLineNumbers.has(row.lineNumber);
          const safe = isSafePublishRow(row);
          return (
            <div
              key={row.lineNumber}
              className={cn(
                "grid gap-3 rounded-xl border bg-white p-3 sm:grid-cols-[minmax(0,1fr)_auto]",
                selected ? "border-brand/40" : "border-border",
                !safe && "bg-muted/20"
              )}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="border-border bg-white text-foreground">Ligne {row.lineNumber}</Badge>
                  <Badge className={cn("border-0", safe ? "bg-brand text-white" : "bg-amber-500 text-white")}>
                    {safe ? "Publication sûre" : "Validation requise"}
                  </Badge>
                  <Badge variant="outline" className="border-brand/30 bg-white text-brand-dark">{row.confidenceLabel}</Badge>
                </div>
                <p className="mt-2 break-words text-sm font-extrabold text-foreground">
                  {row.name || "Médicament sans nom"}
                </p>
                <p className="mt-1 break-words text-xs font-medium text-muted-foreground">
                  {row.genericName || "DCI à compléter"} · {row.dosage || "Dosage à compléter"} · {row.form || "Forme à compléter"}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
                  <span className="rounded-md bg-muted px-2 py-1 text-foreground">Prix : {row.normalizedPrice ? `${row.normalizedPrice.toLocaleString("fr-FR")} FCFA` : "à compléter"}</span>
                  <span className="rounded-md bg-muted px-2 py-1 text-foreground">Statut : {row.normalizedStatus}</span>
                  <span className="rounded-md bg-muted px-2 py-1 text-foreground">Score : {row.matchScore}</span>
                </div>
                {(row.errors.length > 0 || row.warnings.length > 0) && (
                  <p className="mt-2 break-words text-xs font-semibold text-amber-800">
                    {[...row.errors, ...row.warnings].join(" · ")}
                  </p>
                )}
              </div>
              <div className="flex items-center sm:justify-end">
                <Button
                  type="button"
                  variant={selected ? "outline" : "default"}
                  className={cn(
                    "w-full sm:w-auto",
                    selected
                      ? "border-red-200 text-red-700 hover:bg-red-50"
                      : "bg-brand text-white hover:bg-brand-dark"
                  )}
                  onClick={() => toggleLine(row.lineNumber)}
                >
                  {selected ? "Retirer de la publication" : "Réintégrer"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      {rows.length > 80 && (
        <p className="mt-3 rounded-lg border border-border bg-muted/30 p-3 text-xs font-semibold text-muted-foreground">
          Aperçu limité aux 80 premières lignes pour garder l’interface fluide. La sélection groupée reste appliquée sur toutes les lignes analysées.
        </p>
      )}
    </Card>
  );
}
