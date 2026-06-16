"use client";

import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Crown,
  Share2,
  MapPin,
  Pill,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FullLoader } from "@/components/shared/loader";
import { AlertMessage } from "@/components/shared/alert-message";
import { useNav } from "@/store/nav";
import { useAuth } from "@/store/auth";
import { formatFCFA } from "@/lib/format";
import type { EstimateResult } from "@/lib/types";

export function PrescriptionResultView() {
  const { params, navigate } = useNav();
  const { premium } = useAuth();

  const [estimate, setEstimate] = useState<EstimateResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const estimateItems = params.estimateItems;

  useEffect(() => {
    const items = estimateItems ?? [];
    if (!items.length) {
      navigate("prescription");
      return;
    }
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/prescription/estimate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error ?? "Échec de l'estimation.");
        }
        const data: EstimateResult = await res.json();
        if (!cancelled) setEstimate(data);
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "Erreur lors de l'estimation."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    const t = setTimeout(() => {
      void run();
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [estimateItems, navigate]);

  const handleShare = async () => {
    if (!estimate) return;
    const text = `Mon estimation d'ordonnance SABLIN PHARMA : ${formatFCFA(
      estimate.totalMin
    )} — ${formatFCFA(estimate.totalMax)} (${estimate.lines.length} médicament(s)).`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: "Estimation SABLIN PHARMA",
          text,
        });
      } else if (
        typeof navigator !== "undefined" &&
        navigator.clipboard
      ) {
        await navigator.clipboard.writeText(text);
        toast.success("Résultat copié dans le presse-papiers.");
      } else {
        toast.info("Le partage n'est pas disponible sur cet appareil.");
      }
    } catch {
      // User cancelled or unsupported — silent
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate("prescription")}
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-brand"
        >
          <ChevronLeft className="size-4" /> Ordonnance
        </button>
        <FullLoader label="Calcul de votre estimation en cours..." />
      </div>
    );
  }

  // Error state
  if (error || !estimate) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate("prescription")}
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-brand"
        >
          <ChevronLeft className="size-4" /> Ordonnance
        </button>
        <AlertMessage variant="error" title="Estimation indisponible">
          {error ??
            "Nous n'avons pas pu calculer votre estimation. Veuillez réessayer."}
        </AlertMessage>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button
            className="bg-brand-gradient text-white hover:opacity-90"
            onClick={() => navigate("prescription")}
          >
            <ChevronLeft className="size-4" />
            Retour à l&apos;ordonnance
          </Button>
          <Button
            variant="outline"
            className="border-border/70"
            onClick={() => navigate("home")}
          >
            Retour à l&apos;accueil
          </Button>
        </div>
      </div>
    );
  }

  const totalUnits = estimate.lines.reduce(
    (sum, line) => sum + line.quantity,
    0
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back link */}
      <button
        onClick={() => navigate("prescription")}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-brand"
      >
        <ChevronLeft className="size-4" /> Ordonnance
      </button>

      {/* Success header */}
      <div className="flex items-start gap-4">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-brand-light ring-8 ring-brand-light/30">
          <CheckCircle2 className="size-8 text-brand" />
        </span>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Estimation calculée
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Voici le coût estimé de votre ordonnance, basé sur les prix réels
            en pharmacie à Abidjan.
          </p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px] lg:gap-8">
        {/* LEFT — Detail per medication */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-foreground">
              Détail par médicament
            </h2>
            <Badge
              variant="secondary"
              className="bg-brand-light text-brand-dark"
            >
              {estimate.lines.length} médicament
              {estimate.lines.length > 1 ? "s" : ""}
            </Badge>
          </div>

          {estimate.lines.map((line, idx) => (
            <Card
              key={`${line.medication.slug}-${idx}`}
              className="border-border/70 p-5 shadow-premium transition-transform hover:-translate-y-0.5 hover:border-brand/30"
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand">
                    <Pill className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-extrabold leading-tight text-foreground">
                        {line.medication.name}
                      </h3>
                      {line.medication.requiresRx && (
                        <Badge className="border-0 bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                          Ordonnance
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {line.medication.form}
                      {line.medication.form ? " · " : ""}
                      {line.medication.dosage}
                      {line.medication.dosage ? " · " : ""}
                      {line.medication.packSize}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="shrink-0 border-brand/30 bg-brand-light/40 text-brand-dark"
                >
                  x{line.quantity}
                </Badge>
              </div>

              <Separator className="my-4" />

              {/* Price details */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Prix unitaire
                  </p>
                  <p className="mt-0.5 font-semibold text-foreground">
                    {formatFCFA(line.unitMin)} — {formatFCFA(line.unitMax)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Total ligne
                  </p>
                  <p className="mt-0.5 font-extrabold text-brand-dark">
                    {formatFCFA(line.lineMin)} — {formatFCFA(line.lineMax)}
                  </p>
                </div>
              </div>

              {/* Stock info */}
              <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="size-3.5 text-brand" />
                <span>
                  {line.pharmacyCount} pharmacie
                  {line.pharmacyCount > 1 ? "s" : ""} en stock
                </span>
              </div>
            </Card>
          ))}
        </div>

        {/* RIGHT — Récapitulatif (sticky) */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <Card className="border-border/70 p-6 shadow-premium-lg">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-lg font-extrabold text-foreground">
                Récapitulatif de l&apos;ordonnance
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 space-y-3">
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Médicaments</span>
                  <span className="font-semibold text-foreground">
                    {estimate.lines.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Unités totales
                  </span>
                  <span className="font-semibold text-foreground">
                    {totalUnits}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Pharmacies avec tout en stock
                  </span>
                  <span className="font-semibold text-foreground">
                    {estimate.availablePharmacies}
                  </span>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Fourchette totale estimée
                </p>
                <p className="mt-1 text-3xl font-extrabold leading-tight text-brand-dark">
                  {formatFCFA(estimate.totalMin)}
                  <span className="mx-1.5 text-xl text-muted-foreground">
                    —
                  </span>
                  {formatFCFA(estimate.totalMax)}
                </p>
              </div>

              <p className="text-xs leading-relaxed text-muted-foreground">
                Fourchette basée sur les prix réels en pharmacie. Les prix
                peuvent varier selon le point de vente.
              </p>
            </CardContent>
          </Card>

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            <Button
              className="w-full bg-brand-gradient text-white hover:opacity-90"
              size="lg"
              onClick={() => navigate("pharmacies")}
            >
              <MapPin className="size-4" />
              Voir les pharmacies dispos
              <ChevronRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              className="w-full border-border/70"
              onClick={() => navigate("prescription")}
            >
              <ChevronLeft className="size-4" />
              Nouvelle estimation
            </Button>
            <Button
              variant="outline"
              className="w-full border-border/70"
              onClick={handleShare}
            >
              <Share2 className="size-4" />
              Partager le résultat
            </Button>
          </div>

          {/* Premium upsell */}
          {!premium && (
            <Card className="border-amber-500/30 bg-gradient-to-br from-amber-50 to-amber-100/40 p-5">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-white">
                  <Crown className="size-5" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-extrabold text-amber-900">
                    Estimations illimitées avec Premium
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-amber-800/80">
                    Profitez d&apos;estimations sans limite, d&apos;alertes de
                    prix sur vos favoris et d&apos;une assistance prioritaire.
                  </p>
                  <Button
                    size="sm"
                    className="mt-3 w-full bg-gradient-to-br from-amber-400 to-amber-500 text-white hover:opacity-90"
                    onClick={() => navigate("subscription")}
                  >
                    <Crown className="size-3.5" />
                    Découvrir Premium
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Footer disclaimer */}
      <div className="mt-10 flex items-start gap-2 rounded-xl border border-border/60 bg-muted/30 p-4">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          SABLIN PHARMA est une plateforme d&apos;information. Les prix sont
          indicatifs et peuvent varier. Aucune vente en ligne.
        </p>
      </div>
    </div>
  );
}
