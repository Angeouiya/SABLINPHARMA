"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  CheckCircle2,
  Coins,
  MessageSquareText,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/store/auth";
import { useCredits } from "@/store/credits";
import { useNav } from "@/store/nav";
import { cn } from "@/lib/utils";

type Service = {
  id: string;
  publicName: string;
  shortLabel: string;
  description: string;
  creditCost: number;
  fcfaEquivalent: number;
  immediate: boolean;
  requiresMedication: boolean;
  requiresPrescription: boolean;
};

type RequestItem = {
  id: string;
  reference: string;
  requestType: string;
  serviceName: string;
  status: string;
  priority: string;
  creditCost: number;
  fcfaEquivalent: number;
  userMessage?: string | null;
  requestedQuantity?: string | null;
  dosage?: string | null;
  form?: string | null;
  packaging?: string | null;
  preferredResponse?: string | null;
  createdAt: string;
  expiresAt: string;
  respondedAt?: string | null;
  pharmacy?: { name: string; slug: string; commune: string; district?: string | null } | null;
  medication?: { id?: string; name: string; slug: string; dosage: string; form: string; packSize?: string | null } | null;
  user?: { name: string; commune?: string | null } | null;
  responses?: Array<{
    id: string;
    responderName?: string | null;
    responderRole: string;
    availabilityStatus?: string | null;
    confirmedPrice?: number | null;
    packaging?: string | null;
    responseMessage: string;
    validUntil?: string | null;
    dataSource: string;
    createdAt: string;
  }>;
  history?: Array<{
    previousStatus?: string | null;
    newStatus: string;
    changedBy?: string | null;
    changedByRole?: string | null;
    reason?: string | null;
    createdAt: string;
  }>;
  disputes?: Array<{ id: string; reason: string; status: string; createdAt: string; resolvedAt?: string | null }>;
  refunds?: Array<{ id: string; creditAmount: number; reason: string; status: string; createdAt: string; completedAt?: string | null }>;
};

type PharmacyOption = { id: string; name: string; slug: string; commune: string; district?: string | null };
type MedicationOption = { id: string; name: string; dosage: string; form: string; slug: string };

const manualServiceIds = ["advice_pharmacy", "confirm_availability", "confirm_price", "confirm_full", "prescription_request"];
const terminalStatuses = ["Répondue", "Fermée", "Remboursée", "Annulée", "Expirée", "Refusée"];

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

function makeIdempotency(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function EmptyPanel({ message, action }: { message: string; action?: string }) {
  return (
    <Card className="border-dashed bg-white">
      <CardContent className="flex flex-col items-center gap-3 px-4 py-10 text-center">
        <MessageSquareText className="size-9 text-brand" />
        <p className="max-w-md text-sm font-semibold text-foreground">{message}</p>
        {action && <p className="text-xs text-muted-foreground">{action}</p>}
      </CardContent>
    </Card>
  );
}

function RequestCard({ request, footer }: { request: RequestItem; footer?: ReactNode }) {
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

        {footer}
      </CardContent>
    </Card>
  );
}

