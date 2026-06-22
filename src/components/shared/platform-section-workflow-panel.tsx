import { CheckCircle2, ClipboardCheck, Database, GitBranch, Route, ShieldCheck, Siren } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { sectionGuideFor, sectionReadinessFor, sectionWorkflowFor, type PlatformScope, type UxSyncStatus } from "@/lib/platform-ux-sync";

type PlatformSectionWorkflowPanelProps = {
  scope: PlatformScope;
  pageKey: string;
  publicMode?: boolean;
  className?: string;
};

const statusStyles: Record<UxSyncStatus, string> = {
  Synchronisé: "border-emerald-200 bg-emerald-50 text-emerald-900",
  "Contrôle admin": "border-blue-200 bg-blue-50 text-blue-900",
  "Publication contrôlée": "border-teal-200 bg-teal-50 text-teal-900",
  Verrouillé: "border-rose-200 bg-rose-50 text-rose-900",
  "À surveiller": "border-amber-200 bg-amber-50 text-amber-900",
};

const priorityStyles = {
  Stable: "border-emerald-200 bg-emerald-50 text-emerald-900",
  Contrôle: "border-blue-200 bg-blue-50 text-blue-900",
  Sécurité: "border-rose-200 bg-rose-50 text-rose-900",
  Surveillance: "border-amber-200 bg-amber-50 text-amber-900",
} as const;

export function PlatformSectionWorkflowPanel({ scope, pageKey, publicMode = false, className }: PlatformSectionWorkflowPanelProps) {
  const guide = sectionGuideFor(scope, pageKey);
  const workflow = sectionWorkflowFor(scope, pageKey);
  const readiness = sectionReadinessFor(scope, pageKey);

  return (
    <Card className={cn("border-border/70 bg-white p-4 shadow-card sm:p-5", className)}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-0 bg-brand-light text-brand-dark">
              {publicMode ? "Données contrôlées" : "Workflow de section"}
            </Badge>
            <Badge variant="outline" className={cn("whitespace-normal text-left font-extrabold", statusStyles[guide.status])}>
              {guide.status}
            </Badge>
          </div>
          <h3 className="mt-3 break-words text-base font-extrabold text-foreground">
            {publicMode ? "Ce que cette page synchronise" : "Fonctionnement réel de cet onglet"}
          </h3>
          <p className="mt-1 max-w-4xl text-sm font-medium leading-relaxed text-muted-foreground">
            {publicMode
              ? "Les informations générales restent lisibles. Les données avancées restent protégées par crédits ou session valide."
              : "Chaque section lit une source claire, déclenche des actions serveur et publie uniquement les données autorisées."}
          </p>
        </div>
        {!publicMode && scope === "admin" && workflow.apiRoutes.length > 0 && (
          <div className="flex min-w-0 flex-wrap gap-2 lg:max-w-xl lg:justify-end">
            {workflow.apiRoutes.slice(0, 5).map((route) => (
              <Badge key={route} variant="outline" className="max-w-full border-border bg-muted/20 text-xs font-bold text-foreground">
                <Route className="mr-1 size-3 shrink-0 text-brand" />
                <span className="truncate">{route}</span>
              </Badge>
            ))}
          </div>
        )}
        {!publicMode && scope === "pharmacy" && (
          <div className="flex min-w-0 flex-wrap gap-2 lg:justify-end">
            {["Ma pharmacie uniquement", "Base synchronisée", "Publication contrôlée"].map((item) => (
              <Badge key={item} variant="outline" className="border-brand/20 bg-brand-light text-xs font-extrabold text-brand-dark">
                {item}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {!publicMode && (
        <div className="mt-4 rounded-xl border border-border bg-muted/20 p-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-0 bg-white text-brand-dark">Plan opérationnel</Badge>
                <Badge variant="outline" className={cn("font-extrabold", priorityStyles[readiness.priority])}>
                  {readiness.priority}
                </Badge>
              </div>
              <p className="mt-2 break-words text-sm font-extrabold text-foreground">{readiness.nextAction}</p>
              <p className="mt-1 text-xs font-semibold leading-relaxed text-muted-foreground">{readiness.riskIfIgnored}</p>
            </div>
            <div className="grid min-w-0 gap-2 md:grid-cols-2 lg:max-w-2xl">
              <ReadinessChip icon={ClipboardCheck} title="Preuve de sync" text={readiness.syncProof} />
              <ReadinessChip icon={Siren} title="Règle de fin" text={readiness.completionRule} />
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <WorkflowTile title="Source" icon={Database} items={workflow.dataInputs} />
        <WorkflowTile title="Actions" icon={CheckCircle2} items={workflow.serverActions} />
        <WorkflowTile title="Sortie" icon={GitBranch} items={workflow.syncOutputs} />
        <WorkflowTile title="Protection" icon={ShieldCheck} items={publicMode ? workflow.protectionChecks : [...workflow.protectionChecks, ...workflow.auditSignals]} />
      </div>
    </Card>
  );
}

function ReadinessChip({ title, text, icon: Icon }: { title: string; text: string; icon: typeof ClipboardCheck }) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-white px-3 py-2">
      <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase text-foreground">
        <Icon className="size-3.5 shrink-0 text-brand" />
        {title}
      </p>
      <p className="mt-1 break-words text-xs font-semibold leading-snug text-muted-foreground">{text}</p>
    </div>
  );
}

function WorkflowTile({ title, icon: Icon, items }: { title: string; icon: typeof Database; items: string[] }) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-muted/20 p-3">
      <p className="flex items-center gap-2 text-xs font-extrabold uppercase text-foreground">
        <Icon className="size-4 shrink-0 text-brand" />
        {title}
      </p>
      <div className="mt-3 grid gap-2">
        {items.slice(0, 4).map((item) => (
          <span key={item} className="rounded-lg border border-border bg-white px-2.5 py-2 text-xs font-bold leading-snug text-muted-foreground">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
