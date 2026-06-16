"use client";

import { useState, useMemo } from "react";
import {
  ChevronLeft,
  CreditCard,
  Smartphone,
  Lock,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  Crown,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useNav } from "@/store/nav";
import { useAuth } from "@/store/auth";
import { formatFCFA } from "@/lib/format";

type Method = "mobile_money" | "card";
type Provider = "orange" | "mtn" | "moov";

const PROVIDERS: {
  id: Provider;
  label: string;
  short: string;
  bgClass: string;
  textClass: string;
}[] = [
  {
    id: "orange",
    label: "Orange Money",
    short: "OM",
    bgClass: "bg-orange-500",
    textClass: "text-white",
  },
  {
    id: "mtn",
    label: "MTN MoMo",
    short: "MTN",
    bgClass: "bg-yellow-400",
    textClass: "text-black",
  },
  {
    id: "moov",
    label: "Moov Money",
    short: "Moov",
    bgClass: "bg-blue-500",
    textClass: "text-white",
  },
];

const PRICE = 500;

export function PaymentView() {
  const { navigate } = useNav();
  const { user, premium, setPremium, fetchMe } = useAuth();

  const [method, setMethod] = useState<Method>("mobile_money");
  const [provider, setProvider] = useState<Provider>("orange");

  // Mobile money state
  const [phone, setPhone] = useState("");

  // Card state
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [cardName, setCardName] = useState("");

  const [loading, setLoading] = useState(false);

  const formattedPhone = useMemo(() => {
    // Strip non-digits, group by 2 digits
    const digits = phone.replace(/\D/g, "").slice(0, 10);
    return digits.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
  }, [phone]);

  const formattedCard = useMemo(() => {
    const digits = cardNumber.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
  }, [cardNumber]);

  const formattedExpiry = useMemo(() => {
    const digits = expiry.replace(/\D/g, "").slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }, [expiry]);

  // If not connected
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
            Vous devez être connecté à votre compte SABLIN PHARMA pour souscrire
            à l&apos;abonnement Premium.
          </p>
          <Button
            className="mt-6 w-full bg-brand-gradient text-white hover:opacity-90"
            size="lg"
            onClick={() => navigate("auth", { authMode: "login" })}
          >
            Se connecter
          </Button>
          <Button
            variant="ghost"
            className="mt-2 w-full text-muted-foreground"
            onClick={() => navigate("subscription")}
          >
            Retour à l&apos;abonnement
          </Button>
        </Card>
      </div>
    );
  }

  // If already premium
  if (premium) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-md items-center px-4 py-12">
        <Card className="w-full border-brand/30 bg-gradient-to-br from-brand-light/60 to-card p-8 text-center shadow-premium">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-gradient text-white">
            <CheckCircle2 className="size-7" />
          </span>
          <h1 className="mt-5 text-xl font-extrabold text-foreground sm:text-2xl">
            Vous êtes déjà Premium
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Votre abonnement Premium est actif. Aucun paiement supplémentaire
            n&apos;est nécessaire pour le moment.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <Button
              className="w-full bg-brand-gradient text-white hover:opacity-90"
              size="lg"
              onClick={() => navigate("profile")}
            >
              Voir mon profil
              <ChevronRight className="size-4" />
            </Button>
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => navigate("home")}
            >
              Retour à l&apos;accueil
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const handlePay = async () => {
    // Basic client-side validation (mock)
    if (method === "mobile_money") {
      const digits = phone.replace(/\D/g, "");
      if (digits.length !== 10) {
        toast.error("Numéro de téléphone invalide", {
          description: "Saisissez un numéro ivoirien à 10 chiffres (07 XX XX XX XX).",
        });
        return;
      }
    } else {
      const digits = cardNumber.replace(/\D/g, "");
      if (digits.length !== 16) {
        toast.error("Numéro de carte invalide", {
          description: "Saisissez les 16 chiffres de votre carte.",
        });
        return;
      }
      if (!/^\d{2}\/\d{2}$/.test(expiry)) {
        toast.error("Date d&apos;expiration invalide", {
          description: "Format attendu : MM/AA.",
        });
        return;
      }
      if (cvc.replace(/\D/g, "").length !== 3) {
        toast.error("CVC invalide", {
          description: "Le cryptogramme visuel comporte 3 chiffres.",
        });
        return;
      }
      if (cardName.trim().length < 3) {
        toast.error("Nom du titulaire manquant", {
          description: "Saisissez le nom inscrit sur la carte.",
        });
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method,
          provider: method === "mobile_money" ? provider : "card",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Échec du paiement");
      }

      setPremium(true);
      await fetchMe();
      toast.success("Paiement réussi ! Abonnement activé", {
        description: "Bienvenue dans l&apos;expérience Premium SABLIN PHARMA.",
      });
      navigate("success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      toast.error("Paiement échoué", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col">
      {/* HEADER */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-background to-brand-light/40">
        <div className="absolute -right-16 -top-16 size-72 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <button
            onClick={() => navigate("subscription")}
            className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-brand"
          >
            <ChevronLeft className="size-4" />
            Abonnement
          </button>

          <div className="mt-5">
            <Badge className="inline-flex items-center gap-1.5 border-0 bg-gradient-to-br from-amber-400 to-amber-500 px-3 py-1 text-xs font-bold text-white shadow-premium">
              <Crown className="size-3.5" />
              Premium
            </Badge>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
              Paiement de l&apos;abonnement
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Réglez votre abonnement mensuel en toute sécurité. Activation
              immédiate après confirmation du paiement.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:gap-8">
          {/* LEFT — Payment method */}
          <div className="flex flex-col gap-6">
            <Card className="border-border/70 p-6 sm:p-7">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="flex items-center gap-2 text-lg font-extrabold text-foreground">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-brand-light text-brand">
                    <CreditCard className="size-4" />
                  </span>
                  Méthode de paiement
                </CardTitle>
              </CardHeader>

              <CardContent className="px-0">
                <RadioGroup
                  value={method}
                  onValueChange={(v) => setMethod(v as Method)}
                  className="grid gap-3 sm:grid-cols-2"
                >
                  <label
                    htmlFor="method-mm"
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all ${
                      method === "mobile_money"
                        ? "border-brand bg-brand-light/40 ring-2 ring-brand/20"
                        : "border-border/70 hover:border-brand/30 hover:bg-accent/30"
                    }`}
                  >
                    <RadioGroupItem value="mobile_money" id="method-mm" />
                    <span className="flex size-10 items-center justify-center rounded-lg bg-brand-gradient text-white">
                      <Smartphone className="size-5" />
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-foreground">
                        Mobile Money
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Orange, MTN, Moov
                      </p>
                    </div>
                  </label>

                  <label
                    htmlFor="method-card"
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all ${
                      method === "card"
                        ? "border-brand bg-brand-light/40 ring-2 ring-brand/20"
                        : "border-border/70 hover:border-brand/30 hover:bg-accent/30"
                    }`}
                  >
                    <RadioGroupItem value="card" id="method-card" />
                    <span className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 text-white">
                      <CreditCard className="size-5" />
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-foreground">
                        Carte bancaire
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Visa, Mastercard
                      </p>
                    </div>
                  </label>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Mobile Money details */}
            {method === "mobile_money" && (
              <Card className="border-border/70 p-6 sm:p-7">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                    <Smartphone className="size-4 text-brand" />
                    Choisissez votre opérateur
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-0 space-y-5">
                  <div className="grid grid-cols-3 gap-3">
                    {PROVIDERS.map((p) => {
                      const active = provider === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setProvider(p.id)}
                          className={`flex flex-col items-center gap-2 rounded-xl border p-3 transition-all ${
                            active
                              ? "border-brand bg-brand-light/40 ring-2 ring-brand/20"
                              : "border-border/70 hover:border-brand/30 hover:bg-accent/30"
                          }`}
                          aria-pressed={active}
                        >
                          <span
                            className={`flex size-11 items-center justify-center rounded-xl text-xs font-extrabold shadow-sm ${p.bgClass} ${p.textClass}`}
                          >
                            {p.short}
                          </span>
                          <span className="text-center text-[11px] font-semibold leading-tight text-foreground">
                            {p.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-semibold">
                      Numéro Mobile Money
                    </Label>
                    <Input
                      id="phone"
                      inputMode="tel"
                      placeholder="07 00 00 00 00"
                      value={formattedPhone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="text-base tracking-wide"
                      maxLength={19}
                    />
                    <p className="text-xs text-muted-foreground">
                      Saisissez le numéro ivoirien lié à votre compte{" "}
                      {PROVIDERS.find((p) => p.id === provider)?.label}.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Card details */}
            {method === "card" && (
              <Card className="border-border/70 p-6 sm:p-7">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                    <CreditCard className="size-4 text-brand" />
                    Informations de la carte
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-0 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="card-number" className="text-sm font-semibold">
                      Numéro de carte
                    </Label>
                    <Input
                      id="card-number"
                      inputMode="numeric"
                      placeholder="0000 0000 0000 0000"
                      value={formattedCard}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="text-base tracking-widest"
                      maxLength={19}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiry" className="text-sm font-semibold">
                        Date d&apos;expiration
                      </Label>
                      <Input
                        id="expiry"
                        inputMode="numeric"
                        placeholder="MM/AA"
                        value={formattedExpiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        className="text-base"
                        maxLength={5}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvc" className="text-sm font-semibold">
                        CVC
                      </Label>
                      <Input
                        id="cvc"
                        inputMode="numeric"
                        placeholder="000"
                        value={cvc}
                        onChange={(e) =>
                          setCvc(
                            e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 3)
                          )
                        }
                        className="text-base tracking-widest"
                        maxLength={3}
                        type="password"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="card-name" className="text-sm font-semibold">
                      Nom sur la carte
                    </Label>
                    <Input
                      id="card-name"
                      placeholder="JEAN KOUASSI"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="text-base uppercase"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* RIGHT — Récapitulatif (sticky) */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <Card className="border-border/70 p-6 shadow-premium sm:p-7">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-lg font-extrabold text-foreground">
                  Récapitulatif
                </CardTitle>
              </CardHeader>

              <CardContent className="px-0 space-y-4">
                <div className="flex items-start gap-3 rounded-xl bg-brand-light/40 p-4">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white">
                    <Crown className="size-5" />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground">
                      Abonnement Premium
                    </p>
                    <p className="text-xs text-muted-foreground">
                      1 mois · Activation immédiate
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sous-total</span>
                    <span className="font-semibold text-foreground">
                      {formatFCFA(PRICE)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frais</span>
                    <span className="font-semibold text-foreground">0 FCFA</span>
                  </div>
                </div>

                <Separator />

                <div className="flex items-baseline justify-between">
                  <span className="text-base font-bold text-foreground">
                    Total
                  </span>
                  <span className="text-2xl font-extrabold text-brand-dark">
                    {formatFCFA(PRICE)}
                  </span>
                </div>

                <Button
                  className="w-full bg-brand-gradient text-white hover:opacity-90"
                  size="lg"
                  disabled={loading}
                  onClick={handlePay}
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      <Lock className="size-4" />
                      Payer {formatFCFA(PRICE)}
                    </>
                  )}
                </Button>

                <div className="flex items-start gap-2 rounded-xl border border-brand/20 bg-brand-light/30 p-3">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand" />
                  <div className="text-xs">
                    <p className="font-semibold text-foreground">
                      Paiement 100% sécurisé
                    </p>
                    <p className="text-muted-foreground">
                      Vos données sont chiffrées et ne sont jamais stockées sur
                      nos serveurs.
                    </p>
                  </div>
                </div>

                <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
                  Il s&apos;agit d&apos;un environnement de démonstration. Aucun
                  débit réel n&apos;est effectué.
                </p>
              </CardContent>

              <CardFooter className="px-0 pb-0 pt-2">
                <Button
                  variant="ghost"
                  className="w-full text-muted-foreground"
                  onClick={() => navigate("subscription")}
                  disabled={loading}
                >
                  <ChevronLeft className="size-4" />
                  Modifier l&apos;offre
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
