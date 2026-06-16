"use client";

import { useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Coins,
  Wallet,
  CheckCircle2,
  Receipt,
  Zap,
  Info,
  ClipboardList,
  Plus,
  Lock,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Heading,
  Eyebrow,
  Muted,
} from "@/components/ui/typography";
import { CreditCost, PassBadge } from "@/components/shared/credit-cost";
import { EmptyState } from "@/components/shared/empty-state";
import { useNav } from "@/store/nav";
import { useAuth } from "@/store/auth";
import {
  useCredits,
  CREDIT_PACKS,
  FREE_FEATURES,
  PAID_FEATURES,
} from "@/store/credits";
import { formatDate, formatFCFA } from "@/lib/format";
import { cn } from "@/lib/utils";

const FCFA_PER_CREDIT = 100;

export function WalletView() {
  const { navigate } = useNav();
  const { user } = useAuth();
  const { credits, transactions, hasPass, fetch, loading } = useCredits();

  const packsRef = useRef<HTMLDivElement>(null);
  const tariffsRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const estimatedFCFA = credits * FCFA_PER_CREDIT;

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ---------- Not logged in ----------
  if (!user) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col items-center justify-center px-4 py-12">
        <Card className="w-full border-border/70 p-8 text-center shadow-premium">
          <div className="mx-auto mb-5 flex size-20 items-center justify-center rounded-full bg-brand-light">
            <Wallet className="size-10 text-brand" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Connectez-vous pour accéder à votre portefeuille
          </h1>
          <p className="mt-2 text-sm leading-relaxed break-words text-muted-foreground">
            Connectez-vous pour recharger vos crédits, acheter le Pass Ordonnance
            et suivre votre historique de transactions SABLIN PHARMA.
          </p>
          <div className="mt-6 flex flex-col gap-2.5">
            <Button
              onClick={() => navigate("auth", { authMode: "login" })}
              className="h-11 w-full bg-brand text-base font-semibold text-white shadow-premium transition-all hover:bg-brand-dark hover:shadow-premium-lg"
            >
              Se connecter
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("auth", { authMode: "register" })}
              className="h-11 w-full border-brand/30 text-base font-semibold text-brand transition-colors hover:bg-brand-light"
            >
              Créer un compte
            </Button>
          </div>
          <button
            type="button"
            onClick={() => navigate("home")}
            className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-brand"
          >
            <ChevronLeft className="size-4" />
            Retour à l&apos;accueil
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back link */}
      <button
        onClick={() => navigate("home")}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-brand"
      >
        <ChevronLeft className="size-4" /> Accueil
      </button>

      {/* ============ HEADER ============ */}
      <header className="mb-6">
        <Eyebrow>
          <Wallet className="size-3.5" /> Gestion des crédits
        </Eyebrow>
        <Heading level="h1" className="mt-2 text-foreground">
          Mon portefeuille
        </Heading>
        <Muted className="mt-1.5 max-w-2xl">
          Rechargez vos crédits et gérez vos services avancés.
        </Muted>
      </header>

      {/* ============ SOLDE ACTUEL ============ */}
      <Card className="border-border/70 bg-brand-light p-6 shadow-premium sm:p-7">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="flex size-10 items-center justify-center rounded-xl bg-brand text-white">
                <Coins className="size-5" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-brand-dark/70">
                  Solde actuel
                </p>
                <p className="text-sm font-medium text-brand-dark/80">
                  Compte {user.name}
                </p>
              </div>
            </div>

            <div className="mt-4">
              {loading ? (
                <Skeleton className="h-12 w-40" />
              ) : (
                <p className="text-4xl font-extrabold tabular-nums text-brand-dark">
                  {credits}{" "}
                  <span className="text-xl font-bold">
                    crédit{credits > 1 ? "s" : ""}
                  </span>
                </p>
              )}
              <p className="mt-1 text-sm font-semibold text-brand-dark/80">
                ≈ {formatFCFA(estimatedFCFA)}
                <span className="ml-1 font-normal text-brand-dark/60">
                  (1 crédit ≈ {FCFA_PER_CREDIT} FCFA)
                </span>
              </p>
            </div>

            <p className="mt-3 max-w-md text-sm leading-relaxed text-brand-dark/80">
              Les recherches simples sont gratuites. Les services avancés
              utilisent vos crédits.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                onClick={() => scrollTo(packsRef)}
                className="bg-brand text-white hover:bg-brand-dark"
              >
                <Plus className="size-4" /> Recharger
              </Button>
              <Button
                variant="outline"
                onClick={() => scrollTo(tariffsRef)}
                className="border-brand/30 text-brand-dark hover:bg-brand"
              >
                <Receipt className="size-4" /> Voir les tarifs
              </Button>
            </div>
          </div>

          {/* Pass Ordonnance status badge */}
          <div className="shrink-0 rounded-2xl border border-amber-500/30 bg-amber-50 p-4 sm:w-48">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-amber-500 text-white">
                <ClipboardList className="size-4" />
              </span>
              <p className="text-sm font-bold text-amber-900">Pass Ordonnance</p>
            </div>
            {hasPass ? (
              <div className="mt-2">
                <Badge className="border-0 bg-success text-white">
                  <CheckCircle2 className="size-3" /> Actif
                </Badge>
                <p className="mt-1.5 text-xs text-amber-800">
                  Estimation complète disponible sans crédits.
                </p>
              </div>
            ) : (
              <p className="mt-2 text-xs text-amber-800">
                Non activé. Découvrez-le plus bas.
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* ============ MESSAGES PÉDAGOGIQUES ============ */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <InfoNote
          icon={CheckCircle2}
          title="Aucun abonnement obligatoire"
          desc="SABLIN PHARMA fonctionne sans abonnement forcé."
        />
        <InfoNote
          icon={Zap}
          title="Vous payez seulement les services avancés"
          desc="Recherches et consultations restent gratuites."
        />
        <InfoNote
          icon={Coins}
          title="Rechargez vos crédits quand vous voulez"
          desc="Aucune limite de temps ni d&apos;engagement."
        />
      </div>

      {/* ============ PACKS DE RECHARGE ============ */}
      <section ref={packsRef} className="mt-10 scroll-mt-6">
        <SectionTitle icon={Plus} title="Packs de recharge" />
        <Muted className="mb-4">
          Choisissez un pack adapté à vos besoins. Les crédits n&apos;expirent pas.
        </Muted>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CREDIT_PACKS.map((pack) => (
            <Card
              key={pack.amount}
              className={cn(
                "relative flex flex-col border-border/70 p-5 transition-all hover:-translate-y-0.5 hover:shadow-premium",
                pack.popular && "border-brand/50 ring-1 ring-brand/30"
              )}
            >
              {pack.popular && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-premium">
                  Populaire
                </span>
              )}
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {pack.label}
              </p>
              <p className="mt-2 text-2xl font-extrabold tabular-nums text-brand-dark">
                {formatFCFA(pack.amount)}
              </p>
              <div className="mt-3 flex items-center gap-1.5">
                <Coins className="size-4 text-brand" />
                <span className="text-lg font-bold text-foreground">
                  {pack.credits} crédit{pack.credits > 1 ? "s" : ""}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Soit {Math.round((pack.credits / pack.amount) * 100)} FCFA / crédit
              </p>
              <Button
                onClick={() => navigate("payment", { packAmount: pack.amount })}
                className={cn(
                  "mt-4 w-full",
                  pack.popular
                    ? "bg-brand text-white hover:bg-brand-dark"
                    : "bg-brand-light text-brand-dark hover:bg-brand hover:text-white"
                )}
              >
                Recharger <ChevronRight className="size-4" />
              </Button>
            </Card>
          ))}
        </div>
      </section>

      {/* ============ PASS ORDONNANCE ============ */}
      <section className="mt-10">
        <SectionTitle icon={ClipboardList} title="Pass Ordonnance" />
        <Card className="border-amber-500/30 bg-amber-50 p-6 shadow-premium">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-amber-500 text-white">
                  <ClipboardList className="size-6" />
                </span>
                <div>
                  <h3 className="text-lg font-extrabold text-foreground">
                    Pass Ordonnance
                  </h3>
                  <p className="text-sm text-amber-800">
                    Estimation complète sans crédits, pour usage occasionnel
                  </p>
                </div>
              </div>

              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {[
                  "Estimation complète de votre ordonnance",
                  "Liste des pharmacies disponibles",
                  "Comparaison simple des prix",
                  "Sauvegarde de l'estimation",
                ].map((b) => (
                  <li
                    key={b}
                    className="flex items-start gap-2 text-sm text-amber-900"
                  >
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-amber-600" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="shrink-0 sm:text-right">
              <p className="text-xs font-bold uppercase tracking-wide text-amber-800">
                Prix unique
              </p>
              <p className="mt-1 text-3xl font-extrabold tabular-nums text-amber-900">
                300 FCFA
              </p>
              <p className="mt-0.5 text-xs text-amber-700">Valable à vie</p>
              <Button
                onClick={() => navigate("payment", { passOrdonnance: true })}
                className="mt-4 w-full bg-amber-500 text-white hover:bg-amber-600 sm:w-auto"
              >
                Acheter le Pass — 300 FCFA
              </Button>
            </div>
          </div>

          {hasPass && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-success/30 bg-success-light/40 px-3 py-2 text-sm text-success">
              <CheckCircle2 className="size-4" />
              <span className="font-semibold">
                Vous possédez déjà le Pass Ordonnance.
              </span>
            </div>
          )}
        </Card>
      </section>

      {/* ============ FONCTIONNALITÉS & TARIFS ============ */}
      <section ref={tariffsRef} className="mt-10 scroll-mt-6">
        <SectionTitle icon={Receipt} title="Fonctionnalités & Tarifs" />
        <Muted className="mb-4">
          Tout ce que vous pouvez faire sur SABLIN PHARMA, et ce que ça coûte.
        </Muted>

        <Card className="overflow-hidden border-border/70 p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40">
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Fonctionnalité
                  </th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Description
                  </th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Type d&apos;accès
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Coût
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Free features */}
                {FREE_FEATURES.map((feat) => (
                  <tr
                    key={feat}
                    className="border-b border-border/40 last:border-0"
                  >
                    <td className="px-4 py-3 align-top font-semibold text-foreground">
                      {feat}
                    </td>
                    <td className="px-4 py-3 align-top text-muted-foreground">
                      Accès libre, sans connexion requise
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className="inline-flex items-center gap-1 rounded-full bg-success-light px-2 py-0.5 text-[11px] font-bold text-success">
                        <CheckCircle2 className="size-3" /> Gratuit
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right align-top">
                      <span className="text-xs font-bold text-success">0 FCFA</span>
                    </td>
                  </tr>
                ))}
                {/* Paid features */}
                {PAID_FEATURES.map((feat) => (
                  <tr
                    key={feat.label}
                    className="border-b border-border/40 last:border-0"
                  >
                    <td className="px-4 py-3 align-top font-semibold text-foreground">
                      {feat.label}
                    </td>
                    <td className="px-4 py-3 align-top text-muted-foreground">
                      {feat.desc}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {"isPass" in feat && feat.isPass ? (
                        <PassBadge />
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-light px-2 py-0.5 text-[11px] font-bold text-brand-dark">
                          <Coins className="size-3" /> Crédits
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right align-top">
                      {"isPass" in feat && feat.isPass ? (
                        <span className="text-xs font-bold text-amber-700">
                          300 FCFA
                        </span>
                      ) : (
                        <CreditCost cost={feat.cost} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* ============ SERVICES BLOQUÉS SANS CRÉDITS ============ */}
      <section className="mt-10">
        <SectionTitle icon={Lock} title="Services bloqués sans crédits" />
        <Muted className="mb-4">
          Ces services nécessitent des crédits ou le Pass Ordonnance pour fonctionner.
        </Muted>
        <Card className="border-border/70 p-5">
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {[
              "Module Ordonnance",
              "Ajout de médicament à une ordonnance",
              "Estimation complète",
              "Meilleure pharmacie",
              "Comparaison des prix",
              "Disponibilité réelle par pharmacie",
              "Confirmation avant déplacement",
              "Alertes de disponibilité",
            ].map((s) => (
              <li
                key={s}
                className="flex items-start gap-2.5 rounded-lg bg-muted/30 px-3 py-2.5 text-sm font-medium text-foreground/85"
              >
                <Lock className="mt-0.5 size-4 shrink-0 text-danger" />
                <span>{s}</span>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex flex-col gap-3 rounded-xl border border-brand/20 bg-brand-light/40 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-brand-dark">
              Rechargez vos crédits à partir de 200 FCFA ou achetez un Pass Ordonnance à 300 FCFA pour débloquer ces services.
            </p>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button
                size="sm"
                className="bg-brand text-white hover:bg-brand-dark"
                onClick={() => scrollTo(packsRef)}
              >
                <Plus className="size-4" /> Recharger
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-amber-500/40 bg-amber-50 text-amber-700 hover:bg-amber-100"
                onClick={() => navigate("payment", { passOrdonnance: true })}
              >
                <Crown className="size-4" /> Acheter un Pass
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* ============ HISTORIQUE DES CRÉDITS ============ */}
      <section ref={historyRef} className="mt-10 scroll-mt-6">
        <SectionTitle
          icon={Receipt}
          title="Historique des crédits"
        />
        <Muted className="mb-4">
          Suivez vos recharges et débits de crédits.
        </Muted>

        {loading ? (
          <Card className="divide-y divide-border/40 border-border/70 p-0">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <Skeleton className="size-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </Card>
        ) : transactions.length === 0 ? (
          <Card className="border-border/70 p-0">
            <EmptyState
              icon={Receipt}
              title="Aucune transaction pour le moment"
              description="Vos recharges et débits de crédits apparaîtront ici. Rechargez votre portefeuille pour commencer à utiliser les services avancés."
              action={{
                label: "Recharger maintenant",
                onClick: () => scrollTo(packsRef),
              }}
            />
          </Card>
        ) : (
          <Card className="divide-y divide-border/40 border-border/70 p-0">
            {transactions.map((t) => {
              const positive = t.amount >= 0;
              return (
                <div
                  key={t.id}
                  className="flex items-center gap-3 p-4 transition-colors hover:bg-muted/30"
                >
                  <span
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-xl",
                      positive
                        ? "bg-success-light text-success"
                        : "bg-brand-light text-brand-dark"
                    )}
                  >
                    {positive ? <Plus className="size-5" /> : <Coins className="size-5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {t.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <span className="capitalize">{t.type}</span>
                      {" · "}
                      {formatDate(t.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={cn(
                        "text-sm font-extrabold tabular-nums",
                        positive ? "text-success" : "text-foreground"
                      )}
                    >
                      {positive ? "+" : "−"}
                      {Math.abs(t.amount)} crédit{Math.abs(t.amount) > 1 ? "s" : ""}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Solde : {t.balanceAfter}
                    </p>
                  </div>
                </div>
              );
            })}
          </Card>
        )}
      </section>

      {/* ============ ASSISTANCE ============ */}
      <Card className="mt-8 flex flex-col items-start gap-3 border-border/70 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand">
            <Info className="size-5" />
          </span>
          <div>
            <p className="text-sm font-bold text-foreground">
              Besoin d&apos;aide avec vos crédits ?
            </p>
            <p className="text-sm text-muted-foreground">
              Notre équipe support répond à toutes vos questions sur la
              facturation et les services avancés.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="border-brand/30 text-brand-dark hover:bg-brand-light"
          onClick={() => navigate("settings")}
        >
          Contacter le support <ChevronRight className="size-4" />
        </Button>
      </Card>
    </div>
  );
}

/* ============================================================
   SectionTitle — en-tête de section
   ============================================================ */
function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: typeof Coins;
  title: string;
}) {
  return (
    <div className="mb-2 flex items-center gap-2.5">
      <span className="flex size-9 items-center justify-center rounded-xl bg-brand-light text-brand">
        <Icon className="size-5" />
      </span>
      <h2 className="text-xl font-extrabold tracking-tight text-foreground">
        {title}
      </h2>
    </div>
  );
}

/* ============================================================
   InfoNote — petit message pédagogique
   ============================================================ */
function InfoNote({
  icon: Icon,
  title,
  desc,
}: {
  icon: typeof Info;
  title: string;
  desc: string;
}) {
  return (
    <Card className="flex items-start gap-3 border-border/70 p-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand">
        <Icon className="size-5" />
      </span>
      <div>
        <p className="text-sm font-bold text-foreground">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed break-words text-muted-foreground">
          {desc}
        </p>
      </div>
    </Card>
  );
}
