"use client";

import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Database, LockKeyhole, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  flowsForPlatform,
  PLATFORM_LABELS,
  sectionsForPlatform,
  UX_SYNC_GUARDRAILS,
  type PlatformScope,
  type PlatformSyncOverview,
  type UxSyncStatus,
} from "@/lib/platform-ux-sync";

type PlatformUxSyncPanelProps = {
  scope: PlatformScope;
  compact?: boolean;
  title?: string;
  description?: string;
};

const statusStyles: Record<UxSyncStatus, string> = {
  Synchronisé: "border-emerald-200 bg-emerald-50 text-emerald-900",
  "Contrôle admin": "border-blue-200 bg-blue-50 text-blue-900",
  "Publication contrôlée": "border-teal-200 bg-teal-50 text-teal-900",
  Verrouillé: "border-rose-200 bg-rose-50 text-rose-900",
  "À surveiller": "border-amber-200 bg-amber-50 text-amber-900",
};

function SyncStatusBadge({ status }: { status: UxSyncStatus }) {
  return (
    <Badge variant="outline" className={cn("whitespace-normal text-left font-extrabold", statusStyles[status])}>
      {status}
    </Badge>
  );
}

export function PlatformUxSyncPanel({
  scope,
  compact = false,
  title = "UX & synchronisation",
  description,
}: PlatformUxSyncPanelProps) {
  const [overview, setOverview] = useState<PlatformSyncOverview | null>(null);
  const [overviewState, setOverviewState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const sections = sectionsForPlatform(scope);
  const flows = flowsForPlatform(scope);
  const guardrails = scope === "user" ? UX_SYNC_GUARDRAILS.slice(0, 5) : UX_SYNC_GUARDRAILS;
  const intro =
    description ??
    (scope === "user"
      ? "Les informations publiques restent simples. Les données sensibles passent par les crédits SABLIN, sans afficher les espaces professionnels."
      : "Cette vue clarifie quelles sections alimentent les autres plateformes, quelles données sont publiées et quels contrôles protègent la synchronisation.");

  useEffect(() => {
    let active = true;
    setOverviewState("loading");
    fetch(`/api/platform-sync/overview?scope=${scope}`, {
      cache: "no-store",
      headers: scope === "user" ? undefined : { "x-sablin-session-kind": scope },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Aperçu indisponible");
        return res.json() as Promise<PlatformSyncOverview>;
      })
      .then((data) => {
        if (!active) return;
        setOverview(data);
        setOverviewState("ready");
      })
      .catch(() => {
        if (!active) return;
        setOverview(null);
        setOverviewState("error");
      });
    return () => {
      active = false;
    };
  }, [scope]);

  return (
    <section className="space-y-4">
      <Card className="border-border/70 bg-white p-4 shadow-card sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <Badge className="border-0 bg-brand-light text-brand-dark">{PLATFORM_LABELS[scope]}</Badge>
            <h2 className="mt-3 break-words text-xl font-extrabold leading-tight text-foreground sm:text-2xl">
              {title}
            </h2>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-relaxed text-muted-foreground">
              {intro}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-xl border border-border bg-muted/20 p-2 text-center md:min-w-72">
            <MiniSyncMetric value={sections.length} label="Sections" />
            <MiniSyncMetric value={flows.length} label="Flux" />
            <MiniSyncMetric value={guardrails.length} label="Règles" />
          </div>
        </div>
      </Card>

      <Card className="border-border/70 bg-white p-4 shadow-card sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-brand/30 bg-brand-light text-brand-dark">
                État réel
              </Badge>
              <Badge variant="outline" className="border-border bg-muted/30 text-foreground">
                {overviewState === "loading" ? "Chargement" : overviewState === "ready" ? "Connecté" : "Fallback"}
              </Badge>
            </div>
            <h3 className="mt-3 break-words text-lg font-extrabold text-foreground">Aperçu centralisé des données</h3>
            <p className="mt-1 text-sm font-medium leading-relaxed text-muted-foreground">
              {overview
                ? `Dernière lecture : ${new Intl.DateTimeFormat("fr-CI", { dateStyle: "short", timeStyle: "short" }).format(new Date(overview.generatedAt))}.`
                : "Les règles UX restent affichées même si l’aperçu dynamique n’est pas disponible pour cette session."}
            </p>
          </div>
          {overview?.warnings.length ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-900 md:max-w-sm">
              {overview.warnings.join(" ")}
            </div>
          ) : null}
        </div>

        {overview ? (
          <>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {overview.metrics.map((metric) => (
                <div key={`${metric.label}-${metric.value}`} className="rounded-xl border border-border bg-background p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="min-w-0 break-words text-sm font-extrabold text-foreground">{metric.label}</p>
                    <SyncStatusBadge status={normalizeStatus(metric.status)} />
                  </div>
                  <p className="mt-3 break-words text-2xl font-extrabold text-brand-dark">{metric.value}</p>
                  <p className="mt-1 text-xs font-semibold leading-relaxed text-muted-foreground">{metric.detail}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {overview.pipelineChecks.map((check) => (
                <span
                  key={check}
                  className="inline-flex max-w-full items-start gap-1 rounded-md border border-border bg-muted/30 px-2 py-1 text-xs font-semibold leading-snug text-muted-foreground"
                >
                  <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-brand" />
                  <span className="break-words">{check}</span>
                </span>
              ))}
            </div>
          </>
        ) : (
          <div className="mt-4 rounded-xl border border-border bg-muted/20 p-4 text-sm font-semibold text-muted-foreground">
            Aperçu dynamique non disponible. Les règles centrales et les flux restent consultables ci-dessous.
          </div>
        )}
      </Card>

      <div className={cn("grid gap-4", compact ? "lg:grid-cols-2" : "xl:grid-cols-[1.05fr_0.95fr]")}>
        <Card className="border-border/70 bg-white p-4 shadow-card sm:p-5">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand-dark">
              <ShieldCheck className="size-5" />
            </span>
            <div className="min-w-0">
              <h3 className="break-words text-lg font-extrabold text-foreground">Sections maîtrisées</h3>
              <p className="text-sm font-medium text-muted-foreground">
                Chaque onglet garde un rôle clair et une source de données explicite.
              </p>
            </div>
          </div>
          <div className={cn("mt-4 grid gap-3", compact ? "md:grid-cols-1" : "lg:grid-cols-2")}>
            {sections.map((section) => (
              <div key={section.section} className="rounded-xl border border-border bg-background p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="min-w-0 break-words font-extrabold text-foreground">{section.section}</p>
                  <SyncStatusBadge status={section.status} />
                </div>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-foreground">{section.purpose}</p>
                <div className="mt-3 grid gap-2 text-xs font-medium text-muted-foreground">
                  <InfoLine label="UI" value={section.uiState} />
                  <InfoLine label="Source" value={section.dataSource} />
                  <InfoLine label="Sortie" value={section.syncTarget} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border-border/70 bg-white p-4 shadow-card sm:p-5">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand-dark">
              <Database className="size-5" />
            </span>
            <div className="min-w-0">
              <h3 className="break-words text-lg font-extrabold text-foreground">Flux synchronisés</h3>
              <p className="text-sm font-medium text-muted-foreground">
                Les plateformes restent séparées à l’écran mais reliées par des règles de publication.
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-3">
            {flows.map((flow) => (
              <div key={flow.id} className="rounded-xl border border-border bg-background p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="min-w-0 break-words font-extrabold text-foreground">{flow.title}</p>
                  <SyncStatusBadge status={flow.status} />
                </div>
                <div className="mt-3 grid gap-2 text-xs font-bold text-foreground sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
                  <span className="rounded-lg border border-border bg-white px-2 py-2">{flow.source}</span>
                  <ArrowRight className="hidden size-4 text-brand sm:block" />
                  <span className="rounded-lg border border-border bg-white px-2 py-2">{flow.processor}</span>
                  <ArrowRight className="hidden size-4 text-brand sm:block" />
                  <span className="rounded-lg border border-border bg-white px-2 py-2">{flow.target}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {flow.checks.map((check) => (
                    <span
                      key={check}
                      className="inline-flex max-w-full items-start gap-1 rounded-md border border-border bg-muted/30 px-2 py-1 text-xs font-semibold leading-snug text-muted-foreground"
                    >
                      <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-brand" />
                      <span className="break-words">{check}</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="border-border/70 bg-white p-4 shadow-card sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand-dark">
            <LockKeyhole className="size-5" />
          </span>
          <div className="min-w-0">
            <h3 className="break-words text-lg font-extrabold text-foreground">Garde-fous UX et sécurité</h3>
            <p className="text-sm font-medium text-muted-foreground">
              Ces règles évitent les confusions entre plateformes et protègent les données sensibles.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {guardrails.map((rule) => (
            <div key={rule} className="rounded-lg border border-border bg-muted/20 p-3 text-sm font-semibold leading-relaxed text-foreground">
              {rule}
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}

function normalizeStatus(status: string): UxSyncStatus {
  if (status === "Synchronisé" || status === "Contrôle admin" || status === "Publication contrôlée" || status === "Verrouillé" || status === "À surveiller") {
    return status;
  }
  const value = status.toLowerCase();
  if (value.includes("valid") || value.includes("publi") || value.includes("actif")) return "Synchronisé";
  if (value.includes("attente") || value.includes("vérifier") || value.includes("ancien") || value.includes("incomplet")) return "À surveiller";
  if (value.includes("suspend") || value.includes("refus") || value.includes("risque")) return "Verrouillé";
  return "Contrôle admin";
}

function MiniSyncMetric({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-lg bg-white px-2 py-2">
      <p className="text-lg font-extrabold text-brand-dark">{value}</p>
      <p className="text-[10px] font-bold uppercase text-muted-foreground">{label}</p>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <p className="min-w-0">
      <span className="font-extrabold text-foreground">{label} : </span>
      <span className="break-words">{value}</span>
    </p>
  );
}
