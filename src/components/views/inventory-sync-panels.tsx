"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, Database, RefreshCw, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heading, Muted } from "@/components/ui/typography";

type SyncKind = "admin" | "pharmacy";

type SyncConnection = {
  id: string;
  pharmacy?: { name: string; slug: string; commune: string; district?: string | null } | null;
  connectorType: string;
  name: string;
  status: string;
  primaryMethod: string;
  fallbackMethod?: string | null;
  frequency: string;
  healthStatus: string;
  lastSyncAt?: string | null;
  nextSyncAt?: string | null;
  lastRowsReceived: number;
  lastRowsValid: number;
  lastRowsRejected: number;
  lastRecognizedMedications: number;
  lastUnknownMedications: number;
};

type SyncJob = {
  id: string;
  status: string;
  triggerType: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  recognizedMedications: number;
  unknownMedications: number;
  conflicts: number;
  warnings: number;
  createdAt: string;
  completedAt?: string | null;
  pharmacy?: { name: string; slug: string; commune: string };
  connection?: { name: string; connectorType: string } | null;
};

type SyncConflict = {
  id: string;
  conflictType: string;
  status: string;
  riskLevel: string;
  proposedAction?: string | null;
  createdAt: string;
  incomingSource?: string | null;
  pharmacy?: { name: string; slug: string; commune: string };
  medication?: { name: string; dosage: string; form: string } | null;
};

type SyncMapping = {
  id: string;
  sourceSystem: string;
  sourceProductId: string;
  sourceBarcode?: string | null;
  confidenceScore: number;
  status: string;
  medication: { name: string; dosage: string; form: string };
  pharmacy?: { name: string; slug: string };
};

type SyncData = {
  methods?: readonly string[];
  frequencies?: readonly string[];
  connections?: SyncConnection[];
  jobs?: SyncJob[];
  conflicts?: SyncConflict[];
  mappings?: SyncMapping[];
  pharmacy?: { id: string; name: string; slug: string; commune: string; status: string } | null;
  rules?: Record<string, unknown>;
};

function statusClass(label: string) {
  const value = label.toLowerCase();
  if (value.includes("réussi") || value.includes("terminée") || value.includes("connect") || value.includes("opération") || value.includes("valid")) {
    return "bg-success-light text-success";
  }
  if (value.includes("attente") || value.includes("vérifier") || value.includes("warning") || value.includes("ancien") || value.includes("avert")) {
    return "bg-amber-100 text-amber-800";
  }
  if (value.includes("erreur") || value.includes("échou") || value.includes("rejet") || value.includes("suspend") || value.includes("critique")) {
    return "bg-danger-light text-danger";
  }
  return "bg-muted text-foreground";
}

function SyncBadge({ label }: { label: string }) {
  return <Badge className={`${statusClass(label)} border-0`}>{label}</Badge>;
}

