"use client";

import { FileCheck2, ImageIcon, RotateCcw, ShieldCheck, XCircle } from "lucide-react";
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
  packaging?: string;
  manufacturer?: string;
  imageUrl?: string;
  imageBadge?: string;
  price: string;
  normalizedPrice: number | null;
  quantity: string;
  status: string;
  normalizedStatus: string;
  errors: string[];
  warnings: string[];
  matchScore: number;
  matchLevel: string;
  medicationId?: string;
  medicationName?: string;
  confidenceLabel: string;
  publicationDecision?: "Prêt à publier" | "Validation admin requise" | "Référentiel requis" | "Bloqué";
  publicationReason?: string;
  prohibitedTerm?: string;
  blockedReason?: string;
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
  prohibitedRows?: number;
  rows?: ImportPreviewLine[];
  confirmableRows?: ConfirmableImportRow[];
  safePublishedRows?: number;
  draftRows?: number;
  selectedButNeedsValidation?: number;
};

function isSafePublishRow(row: ImportPreviewLine) {
  return (
    row.errors.length === 0 &&
    !row.prohibitedTerm &&
    row.normalizedPrice !== null &&
    row.matchScore >= 95 &&
    row.matchLevel === "Correspondance certaine"
  );
}

export function safePublishLineNumbers(preview: ImportPreviewData | null) {
  return new Set((preview?.rows ?? []).filter(isSafePublishRow).map((row) => row.lineNumber));
}

