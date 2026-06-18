"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  MessageSquareText,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type RequestItem = {
  id: string;
  reference: string;
  serviceName: string;
  status: string;
  priority: string;
  creditCost: number;
  userMessage?: string | null;
  dosage?: string | null;
  form?: string | null;
  createdAt: string;
  expiresAt: string;
  pharmacy?: { name: string; slug: string; commune: string; district?: string | null } | null;
  medication?: { name: string; slug: string; dosage: string; form: string; packSize?: string | null } | null;
  user?: { name: string; commune?: string | null } | null;
  responses?: Array<{
    id: string;
    availabilityStatus?: string | null;
    confirmedPrice?: number | null;
    responseMessage: string;
    createdAt: string;
  }>;
  disputes?: Array<{ id: string; reason: string; status: string; createdAt: string }>;
};

const terminalStatuses = ["Répondue", "Fermée", "Remboursée", "Annulée", "Expirée", "Refusée"];

function makeIdempotency(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function requestStatusClass(status: string) {
  if (status === "Nouvelle") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (["Reçue", "Acceptée", "En cours"].includes(status)) return "border-blue-200 bg-blue-50 text-blue-800";
  if (status === "Répondue") return "border-brand/30 bg-brand-light text-brand-dark";
  if (["Expirée", "Refusée", "Litige"].includes(status)) return "border-amber-200 bg-amber-50 text-amber-900";
  if (status === "Remboursée") return "border-slate-200 bg-slate-100 text-slate-800";
  return "border-border bg-muted text-foreground";
}

function formatDate(value?: string | null) {
  if (!value) return "Non renseigné";
  return new Intl.DateTimeFormat("fr-CI", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function costText(cost: number) {
  return `${cost} crédit${cost > 1 ? "s" : ""} — ${cost * 100} FCFA`;
}

function EmptyPanel() {
  return (
    <Card className="border-dashed bg-white">
      <CardContent className="flex flex-col items-center gap-3 px-4 py-10 text-center">
        <MessageSquareText className="size-9 text-brand" />
        <p className="max-w-md text-sm font-semibold text-foreground">Aucune demande utilisateur dans ce filtre.</p>
        <p className="text-xs text-muted-foreground">Les demandes apparaissent ici après validation des crédits côté utilisateur.</p>
      </CardContent>
    </Card>
  );
}

function RequestCard({ request, children }: { request: RequestItem; children: React.ReactNode }) {
  const latestResponse = request.responses?.[0];
  return (
    <Card className="bg-white">
      <CardContent className="space-y-4 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={cn("border", requestStatusClass(request.status))}>{request.status}</Badge>
              <Badge className="border border-brand/25 bg-brand-light text-brand-dark">{costText(request.creditCost)}</Badge>
              {request.priority === "Haute" && <Badge className="border border-red-200 bg-red-50 text-red-700">Priorité haute</Badge>}
            </div>
            <h3 className="text-base font-bold text-foreground">{request.serviceName}</h3>
            <p className="text-xs font-semibold text-muted-foreground">{request.reference}</p>
          </div>
          <div className="text-left text-xs text-muted-foreground sm:text-right">
            <p>Créée : {formatDate(request.createdAt)}</p>
            <p>Échéance : {formatDate(request.expiresAt)}</p>
          </div>
        </div>

        <div className="grid gap-3 text-sm md:grid-cols-2">
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs font-bold uppercase text-muted-foreground">Pharmacie</p>
            <p className="font-semibold text-foreground">{request.pharmacy?.name ?? "Pharmacie"}</p>
            <p className="text-xs text-muted-foreground">
              {[request.pharmacy?.commune, request.pharmacy?.district].filter(Boolean).join(" · ") || "Localisation non renseignée"}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs font-bold uppercase text-muted-foreground">Médicament</p>
            <p className="font-semibold text-foreground">{request.medication?.name ?? "Non lié à un médicament"}</p>
            <p className="text-xs text-muted-foreground">
              {[request.medication?.dosage ?? request.dosage, request.medication?.form ?? request.form].filter(Boolean).join(" · ") || "Information libre"}
            </p>
          </div>
        </div>

        {request.userMessage && (
          <div className="rounded-lg border border-border bg-white p-3 text-sm text-foreground">
            <p className="mb-1 text-xs font-bold uppercase text-muted-foreground">Message utilisateur</p>
            {request.userMessage}
          </div>
        )}

        {latestResponse && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <CheckCircle2 className="size-4" />
              <span className="font-bold">Réponse pharmacie</span>
              {latestResponse.availabilityStatus && <Badge className="border border-emerald-300 bg-white text-emerald-800">{latestResponse.availabilityStatus}</Badge>}
              {typeof latestResponse.confirmedPrice === "number" && (
                <Badge className="border border-emerald-300 bg-white text-emerald-800">{latestResponse.confirmedPrice.toLocaleString("fr-FR")} FCFA</Badge>
              )}
            </div>
            <p>{latestResponse.responseMessage}</p>
            <p className="mt-2 text-xs text-emerald-800">Prix indicatif, à confirmer auprès de la pharmacie.</p>
          </div>
        )}

        {children}
      </CardContent>
    </Card>
  );
}

export function ProfessionalRequestsPanel({ kind, pharmacySlug }: { kind: "pharmacy" | "admin"; pharmacySlug?: string }) {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [busyRef, setBusyRef] = useState<string | null>(null);
  const [responses, setResponses] = useState<Record<string, { message: string; availabilityStatus: string; confirmedPrice: string }>>({});

  const endpoint = useMemo(() => {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (pharmacySlug) params.set("pharmacySlug", pharmacySlug);
    return kind === "admin" ? `/api/admin/user-requests?${params}` : `/api/pharmacy-platform/user-requests?${params}`;
  }, [kind, pharmacySlug, status]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(endpoint, { headers: { "X-Sablin-Session-Kind": kind } });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Chargement impossible.");
      setRequests(data.requests ?? []);
      setStats(data.stats ?? { pending: data.pending ?? 0 });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Chargement impossible.");
    } finally {
      setLoading(false);
    }
  }, [endpoint, kind]);

  useEffect(() => {
    load();
  }, [load]);

  const runPharmacyAction = async (reference: string, action: string, extra: Record<string, unknown> = {}) => {
    setBusyRef(reference);
    try {
      const res = await fetch("/api/pharmacy-platform/user-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Sablin-Session-Kind": kind },
        body: JSON.stringify({ reference, action, pharmacySlug, ...extra }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Action impossible.");
      toast.success("Action enregistrée.");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action impossible.");
    } finally {
      setBusyRef(null);
    }
  };

  const runAdminAction = async (reference: string, action: string, extra: Record<string, unknown> = {}) => {
    setBusyRef(reference);
    try {
      const res = await fetch("/api/admin/user-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Sablin-Session-Kind": "admin" },
        body: JSON.stringify({ reference, action, ...extra }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Action impossible.");
      toast.success("Action admin enregistrée.");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action admin impossible.");
    } finally {
      setBusyRef(null);
    }
  };

  const respond = (request: RequestItem) => {
    const value = responses[request.reference] ?? { message: "", availabilityStatus: "À confirmer", confirmedPrice: "" };
    if (value.message.trim().length < 8) {
      toast.error("Ajoutez une réponse claire pour l’utilisateur.");
      return;
    }
    runPharmacyAction(request.reference, "respond", {
      responseMessage: value.message,
      availabilityStatus: value.availabilityStatus,
      confirmedPrice: value.confirmedPrice ? Number(value.confirmedPrice) : null,
      updateInventory: true,
    });
  };

  const visibleStats = [
    { label: "Total", value: stats.total ?? requests.length, icon: MessageSquareText },
    { label: "Nouvelles", value: stats.new ?? requests.filter((item) => item.status === "Nouvelle").length, icon: Clock3 },
    { label: "En cours", value: stats.inProgress ?? requests.filter((item) => ["Reçue", "Acceptée", "En cours"].includes(item.status)).length, icon: RefreshCw },
    { label: "Répondues", value: stats.answered ?? requests.filter((item) => item.status === "Répondue").length, icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge className="mb-2 border border-brand/25 bg-brand-light text-brand-dark">
            {kind === "admin" ? "Supervision globale" : "Demandes de ma pharmacie"}
          </Badge>
          <h2 className="text-2xl font-bold text-foreground">Demandes utilisateurs</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Les demandes payées en crédits SABLIN sont suivies, historisées et synchronisées avec l’espace utilisateur.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full bg-white sm:w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="Nouvelle">Nouvelle</SelectItem>
              <SelectItem value="En cours">En cours</SelectItem>
              <SelectItem value="Répondue">Répondue</SelectItem>
              <SelectItem value="Litige">Litige</SelectItem>
              <SelectItem value="Expirée">Expirée</SelectItem>
              <SelectItem value="Remboursée">Remboursée</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={load}>
            <RefreshCw className="size-4" /> Actualiser
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {visibleStats.map((item) => (
          <Card key={item.label} className="bg-white">
            <CardContent className="flex items-center gap-3 px-4 py-4">
              <span className="flex size-10 items-center justify-center rounded-lg bg-brand-light text-brand-dark">
                <item.icon className="size-5" />
              </span>
              <div>
                <p className="text-2xl font-bold text-foreground">{item.value}</p>
                <p className="text-xs font-semibold text-muted-foreground">{item.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading ? (
        <Card className="bg-white">
          <CardContent className="px-4 py-8 text-sm text-muted-foreground">Chargement des demandes...</CardContent>
        </Card>
      ) : requests.length === 0 ? (
        <EmptyPanel />
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const responseValue = responses[request.reference] ?? {
              message: "",
              availabilityStatus: "À confirmer",
              confirmedPrice: "",
            };
            const canRespond = !terminalStatuses.includes(request.status);
            return (
              <RequestCard key={request.id} request={request}>
                <div className="space-y-4 border-t border-border pt-4">
                  {kind === "admin" && request.user && (
                    <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                      <p className="text-xs font-bold uppercase text-muted-foreground">Utilisateur anonymisé</p>
                      <p className="font-semibold text-foreground">{request.user.name}</p>
                      <p className="text-xs text-muted-foreground">{request.user.commune ?? "Commune non renseignée"}</p>
                    </div>
                  )}

                  {canRespond && (
                    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_160px_150px]">
                      <div className="space-y-2">
                        <Label>Réponse à transmettre</Label>
                        <Textarea
                          value={responseValue.message}
                          onChange={(event) =>
                            setResponses((current) => ({
                              ...current,
                              [request.reference]: { ...responseValue, message: event.target.value },
                            }))
                          }
                          placeholder="Réponse claire et professionnelle pour l’utilisateur."
                          className="min-h-20 bg-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Disponibilité</Label>
                        <Select
                          value={responseValue.availabilityStatus}
                          onValueChange={(value) =>
                            setResponses((current) => ({
                              ...current,
                              [request.reference]: { ...responseValue, availabilityStatus: value },
                            }))
                          }
                        >
                          <SelectTrigger className="w-full bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Disponible">Disponible</SelectItem>
                            <SelectItem value="Stock faible">Stock faible</SelectItem>
                            <SelectItem value="Rupture">Rupture</SelectItem>
                            <SelectItem value="À confirmer">À confirmer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Prix indicatif</Label>
                        <Input
                          type="number"
                          value={responseValue.confirmedPrice}
                          onChange={(event) =>
                            setResponses((current) => ({
                              ...current,
                              [request.reference]: { ...responseValue, confirmedPrice: event.target.value },
                            }))
                          }
                          placeholder="FCFA"
                          className="bg-white"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {canRespond && (
                      <>
                        <Button
                          variant="outline"
                          className="border-brand/30 text-brand-dark hover:bg-brand-light"
                          disabled={busyRef === request.reference}
                          onClick={() => runPharmacyAction(request.reference, request.status === "Nouvelle" ? "accept" : "take")}
                        >
                          {request.status === "Nouvelle" ? "Accepter" : "Prendre en charge"}
                        </Button>
                        <Button className="bg-brand text-white hover:bg-brand-dark" disabled={busyRef === request.reference} onClick={() => respond(request)}>
                          Répondre et synchroniser
                        </Button>
                        <Button
                          variant="outline"
                          className="border-red-200 text-red-700 hover:bg-red-50"
                          disabled={busyRef === request.reference}
                          onClick={() => runPharmacyAction(request.reference, "refuse", { reason: "La pharmacie ne peut pas traiter cette demande." })}
                        >
                          Refuser
                        </Button>
                      </>
                    )}
                    {kind === "admin" && (
                      <>
                        <Button variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" disabled={busyRef === request.reference} onClick={() => runAdminAction(request.reference, "remind")}>
                          Relancer
                        </Button>
                        <Button variant="outline" disabled={busyRef === request.reference} onClick={() => runAdminAction(request.reference, "prolong", { hours: 2 })}>
                          Prolonger 2h
                        </Button>
                        <Button variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-50" disabled={busyRef === request.reference} onClick={() => runAdminAction(request.reference, "refund", { reason: "Remboursement validé par l’administration", idempotencyKey: makeIdempotency(`refund-${request.reference}`) })}>
                          Rembourser
                        </Button>
                        <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50" disabled={busyRef === request.reference} onClick={() => runAdminAction(request.reference, "close", { reason: "Dossier clôturé par l’administration." })}>
                          Clôturer
                        </Button>
                      </>
                    )}
                  </div>

                  {kind === "admin" && request.disputes && request.disputes.length > 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                      <div className="mb-1 flex items-center gap-2 font-bold">
                        <AlertTriangle className="size-4" /> Litige ouvert
                      </div>
                      {request.disputes[0]?.reason}
                    </div>
                  )}
                </div>
              </RequestCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
