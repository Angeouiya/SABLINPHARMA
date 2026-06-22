"use client";

import { CheckCircle2, LockKeyhole, RefreshCw, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { sectionGuideFor, type PlatformScope, type UxSyncStatus } from "@/lib/platform-ux-sync";

type PlatformSectionGuideProps = {
  scope: PlatformScope;
  pageKey: string;
  className?: string;
};

const statusStyles: Record<UxSyncStatus, string> = {
  Synchronisé: "border-emerald-200 bg-emerald-50 text-emerald-900",
  "Contrôle admin": "border-blue-200 bg-blue-50 text-blue-900",
  "Publication contrôlée": "border-teal-200 bg-teal-50 text-teal-900",
  Verrouillé: "border-rose-200 bg-rose-50 text-rose-900",
  "À surveiller": "border-amber-200 bg-amber-50 text-amber-900",
};

export function PlatformSectionGuide({ scope, pageKey, className }: PlatformSectionGuideProps) {
  const guide = sectionGuideFor(scope, pageKey);

  return (
    <Card className={cn("border-border/70 bg-white p-4 shadow-card sm:p-5", className)}>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.85fr)]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-0 bg-brand-light text-brand-dark">UX de l’onglet</Badge>
            <Badge variant="outline" className={cn("whitespace-normal text-left font-extrabold", statusStyles[guide.status])}>
              {guide.status}
            </Badge>
          </div>
          <h2 className="mt-3 break-words text-lg font-extrabold leading-tight text-foreground sm:text-xl">
            {guide.title}
          </h2>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-foreground">{guide.intent}</p>
          <p className="mt-1 text-sm font-medium leading-relaxed text-muted-foreground">{guide.uiFocus}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
          <GuideList icon={Target} title="Actions" items={guide.primaryActions} />
          <GuideList icon={RefreshCw} title="Synchronise" items={guide.syncedData} />
          <GuideList icon={LockKeyhole} title="Protège" items={guide.protections} />
        </div>
      </div>
    </Card>
  );
}

function GuideList({
  icon: Icon,
  title,
  items,
}: {
  icon: typeof Target;
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-3">
      <div className="flex items-center gap-2">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-brand-light text-brand-dark">
          <Icon className="size-4" />
        </span>
        <p className="text-xs font-extrabold uppercase text-foreground">{title}</p>
      </div>
      <div className="mt-3 grid gap-1.5">
        {items.map((item) => (
          <span key={item} className="flex min-w-0 items-start gap-1.5 text-xs font-semibold leading-snug text-muted-foreground">
            <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-brand" />
            <span className="break-words">{item}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