export function ImportValidationPanel({
  preview,
  selectedLineNumbers,
  onSelectionChange,
  onResetSelection,
}: {
  preview: ImportPreviewData;
  selectedLineNumbers: Set<number>;
  onSelectionChange: (next: Set<number>) => void;
  onResetSelection?: () => void;
}) {
  const rows = preview.rows ?? [];
  const safeRows = rows.filter(isSafePublishRow);
  const selectedSafeCount = rows.filter((row) => selectedLineNumbers.has(row.lineNumber) && isSafePublishRow(row)).length;
  const reviewCount = rows.filter((row) => !isSafePublishRow(row)).length;
  const prohibitedCount = rows.filter((row) => row.prohibitedTerm).length;
  const removedSafeCount = safeRows.length - selectedSafeCount;

  const selectSafe = () => onSelectionChange(new Set(safeRows.map((row) => row.lineNumber)));
  const clearAll = () => onSelectionChange(new Set());
  const resetSelection = () => {
    if (onResetSelection) onResetSelection();
    else selectSafe();
  };
  const toggleLine = (lineNumber: number) => {
    const row = rows.find((item) => item.lineNumber === lineNumber);
    if (!row || !isSafePublishRow(row)) return;
    const next = new Set(selectedLineNumbers);
    if (next.has(lineNumber)) next.delete(lineNumber);
    else next.add(lineNumber);
    onSelectionChange(next);
  };

  return (
    <Card className="mt-4 border-border/70 p-4 shadow-card">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-base font-extrabold text-foreground">Analyse de la liste à publier</h3>
          <p className="mt-1 max-w-3xl text-sm font-medium leading-relaxed text-muted-foreground">
            Les produits reconnus, autorisés et complets seront publiés automatiquement. Vous pouvez retirer une ligne
            sûre si vous ne voulez pas l’afficher. Les produits interdits et les lignes incomplètes restent non publiés.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className="border-0 bg-brand text-white">{selectedSafeCount} à publier</Badge>
          <Badge variant="outline" className="border-amber-300 bg-white text-amber-700">{reviewCount} non publié(s)</Badge>
          <Badge variant="outline" className="border-border bg-white text-foreground">{removedSafeCount} retiré(s)</Badge>
          <Badge variant="outline" className="border-red-200 bg-white text-red-700">{prohibitedCount} interdit(s)</Badge>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <Button type="button" className="bg-brand text-white hover:bg-brand-dark" onClick={selectSafe}>
          <ShieldCheck className="size-4" /> Publier les produits sûrs
        </Button>
        <Button type="button" variant="outline" className="border-border text-foreground hover:bg-muted" onClick={clearAll}>
          <XCircle className="size-4" /> Tout retirer
        </Button>
        <Button type="button" variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={resetSelection}>
          <RotateCcw className="size-4" /> Réinitialiser
        </Button>
      </div>
      <p className="mt-2 rounded-lg border border-brand/20 bg-brand-light/50 p-3 text-xs font-bold text-brand-dark">
        Sélection active : {selectedSafeCount} produit(s) sûr(s) seront publiés. Les produits retirés, interdits ou ambigus ne seront pas affichés côté utilisateur.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-border bg-white p-3">
          <p className="text-xs font-bold text-muted-foreground">Liste à publier</p>
          <p className="mt-1 text-xl font-extrabold text-foreground">{selectedSafeCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-3">
          <p className="text-xs font-bold text-muted-foreground">Produits sûrs détectés</p>
          <p className="mt-1 text-xl font-extrabold text-brand-dark">{safeRows.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-3">
          <p className="text-xs font-bold text-muted-foreground">Non publiés</p>
          <p className="mt-1 text-xl font-extrabold text-amber-700">{reviewCount + removedSafeCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-3">
          <p className="text-xs font-bold text-muted-foreground">Interdits retirés</p>
          <p className="mt-1 text-xl font-extrabold text-red-700">{prohibitedCount}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {rows.slice(0, 80).map((row) => {
          const selected = selectedLineNumbers.has(row.lineNumber);
          const safe = isSafePublishRow(row);
          const decision = row.publicationDecision ?? (safe ? "Prêt à publier" : "Validation admin requise");
          const decisionClass =
            decision === "Prêt à publier"
              ? "bg-brand text-white"
              : decision === "Bloqué"
                ? "bg-red-600 text-white"
                : "bg-amber-500 text-white";
          return (
            <div
              key={row.lineNumber}
              className={cn(
                "grid gap-3 rounded-xl border bg-white p-3 sm:grid-cols-[96px_minmax(0,1fr)_auto]",
                selected ? "border-brand/40" : "border-border",
                !safe && "bg-muted/20"
              )}
            >
              <div className="h-24 w-full overflow-hidden rounded-lg border border-border bg-white sm:w-24">
                {row.imageUrl ? (
                  <img src={row.imageUrl} alt={row.name || "Image médicament"} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted/30 text-muted-foreground">
                    <ImageIcon className="size-7" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="border-border bg-white text-foreground">Ligne {row.lineNumber}</Badge>
                  <Badge className={cn("border-0", decisionClass)}>{decision}</Badge>
                  <Badge variant="outline" className="border-border bg-white text-foreground">
                    {safe ? (selected ? "Sera publié" : "Retiré de la publication") : "Non publié"}
                  </Badge>
                  <Badge variant="outline" className="border-brand/30 bg-white text-brand-dark">{row.confidenceLabel}</Badge>
                  {row.imageBadge && <Badge variant="outline" className="border-border bg-white text-foreground">{row.imageBadge}</Badge>}
                  {row.prohibitedTerm && <Badge variant="outline" className="border-red-200 bg-white text-red-700">Interdit : {row.prohibitedTerm}</Badge>}
                </div>
                <p className="mt-2 break-words text-sm font-extrabold text-foreground">
                  {row.medicationName || row.name || "Médicament sans nom"}
                </p>
                <p className="mt-1 break-words text-xs font-medium text-muted-foreground">
                  {row.genericName || "DCI à compléter"} · {row.dosage || "Dosage à compléter"} · {row.form || "Forme à compléter"}
                  {row.packaging ? ` · ${row.packaging}` : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
                  <span className="rounded-md bg-muted px-2 py-1 text-foreground">Prix : {row.normalizedPrice ? `${row.normalizedPrice.toLocaleString("fr-FR")} FCFA` : "à compléter"}</span>
                  <span className="rounded-md bg-muted px-2 py-1 text-foreground">Statut : {row.normalizedStatus}</span>
                  <span className="rounded-md bg-muted px-2 py-1 text-foreground">Score : {row.matchScore}</span>
                </div>
                <p className="mt-2 break-words text-xs font-semibold text-muted-foreground">
                  <FileCheck2 className="mr-1 inline size-3.5" />
                  {row.publicationReason ?? (safe ? "Cette ligne peut alimenter la marketplace après validation." : "Cette ligne reste à contrôler avant publication.")}
                </p>
                {row.blockedReason && (
                  <p className="mt-2 break-words text-xs font-semibold text-red-700">{row.blockedReason}</p>
                )}
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
                    !safe
                      ? "bg-muted text-muted-foreground"
                      : selected
                      ? "border-red-200 text-red-700 hover:bg-red-50"
                      : "bg-brand text-white hover:bg-brand-dark"
                  )}
                  disabled={!safe}
                  onClick={() => toggleLine(row.lineNumber)}
                >
                  {!safe ? "Non publiable" : selected ? "Retirer" : "Publier"}
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
