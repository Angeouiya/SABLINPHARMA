"use client";

import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Crown,
  CheckCircle2,
  Check,
  X,
  ShieldCheck,
  Zap,
  Clock,
  Search,
  ClipboardList,
  Timer,
  Heart,
  Bell,
  Headphones,
  CreditCard,
  Smartphone,
  RotateCcw,
  AlertCircle,
  Info,
  TrendingDown,
  Navigation,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Heading, Eyebrow, Muted, Price } from "@/components/ui/typography";
import { useNav } from "@/store/nav";
import { useAuth } from "@/store/auth";
import { formatFCFA, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Subscription } from "@/lib/types";

// Les 8 avantages Premium demandés
const AVANTAGES = [
  { icon: Search, label: "Recherche illimitée de médicaments" },
  { icon: ClipboardList, label: "Estimation d'ordonnance" },
  { icon: Clock, label: "Accès aux pharmacies ouvertes" },
  { icon: Timer, label: "Accès aux pharmacies de garde" },
  { icon: Clock, label: "Historique des recherches" },
  { icon: Heart, label: "Pharmacies favorites" },
  { icon: Bell, label: "Alertes de disponibilité" },
  { icon: Headphones, label: "Support utilisateur prioritaire" },
];

const COMPARATIF: {
  label: string;
  gratuit: string;
  premium: string;
  premiumOnly?: boolean;
}[] = [
  { label: "Recherches de médicaments", gratuit: "10 / jour", premium: "Illimité" },
  { label: "Estimation d'ordonnance", gratuit: "3 / mois", premium: "Illimité" },
  { label: "Pharmacies ouvertes", gratuit: "Accès partiel", premium: "Accès complet" },
  { label: "Pharmacies de garde", gratuit: "—", premium: "Accès complet", premiumOnly: true },
  { label: "Historique des recherches", gratuit: "—", premium: "Illimité", premiumOnly: true },
  { label: "Pharmacies favorites", gratuit: "3 maximum", premium: "Illimité" },
  { label: "Alertes de disponibilité", gratuit: "—", premium: "Incluses", premiumOnly: true },
  { label: "Support utilisateur", gratuit: "Standard", premium: "Prioritaire" },
  { label: "Sans publicité", gratuit: "—", premium: "Inclus", premiumOnly: true },
];

// Pourquoi passer à Premium
const POURQUOI = [
  {
    icon: Zap,
    title: "Gagner du temps",
    desc: "Trouvez vos médicaments et pharmacies en quelques secondes, sans déplacement inutile.",
  },
  {
    icon: Navigation,
    title: "Éviter les déplacements inutiles",
    desc: "Vérifiez la disponibilité avant de sortir et allez directement à la bonne pharmacie.",
  },
  {
    icon: Wallet,
    title: "Préparer son budget ordonnance",
    desc: "Estimez le coût total de vos médicaments et comparez les prix par pharmacie.",
  },
  {
    icon: Timer,
    title: "Trouver les pharmacies de garde",
    desc: "Accédez en temps réel aux pharmacies de garde près de chez vous, jour et nuit.",
  },
  {
    icon: Bell,
    title: "Recevoir des alertes importantes",
    desc: "Soyez informé des disponibilités, des gardes et des mises à jour importantes.",
  },
];

const FAQ = [
  {
    q: "Comment payer l'abonnement ?",
    a: "Vous pouvez régler votre abonnement via Mobile Money (Orange Money, MTN MoMo, Moov Money) ou par carte bancaire (Visa, Mastercard). Le paiement est sécurisé et chiffré. Aucun prélèvement automatique : vous payez 500 FCFA pour 30 jours d'accès Premium.",
  },
  {
    q: "Puis-je annuler ?",
    a: "Oui, l'abonnement est sans engagement. Il n'est pas reconduit automatiquement. Vous conservez l'accès Premium jusqu'à la fin de la période payée, puis le compte repasse en mode gratuit sans aucune action de votre part.",
  },
  {
    q: "Que se passe-t-il si mon abonnement expire ?",
    a: "Votre compte repasse automatiquement en mode gratuit. Vous conservez accès aux fonctionnalités de base (recherche limitée, pharmacies). Vos favoris et historique sont conservés. Vous pouvez renouveler à tout moment pour retrouver toutes les fonctionnalités Premium.",
  },
  {
    q: "Les prix des médicaments sont-ils garantis ?",
    a: "Les prix affichés sont indicatifs et basés sur les informations fournies par les pharmacies partenaires. Ils peuvent varier selon le point de vente. Nous vous recommandons toujours de confirmer auprès de la pharmacie avant tout déplacement. SABLIN PHARMA est une plateforme d'information, aucune vente en ligne.",
  },
];

