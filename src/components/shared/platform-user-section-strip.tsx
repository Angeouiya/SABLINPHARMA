import { CheckCircle2, LockKeyhole, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { sectionGuideFor, type UxSyncStatus } from "@/lib/platform-ux-sync";
import type { View } from "@/lib/types";

type PlatformUserSectionStripProps = {
  pageKey: View;
  className?: string;
};

const statusStyles: Record<UxSyncStatus, string> = {
  Synchronisé: "border-emerald-200 bg-emerald-50 text-emerald-900",
  "Contrôle admin": "border-blue-200 bg-blue-50 text-blue-900",
  "Publication contrôlée": "border-teal-200 bg-teal-50 text-teal-900",
  Verrouillé: "border-rose-200 bg-rose-50 text-rose-900",
  "À surveiller": "border-amber-200 bg-amber-50 text-amber-900",
};

export function PlatformUserSectionStrip({ pageKey, className }: PlatformUserSectionStripProps) {
  const guide = sectionGuideFor("user", pageKey);
  const primaryAction = guide.primaryActions[0] ?? "Consulter";
  const syncedData = guide.syncedData[0] ?? "Données publiques validées";
  const protection = guide.protections[0] ?? "Services avancés verrouillés";

  return (
    <div className={cn("rounded-xl border border-border/70 bg-white px-3 py-3 shadow-card sm:px-4", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-0 bg-brand-light text-brand-dark">Information générale</Badge>
            <Badge variant="outline" className={cn("whitespace-normal text-left font-extrabold", statusStyles[guide.status])}>
              {guide.status}
            </Badge>
          </div>
          <p className="mt-2 break-words text-sm font-extrabold text-foreground">{guide.title}</p>
        </div>

        <div className="grid min-w-0 gap-2 sm:flex sm:flex-wrap sm:justify-end">
          <MiniSignal icon={CheckCircle2} text={primaryAction} />
          <MiniSignal icon={RefreshCw} text={syncedData} />
          <MiniSignal icon={LockKeyhole} text={protection} />
        </div>
      </div>
    </div>
  );
}

function MiniSignal({ icon: Icon, text }: { icon: typeof CheckCircle2; text: string }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 rounded-lg border border-border bg-muted/20 px-2.5 py-2 text-xs font-bold text-muted-foreground">
      <Icon className="size-3.5 shrink-0 text-brand" />
      <span className="break-words">{text}</span>
    </span>
  );
}
