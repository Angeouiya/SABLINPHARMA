"use client";

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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { useNav } from "@/store/nav";
import { useAuth } from "@/store/auth";
import { formatFCFA } from "@/lib/format";

const AVANTAGES = [
  "Recherches illimitées et sans publicité",
  "Estimations d'ordonnance illimitées",
  "Alertes pharmacies de garde en temps réel",
  "Comparateur de prix avancé",
  "Priorité sur l'assistance WhatsApp 24/7",
  "Historique des recherches sauvegardé",
];

const COMPARATIF: {
  label: string;
  gratuit: string;
  premium: string;
  premiumOnly?: boolean;
}[] = [
  {
    label: "Recherches de médicaments",
    gratuit: "10 / jour",
    premium: "Illimité",
  },
  {
    label: "Estimation ordonnance",
    gratuit: "3 / mois",
    premium: "Illimité",
  },
  {
    label: "Alertes pharmacies de garde",
    gratuit: "—",
    premium: "Illimité",
    premiumOnly: true,
  },
  {
    label: "Assistance prioritaire",
    gratuit: "—",
    premium: "Incluse",
    premiumOnly: true,
  },
  {
    label: "Sans publicité",
    gratuit: "—",
    premium: "Incluse",
    premiumOnly: true,
  },
];

const FAQ = [
  {
    q: "Comment fonctionne l'abonnement ?",
    a: "L'abonnement Premium est mensuel : vous payez 500 FCFA une fois, et toutes les fonctionnalités avancées sont débloquées pendant 30 jours. À la fin de la période, vous pouvez renouveler manuellement. Aucun prélèvement automatique n'est effectué.",
  },
  {
    q: "Puis-je résilier à tout moment ?",
    a: "Oui. L'abonnement n'est pas reconduit automatiquement. Vous conservez l'accès Premium jusqu'à la fin de la période payée, puis le compte repasse en mode gratuit sans aucune action de votre part.",
  },
  {
    q: "Quels moyens de paiement ?",
    a: "Vous pouvez régler votre abonnement via Mobile Money (Orange Money, MTN MoMo, Moov Money) ou par carte bancaire (Visa, Mastercard). Le paiement est sécurisé et chiffré.",
  },
  {
    q: "Est-ce que je peux acheter des médicaments ?",
    a: "Non. SABLIN PHARMA est une plateforme d'information uniquement. Nous ne vendons aucun médicament. Nous vous aidons à localiser les médicaments dans les pharmacies partenaires et à estimer le coût de votre ordonnance.",
  },
];