export function SubscriptionView() {
  const { navigate } = useNav();
  const { user, premium } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/me");
        if (res.ok) {
          const data = await res.json();
          if (active) setSubscription(data.subscription ?? null);
        }
      } catch {
        /* noop */
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex flex-col">
      {/* ============ HEADER ATTRACTIF ============ */}
      <section className="relative overflow-hidden bg-amber-50">
        <div className="absolute -right-16 -top-16 size-72 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 size-80 rounded-full bg-brand/10 blur-3xl" />

        <div className="relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <button
            onClick={() => navigate("home")}
            className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-brand"
          >
            <ChevronLeft className="size-4" />
            Retour à l&apos;accueil
          </button>

          <div className="mx-auto mt-6 max-w-2xl text-center">
            <Badge className="mx-auto inline-flex items-center gap-1.5 border-0 bg-amber-500 px-3 py-1 text-xs font-bold text-white shadow-premium">
              <Crown className="size-3.5" />
              Offre Premium
            </Badge>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Abonnement Premium
            </h1>
            <p className="mt-3 text-sm leading-relaxed break-words text-muted-foreground sm:text-base">
              Accédez à toutes les fonctionnalités pour trouver vos médicaments plus
              rapidement, estimer vos ordonnances et localiser les pharmacies de garde.
            </p>

            {/* Prix bien visible */}
            <div className="mt-5 inline-flex items-baseline gap-2 rounded-2xl border border-amber-500/30 bg-background px-6 py-3 shadow-premium">
              <span className="text-4xl font-extrabold tracking-tight text-brand-dark sm:text-5xl">
                500
              </span>
              <span className="text-sm font-semibold text-muted-foreground">FCFA / mois</span>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        {/* ============ CARTE PREMIUM CENTRALE + AVANTAGES ============ */}
        <div className="grid gap-8 lg:grid-cols-[1fr_400px] lg:gap-10">
          {/* LEFT — Avantages détaillés */}
          <div className="flex flex-col gap-6">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-xl bg-brand-light text-brand">
                  <Zap className="size-5" />
                </span>
                <div>
                  <Eyebrow>Vos avantages</Eyebrow>
                  <Heading level="h2">Ce que vous obtenez avec Premium</Heading>
                </div>
              </div>
              <Muted className="mt-2 max-w-lg">
                Des outils exclusifs pour gagner du temps et prendre de meilleures
                décisions santé au quotidien.
              </Muted>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {AVANTAGES.map((a, i) => (
                <Card
                  key={i}
                  className="group flex items-center gap-3 border-border/70 p-4 transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-premium"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white transition-transform group-hover:scale-110">
                    <a.icon className="size-5" />
                  </span>
                  <p className="text-sm font-semibold leading-snug text-foreground">
                    {a.label}
                  </p>
                </Card>
              ))}
            </div>

            {/* Statut de l'abonnement */}
            <SubscriptionStatus
              premium={premium}
              subscription={subscription}
              onRenew={() => navigate("payment")}
              onSubscribe={() => navigate("payment")}
            />
          </div>

          {/* RIGHT — Carte Premium pricing (sticky) */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <Card className="relative overflow-hidden border-amber-500/30 bg-amber-50 p-0 shadow-premium-lg">
              <div className="absolute -right-10 -top-10 size-44 rounded-full bg-amber-300/30 blur-3xl" />
              <div className="absolute -bottom-12 -left-10 size-44 rounded-full bg-brand/10 blur-3xl" />

              <div className="relative flex h-full flex-col p-6 sm:p-7">
                <div className="flex items-center justify-between">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-premium">
                    <Crown className="size-6" />
                  </span>
                  <Badge className="border-0 bg-amber-500 text-[11px] font-bold text-white">
                    Recommandé
                  </Badge>
                </div>

                <h3 className="mt-5 text-xl font-extrabold text-foreground">
                  Plan Premium
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Accès complet à toutes les fonctionnalités avancées.
                </p>

                <div className="mt-5 flex items-baseline gap-1.5">
                  <span className="text-5xl font-extrabold tracking-tight text-brand-dark">
                    500
                  </span>
                  <span className="text-sm font-semibold text-muted-foreground">
                    FCFA / mois
                  </span>
                </div>

                <Separator className="my-5" />

                <ul className="flex-1 space-y-2 text-sm">
                  {AVANTAGES.map((a, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-amber-600" />
                      <span className="text-foreground/80">{a.label}</span>
                    </li>
                  ))}
                </ul>

                {premium ? (
                  <Button
                    className="mt-5 w-full bg-brand-gradient text-white hover:opacity-90"
                    size="lg"
                    onClick={() => navigate("payment")}
                  >
                    <RotateCcw className="size-4" /> Renouveler mon abonnement
                  </Button>
                ) : (
                  <Button
                    className="mt-5 w-full bg-amber-500 text-white hover:bg-amber-600"
                    size="lg"
                    onClick={() => navigate("payment")}
                  >
                    <Crown className="size-4" /> S&apos;abonner à 500 FCFA/mois
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="mt-2 w-full border-brand/30 text-brand-dark hover:bg-brand-light"
                  size="lg"
                  onClick={() => {
                    document
                      .getElementById("avantages")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Voir les avantages <ChevronRight className="size-4" />
                </Button>

                <p className="mt-3 text-center text-[11px] text-muted-foreground">
                  Sans engagement · Paiement sécurisé · Résiliable à tout moment
                </p>
              </div>
            </Card>

            <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-border/70 bg-card/60 p-3 text-xs text-muted-foreground">
              <ShieldCheck className="size-4 text-brand" />
              Paiement chiffré et 100% sécurisé
            </div>
          </div>
        </div>

        {/* ============ COMPARATIF ============ */}
        <section id="avantages" className="mt-14 scroll-mt-20">
          <div className="text-center">
            <Eyebrow className="justify-center">Comparez les offres</Eyebrow>
            <Heading level="h2" className="text-center">
              Gratuit vs <span className="text-amber-600">Premium</span>
            </Heading>
            <Muted className="mt-2 text-center">
              Comparez les fonctionnalités et choisissez l&apos;offre qui vous convient.
            </Muted>
          </div>

          <Card className="mt-6 overflow-hidden border-border/70 p-0 shadow-premium">
            <div className="overflow-x-auto scroll-thin">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="border-b border-border/60 bg-muted/40">
                  <tr>
                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Fonctionnalité
                    </th>
                    <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Gratuit
                    </th>
                    <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wide text-amber-600">
                      <span className="inline-flex items-center gap-1">
                        <Crown className="size-3.5" /> Premium
                      </span>
                      <span className="ml-1.5 inline-flex rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] text-white">
                        Recommandé
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {COMPARATIF.map((row) => (
                    <tr key={row.label} className="transition-colors hover:bg-accent/30">
                      <td className="px-5 py-3.5 font-semibold text-foreground">
                        {row.label}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {row.premiumOnly ? (
                          <X className="mx-auto size-4 text-muted-foreground/60" />
                        ) : (
                          <span className="text-muted-foreground">{row.gratuit}</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-amber-700">
                          <CheckCircle2 className="size-4 text-amber-600" />
                          {row.premium}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-amber-50/60">
                  <tr>
                    <td className="px-5 py-4 font-bold text-foreground">Prix mensuel</td>
                    <td className="px-5 py-4 text-center font-bold text-muted-foreground">
                      0 FCFA
                    </td>
                    <td className="px-5 py-4 text-center font-extrabold text-amber-700">
                      {formatFCFA(500)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </section>

        {/* ============ POURQUOI PASSER À PREMIUM ============ */}
        <section className="mt-14">
          <div className="text-center">
            <Eyebrow className="justify-center">Bénéfices concrets</Eyebrow>
            <Heading level="h2" className="text-center">
              Pourquoi passer à Premium ?
            </Heading>
            <Muted className="mt-2 text-center">
              500 FCFA/mois pour gagner du temps et mieux gérer votre santé.
            </Muted>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {POURQUOI.map((p, i) => (
              <Card
                key={i}
                className="group border-border/70 p-5 transition-all hover:-translate-y-1 hover:border-brand/30 hover:shadow-premium-lg"
              >
                <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-light text-brand transition-transform group-hover:scale-110">
                  <p.icon className="size-6" />
                </span>
                <h3 className="mt-4 text-base font-bold text-foreground">{p.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed break-words text-muted-foreground">
                  {p.desc}
                </p>
              </Card>
            ))}
          </div>
        </section>

        {/* ============ FAQ ============ */}
        <section className="mt-14">
          <div className="text-center">
            <Eyebrow className="justify-center">Besoin d&apos;informations ?</Eyebrow>
            <Heading level="h2" className="text-center">
              Questions fréquentes
            </Heading>
            <Muted className="mt-2 text-center">
              Tout ce que vous devez savoir avant de vous abonner.
            </Muted>
          </div>

          <Card className="mx-auto mt-6 max-w-3xl border-border/70 p-6 sm:p-8">
            <Accordion type="single" collapsible className="w-full">
              {FAQ.map((item, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className="text-left text-sm font-semibold text-foreground sm:text-base">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed break-words text-muted-foreground">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
        </section>

        {/* ============ CTA FINAL ============ */}
        {!premium && (
          <section className="mt-14">
            <Card className="relative overflow-hidden border-amber-500/30 bg-amber-50 p-8 text-center shadow-premium sm:p-10">
              <div className="absolute -right-12 -top-12 size-48 rounded-full bg-amber-300/20 blur-3xl" />
              <div className="absolute -bottom-12 -left-12 size-48 rounded-full bg-brand/10 blur-3xl" />
              <div className="relative">
                <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-premium">
                  <Crown className="size-7" />
                </span>
                <h2 className="mt-5 text-2xl font-extrabold text-foreground sm:text-3xl">
                  Prêt à passer Premium ?
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  Rejoignez les utilisateurs Premium de SABLIN PHARMA et débloquez
                  l&apos;expérience complète pour seulement{" "}
                  <span className="font-bold text-amber-700">500 FCFA / mois</span>.
                </p>
                <Button
                  className="mt-6 bg-amber-500 text-white hover:bg-amber-600"
                  size="lg"
                  onClick={() => navigate("payment")}
                >
                  <Crown className="size-4" />
                  S&apos;abonner à 500 FCFA/mois
                </Button>
              </div>
            </Card>
          </section>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   SubscriptionStatus — bloc statut de l'abonnement
   ============================================================ */
function SubscriptionStatus({
  premium,
  subscription,
  onRenew,
  onSubscribe,
}: {
  premium: boolean;
  subscription: Subscription | null;
  onRenew: () => void;
  onSubscribe: () => void;
}) {
  return (
    <Card className="overflow-hidden border-border/70 py-0 shadow-premium">
      <div className="flex items-center gap-2 border-b border-border/50 bg-muted/30 px-5 py-3">
        <CreditCard className="size-4 text-brand" />
        <h3 className="text-sm font-bold text-foreground">Statut de votre abonnement</h3>
      </div>
      <div className="p-5">
        {premium && subscription ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="flex size-10 items-center justify-center rounded-xl bg-amber-500 text-white">
                <Crown className="size-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-foreground">Premium actif</p>
                <Badge className="mt-0.5 border-0 bg-success text-white">
                  <CheckCircle2 className="size-3" /> Actif
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StatusInfo label="Type d'abonnement" value="Premium mensuel" />
              <StatusInfo label="Statut" value="Actif" success />
              <StatusInfo label="Date de début" value={formatDate(subscription.startDate)} />
              <StatusInfo
                label="Date d'expiration"
                value={subscription.endDate ? formatDate(subscription.endDate) : "—"}
              />
              <StatusInfo label="Moyen de paiement" value="Mobile Money" />
              <StatusInfo label="Montant" value="500 FCFA" />
            </div>
            <Button
              className="w-full bg-amber-500 text-white hover:bg-amber-600"
              onClick={onRenew}
            >
              <RotateCcw className="size-4" /> Renouveler
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="flex size-10 items-center justify-center rounded-xl bg-brand-light text-brand">
                <Clock className="size-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-foreground">Compte gratuit</p>
                <Badge className="mt-0.5 border-0 bg-neutral-light text-neutral-foreground">
                  <AlertCircle className="size-3" /> Inactif
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StatusInfo label="Type d'abonnement" value="Gratuit" />
              <StatusInfo label="Statut" value="Inactif" />
              <StatusInfo label="Date de début" value="—" />
              <StatusInfo label="Date d'expiration" value="—" />
              <StatusInfo label="Moyen de paiement" value="—" />
              <StatusInfo label="Montant" value="0 FCFA" />
            </div>
            <Button
              className="w-full bg-brand-gradient text-white hover:opacity-90"
              onClick={onSubscribe}
            >
              <Crown className="size-4" /> S&apos;abonner maintenant
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

function StatusInfo({
  label,
  value,
  success = false,
}: {
  label: string;
  value: string;
  success?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-background px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={cn("mt-0.5 text-sm font-semibold", success ? "text-success" : "text-foreground")}>
        {value}
      </p>
    </div>
  );
}
