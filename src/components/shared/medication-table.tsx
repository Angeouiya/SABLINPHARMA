"use client";

import { ShieldAlert, ChevronRight, Lock, Pill } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CategoryIcon } from "@/components/category-icons";
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
      <div className="grid gap-3 p-3 md:hidden">
        {meds.map((m) => (
            <button
              key={m.id}
              onClick={() => navigate("medication-detail", { slug: m.slug })}
              className="w-full rounded-xl border border-border/60 bg-background p-3 text-left transition-colors hover:border-brand/30 hover:bg-accent/40"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-brand-light">
                  {m.imageUrl ? (
                    <img src={m.imageUrl} alt={m.name} className="size-full object-cover" />
                  ) : m.category ? (
                    <CategoryIcon name={m.category.iconName} size={22} color={m.category.color} />
                  ) : (
                    <Pill className="size-5 text-brand" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="break-words text-sm font-bold leading-snug text-foreground">
                      {m.name}
                    </h3>
                    {m.requiresRx && <ShieldAlert className="size-3.5 shrink-0 text-amber-500" />}
                  </div>
                  <p className="mt-1 break-words text-xs text-muted-foreground">
                    {m.genericName} · {m.form} · {m.dosage}
                  </p>
                </div>
                <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-3">
                <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-bold text-foreground">
                  <Lock className="size-3 text-brand" />
                  Prix verrouillé — 1 crédit
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground">
                  <Lock className="size-3.5 text-brand" />
                  Voir pharmacies — 1 crédit
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-foreground">
                  <Lock className="size-3" />
                  Disponibilité verrouillée
                </span>
              </div>
            </button>
          ))}
      </div>
      <div className="hidden overflow-x-auto scroll-thin md:block">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-border/60 bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-5 py-3.5 font-semibold">Médicament</th>
              <th className="px-5 py-3.5 font-semibold">DCI</th>
              <th className="px-5 py-3.5 font-semibold">Forme</th>
              <th className="px-5 py-3.5 font-semibold">Dosage</th>
              <th className="px-5 py-3.5 font-semibold">Prix</th>
              <th className="px-5 py-3.5 font-semibold">Pharmacies</th>
              <th className="px-5 py-3.5 font-semibold">Disponibilité</th>
              <th className="px-5 py-3.5 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {meds.map((m) => (
                <tr
                  key={m.id}
                  onClick={() => navigate("medication-detail", { slug: m.slug })}
                  className="cursor-pointer transition-colors hover:bg-accent/40"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-brand-light">
                        {m.imageUrl ? (
                          <img src={m.imageUrl} alt={m.name} className="size-full object-cover" />
                        ) : m.category ? (
                          <CategoryIcon name={m.category.iconName} size={20} color={m.category.color} />
                        ) : (
                          <Pill className="size-4 text-brand" />
                        )}
                      </span>
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
                    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-bold text-foreground">
                      <Lock className="size-3 text-brand" />
                      Verrouillé — 1 crédit
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground">
                      <Lock className="size-3.5 text-brand" />
                      1 crédit
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-foreground">
                      <Lock className="size-3" />
                      Verrouillée
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="inline-flex items-center gap-0.5 text-xs font-bold text-brand">
                      Voir détails
                      <ChevronRight className="size-3.5" />
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