export function SubscriptionView() {
  const { navigate } = useNav();
  const { premium } = useAuth();

  return (
    <div className="flex flex-col">
      {/* HEADER */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-background to-brand-light/40">
        <div className="absolute -right-16 -top-16 size-72 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 size-80 rounded-full bg-brand/10 blur-3xl" />

        <div className="relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          {/* Back link */}
          <button
            onClick={() => navigate("home")}
            className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-brand"
          >
            <ChevronLeft className="size-4" />
            Retour à l&apos;accueil
          </button>

          <div className="mx-auto mt-6 max-w-2xl text-center">
            <Badge className="mx-auto inline-flex items-center gap-1.5 border-0 bg-gradient-to-br from-amber-400 to-amber-500 px-3 py-1 text-xs font-bold text-white shadow-premium">
              <Crown className="size-3.5" />
              Premium
            </Badge>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Abonnement Premium{" "}
              <span className="text-brand-dark">SABLIN PHARMA</span>
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Débloquez toutes les fonctionnalités avancées et profitez d&apos;une
              expérience sans limite pour gérer votre santé au quotidien.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        {/* MAIN GRID */}
        <div className="grid gap-8 lg:grid-cols-[1fr_400px] lg:gap-10">
          {/* LEFT — Avantages + image */}
          <div className="flex flex-col gap-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-xl bg-brand-light text-brand">
                  <Zap className="size-5" />
                </span>
                <h2 className="text-xl font-extrabold text-foreground sm:text-2xl">
                  Ce que vous obtenez
                </h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Des outils exclusifs pour gagner du temps et prendre de meilleures
                décisions santé.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {AVANTAGES.map((a, i) => (
                <Card
                  key={a}
                  className="group flex items-start gap-3 border-border/70 p-4 transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-premium"
                >
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand transition-transform group-hover:scale-110">
                    <CheckCircle2 className="size-4" />
                  </span>
                  <div className="flex-1">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                      Avantage {i + 1}
                    </span>
                    <p className="text-sm font-semibold leading-snug text-foreground">
                      {a}
                    </p>
                  </div>
                </Card>
              ))}
            </div>

            {/* Illustration */}
            <Card className="relative overflow-hidden border-border/70 p-0">
              <div className="grid items-center gap-0 sm:grid-cols-[1.2fr_1fr]">
                <div className="p-6 sm:p-8">
                  <Badge className="border-0 bg-brand-light text-xs font-semibold text-brand-dark">
                    <Clock className="size-3" /> Disponibilité 24/7
                  </Badge>
                  <h3 className="mt-3 text-lg font-extrabold text-foreground sm:text-xl">
                    Soyez informé en temps réel
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Recevez des alertes instantanées lorsque les pharmacies de
                    garde ouvrent près de chez vous. Ne ratez plus jamais une
                    pharmacie ouverte la nuit ou le week-end.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4 border-brand/30 text-brand hover:bg-brand-light hover:text-brand-dark"
                    onClick={() => navigate("pharmacies", { filter: "on-duty" })}
                  >
                    Voir les pharmacies de garde
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
                <div className="relative h-44 overflow-hidden sm:h-full">
                  <img
                    src="/images/pharmacist.png"
                    alt="Pharmacien SABLIN PHARMA"
                    className="size-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent sm:from-card" />
                </div>
              </div>
            </Card>
          </div>

          {/* RIGHT — Pricing card (sticky) */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <Card className="relative overflow-hidden border-amber-500/30 bg-gradient-to-br from-amber-50 via-card to-card p-0 shadow-premium-lg">
              <div className="absolute -right-10 -top-10 size-44 rounded-full bg-amber-300/30 blur-3xl" />
              <div className="absolute -bottom-12 -left-10 size-44 rounded-full bg-brand/10 blur-3xl" />

              <div className="relative flex h-full flex-col p-6 sm:p-7">
                <div className="flex items-center justify-between">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-premium">
                    <Crown className="size-6" />
                  </span>
                  <Badge className="border-0 bg-amber-500 text-[11px] font-bold text-white">
                    Offre mensuelle
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

                {premium ? (
                  <div className="flex flex-1 flex-col gap-4">
                    <div className="flex items-center gap-3 rounded-xl bg-brand-light/60 p-4">
                      <CheckCircle2 className="size-6 shrink-0 text-brand" />
                      <div>
                        <p className="text-sm font-bold text-foreground">
                          Vous êtes Premium
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Votre abonnement est actif. Profitez pleinement de
                          toutes les fonctionnalités.
                        </p>
                      </div>
                    </div>
                    <ul className="space-y-2 text-sm">
                      {AVANTAGES.slice(0, 4).map((a) => (
                        <li key={a} className="flex items-start gap-2">
                          <Check className="mt-0.5 size-4 shrink-0 text-brand" />
                          <span className="text-foreground/80">{a}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="mt-auto w-full bg-brand-gradient text-white hover:opacity-90"
                      size="lg"
                      onClick={() => navigate("home")}
                    >
                      Retour à l&apos;accueil
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col gap-4">
                    <ul className="space-y-2 text-sm">
                      {AVANTAGES.map((a) => (
                        <li key={a} className="flex items-start gap-2">
                          <Check className="mt-0.5 size-4 shrink-0 text-amber-600" />
                          <span className="text-foreground/80">{a}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="mt-auto w-full bg-gradient-to-br from-amber-400 to-amber-600 text-white hover:opacity-90"
                      size="lg"
                      onClick={() => navigate("payment")}
                    >
                      <Crown className="size-4" />
                      S&apos;abonner maintenant
                    </Button>
                    <p className="text-center text-[11px] text-muted-foreground">
                      Sans engagement · Paiement sécurisé · Résiliable à tout
                      moment
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Trust badge */}
            <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-border/70 bg-card/60 p-3 text-xs text-muted-foreground">
              <ShieldCheck className="size-4 text-brand" />
              Paiement chiffré et 100% sécurisé
            </div>
          </div>
        </div>

        {/* COMPARATIF */}
        <section className="mt-14">
          <div className="text-center">
            <h2 className="text-2xl font-extrabold text-foreground sm:text-3xl">
              Gratuit vs{" "}
              <span className="text-amber-600">Premium</span>
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Comparez les fonctionnalités et choisissez l&apos;offre qui vous
              convient.
            </p>
          </div>

          <Card className="mt-6 overflow-hidden border-border/70 p-0">
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
                          <span className="inline-flex items-center justify-center">
                            <X className="size-4 text-muted-foreground/60" />
                            <span className="sr-only">Non inclus</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            {row.gratuit}
                          </span>
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
                    <td className="px-5 py-4 font-bold text-foreground">
                      Prix mensuel
                    </td>
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

        {/* FAQ */}
        <section className="mt-14">
          <div className="text-center">
            <h2 className="text-2xl font-extrabold text-foreground sm:text-3xl">
              Questions fréquentes
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Tout ce que vous devez savoir avant de vous abonner.
            </p>
          </div>

          <Card className="mx-auto mt-6 max-w-3xl border-border/70 p-6 sm:p-8">
            <Accordion type="single" collapsible className="w-full">
              {FAQ.map((item, i) => (
                <AccordionItem key={item.q} value={`item-${i}`}>
                  <AccordionTrigger className="text-left text-sm font-semibold text-foreground sm:text-base">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
        </section>

        {/* CTA FINAL */}
        {!premium && (
          <section className="mt-14">
            <Card className="relative overflow-hidden border-amber-500/30 bg-gradient-to-br from-amber-50 via-card to-brand-light/40 p-8 text-center shadow-premium sm:p-10">
              <div className="absolute -right-12 -top-12 size-48 rounded-full bg-amber-300/20 blur-3xl" />
              <div className="absolute -bottom-12 -left-12 size-48 rounded-full bg-brand/10 blur-3xl" />
              <div className="relative">
                <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-premium">
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
                  className="mt-6 bg-gradient-to-br from-amber-400 to-amber-600 text-white hover:opacity-90"
                  size="lg"
                  onClick={() => navigate("payment")}
                >
                  <Crown className="size-4" />
                  S&apos;abonner maintenant
                </Button>
              </div>
            </Card>
          </section>
        )}
      </div>
    </div>
  );
}