export function UserRequestsView() {
  const user = useAuth((state) => state.user);
  const navigate = useNav((state) => state.navigate);
  const credits = useCredits((state) => state.credits);
  const fetchCredits = useCredits((state) => state.fetch);
  const [services, setServices] = useState<Service[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [pharmacies, setPharmacies] = useState<PharmacyOption[]>([]);
  const [medications, setMedications] = useState<MedicationOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    requestType: "confirm_availability",
    pharmacyId: "",
    medicationId: "",
    userMessage: "",
    requestedQuantity: "",
    preferredResponse: "Notification SABLIN",
  });

  const selectedService = useMemo(() => services.find((service) => service.id === form.requestType), [form.requestType, services]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [servicesRes, requestsRes, pharmaciesRes, medicationsRes] = await Promise.all([
        fetch("/api/user-services"),
        fetch("/api/user-requests"),
        fetch("/api/pharmacies"),
        fetch("/api/medications?limit=80"),
      ]);
      const servicesData = await servicesRes.json();
      const requestsData = requestsRes.ok ? await requestsRes.json() : { requests: [] };
      const pharmaciesData = await pharmaciesRes.json();
      const medicationsData = await medicationsRes.json();
      const nextServices = (servicesData.services ?? []).filter((service: Service) => manualServiceIds.includes(service.id));
      setServices(nextServices);
      setRequests(requestsData.requests ?? []);
      setPharmacies(pharmaciesData);
      setMedications(medicationsData);
      setForm((current) => ({
        ...current,
        requestType: current.requestType || nextServices[0]?.id || "confirm_availability",
        pharmacyId: current.pharmacyId || pharmaciesData[0]?.id || "",
        medicationId: current.medicationId || medicationsData[0]?.id || "",
      }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Chargement impossible.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    if (!selectedService) return;
    if (!user) {
      navigate("auth", { authMode: "login" });
      return;
    }
    if (!form.pharmacyId) {
      toast.error("Sélectionnez une pharmacie.");
      return;
    }
    if (selectedService.requiresMedication && !form.medicationId) {
      toast.error("Sélectionnez un médicament pour cette demande.");
      return;
    }
    if (credits < selectedService.creditCost) {
      toast.error("Solde insuffisant. Rechargez vos crédits SABLIN pour continuer.");
      navigate("wallet");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/user-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          medicationId: form.medicationId || null,
          idempotencyKey: makeIdempotency("user-request"),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Demande impossible.");
      toast.success(data?.reused ? "Demande déjà enregistrée." : "Demande transmise à la pharmacie.");
      setForm((current) => ({ ...current, userMessage: "", requestedQuantity: "" }));
      await Promise.all([load(), fetchCredits()]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Demande impossible.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <EmptyPanel message="Connectez-vous pour suivre vos demandes envoyées aux pharmacies." action="Les coûts sont toujours affichés avant validation. Aucun crédit n’est débité sans confirmation." />
        <Button className="mt-4 bg-brand text-white hover:bg-brand-dark" onClick={() => navigate("auth", { authMode: "login" })}>
          Se connecter
        </Button>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge className="mb-2 border border-brand/25 bg-brand-light text-brand-dark">Demandes sécurisées</Badge>
          <h1 className="text-2xl font-bold tracking-normal text-foreground sm:text-3xl">Mes demandes pharmacies</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Conseil, confirmation de disponibilité ou prix : la pharmacie reçoit une demande tracée après validation de vos crédits SABLIN.
          </p>
        </div>
        <Button variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={() => navigate("wallet")}>
          <Coins className="size-4" /> Solde : {credits} crédit{credits > 1 ? "s" : ""}
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.45fr)]">
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="size-5 text-brand" />
              Nouvelle demande
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="space-y-2">
                <Label>Service</Label>
                <Select value={form.requestType} onValueChange={(value) => setForm((current) => ({ ...current, requestType: value }))}>
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.shortLabel} — {service.creditCost} crédit{service.creditCost > 1 ? "s" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Pharmacie</Label>
                <Select value={form.pharmacyId} onValueChange={(value) => setForm((current) => ({ ...current, pharmacyId: value }))}>
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder="Choisir une pharmacie" />
                  </SelectTrigger>
                  <SelectContent>
                    {pharmacies.map((pharmacy) => (
                      <SelectItem key={pharmacy.id} value={pharmacy.id}>
                        {pharmacy.name} — {pharmacy.commune}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Médicament concerné</Label>
              <Select value={form.medicationId} onValueChange={(value) => setForm((current) => ({ ...current, medicationId: value }))}>
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Choisir un médicament" />
                </SelectTrigger>
                <SelectContent>
                  {medications.map((medication) => (
                    <SelectItem key={medication.id} value={medication.id}>
                      {medication.name} — {medication.dosage}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Quantité souhaitée</Label>
                <Input value={form.requestedQuantity} onChange={(event) => setForm((current) => ({ ...current, requestedQuantity: event.target.value }))} placeholder="Ex. 2 boîtes" className="bg-white" />
              </div>
              <div className="space-y-2">
                <Label>Réponse souhaitée</Label>
                <Input value={form.preferredResponse} onChange={(event) => setForm((current) => ({ ...current, preferredResponse: event.target.value }))} className="bg-white" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Message à la pharmacie</Label>
              <Textarea value={form.userMessage} onChange={(event) => setForm((current) => ({ ...current, userMessage: event.target.value }))} placeholder="Donnez le contexte utile sans partager de données médicales sensibles." className="min-h-24 bg-white" />
            </div>

            <div className="rounded-lg border border-brand/20 bg-brand-light p-3 text-sm text-brand-dark">
              <p className="font-bold">Coût avant validation : {selectedService ? costText(selectedService.creditCost) : "Service non sélectionné"}</p>
              <p className="mt-1 text-xs">1 crédit = 100 FCFA. Aucun crédit n’est débité sans confirmation serveur.</p>
            </div>

            <Button className="w-full bg-brand text-white hover:bg-brand-dark" onClick={submit} disabled={submitting || loading}>
              {submitting ? "Transmission..." : selectedService ? `Envoyer la demande — ${selectedService.creditCost} crédit${selectedService.creditCost > 1 ? "s" : ""}` : "Envoyer"}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-foreground">Suivi des demandes</h2>
              <p className="text-sm text-muted-foreground">Réponses, litiges et remboursements sont conservés dans l’historique.</p>
            </div>
            <Button variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={load}>
              <RefreshCw className="size-4" /> Actualiser
            </Button>
          </div>
          {requests.length === 0 ? (
            <EmptyPanel message="Aucune demande envoyée pour le moment." action="Créez une demande pour confirmer une disponibilité, un prix ou obtenir un conseil." />
          ) : (
            requests.map((request) => <RequestCard key={request.id} request={request} />)
          )}
        </div>
      </div>
    </section>
  );
}

