"use client";

import { ShieldAlert, ChevronRight, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { MedicationStatusBadge } from "@/components/shared/status-badge";
import { getMedStatus } from "@/components/shared/medication-card";
import { Price } from "@/components/ui/typography";
import { useNav } from "@/store/nav";
import type { Medication } from "@/lib/types";

interface MedicationTableProps {
  meds: Medication[];
  loading?: boolean;
}

export function MedicationTable({ meds, loading = false }: MedicationTableProps) {
  const { navigate } = useNav();

  if (loading) {
    return (
      <Card className="overflow-hidden border-border/60 py-0">
        <div className="space-y-2 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-md bg-muted/60" />
          ))}
        </div>
      </Card>
    );
  }

  if (meds.length === 0) return null;

  return (
    <Card className="overflow-hidden border-border/60 py-0 shadow-card">
      <div className="overflow-x-auto scroll-thin">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-border/60 bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-5 py-3.5 font-semibold">Médicament</th>
              <th className="px-5 py-3.5 font-semibold">DCI</th>
              <th className="px-5 py-3.5 font-semibold">Forme</th>
              <th className="px-5 py-3.5 font-semibold">Dosage</th>
              <th className="px-5 py-3.5 font-semibold">Prix indicatif</th>
              <th className="px-5 py-3.5 font-semibold">Pharmacies</th>
              <th className="px-5 py-3.5 font-semibold">Statut</th>
              <th className="px-5 py-3.5 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {meds.map((m) => {
              const status = getMedStatus(m);
              return (
                <tr
                  key={m.id}
                  onClick={() => navigate("medication-detail", { slug: m.slug })}
                  className="cursor-pointer transition-colors hover:bg-accent/40"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{m.name}</span>
                      {m.requiresRx && (
                        <ShieldAlert className="size-3.5 text-amber-500" />
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{m.genericName}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{m.form}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{m.dosage}</td>
                  <td className="px-5 py-3.5">
                    <Price amount={m.avgPrice} size="sm" variant="brand" />
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <MapPin className="size-3.5 text-brand" />
                      {m.pharmacyCount ?? 0}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <MedicationStatusBadge status={status} />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="inline-flex items-center gap-0.5 text-xs font-bold text-brand">
                      Voir détails
                      <ChevronRight className="size-3.5" />
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
