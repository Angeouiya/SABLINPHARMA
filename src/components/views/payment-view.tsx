"use client";

import { useEffect, useState, useMemo } from "react";
import {
  ChevronLeft,
  CreditCard,
  Smartphone,
  Lock,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
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
import {
  FCFA_PER_CREDIT,
  MAX_RECHARGE_AMOUNT,
  MIN_RECHARGE_AMOUNT,
  getRechargeCreditsForAmount,
  getRechargeLabelForAmount,
} from "@/lib/restrictions";

type Provider = "wave" | "orange" | "mtn" | "moov";
type PaymentState = "idle" | "pending" | "processing" | "success" | "failed" | "cancelled" | "expired" | "suspicious";

const PROVIDERS: {
  id: Provider;
  label: string;
  short: string;
  bgClass: string;
  textClass: string;
  desc: string;
  logoLabel: string;
}[] = [
  {
    id: "wave",
    label: "Wave CI",
    short: "W",
    bgClass: "bg-sky-500",
    textClass: "text-white",
    desc: "Choix disponible sur PayDunya",
    logoLabel: "Wave",
  },
  {
    id: "orange",
    label: "Orange Money",
    short: "OM",
    bgClass: "bg-orange-500",
    textClass: "text-white",
    desc: "Choix disponible sur PayDunya",
    logoLabel: "Orange",
  },
  {
    id: "mtn",
    label: "MTN Money",
    short: "MTN",
    bgClass: "bg-yellow-400",
    textClass: "text-black",
    desc: "Choix disponible sur PayDunya",
    logoLabel: "MTN",
  },
  {
    id: "moov",
    label: "Moov Money",
    short: "Moov",
    bgClass: "bg-blue-600",
    textClass: "text-white",
    desc: "Choix disponible sur PayDunya",
    logoLabel: "Moov",
  },
];

const PASS_PRICE = 500;
type PaymentMode = "recharge" | "pass";

// Fictive payment history
const PAYMENT_HISTORY = [
  {
    date: "2026-06-16",
    formule: "Pack Standard (6 crédits)",
    montant: 500,
    moyen: "Choisi sur PayDunya",
    statut: "success" as const,
    reference: "SPL-RECHARGE-202606161435",
  },
  {
    date: "2026-05-28",
    formule: "Pass Ordonnance Unique",
    montant: 500,
    moyen: "Choisi sur PayDunya",
    statut: "success" as const,
    reference: "SPL-PASS-202605280912",
  },
  {
    date: "2026-05-16",
    formule: "Pack Découverte (2 crédits)",
    montant: 200,
    moyen: "Choisi sur PayDunya",
    statut: "success" as const,
    reference: "SPL-RECHARGE-202605161820",
  },
  {
    date: "2026-04-30",
    formule: "Pack Plus (13 crédits)",
    montant: 1000,
    moyen: "Choisi sur PayDunya",
    statut: "failed" as const,
    reference: "SPL-RECHARGE-202604301104",
  },
];

export function PaymentView() {
  const { navigate, params } = useNav();
  const { user } = useAuth();
  const { fetch: fetchCredits, hasPass } = useCredits();

  // Mode dérivé des params (wallet → payment) ou du state local
  const [mode, setMode] = useState<PaymentMode>(
    params.passOrdonnance ? "pass" : "recharge"
  );
  const initialRechargeAmount = params.packAmount ?? 500;
  const [rechargeAmountInput, setRechargeAmountInput] = useState(
    String(initialRechargeAmount)
  );

  const [holderName, setHolderName] = useState(user?.name ?? "");
  const [state, setState] = useState<PaymentState>("idle");
  const [showSuccess, setShowSuccess] = useState(false);
  const [transactionRef, setTransactionRef] = useState("");
  const [paymentDate, setPaymentDate] = useState("");

  useEffect(() => {
    if (params.passOrdonnance) {
      setMode("pass");
      return;
    }
    if (typeof params.packAmount === "number") {
      setMode("recharge");
      setRechargeAmountInput(String(params.packAmount));
    }
  }, [params.packAmount, params.passOrdonnance]);

  // Montant et libellé dynamiques selon le mode
  const currentAmount = useMemo(() => {
    if (mode === "recharge") {
      const parsed = Number(rechargeAmountInput);
      return Number.isFinite(parsed) ? Math.trunc(parsed) : 0;
    }
    return PASS_PRICE;
  }, [mode, rechargeAmountInput]);

  const currentCredits = useMemo(() => {
    if (mode !== "recharge") return 0;
    return getRechargeCreditsForAmount(currentAmount) ?? 0;
  }, [currentAmount, mode]);

  const selectedOfficialPack = useMemo(
    () => CREDIT_PACKS.find((p) => p.amount === currentAmount),
    [currentAmount]
  );

  const rechargeAmountError = useMemo(() => {
    if (mode !== "recharge") return null;
    if (!rechargeAmountInput.trim()) return "Saisissez un montant de recharge.";
    if (currentAmount < MIN_RECHARGE_AMOUNT) {
      return `Le montant minimum est ${formatFCFA(MIN_RECHARGE_AMOUNT)}.`;
    }
    if (currentAmount > MAX_RECHARGE_AMOUNT) {
      return `Le montant maximum est ${formatFCFA(MAX_RECHARGE_AMOUNT)}.`;
    }
    if (currentAmount % FCFA_PER_CREDIT !== 0) {
      return `Saisissez un montant par tranche de ${formatFCFA(FCFA_PER_CREDIT)}.`;
    }
    return null;
  }, [currentAmount, mode, rechargeAmountInput]);

  const currentLabel = useMemo(() => {
    if (mode === "recharge") {
      return getRechargeLabelForAmount(currentAmount) ?? "Recharge de crédits";
    }
    return "Pass Ordonnance Unique";
  }, [currentAmount, mode]);

  const currentShortLabel = useMemo(() => {
    if (mode === "recharge") return "Recharge de crédits";
    return "Pass Ordonnance Unique";
  }, [mode]);

  // Not connected
  if (!user) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-md items-center px-4 py-12">
        <Card className="w-full border-border/70 p-8 text-center shadow-avance">
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
    if (mode === "recharge" && rechargeAmountError) {
      toast.error("Montant de recharge invalide", {
        description: rechargeAmountError,
      });
      return;
    }
    setState("processing");
    try {
      const idempotencyKey = `sablin-${mode}-${currentAmount}-paydunya-${Date.now()}`;
      const res = await fetch("/api/payments/create-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-idempotency-key": idempotencyKey,
        },
        body: JSON.stringify({
          purchaseType: mode === "recharge" ? "credit_pack" : "pass_ordonnance",
          amount: currentAmount,
          provider: "paydunya",
          holderName: holderName.trim() || user.name,
          idempotencyKey,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error ?? "Impossible d’initier le paiement.");
      }
      setTransactionRef(data.payment?.reference ?? "");
      setPaymentDate(new Date().toISOString());
      setState("pending");
      setShowSuccess(true);
      toast.info("Paiement en cours de vérification", {
        description:
          "Aucun crédit et aucun Pass n’est activé tant que le prestataire n’a pas confirmé le paiement.",
      });
      if (data.payment?.checkoutUrl) {
        window.location.assign(data.payment.checkoutUrl);
      }
    } catch (err) {
      setState("failed");
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      toast.error("Paiement échoué", { description: msg });
    }
  };

  const verifyCurrentPayment = async () => {
    if (!transactionRef) return;
    setState("processing");
    try {
      await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: transactionRef }),
      });
      const res = await fetch(`/api/payments/status/${encodeURIComponent(transactionRef)}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Statut indisponible.");
      if (data.status === "SUCCESS") {
        setState("success");
        await fetchCredits();
        toast.success("Paiement confirmé", { description: data.message });
      } else if (data.status === "EXPIRED") {
        setState("expired");
        toast.error("Paiement expiré", { description: data.message });
      } else if (data.status === "SUSPICIOUS" || data.status === "MANUAL_REVIEW") {
        setState("suspicious");
        toast.warning("Paiement en vérification", { description: data.message });
      } else if (["FAILED", "CANCELLED", "REJECTED"].includes(data.status)) {
        setState("failed");
        toast.error("Paiement non confirmé", { description: data.message });
      } else {
        setState("pending");
        toast.info("Paiement en attente", { description: data.message });
      }
    } catch (error) {
      setState("pending");
      toast.error("Vérification impossible", {
        description: error instanceof Error ? error.message : "Réessayez dans quelques instants.",
      });
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
  };

  return (
    <div className="flex flex-col">
      {/* ============ HEADER ============ */}
      <section className="bg-brand-light">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <button
            onClick={() => navigate("wallet")}
            className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-brand"
          >
            <ChevronLeft className="size-4" />
            Mon portefeuille
          </button>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-brand text-white shadow-avance">
              {mode === "pass" ? (
                <Receipt className="size-6" />
              ) : (
                <Coins className="size-6" />
              )}
            </span>
            <div>
              <Eyebrow className="text-brand-dark">Paiement sécurisé</Eyebrow>
              <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-foreground sm:text-3xl">
                Paiement
              </h1>
            </div>
          </div>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
            {mode === "pass" ? (
              <>
                Achetez un Pass Ordonnance Unique valable pour une seule ordonnance.
                Le pass expire après estimation et comparaison.
              </>
            ) : (
              <>
                Rechargez vos crédits quand vous voulez. Vous payez uniquement
                ce que vous consommez.
              </>
            )}
          </p>
          <p className="mt-2 text-sm font-bold text-brand-dark">
            1 crédit = {FCFA_PER_CREDIT} FCFA. Aucun paiement mensuel.
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
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Pass Ordonnance Unique card */}
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
                <p className="text-sm font-bold text-foreground">Pass Ordonnance Unique</p>
                <p className="text-[11px] text-muted-foreground">Une seule ordonnance · Expire après comparaison</p>
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
                <p className="text-[11px] text-muted-foreground">À la carte · Sans engagement</p>
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
            <Card className="border-border/70 p-5 shadow-avance sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-brand-light text-brand">
                  <Coins className="size-4" />
                </span>
                <div>
                  <h2 className="text-base font-bold text-foreground">Recharger mes crédits</h2>
                  <p className="text-[11px] text-muted-foreground">
                    Rechargez vos crédits quand vous voulez, à la carte.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {CREDIT_PACKS.map((pack) => {
                  const active = currentAmount === pack.amount;
                  return (
                    <button
                      key={pack.amount}
                      type="button"
                      onClick={() => {
                        setRechargeAmountInput(String(pack.amount));
                      }}
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

              <div className="mt-4 rounded-xl border border-brand/20 bg-brand-light/30 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Label htmlFor="custom-recharge-amount">Montant personnalisé</Label>
                    <div className="relative">
                      <Input
                        id="custom-recharge-amount"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={rechargeAmountInput}
                        onChange={(e) => {
                          const clean = e.target.value.replace(/\D/g, "");
                          setRechargeAmountInput(clean);
                        }}
                        placeholder="Ex : 3000"
                        className="h-11 pr-16 text-base"
                        disabled={state === "processing" || state === "pending"}
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                        FCFA
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Minimum {formatFCFA(MIN_RECHARGE_AMOUNT)}. Le montant doit respecter
                      la règle 1 crédit = {FCFA_PER_CREDIT} FCFA. Les packs officiels gardent
                      leurs bonus.
                    </p>
                    {rechargeAmountError ? (
                      <p className="text-xs font-semibold text-danger">{rechargeAmountError}</p>
                    ) : (
                      <p className="text-xs font-semibold text-brand-dark">
                        Vous recevrez {currentCredits} crédit{currentCredits > 1 ? "s" : ""}
                        {selectedOfficialPack ? " avec le bonus du pack officiel." : "."}
                      </p>
                    )}
                  </div>
                  <div className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">
                      Crédits attendus
                    </p>
                    <p className="text-lg font-extrabold text-brand-dark">{currentCredits}</p>
                  </div>
                </div>
              </div>
            </Card>
          </section>
        )}

        {/* ============ SECTION PASS ORDONNANCE (visible si mode=pass) ============ */}
        {mode === "pass" && (
          <section className="mb-6">
            <Card className="border-brand/20 p-5 shadow-avance sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand text-white">
                    <Receipt className="size-6" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-foreground">Pass Ordonnance Unique</h2>
                      <Badge className="border-0 bg-brand text-white">
                        {formatFCFA(PASS_PRICE)}
                      </Badge>
                    </div>
                    <p className="mt-1 max-w-md text-sm text-muted-foreground">
                      Utilisez le Pass Ordonnance Unique pour estimer et comparer une seule ordonnance.
                      Après la comparaison finale, le pass expire automatiquement.
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
                    Aucun crédit débité pour cette ordonnance
                  </p>
                </div>
              </div>
            </Card>
          </section>
        )}

        {/* ============ PAYMENT STATE BANNERS ============ */}
        {(state === "pending" || state === "processing") && (
          <StateBanner
            icon={Loader2}
            iconClass="animate-spin text-brand"
            title={state === "processing" ? "Création du paiement" : "Paiement en cours de vérification"}
            message="Aucun crédit et aucun Pass ne sera activé tant que le prestataire n’a pas confirmé le paiement côté serveur."
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
        {(state === "expired" || state === "suspicious") && (
          <StateBanner
            icon={AlertCircle}
            iconClass="text-warning-foreground"
            title={state === "expired" ? "Paiement expiré" : "Paiement en vérification"}
            message={
              state === "expired"
                ? "Le délai de paiement est dépassé. Aucun crédit n’a été ajouté."
                : "Le paiement nécessite une vérification manuelle. Aucun service n’est débloqué."
            }
            tone="warning"
            action={{ label: "Réessayer", onClick: resetState }}
          />
        )}

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px] lg:gap-8">
          {/* LEFT — Payment form */}
          <div className="space-y-6">
            {/* Moyens de paiement */}
            <Card className="border-border/70 p-5 shadow-avance sm:p-6">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-brand-light text-brand">
                  <Smartphone className="size-4" />
                </span>
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-foreground">
                      Moyens disponibles sur PayDunya
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Le choix se fait sur la page sécurisée PayDunya, pas sur SABLIN PHARMA.
                    </p>
                  </div>
                </div>
                <Badge className="w-fit border-0 bg-brand text-white">PayDunya</Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {PROVIDERS.map((p) => (
                  <div
                    key={p.id}
                    className="flex min-w-0 flex-col items-center gap-2 rounded-xl border border-border/70 bg-background p-3 text-center"
                  >
                    <PaymentMethodLogo provider={p.id} label={p.logoLabel} />
                    <span className="text-[11px] font-bold leading-tight text-foreground">
                      {p.label}
                    </span>
                    <span className="text-[10px] leading-snug text-muted-foreground">
                      {p.desc}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Formulaire de paiement */}
            <Card className="border-border/70 p-5 shadow-avance sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-brand-light text-brand">
                  <CreditCard className="size-4" />
                </span>
                <h2 className="text-base font-bold text-foreground">
                  Informations de paiement
                </h2>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-brand/20 bg-brand-light/30 p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand text-white">
                      <ShieldCheck className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground">
                        Paiement via PayDunya Checkout
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        SABLIN PHARMA transmet uniquement le montant et la référence.
                        PayDunya affiche ensuite Wave CI, Orange Money, MTN Money ou Moov Money
                        selon les moyens activés sur le compte marchand.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Nom du titulaire */}
                <div className="space-y-1.5">
                  <Label htmlFor="holder">
                    Nom du payeur <span className="text-muted-foreground">(optionnel)</span>
                  </Label>
                  <Input
                    id="holder"
                    placeholder="Nom complet si vous souhaitez le préremplir"
                    value={holderName}
                    onChange={(e) => setHolderName(e.target.value)}
                    className="h-11"
                    disabled={state === "processing" || state === "pending"}
                  />
                  <p className="text-xs text-muted-foreground">
                    Le numéro et le moyen de paiement seront saisis ou confirmés sur PayDunya.
                  </p>
                </div>

                {/* Montant transmis à PayDunya */}
                <div className="space-y-1.5">
                  <Label>Montant à payer</Label>
                  <div className="flex flex-col gap-2 rounded-lg border border-brand/20 bg-brand-light/30 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm text-muted-foreground">{currentLabel}</span>
                    <Price amount={currentAmount} size="md" variant="brand" />
                  </div>
                  {mode === "recharge" && rechargeAmountError && (
                    <p className="text-xs font-semibold text-danger">{rechargeAmountError}</p>
                  )}
                </div>

                {/* Bouton Payer maintenant */}
                <Button
                  className="min-h-12 w-full whitespace-normal bg-brand px-3 py-3 text-sm font-semibold text-white shadow-avance hover:bg-brand-dark sm:text-base"
                  onClick={handlePay}
                  disabled={
                    state === "processing" ||
                    state === "pending" ||
                    (mode === "pass" && hasPass) ||
                    (mode === "recharge" && Boolean(rechargeAmountError))
                  }
                >
                  {state === "processing" ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Traitement en cours…
                    </>
                  ) : mode === "pass" && hasPass ? (
                    <>Pass déjà actif</>
                  ) : (
                    <>
                      <Lock className="size-4" />
                      Continuer sur PayDunya
                    </>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  className="w-full text-muted-foreground"
                  onClick={handleCancel}
                  disabled={state === "processing"}
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
                <SecurityItem text="Crédits et Pass activés uniquement après confirmation officielle du prestataire." />
              </ul>
              <p className="mt-3 rounded-lg bg-background/60 px-3 py-2 text-[11px] text-muted-foreground">
                Les captures d’écran et les références saisies manuellement ne valident jamais un paiement.
              </p>
            </Card>
          </div>

          {/* RIGHT — Récapitulatif (sticky) */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <Card className="border-border/70 p-5 shadow-avance sm:p-6">
              <div className="flex items-center gap-2">
                <Receipt className="size-4 text-brand" />
                <h2 className="text-base font-bold text-foreground">
                  Récapitulatif
                </h2>
              </div>

              <div className="mt-4 flex items-start gap-3 rounded-xl bg-brand-light/40 p-4">
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-xl bg-brand text-white"
                  )}
                >
                  {mode === "pass" ? (
                    <Receipt className="size-5" />
                  ) : (
                    <Coins className="size-5" />
                  )}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground">{currentShortLabel}</p>
                  <p className="text-xs text-muted-foreground">
                    {mode === "pass"
                      ? "Une seule ordonnance · Activation après confirmation"
                      : `${currentCredits} crédits · Ajout après confirmation`}
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
                {mode === "recharge" && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Règle crédits</span>
                    <span className="font-semibold text-foreground">
                      1 crédit = {FCFA_PER_CREDIT} FCFA
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Durée</span>
                  <span className="font-semibold text-foreground">
                    {mode === "pass" ? "Une ordonnance" : "À la carte"}
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
                className="mt-4 min-h-11 w-full whitespace-normal bg-brand px-3 py-2.5 text-sm text-white hover:bg-brand-dark"
                size="lg"
                onClick={handlePay}
                disabled={
                  state === "processing" ||
                  state === "pending" ||
                  (mode === "pass" && hasPass) ||
                  (mode === "recharge" && Boolean(rechargeAmountError))
                }
              >
                {state === "processing" ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Traitement…
                  </>
                ) : mode === "pass" && hasPass ? (
                  <>Pass déjà actif</>
                ) : (
                  <>
                    <Lock className="size-4" /> Continuer sur PayDunya
                  </>
                )}
              </Button>

              <Button
                variant="ghost"
                className="mt-2 w-full text-muted-foreground"
                onClick={() => navigate("wallet")}
                disabled={state === "processing"}
              >
                <ChevronLeft className="size-4" /> Retour au portefeuille
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
            <DialogTitle>
              {state === "success" ? "Paiement confirmé" : "Paiement en cours de vérification"}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-hidden rounded-xl">
            {/* Header succès */}
            <div className="relative flex flex-col items-center bg-brand px-6 py-8 text-center text-white">
              <span className="relative flex size-16 items-center justify-center rounded-full bg-white/15 ring-8 ring-white/10 animate-scale-in">
                {state === "success" ? (
                  <CheckCircle2 className="size-9 text-white" />
                ) : state === "failed" || state === "expired" ? (
                  <XCircle className="size-9 text-white" />
                ) : (
                  <Loader2 className="size-9 animate-spin text-white" />
                )}
              </span>
              <h2 className="relative mt-4 text-xl font-extrabold">
                {state === "success"
                  ? "Paiement confirmé"
                  : state === "failed"
                    ? "Paiement échoué"
                    : state === "expired"
                      ? "Paiement expiré"
                      : state === "suspicious"
                        ? "Paiement en vérification"
                        : "Paiement en cours de vérification"}
              </h2>
              <p className="relative mt-1 text-sm text-white/85">
                {state === "success"
                  ? mode === "pass"
                    ? "Pass Ordonnance Unique activé avec succès"
                    : "Crédits ajoutés à votre compte"
                  : "Aucun crédit ni Pass n’est activé tant que le fournisseur n’a pas confirmé SUCCESS."}
              </p>
            </div>

            {/* Détails */}
            <div className="space-y-3 p-6">
              <div className="grid grid-cols-2 gap-3">
                <DetailItem label={state === "success" ? "Montant payé" : "Montant à vérifier"} value={formatFCFA(currentAmount)} />
                <DetailItem label="Date de paiement" value={paymentDate ? formatDate(paymentDate) : "—"} />
                <DetailItem
                  label={mode === "recharge" ? (state === "success" ? "Crédits obtenus" : "Crédits attendus") : "Validité du pass"}
                  value={
                    mode === "recharge"
                      ? `${currentCredits} crédits`
                      : "Une seule ordonnance"
                  }
                />
                <DetailItem label="Moyen de paiement" value="Choisi sur PayDunya" />
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
                onClick={verifyCurrentPayment}
                disabled={state === "processing" || state === "success"}
              >
                {state === "processing" ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Vérification…
                  </>
                ) : state === "success" ? (
                  <>Paiement confirmé</>
                ) : (
                  <>Vérifier le statut</>
                )}
              </Button>

              <Button
                variant="outline"
                className="w-full border-brand/30 text-brand-dark hover:bg-brand-light"
                size="lg"
                onClick={() => {
                  setShowSuccess(false);
                  navigate("wallet");
                }}
              >
                Retour à mon portefeuille <ArrowRight className="size-4" />
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

function PaymentMethodLogo({ provider, label }: { provider: Provider; label: string }) {
  if (provider === "wave") {
    return (
      <span className="flex h-12 w-full max-w-24 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 px-2 text-center text-sm font-black text-sky-700">
        {label}
        <span className="ml-1 text-[10px] font-bold text-sky-600">CI</span>
      </span>
    );
  }
  if (provider === "orange") {
    return (
      <span className="flex h-12 w-full max-w-24 items-center justify-center rounded-xl bg-black px-2 text-center text-[11px] font-black leading-tight text-white">
        <span className="mr-1 inline-flex size-4 rounded-sm bg-orange-500" />
        Orange
      </span>
    );
  }
  if (provider === "mtn") {
    return (
      <span className="flex h-12 w-full max-w-24 items-center justify-center rounded-xl border border-yellow-300 bg-yellow-300 px-2 text-center text-sm font-black text-black">
        MTN
      </span>
    );
  }
  return (
    <span className="flex h-12 w-full max-w-24 items-center justify-center rounded-xl bg-blue-700 px-2 text-center text-xs font-black leading-tight text-white">
      Moov
      <span className="ml-1 text-[10px] font-bold">Money</span>
    </span>
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