function dateLabel(value?: string | null) {
  if (!value) return "Non planifiée";
  return new Intl.DateTimeFormat("fr-CI", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function metric(value: number | undefined) {
  return Number(value ?? 0).toLocaleString("fr-CI");
}

export function InventorySyncPanel({ kind, pharmacySlug }: { kind: SyncKind; pharmacySlug?: string }) {
  const [data, setData] = useState<SyncData>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [connectorType, setConnectorType] = useState("GenericCsvConnector");
  const [frequency, setFrequency] = useState("Manuelle");
  const [connectionName, setConnectionName] = useState(kind === "admin" ? "Import administrateur" : "Import Excel");
  const isAdmin = kind === "admin";

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (pharmacySlug) params.set("pharmacySlug", pharmacySlug);
    return params.toString();
  }, [pharmacySlug]);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");
    const res = await fetch(`/api/inventory-sync${query ? `?${query}` : ""}`, {
      headers: { "X-Sablin-Session-Kind": kind },
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok) setData(json);
    else setMessage(json.error ?? "Synchronisation indisponible.");
    setLoading(false);
  }, [kind, query]);

  useEffect(() => {
    load();
  }, [load]);

  async function apiAction(method: "POST" | "PATCH", payload: Record<string, unknown>) {
    setMessage("");
    const res = await fetch("/api/inventory-sync", {
      method,
      headers: { "Content-Type": "application/json", "X-Sablin-Session-Kind": kind },
      body: JSON.stringify({ pharmacySlug, ...payload }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(json.error ?? "Action impossible.");
      return null;
    }
    setMessage(json.result?.status ? `Synchronisation : ${json.result.status}` : "Action enregistrée.");
    await load();
    return json;
  }

  const createConnection = async () => {
    await apiAction("POST", {
      action: "create-connection",
      connectorType,
      name: connectionName,
      primaryMethod: connectionName,
      fallbackMethod: "Import Excel",
      frequency,
      configuration:
        connectorType === "GenericRestApiConnector"
          ? { apiUrl: "https://api.exemple-pharmacie.ci/inventory", apiKey: "clé-à-remplacer" }
          : connectorType === "WebhookConnector"
            ? { webhookSecret: "secret-à-remplacer" }
            : {},
    });
  };

  const connections = data.connections ?? [];
  const jobs = data.jobs ?? [];
  const conflicts = data.conflicts ?? [];
  const mappings = data.mappings ?? [];
  const openConflicts = conflicts.filter((item) => item.status !== "Résolu");
  const lastJob = jobs[0];
  const successRate = lastJob?.totalRows ? Math.round((lastJob.validRows / Math.max(lastJob.totalRows, 1)) * 100) : 0;

  return (
    <div className="space-y-5">
      <Card className="border-border/70 p-5 shadow-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <SyncBadge label={isAdmin ? "Administration SABLIN" : "Espace Pharmacie"} />
              <SyncBadge label="Service de synchronisation des inventaires" />
            </div>
            <Heading level="h2" className="mt-3">
              {isAdmin ? "Synchronisations multi-pharmacies" : "Synchronisation de mon inventaire"}
            </Heading>
            <Muted className="mt-2">
              Les inventaires sont traités côté serveur, les secrets restent chiffrés, les produits inconnus passent par l’enrichissement et le public ne voit jamais les quantités exactes.
            </Muted>
          </div>
          <Button variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={load} disabled={loading}>
            <RefreshCw className="mr-2 size-4" />
            Actualiser
          </Button>
        </div>
        {message && <p className="mt-3 rounded-lg border border-border bg-white p-3 text-sm font-bold text-foreground">{message}</p>}
      </Card>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/70 p-4">
          <Database className="size-5 text-brand" />
          <p className="mt-3 text-2xl font-extrabold text-foreground">{metric(connections.length)}</p>
          <p className="text-sm font-semibold text-muted-foreground">Connexions configurées</p>
        </Card>
        <Card className="border-border/70 p-4">
          <CheckCircle2 className="size-5 text-success" />
          <p className="mt-3 text-2xl font-extrabold text-foreground">{successRate}%</p>
          <p className="text-sm font-semibold text-muted-foreground">Réussite du dernier job</p>
        </Card>
        <Card className="border-border/70 p-4">
          <AlertTriangle className="size-5 text-amber-700" />
          <p className="mt-3 text-2xl font-extrabold text-foreground">{metric(openConflicts.length)}</p>
          <p className="text-sm font-semibold text-muted-foreground">Conflits ouverts</p>
        </Card>
        <Card className="border-border/70 p-4">
          <Clock3 className="size-5 text-brand-dark" />
          <p className="mt-3 text-sm font-extrabold text-foreground">{dateLabel(lastJob?.completedAt ?? lastJob?.createdAt)}</p>
          <p className="text-sm font-semibold text-muted-foreground">Dernier rapport</p>
        </Card>
      </div>

      <Card className="border-border/70 p-5 shadow-card">
        <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto]">
          <div>
            <Label>Type de connexion</Label>
            <select value={connectorType} onChange={(event) => setConnectorType(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-semibold text-foreground">
              {["ManualConnector", "GenericCsvConnector", "GenericExcelConnector", "GenericRestApiConnector", "WebhookConnector", "SecureFileConnector", "AdminManagedConnector"].map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Nom de la méthode</Label>
            <Input value={connectionName} onChange={(event) => setConnectionName(event.target.value)} />
          </div>
          <div>
            <Label>Fréquence</Label>
            <select value={frequency} onChange={(event) => setFrequency(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-semibold text-foreground">
              {(data.frequencies ?? ["Manuelle", "Toutes les heures", "Une fois par jour"]).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <Button className="self-end bg-brand text-white hover:bg-brand-dark" onClick={createConnection}>
            Configurer
          </Button>
        </div>
        <p className="mt-3 text-sm font-semibold text-muted-foreground">
          Méthodes prévues : {(data.methods ?? []).slice(0, 8).join(" · ")}
        </p>
      </Card>

      <section className="grid gap-3 xl:grid-cols-2">
        {connections.map((connection) => (
          <Card key={connection.id} className="border-border/70 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap gap-2">
                  <SyncBadge label={connection.status} />
                  <SyncBadge label={connection.healthStatus} />
                </div>
                <p className="mt-2 text-lg font-extrabold text-foreground">{connection.name}</p>
                <p className="text-sm font-semibold text-muted-foreground">
                  {connection.pharmacy?.name ?? data.pharmacy?.name ?? "Pharmacie"} · {connection.connectorType}
                </p>
              </div>
              <ShieldCheck className="size-5 text-brand-dark" />
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <p className="rounded-lg bg-muted/40 p-3 text-sm font-semibold text-foreground">Dernière sync : {dateLabel(connection.lastSyncAt)}</p>
              <p className="rounded-lg bg-muted/40 p-3 text-sm font-semibold text-foreground">Prochaine : {dateLabel(connection.nextSyncAt)}</p>
              <p className="rounded-lg bg-muted/40 p-3 text-sm font-semibold text-foreground">Lignes : {metric(connection.lastRowsReceived)}</p>
              <p className="rounded-lg bg-muted/40 p-3 text-sm font-semibold text-foreground">Reconnus : {metric(connection.lastRecognizedMedications)}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => apiAction("POST", { action: "test-connection", connectionId: connection.id })}>Tester</Button>
              <Button size="sm" className="bg-brand text-white hover:bg-brand-dark" onClick={() => apiAction("POST", { action: "sync-now", connectionId: connection.id })}>
                Synchroniser maintenant
              </Button>
              <Button size="sm" variant="outline" onClick={() => apiAction("PATCH", { action: "update-connection", connectionId: connection.id, status: "Suspendue", healthStatus: "Suspendue" })}>
                Suspendre
              </Button>
            </div>
          </Card>
        ))}
        {!connections.length && (
          <Card className="border-border/70 p-5">
            <p className="font-extrabold text-foreground">Aucune connexion configurée.</p>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">Créez une méthode Excel, CSV, API ou assistance SABLIN PHARMA pour démarrer.</p>
          </Card>
        )}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border/70 p-5 shadow-card">
          <Heading level="h3">Rapports de synchronisation</Heading>
          <div className="mt-4 overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <tr>{["Date", "Pharmacie", "Méthode", "Statut", "Lignes", "Valides", "Erreurs", "Conflits"].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border bg-white">
                {jobs.slice(0, 12).map((job) => (
                  <tr key={job.id}>
                    <td className="px-4 py-3 font-semibold">{dateLabel(job.createdAt)}</td>
                    <td className="px-4 py-3">{job.pharmacy?.name ?? data.pharmacy?.name ?? "Pharmacie"}</td>
                    <td className="px-4 py-3">{job.connection?.name ?? job.triggerType}</td>
                    <td className="px-4 py-3"><SyncBadge label={job.status} /></td>
                    <td className="px-4 py-3">{metric(job.totalRows)}</td>
                    <td className="px-4 py-3">{metric(job.validRows)}</td>
                    <td className="px-4 py-3">{metric(job.invalidRows)}</td>
                    <td className="px-4 py-3">{metric(job.conflicts)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="border-border/70 p-5 shadow-card">
          <Heading level="h3">Conflits de synchronisation</Heading>
          <div className="mt-4 space-y-3">
            {conflicts.slice(0, 8).map((conflict) => (
              <Card key={conflict.id} className="border-border/70 p-4">
                <div className="flex flex-wrap gap-2">
                  <SyncBadge label={conflict.status} />
                  <SyncBadge label={conflict.riskLevel} />
                </div>
                <p className="mt-2 font-extrabold text-foreground">{conflict.conflictType}</p>
                <p className="text-sm font-semibold text-muted-foreground">
                  {conflict.medication?.name ?? "Médicament non reconnu"} · {conflict.pharmacy?.name ?? data.pharmacy?.name ?? "Pharmacie"}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{conflict.proposedAction ?? "Action proposée à confirmer."}</p>
                {conflict.status !== "Résolu" && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => apiAction("PATCH", { action: "resolve-conflict", conflictId: conflict.id, resolution: "Marquer à confirmer" })}>
                      Marquer à confirmer
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => apiAction("PATCH", { action: "resolve-conflict", conflictId: conflict.id, resolution: "Conserver la donnée actuelle" })}>
                      Conserver
                    </Button>
                  </div>
                )}
              </Card>
            ))}
            {!conflicts.length && <p className="rounded-lg border border-border bg-white p-4 text-sm font-bold text-foreground">Aucun conflit de synchronisation ouvert.</p>}
          </div>
        </Card>
      </section>

      <Card className="border-border/70 p-5 shadow-card">
        <Heading level="h3">Correspondances produits validables</Heading>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {mappings.slice(0, 9).map((mapping) => (
            <Card key={mapping.id} className="border-border/70 p-4">
              <SyncBadge label={mapping.status} />
              <p className="mt-2 font-extrabold text-foreground">{mapping.sourceProductId}</p>
              <p className="text-sm font-semibold text-muted-foreground">
                → {mapping.medication.name} · Score {mapping.confidenceScore}/100
              </p>
              {mapping.status !== "Validée" && (
                <Button size="sm" className="mt-3 bg-brand text-white hover:bg-brand-dark" onClick={() => apiAction("PATCH", { action: "validate-mapping", mappingId: mapping.id })}>
                  Valider correspondance
                </Button>
              )}
            </Card>
          ))}
          {!mappings.length && <p className="rounded-lg border border-border bg-white p-4 text-sm font-bold text-foreground">Aucune correspondance produit enregistrée.</p>}
        </div>
      </Card>
    </div>
  );
}
