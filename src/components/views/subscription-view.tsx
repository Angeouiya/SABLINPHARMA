"use client";

import {
  ChevronLeft,
  CheckCircle2,
  ClipboardList,
  Coins,
  Lock,
  Search,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNav } from "@/store/nav";
import { useCredits, CREDIT_PACKS, PAID_FEATURES } from "@/store/credits";
import { formatFCFA } from "@/lib/format";

export function SubscriptionView() {
  const { navigate } = useNav();
  const { credits, hasPass } = useCredits();

  return (
    <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-5 lg:px-6 lg:py-6">
      <button
        onClick={() => navigate("home")}
        className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-brand"
      >
        <ChevronLeft className="size-4" />
        Accueil
      </button>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card className="border-border/80 p-4 shadow-card sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-brand">Crédits & Pass</p>
              <h1 className="mt-1 text-2xl font-extrabold text-foreground sm:text-3xl">
                Services avancés SABLIN PHARMA
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Les recherches simples restent accessibles. Les actions avancées utilisent des crédits SABLIN ou un Pass Ordonnance Unique.
              </p>
            </div>
            <Badge className="w-fit rounded-md bg-brand text-white">
              Solde : {credits} crédit{credits > 1 ? "s" : ""}
            </Badge>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <InfoCard icon={Search} title="Fonctions simples" text="Recherche et informations générales accessibles." />
            <InfoCard icon={Coins} title="Crédits SABLIN" text="1 crédit = 100 FCFA. Le coût est affiché avant validation." />
            <InfoCard icon={ClipboardList} title="Pass Ordonnance Unique" text="500 FCFA. Valable pour une seule ordonnance." />
          </div>
        </Card>

        <Card className="border-brand/20 bg-brand p-4 text-white shadow-card sm:p-5">
          <span className="flex size-10 items-center justify-center rounded-lg bg-white/15">
            <Wallet className="size-5" />
          </span>
          <p className="mt-4 text-sm font-semibold text-white/80">Votre solde</p>
          <p className="mt-1 text-3xl font-extrabold">
            {credits} crédit{credits > 1 ? "s" : ""}
          </p>
          <p className="mt-1 text-xs text-white/75">Aucun crédit n'est débité sans confirmation.</p>
          <Button
            className="mt-4 w-full bg-white text-brand-dark hover:bg-white/90"
            onClick={() => navigate("wallet")}
          >
            Recharger mes crédits
          </Button>
        </Card>
      </div>

      <section className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card className="border-border/80 p-4 shadow-card sm:p-5">
          <h2 className="text-lg font-extrabold text-foreground">Packs de recharge</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {CREDIT_PACKS.map((pack) => (
              <div key={pack.amount} className="rounded-lg border border-border bg-background p-3">
                <p className="text-sm font-extrabold text-foreground">{formatFCFA(pack.amount)}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {pack.credits} crédit{pack.credits > 1 ? "s" : ""}
                </p>
                {pack.popular ? (
                  <Badge className="mt-2 rounded-md bg-warning text-warning-foreground">
                    Bonus inclus
                  </Badge>
                ) : null}
                <Button
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => navigate("payment", { packAmount: pack.amount })}
                >
                  Recharger
                </Button>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border-border/80 p-4 shadow-card sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-foreground">Pass Ordonnance Unique</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Valable pour une seule ordonnance. Après estimation et comparaison des pharmacies, le pass expire automatiquement.
              </p>
            </div>
            <Badge className="shrink-0 rounded-md bg-brand text-white">500 FCFA</Badge>
          </div>
          <div className="mt-4 rounded-lg border border-warning/30 bg-warning-light p-3">
            <p className="text-sm font-bold text-warning-foreground">
              Ce pass est un achat unique : une ordonnance, une seule utilisation.
            </p>
          </div>
          {hasPass ? (
            <Badge className="mt-4 rounded-md bg-success text-success-foreground">
              <CheckCircle2 className="size-3" /> Pass actif
            </Badge>
          ) : null}
          <Button
            className="mt-4 w-full"
            onClick={() => navigate("payment", { passOrdonnance: true })}
          >
            Acheter le Pass Ordonnance Unique
          </Button>
        </Card>
      </section>

      <section className="mt-4">
        <Card className="border-border/80 p-4 shadow-card sm:p-5">
          <h2 className="text-lg font-extrabold text-foreground">Services payants</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {PAID_FEATURES.map((feature) => (
              <div key={feature.label} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2.5">
                <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground">
                  <Lock className="size-4 shrink-0 text-brand" />
                  <span>{feature.label}</span>
                </span>
                {"isPass" in feature && feature.isPass ? (
                  <Badge className="shrink-0 rounded-md bg-warning text-warning-foreground">500 FCFA</Badge>
                ) : (
                  <Badge className="shrink-0 rounded-md bg-brand-light text-brand-dark">
                    {feature.cost} crédit{feature.cost > 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Search;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <Icon className="size-5 text-brand" />
      <p className="mt-2 text-sm font-extrabold text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{text}</p>
    </div>
  );
}
