"use client";

import { useState, useMemo, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Smartphone,
  Lock,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  Crown,
  XCircle,
  AlertCircle,
  Clock,
  Zap,
  Receipt,
  Copy,
  ArrowRight,
  Coins,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Heading, Eyebrow, Muted, Price } from "@/components/ui/typography";
import { CreditCost } from "@/components/shared/credit-cost";
import { useNav } from "@/store/nav";
import { useAuth } from "@/store/auth";
import { useCredits, CREDIT_PACKS } from "@/store/credits";
import { formatFCFA, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type Provider = "wave" | "orange" | "mtn" | "moov";
type PaymentState = "idle" | "pending" | "success" | "failed" | "cancelled";

const PROVIDERS: {
  id: Provider;
  label: string;
  short: string;
  bgClass: string;
  textClass: string;
  desc: string;
}[] = [
  {
    id: "wave",
    label: "Wave",
    short: "W",
    bgClass: "bg-sky-500",
    textClass: "text-white",
    desc: "Transfert instantané, sans frais",
  },
  {
    id: "orange",
    label: "Orange Money",
    short: "OM",
    bgClass: "bg-orange-500",
    textClass: "text-white",
    desc: "Orange Money, partout en CI",
  },
  {
    id: "mtn",
    label: "MTN Money",
    short: "MTN",
    bgClass: "bg-yellow-400",
    textClass: "text-black",
    desc: "MTN MoMo, rapide et sûr",
  },
  {
    id: "moov",
    label: "Moov Money",
    short: "Moov",
    bgClass: "bg-blue-600",
    textClass: "text-white",
    desc: "Moov Money, facile et fiable",
  },
];

const PRICE = 500;
const PASS_PRICE = 300;
type PaymentMode = "premium" | "recharge" | "pass";

// Fictive payment history
const PAYMENT_HISTORY = [
  {
    date: "2026-06-16",
    formule: "Premium mensuel",
    montant: 500,
    moyen: "Orange Money",
    statut: "success" as const,
    reference: "SPL-202606161435",
  },
  {
    date: "2026-05-16",
    formule: "Premium mensuel",
    montant: 500,
    moyen: "Wave",
    statut: "success" as const,
    reference: "SPL-202605160912",
  },
  {
    date: "2026-04-16",
    formule: "Premium mensuel",
    montant: 500,
    moyen: "MTN Money",
    statut: "success" as const,
    reference: "SPL-202604161820",
  },
  {
    date: "2026-03-16",
    formule: "Premium mensuel",
    montant: 500,
    moyen: "Moov Money",
    statut: "failed" as const,
    reference: "SPL-202603161104",
  },
];

export function PaymentView() {
  const { navigate, params } = useNav();
  const { user, premium, setPremium, fetchMe } = useAuth();
  const { recharge, fetch: fetchCredits, hasPass } = useCredits();

  // Mode dérivé des params (wallet → payment) ou du state local
  const [mode, setMode] = useState<PaymentMode>(
    params.packAmount ? "recharge" : params.passOrdonnance ? "pass" : "premium"
  );
  const [selectedPackAmount, setSelectedPackAmount] = useState<number>(
    params.packAmount ?? 500
  );

  const [provider, setProvider] = useState<Provider>("orange");
  const [phone, setPhone] = useState("");
  const [holderName, setHolderName] = useState(user?.name ?? "");
  const [state, setState] = useState<PaymentState>("idle");
  const [showSuccess, setShowSuccess] = useState(false);
  const [transactionRef, setTransactionRef] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  const formattedPhone = useMemo(() => {
    const digits = phone.replace(/\D/g, "").slice(0, 10);
    return digits.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
  }, [phone]);

  // Montant et libellé dynamiques selon le mode
  const currentAmount = useMemo(() => {
    if (mode === "recharge") return selectedPackAmount;
    if (mode === "pass") return PASS_PRICE;
    return PRICE;
  }, [mode, selectedPackAmount]);

  const currentLabel = useMemo(() => {
    if (mode === "recharge") {
      const pack = CREDIT_PACKS.find((p) => p.amount === selectedPackAmount);
      return pack ? `${pack.label} (${pack.credits} crédits)` : "Recharge de crédits";
    }
    if (mode === "pass") return "Pass Ordonnance";
    return "Abonnement Premium · 1 mois";
  }, [mode, selectedPackAmount]);

  const currentShortLabel = useMemo(() => {
    if (mode === "recharge") return "Recharge de crédits";
    if (mode === "pass") return "Pass Ordonnance";
    return "Abonnement Premium";
  }, [mode]);

  // Not connected
  if (!user) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-md items-center px-4 py-12">
        <Card className="w-full border-border/70 p-8 text-center shadow-premium">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-light text-brand">
            <Lock className="size-7" />
          </span>
          <h1 className="mt-5 text-xl font-extrabold text-foreground sm:text-2xl">
            Connectez-vous pour continuer
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Vous devez être connecté pour effectuer un paiement sur SABLIN PHARMA.
          </p>
          <Button
            className="mt-6 w-full bg-brand text-white hover:bg-brand-dark"
            size="lg"
            onClick={() => navigate("auth", { authMode: "login" })}
          >
            Se connecter
          </Button>
        </Card>
      </div>
    );
  }

  const handlePay = async () => {
    // Validation
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) {
      toast.error("Numéro de téléphone invalide", {
        description: "Saisissez un numéro ivoirien à 10 chiffres (07 XX XX XX XX).",
      });
      return;
    }
    if (holderName.trim().length < 3) {
      toast.error("Nom du titulaire manquant", {
        description: "Saisissez le nom du titulaire du compte.",
      });
      return;
    }

    setState("pending");
    try {
      if (mode === "recharge") {
        const result = await recharge(selectedPackAmount, provider);
        if (!result.success) {
          throw new Error(result.error ?? "Échec de la recharge");
        }
        const ref = `SPL-RECHARGE-${Date.now()}`;
        const now = new Date();
        setTransactionRef(ref);
        setPaymentDate(now.toISOString());
        setExpiryDate("");
        setState("success");
        setShowSuccess(true);
        toast.success("Recharge réussie !", {
          description: `${CREDIT_PACKS.find((p) => p.amount === selectedPackAmount)?.credits ?? 0} crédits ajoutés à votre compte.`,
        });
      } else if (mode === "pass") {
        const res = await fetch("/api/credits/pass", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error ?? "Échec de l'achat du Pass");
        }
        await fetchCredits();
        const ref = `SPL-PASS-${Date.now()}`;
        const now = new Date();
        const exp = new Date();
        exp.setDate(exp.getDate() + 30);
        setTransactionRef(ref);
        setPaymentDate(now.toISOString());
        setExpiryDate(exp.toISOString());
        setState("success");
        setShowSuccess(true);
        toast.success("Pass Ordonnance activé !", {
          description: "Vos estimations d'ordonnance sont désormais gratuites.",
        });
      } else {
        // Premium (comportement existant)
        const res = await fetch("/api/subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method: "mobile_money",
            provider,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error ?? "Échec du paiement");
        }

        const result = await res.json();
        const ref = `SPL-${Date.now()}`;
        const now = new Date();
        const exp = new Date();
        exp.setMonth(exp.getMonth() + 1);

        setTransactionRef(ref);
        setPaymentDate(now.toISOString());
        setExpiryDate(exp.toISOString());
        setPremium(true);
        await fetchMe();
        setState("success");
        setShowSuccess(true);
        toast.success("Paiement réussi ! Abonnement Premium activé", {
          description: "Bienvenue dans l'expérience Premium SABLIN PHARMA.",
        });
        void result;
      }
    } catch (err) {
      setState("failed");
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      toast.error("Paiement échoué", { description: msg });
    }
  };

  const handleCancel = () => {
    setState("cancelled");
    toast.info("Transaction annulée", {
      description: "Vous pouvez réessayer à tout moment.",
    });
  };

  const resetState = () => {
    setState("idle");
    setPhone("");
  };

  return (
    <div className="flex flex-col">
      {/* ============ HEADER ============ */}
      <section className="bg-brand-light">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <button
            onClick={() => navigate(mode === "premium" ? "subscription" : "wallet")}
            className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-brand"
          >
            <ChevronLeft className="size-4" />
            {mode === "premium" ? "Abonnement" : "Mon portefeuille"}
          </button>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-brand text-white shadow-premium">
              {mode === "premium" ? (
                <Crown className="size-6" />
              ) : mode === "pass" ? (
                <Receipt className="size-6" />
              ) : (
                <Coins className="size-6" />
              )}
            </span>
            <div>
              <Eyebrow className="text-brand-dark">Paiement sécurisé</Eyebrow>
              <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-foreground sm:text-3xl">
                {mode === "premium"
                  ? "Paiement de l'abonnement Premium"
                  : mode === "pass"
                    ? "Achat du Pass Ordonnance"
                    : "Recharge de vos crédits"}
              </h1>
            </div>
          </div>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
            {mode === "premium" ? (
              <>
                Activez votre accès aux fonctionnalités avancées : recherche illimitée,
                estimation d&apos;ordonnance, pharmacies de garde, favoris, historique et
                alertes. Simple, rapide et sécurisé.
              </>
            ) : mode === "pass" ? (
              <>
                Profitez d&apos;estimations d&apos;ordonnance gratuites pendant 30 jours.
                Idéal pour un usage occasionnel sans engagement.
              </>
            ) : (
              <>
                Rechargez vos crédits quand vous voulez. Aucun abonnement obligatoire —
                vous payez uniquement ce que vous consommez.
              </>
            )}
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {/* ============ SÉLECTION DU MODE ============ */}
        <section className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-brand-light text-brand">
              <Zap className="size-4" />
            </span>
            <h2 className="text-base font-bold text-foreground">
              Que souhaitez-vous payer ?
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {/* Premium card */}
            <button
              type="button"
              onClick={() => setMode("premium")}
              className={cn(
                "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all",
                mode === "premium"
                  ? "border-brand bg-brand-light/40 ring-2 ring-brand/20"
                  : "border-border/70 hover:border-brand/30 hover:bg-accent/30"
              )}
              aria-pressed={mode === "premium"}
            >
              <span className="flex size-9 items-center justify-center rounded-xl bg-amber-500 text-white">
                <Crown className="size-4" />
              </span>
              <div>
                <p className="text-sm font-bold text-foreground">Abonnement Premium</p>
                <p className="text-[11px] text-muted-foreground">Accès complet · 1 mois</p>
              </div>
              <p className="mt-1 text-base font-extrabold text-brand-dark">{formatFCFA(PRICE)}</p>
              {mode === "premium" && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand">
                  <CheckCircle2 className="size-3" /> Sélectionné
                </span>
              )}
            </button>

            {/* Pass Ordonnance card */}
            <button
              type="button"
              onClick={() => setMode("pass")}
              disabled={hasPass}
              className={cn(
                "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all",
                mode === "pass"
                  ? "border-brand bg-brand-light/40 ring-2 ring-brand/20"
                  : "border-border/70 hover:border-brand/30 hover:bg-accent/30",
                hasPass && "opacity-60"
              )}
              aria-pressed={mode === "pass"}
            >
              <span className="flex size-9 items-center justify-center rounded-xl bg-brand text-white">
                <Receipt className="size-4" />
              </span>
              <div>
                <p className="text-sm font-bold text-foreground">Pass Ordonnance</p>
                <p className="text-[11px] text-muted-foreground">Estimations gratuites · 30 jours</p>
              </div>
              <p className="mt-1 text-base font-extrabold text-brand-dark">{formatFCFA(PASS_PRICE)}</p>
              {hasPass ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-success">
                  <CheckCircle2 className="size-3" /> Déjà actif
                </span>
              ) : mode === "pass" ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand">
                  <CheckCircle2 className="size-3" /> Sélectionné
                </span>
              ) : null}
            </button>

            {/* Recharge card */}
            <button
              type="button"
              onClick={() => setMode("recharge")}
              className={cn(
                "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all",
                mode === "recharge"
                  ? "border-brand bg-brand-light/40 ring-2 ring-brand/20"
                  : "border-border/70 hover:border-brand/30 hover:bg-accent/30"
              )}
              aria-pressed={mode === "recharge"}
            >
              <span className="flex size-9 items-center justify-center rounded-xl bg-brand text-white">
                <Coins className="size-4" />
              </span>
              <div>
                <p className="text-sm font-bold text-foreground">Recharger mes crédits</p>
                <p className="text-[11px] text-muted-foreground">Sans engagement · À la carte</p>
              </div>
              <p className="mt-1 text-base font-extrabold text-brand-dark">
                dès {formatFCFA(CREDIT_PACKS[0].amount)}
              </p>
              {mode === "recharge" && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand">
                  <CheckCircle2 className="size-3" /> Sélectionné
                </span>
              )}
            </button>
          </div>
        </section>

        {/* ============ SECTION RECHARGER MES CRÉDITS (visible si mode=recharge) ============ */}
        {mode === "recharge" && (
          <section className="mb-6">
            <Card className="border-border/70 p-5 shadow-premium sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-brand-light text-brand">
                  <Coins className="size-4" />
                </span>
                <div>
                  <h2 className="text-base font-bold text-foreground">Recharger mes crédits</h2>
                  <p className="text-[11px] text-muted-foreground">
                    Rechargez vos crédits quand vous voulez. Aucun abonnement obligatoire.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {CREDIT_PACKS.map((pack) => {
                  const active = selectedPackAmount === pack.amount;
                  return (
                    <button
                      key={pack.amount}
                      type="button"
                      onClick={() => setSelectedPackAmount(pack.amount)}
                      className={cn(
                        "relative flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition-all",
                        active
                          ? "border-brand bg-brand-light/40 ring-2 ring-brand/20"
                          : "border-border/70 hover:border-brand/30 hover:bg-accent/30"
                      )}
                      aria-pressed={active}
                    >
                      {pack.popular && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-bold text-white">
                          Populaire
                        </span>
                      )}
                      <span className="flex size-9 items-center justify-center rounded-xl bg-brand-light text-brand">
                        <Coins className="size-4" />
                      </span>
                      <p className="text-sm font-extrabold text-foreground">
                        {pack.credits} crédits
                      </p>
                      <p className="text-[11px] text-muted-foreground">{pack.label}</p>
                      <p className="mt-1 text-sm font-bold text-brand-dark">
                        {formatFCFA(pack.amount)}
                      </p>
                      {active && (
                        <span className="mt-0.5 inline-flex items-center gap-0.5 text-[10px] font-bold text-brand">
                          <CheckCircle2 className="size-3" /> Choisi
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </Card>
          </section>
        )}

        {/* ============ SECTION PASS ORDONNANCE (visible si mode=pass) ============ */}
        {mode === "pass" && (
          <section className="mb-6">
            <Card className="border-brand/20 p-5 shadow-premium sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand text-white">
                    <Receipt className="size-6" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-foreground">Pass Ordonnance</h2>
                      <Badge className="border-0 bg-brand text-white">
                        {formatFCFA(PASS_PRICE)}
                      </Badge>
                    </div>
                    <p className="mt-1 max-w-md text-sm text-muted-foreground">
                      Profitez d&apos;estimations d&apos;ordonnance gratuites et illimitées
                      pendant 30 jours. Idéal pour un usage occasionnel sans souscrire à
                      l&apos;abonnement Premium.
                    </p>
                    {hasPass && (
                      <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-success-light px-2 py-0.5 text-[11px] font-bold text-success">
                        <CheckCircle2 className="size-3" /> Pass déjà actif sur votre compte
                      </p>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <CreditCost cost={0} />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Soit 0 crédit par estimation
                  </p>
                </div>
              </div>
            </Card>
          </section>
        )}

        {/* ============ PAYMENT STATE BANNERS ============ */}
        {state === "pending" && (
          <StateBanner
            icon={Loader2}
            iconClass="animate-spin text-brand"
            title="Paiement en attente"
            message="Veuillez patienter pendant le traitement de votre paiement..."
            tone="info"
          />
        )}
        {state === "failed" && (
          <StateBanner
            icon={XCircle}
            iconClass="text-danger"
            title="Paiement échoué"
            message="Le paiement n'a pas pu aboutir. Vérifiez votre solde et réessayez."
            tone="danger"
            action={{ label: "Réessayer", onClick: resetState }}
          />
        )}
        {state === "cancelled" && (
          <StateBanner
            icon={AlertCircle}
            iconClass="text-warning-foreground"
            title="Transaction annulée"
            message="Vous avez annulé la transaction. Vous pouvez réessayer quand vous voulez."
            tone="warning"
            action={{ label: "Reprendre", onClick: resetState }}
          />
        )}

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px] lg:gap-8">
          {/* LEFT — Payment form */}
          <div className="space-y-6">
            {/* Moyens de paiement */}
            <Card className="border-border/70 p-5 shadow-premium sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-brand-light text-brand">
                  <Smartphone className="size-4" />
                </span>
                <h2 className="text-base font-bold text-foreground">
                  Choisissez votre moyen de paiement
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {PROVIDERS.map((p) => {
                  const active = provider === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setProvider(p.id)}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all",
                        active
                          ? "border-brand bg-brand-light/40 ring-2 ring-brand/20"
                          : "border-border/70 hover:border-brand/30 hover:bg-accent/30"
                      )}
                      aria-pressed={active}
                    >
                      <span
                        className={cn(
                          "flex size-11 items-center justify-center rounded-xl text-xs font-extrabold shadow-sm",
                          p.bgClass,
                          p.textClass
                        )}
                      >
                        {p.short}
                      </span>
                      <span className="text-[11px] font-bold leading-tight text-foreground">
                        {p.label}
                      </span>
                      {active && (
                        <CheckCircle2 className="size-3.5 text-brand" />
                      )}
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Formulaire de paiement */}
            <Card className="border-border/70 p-5 shadow-premium sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-brand-light text-brand">
                  <CreditCard className="size-4" />
                </span>
                <h2 className="text-base font-bold text-foreground">
                  Informations de paiement
                </h2>
              </div>

              <div className="space-y-4">
                {/* Opérateur sélectionné (read-only display) */}
                <div className="space-y-1.5">
                  <Label>Opérateur sélectionné</Label>
                  <div className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                    <span
                      className={cn(
                        "flex size-7 items-center justify-center rounded-lg text-[10px] font-extrabold",
                        PROVIDERS.find((p) => p.id === provider)?.bgClass,
                        PROVIDERS.find((p) => p.id === provider)?.textClass
                      )}
                    >
                      {PROVIDERS.find((p) => p.id === provider)?.short}
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {PROVIDERS.find((p) => p.id === provider)?.label}
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {PROVIDERS.find((p) => p.id === provider)?.desc}
                    </span>
                  </div>
                </div>

                {/* Numéro de téléphone */}
                <div className="space-y-1.5">
                  <Label htmlFor="phone">
                    Numéro de téléphone Mobile Money <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Smartphone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="phone"
                      inputMode="tel"
                      placeholder="07 00 00 00 00"
                      value={formattedPhone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-11 pl-9 text-base tracking-wide"
                      maxLength={19}
                      disabled={state === "pending"}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Saisissez le numéro ivoirien lié à votre compte{" "}
                    {PROVIDERS.find((p) => p.id === provider)?.label}.
                  </p>
                </div>

                {/* Nom du titulaire */}
                <div className="space-y-1.5">
                  <Label htmlFor="holder">
                    Nom du titulaire <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="holder"
                    placeholder="Nom complet du titulaire"
                    value={holderName}
                    onChange={(e) => setHolderName(e.target.value)}
                    className="h-11"
                    disabled={state === "pending"}
                  />
                </div>

                {/* Montant (read-only) */}
                <div className="space-y-1.5">
                  <Label>Montant à payer</Label>
                  <div className="flex items-center justify-between rounded-lg border border-brand/20 bg-brand-light/30 px-3 py-2.5">
                    <span className="text-sm text-muted-foreground">{currentLabel}</span>
                    <Price amount={currentAmount} size="md" variant="brand" />
                  </div>
                </div>

                {/* Bouton Payer maintenant */}
                <Button
                  className="h-12 w-full bg-brand text-base font-semibold text-white shadow-premium hover:bg-brand-dark"
                  onClick={handlePay}
                  disabled={state === "pending" || (mode === "pass" && hasPass)}
                >
                  {state === "pending" ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Traitement en cours…
                    </>
                  ) : mode === "pass" && hasPass ? (
                    <>Pass déjà actif</>
                  ) : (
                    <>
                      <Lock className="size-4" />
                      Payer {formatFCFA(currentAmount)}
                    </>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  className="w-full text-muted-foreground"
                  onClick={handleCancel}
                  disabled={state === "pending"}
                >
                  Annuler
                </Button>
              </div>
            </Card>

            {/* Bloc sécurité */}
            <Card className="border-brand/20 bg-brand-light/20 p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-brand" />
                <h3 className="text-sm font-bold text-foreground">
                  Paiement sécurisé et protégé
                </h3>
              </div>
              <ul className="mt-3 space-y-2">
                <SecurityItem text="Paiement sécurisé — toutes les transactions sont chiffrées." />
                <SecurityItem text="Vos informations sont protégées et ne sont jamais partagées." />
                <SecurityItem text="Activation automatique après paiement confirmé." />
              </ul>
              <p className="mt-3 rounded-lg bg-background/60 px-3 py-2 text-[11px] text-muted-foreground">
                Environnement de démonstration — aucun débit réel n&apos;est effectué.
              </p>
            </Card>
          </div>

          {/* RIGHT — Récapitulatif (sticky) */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <Card className="border-border/70 p-5 shadow-premium sm:p-6">
              <div className="flex items-center gap-2">
                <Receipt className="size-4 text-brand" />
                <h2 className="text-base font-bold text-foreground">
                  Récapitulatif
                </h2>
              </div>

              <div className="mt-4 flex items-start gap-3 rounded-xl bg-brand-light/40 p-4">
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-xl text-white",
                    mode === "premium" ? "bg-amber-500" : "bg-brand"
                  )}
                >
                  {mode === "premium" ? (
                    <Crown className="size-5" />
                  ) : mode === "pass" ? (
                    <Receipt className="size-5" />
                  ) : (
                    <Coins className="size-5" />
                  )}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground">{currentShortLabel}</p>
                  <p className="text-xs text-muted-foreground">
                    {mode === "premium"
                      ? "Formule mensuelle · Activation immédiate"
                      : mode === "pass"
                        ? "Validité 30 jours · Activation immédiate"
                        : `${CREDIT_PACKS.find((p) => p.amount === selectedPackAmount)?.credits ?? 0} crédits · Activation immédiate`}
                  </p>
                </div>
                <Badge className="border-0 bg-success text-white">
                  <CheckCircle2 className="size-3" /> À payer
                </Badge>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Formule</span>
                  <span className="font-semibold text-foreground">{currentShortLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Montant</span>
                  <span className="font-semibold text-foreground">{formatFCFA(currentAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Durée</span>
                  <span className="font-semibold text-foreground">
                    {mode === "premium" ? "1 mois" : mode === "pass" ? "30 jours" : "Illimité"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frais</span>
                  <span className="font-semibold text-foreground">0 FCFA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Statut</span>
                  <span className="font-semibold text-foreground">En attente</span>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex items-baseline justify-between">
                <span className="text-base font-bold text-foreground">Total à payer</span>
                <Price amount={currentAmount} size="lg" variant="brand" />
              </div>

              <Button
                className="mt-4 w-full bg-brand text-white hover:bg-brand-dark"
                size="lg"
                onClick={handlePay}
                disabled={state === "pending" || (mode === "pass" && hasPass)}
              >
                {state === "pending" ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Traitement…
                  </>
                ) : mode === "pass" && hasPass ? (
                  <>Pass déjà actif</>
                ) : (
                  <>
                    <Lock className="size-4" /> Payer {formatFCFA(currentAmount)}
                  </>
                )}
              </Button>

              <Button
                variant="ghost"
                className="mt-2 w-full text-muted-foreground"
                onClick={() => navigate(mode === "premium" ? "subscription" : "wallet")}
                disabled={state === "pending"}
              >
                <ChevronLeft className="size-4" /> {mode === "premium" ? "Modifier l'offre" : "Retour au portefeuille"}
              </Button>
            </Card>
          </div>
        </div>

        {/* ============ HISTORIQUE DES PAIEMENTS ============ */}
        <section className="mt-12">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-brand-light text-brand">
              <Receipt className="size-5" />
            </span>
            <div>
              <Eyebrow>Transparence</Eyebrow>
              <Heading level="h2">Historique des paiements</Heading>
            </div>
          </div>

          <Card className="overflow-hidden border-border/70 py-0 shadow-card">
            <div className="overflow-x-auto scroll-thin">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-border/60 bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold">Date</th>
                    <th className="px-5 py-3.5 font-semibold">Formule</th>
                    <th className="px-5 py-3.5 font-semibold">Montant</th>
                    <th className="px-5 py-3.5 font-semibold">Moyen</th>
                    <th className="px-5 py-3.5 font-semibold">Statut</th>
                    <th className="px-5 py-3.5 font-semibold">Référence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {PAYMENT_HISTORY.map((row, i) => (
                    <tr key={i} className="transition-colors hover:bg-accent/30">
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {formatDate(row.date)}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-foreground">
                        {row.formule}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-brand-dark">
                        {formatFCFA(row.montant)}
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">{row.moyen}</td>
                      <td className="px-5 py-3.5">
                        {row.statut === "success" ? (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-success-light px-2 py-0.5 text-[10px] font-bold text-success">
                            <CheckCircle2 className="size-2.5" /> Réussi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-danger-light px-2 py-0.5 text-[10px] font-bold text-danger">
                            <XCircle className="size-2.5" /> Échoué
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => {
                            navigator.clipboard?.writeText(row.reference);
                            toast.success("Référence copiée");
                          }}
                          className="inline-flex items-center gap-1 font-mono text-xs text-brand hover:underline"
                        >
                          {row.reference}
                          <Copy className="size-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      </div>

      {/* ============ MODALE DE CONFIRMATION ============ */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="max-w-md border-brand/30 p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Paiement confirmé</DialogTitle>
          </DialogHeader>
          <div className="overflow-hidden rounded-xl">
            {/* Header succès */}
            <div className="relative flex flex-col items-center bg-brand px-6 py-8 text-center text-white">
              <span className="relative flex size-16 items-center justify-center rounded-full bg-white/15 ring-8 ring-white/10 animate-scale-in">
                <CheckCircle2 className="size-9 text-white" />
              </span>
              <h2 className="relative mt-4 text-xl font-extrabold">
                Paiement confirmé !
              </h2>
              <p className="relative mt-1 text-sm text-white/85">
                {mode === "premium"
                  ? "Abonnement Premium activé avec succès"
                  : mode === "pass"
                    ? "Pass Ordonnance activé avec succès"
                    : "Recharge de crédits effectuée avec succès"}
              </p>
            </div>

            {/* Détails */}
            <div className="space-y-3 p-6">
              <div className="grid grid-cols-2 gap-3">
                <DetailItem label="Montant payé" value={formatFCFA(currentAmount)} />
                <DetailItem label="Date de paiement" value={paymentDate ? formatDate(paymentDate) : "—"} />
                <DetailItem
                  label={mode === "recharge" ? "Crédits obtenus" : "Date d'expiration"}
                  value={
                    mode === "recharge"
                      ? `${CREDIT_PACKS.find((p) => p.amount === selectedPackAmount)?.credits ?? 0} crédits`
                      : expiryDate
                        ? formatDate(expiryDate)
                        : "—"
                  }
                />
                <DetailItem label="Moyen de paiement" value={PROVIDERS.find((p) => p.id === provider)?.label ?? "—"} />
              </div>

              <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  Référence de transaction
                </p>
                <div className="mt-0.5 flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-foreground">
                    {transactionRef}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(transactionRef);
                      toast.success("Référence copiée");
                    }}
                    className="text-brand hover:underline"
                  >
                    <Copy className="size-3.5" />
                  </button>
                </div>
              </div>

              <Button
                className="w-full bg-brand text-white hover:bg-brand-dark"
                size="lg"
                onClick={() => {
                  setShowSuccess(false);
                  navigate(mode === "premium" ? "profile" : "wallet");
                }}
              >
                {mode === "premium" ? (
                  <>Accéder à mon compte <ArrowRight className="size-4" /></>
                ) : (
                  <>Retour à mon portefeuille <ArrowRight className="size-4" /></>
                )}
              </Button>
              <Button
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={() => {
                  setShowSuccess(false);
                  navigate("home");
                }}
              >
                Retour à l&apos;accueil
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ============================================================
   StateBanner — bannière d'état de paiement
   ============================================================ */
function StateBanner({
  icon: Icon,
  iconClass,
  title,
  message,
  tone,
  action,
}: {
  icon: typeof Loader2;
  iconClass: string;
  title: string;
  message: string;
  tone: "info" | "danger" | "warning" | "success";
  action?: { label: string; onClick: () => void };
}) {
  const tones = {
    info: "border-brand/30 bg-brand-light/30 text-brand-dark",
    danger: "border-danger/30 bg-danger-light text-danger",
    warning: "border-warning/30 bg-warning-light text-warning-foreground",
    success: "border-success/30 bg-success-light text-success",
  };
  return (
    <div className={cn("flex items-center gap-3 rounded-xl border p-4", tones[tone])}>
      <Icon className={cn("size-6 shrink-0", iconClass)} />
      <div className="flex-1">
        <p className="text-sm font-bold">{title}</p>
        <p className="text-xs opacity-90">{message}</p>
      </div>
      {action && (
        <Button
          size="sm"
          variant="outline"
          className="border-current"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

/* ============================================================
   SecurityItem — élément de la liste sécurité
   ============================================================ */
function SecurityItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2 text-xs text-foreground/80">
      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-brand" />
      <span>{text}</span>
    </li>
  );
}

/* ============================================================
   DetailItem — détail dans la modale de confirmation
   ============================================================ */
function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/50 bg-background px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
