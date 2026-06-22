"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ExternalLink, Filter, Search, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  coverageReportFor,
  maturityScoreForStatus,
  PLATFORM_LABELS,
  type PlatformCoverageItem,
  type PlatformCoverageReport,
  type PlatformScope,
  type UxSyncStatus,
} from "@/lib/platform-ux-sync";

type PlatformCoverageMatrixProps = {
  scope?: PlatformScope;
  title?: string;
  description?: string;
};

const scopeLabels: Array<{ value: "all" | PlatformScope; label: string }> = [
  { value: "all", label: "Toutes" },
  { value: "user", label: "Utilisateur" },
  { value: "pharmacy", label: "Pharmacie" },
  { value: "admin", label: "Admin" },
];

const statusStyles: Record<UxSyncStatus, string> = {
  Synchronisé: "border-emerald-200 bg-emerald-50 text-emerald-900",
  "Contrôle admin": "border-blue-200 bg-blue-50 text-blue-900",
  "Publication contrôlée": "border-teal-200 bg-teal-50 text-teal-900",
  Verrouillé: "border-rose-200 bg-rose-50 text-rose-900",
  "À surveiller": "border-amber-200 bg-amber-50 text-amber-900",
};

export function PlatformCoverageMatrix({
  scope,
  title = "Matrice UX & synchronisation",
  description = "Contrôle section par section : objectif UX, données synchronisées, protections et route concernée.",
}: PlatformCoverageMatrixProps) {
  const [query, setQuery] = useState("");
  const [selectedScope, setSelectedScope] = useState<"all" | PlatformScope>(scope ?? "all");
  const [report, setReport] = useState<PlatformCoverageReport | null>(null);
  const [reportState, setReportState] = useState<"loading" | "ready" | "fallback">("loading");
  const fixedScope = Boolean(scope);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const endpoint =
      selectedScope === "all"
        ? "/api/platform-sync/coverage"
        : `/api/platform-sync/coverage?scope=${encodeURIComponent(selectedScope)}`;

    setReportState("loading");
    fetch(endpoint, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Coverage API unavailable");
        return response.json() as Promise<PlatformCoverageReport>;
      })
      .then((nextReport) => {
        if (!active) return;
        setReport(nextReport);
        setReportState("ready");
      })
      .catch(() => {
        if (!active) return;
        setReport(null);
        setReportState("fallback");
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [selectedScope]);

  const localReport = useMemo(
    () => coverageReportFor(selectedScope === "all" ? undefined : selectedScope),
    [selectedScope]
  );

  const activeReport = report?.scope === (selectedScope === "all" ? "all" : selectedScope) ? report : localReport;

  const items = useMemo(() => {
    const base = activeReport.sections;
    const normalized = query.trim().toLowerCase();
    if (!normalized) return base;
    return base.filter((item) =>
      [
        item.title,
        item.intent,
        item.uiFocus,
        item.status,
        item.scope,
        item.route ?? "",
        item.primaryActions.join(" "),
        item.syncedData.join(" "),
        item.protections.join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized)
    );
  }, [activeReport.sections, query]);

  const summary = activeReport.summary;

  return (
    <Card className="border-border/70 bg-white p-4 shadow-card sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-0 bg-brand-light text-brand-dark">Couverture des sections</Badge>
            <Badge variant="outline" className="border-border bg-muted/30 text-foreground">
              {summary.total} onglets
            </Badge>
            <Badge variant="outline" className={cn("border-border bg-white text-foreground", summary.missingCoverage > 0 && "border-amber-200 bg-amber-50 text-amber-900")}>
              {summary.missingCoverage === 0 ? "Parité routes OK" : `${summary.missingCoverage} à couvrir`}
            </Badge>
            <Badge variant="outline" className="border-border bg-white text-muted-foreground">
              {reportState === "ready" ? "API synchronisée" : reportState === "loading" ? "Lecture serveur" : "Fallback local"}
            </Badge>
          </div>
          <h2 className="mt-3 break-words text-xl font-extrabold text-foreground">{title}</h2>
          <p className="mt-2 max-w-4xl text-sm font-medium leading-relaxed text-muted-foreground">{description}</p>
        </div>

        <div className="grid gap-2 sm:grid-cols-5 xl:min-w-[520px]">
          <SummaryChip label="Total" value={summary.total} />
          <SummaryChip label="Synchronisés" value={summary.synchronized} />
          <SummaryChip label="Contrôlés" value={summary.controlled} />
          <SummaryChip label="Verrouillés" value={summary.locked} />
          <SummaryChip label="Surveillance" value={summary.watch} />
        </div>
      </div>

      {activeReport.missingPageKeys.length > 0 && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-900">
          Sections à couvrir :{" "}
          {activeReport.missingPageKeys
            .slice(0, 8)
            .map((item) => `${PLATFORM_LABELS[item.scope]} / ${item.pageKey}`)
            .join(", ")}
          {activeReport.missingPageKeys.length > 8 ? "..." : ""}
        </div>
      )}

      <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
        <div className="relative min-w-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher une section, une protection, une donnée..."
            className="h-11 bg-white pl-9 text-foreground"
          />
        </div>
        {!fixedScope && (
          <div className="flex min-w-0 flex-wrap gap-2">
            {scopeLabels.map((item) => (
              <Button
                key={item.value}
                type="button"
                variant={selectedScope === item.value ? "default" : "outline"}
                size="sm"
                className={cn(
                  selectedScope === item.value
                    ? "bg-brand text-white hover:bg-brand-dark"
                    : "border-brand/30 text-brand-dark hover:bg-brand-light"
                )}
                onClick={() => setSelectedScope(item.value)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-3 lg:hidden">
        {items.map((item) => (
          <CoverageCard key={`${item.scope}-${item.pageKey}`} item={item} />
        ))}
      </div>

      <div className="mt-4 hidden overflow-x-auto rounded-xl border border-border lg:block">
        <table className="w-full min-w-[1180px] text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              {["Plateforme", "Section", "Statut", "Maturité", "Synchronise", "Protège", "Route"].map((header) => (
                <th key={header} className="px-4 py-3 font-extrabold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-white">
            {items.map((item) => (
              <CoverageRow key={`${item.scope}-${item.pageKey}`} item={item} />
            ))}
          </tbody>
        </table>
      </div>

      {items.length === 0 && (
        <div className="mt-4 rounded-xl border border-border bg-muted/20 p-5 text-sm font-semibold text-muted-foreground">
          Aucune section ne correspond à cette recherche.
        </div>
      )}
    </Card>
  );
}

function CoverageRow({ item }: { item: PlatformCoverageItem }) {
  const route = item.route;
  return (
    <tr>
      <td className="px-4 py-3 font-bold text-foreground">{PLATFORM_LABELS[item.scope]}</td>
      <td className="px-4 py-3">
        <p className="font-extrabold text-foreground">{item.title}</p>
        <p className="mt-1 max-w-md text-xs font-medium leading-relaxed text-muted-foreground">{item.intent}</p>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={item.status} />
      </td>
      <td className="px-4 py-3">
        <MaturityMeter status={item.status} score={item.maturityScore} />
      </td>
      <td className="px-4 py-3">
        <MiniList items={item.syncedData} />
      </td>
      <td className="px-4 py-3">
        <MiniList items={item.protections} icon="lock" />
      </td>
      <td className="px-4 py-3">
        {route ? (
          <a href={route} className="inline-flex items-center gap-1 rounded-md border border-brand/30 bg-white px-2 py-1 text-xs font-extrabold text-brand-dark hover:bg-brand-light">
            Ouvrir <ExternalLink className="size-3" />
          </a>
        ) : (
          <span className="text-xs font-semibold text-muted-foreground">Vue interne</span>
        )}
      </td>
    </tr>
  );
}

function CoverageCard({ item }: { item: PlatformCoverageItem }) {
  const route = item.route;
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-extrabold uppercase text-brand-dark">{PLATFORM_LABELS[item.scope]}</p>
          <p className="mt-1 break-words font-extrabold text-foreground">{item.title}</p>
        </div>
        <StatusBadge status={item.status} />
      </div>
      <p className="mt-2 text-sm font-semibold leading-relaxed text-foreground">{item.intent}</p>
      <MaturityMeter status={item.status} score={item.maturityScore} className="mt-3" />
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <MiniBlock title="Synchronise" items={item.syncedData} />
        <MiniBlock title="Protège" items={item.protections} />
      </div>
      {route && (
        <a href={route} className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-lg border border-brand/30 bg-white px-3 py-2 text-sm font-extrabold text-brand-dark hover:bg-brand-light">
          Ouvrir la section <ExternalLink className="size-4" />
        </a>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: UxSyncStatus }) {
  return (
    <Badge variant="outline" className={cn("whitespace-normal text-left font-extrabold", statusStyles[status])}>
      {status}
    </Badge>
  );
}

function MaturityMeter({ status, score: providedScore, className }: { status: UxSyncStatus; score?: number; className?: string }) {
  const score = providedScore ?? maturityScoreForStatus(status);
  return (
    <div className={cn("min-w-36", className)}>
      <div className="flex items-center justify-between gap-2 text-xs font-bold text-foreground">
        <span>{score}%</span>
        <span className="text-muted-foreground">maturité</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-brand" style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function MiniList({ items, icon = "check" }: { items: string[]; icon?: "check" | "lock" }) {
  const Icon = icon === "lock" ? ShieldCheck : CheckCircle2;
  return (
    <div className="grid gap-1">
      {items.slice(0, 3).map((item) => (
        <span key={item} className="flex max-w-sm items-start gap-1.5 text-xs font-semibold leading-snug text-muted-foreground">
          <Icon className="mt-0.5 size-3 shrink-0 text-brand" />
          <span className="break-words">{item}</span>
        </span>
      ))}
    </div>
  );
}

function MiniBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-border bg-white p-3">
      <p className="mb-2 flex items-center gap-1 text-xs font-extrabold uppercase text-foreground">
        <Filter className="size-3 text-brand" /> {title}
      </p>
      <MiniList items={items} />
    </div>
  );
}

function SummaryChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 px-3 py-2 text-center">
      <p className="text-lg font-extrabold text-brand-dark">{value}</p>
      <p className="text-[10px] font-bold uppercase text-muted-foreground">{label}</p>
    </div>
  );
}
