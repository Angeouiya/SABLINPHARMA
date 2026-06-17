"use client";

import { useMemo } from "react";
import {
  CheckCircle2,
  Crown,
  ChevronRight,
  Zap,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useNav } from "@/store/nav";
import { useAuth } from "@/store/auth";
import { formatFCFA, formatDate } from "@/lib/format";

const BENEFICES = [
  "Estimations illimitées",
  "Alertes de garde en temps réel",
  "Assistance prioritaire",
];

// Confetti dots (CSS only, simple)
const CONFETTI = [
  { left: "8%", top: "12%", delay: "0s", color: "bg-amber-400", size: "size-2" },
  { left: "18%", top: "6%", delay: "0.4s", color: "bg-brand", size: "size-2.5" },
  { left: "30%", top: "16%", delay: "0.8s", color: "bg-amber-500", size: "size-1.5" },
  { left: "44%", top: "8%", delay: "0.2s", color: "bg-emerald-400", size: "size-2" },
  { left: "58%", top: "14%", delay: "0.6s", color: "bg-amber-400", size: "size-2.5" },
  { left: "70%", top: "6%", delay: "1s", color: "bg-brand-dark", size: "size-1.5" },
  { left: "82%", top: "16%", delay: "0.3s", color: "bg-amber-500", size: "size-2" },
  { left: "92%", top: "10%", delay: "0.7s", color: "bg-emerald-400", size: "size-2.5" },
  { left: "14%", top: "30%", delay: "1.2s", color: "bg-amber-400", size: "size-1.5" },
  { left: "88%", top: "28%", delay: "1.4s", color: "bg-brand", size: "size-2" },
];

export function SuccessView() {
  const { navigate } = useNav();
  const { user } = useAuth();

  // Compute renewal date (1 month from now)
  const renewalDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d;
  }, []);

  return (
    <div className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-4 py-12">
      {/* Soft amber glow top */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -z-10 size-[480px] -translate-x-1/2 rounded-full bg-amber-300/20 blur-3xl" />

      {/* Confetti */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {CONFETTI.map((c, i) => (
          <span
            key={i}
            className={`absolute rounded-full ${c.color} ${c.size} opacity-70`}
            style={{
              left: c.left,
              top: c.top,
              animation: "confetti-fall 3.2s ease-in-out infinite",
              animationDelay: c.delay,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-12px) rotate(0deg); opacity: 0; }
          20% { opacity: 0.8; }
          100% { transform: translateY(60px) rotate(220deg); opacity: 0; }
        }
        @keyframes scale-in {
          0% { transform: scale(0.3); opacity: 0; }
          60% { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div className="flex w-full max-w-xl flex-col items-center text-center">
        {/* Big check */}
        <div className="relative">
          <div className="absolute inset-0 -z-10 animate-pulse rounded-full bg-brand/20 blur-2xl" />
          <div
            className="flex size-24 items-center justify-center rounded-full bg-brand-light ring-8 ring-brand-light/40 sm:size-28"
            style={{ animation: "scale-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both" }}
          >
            <CheckCircle2 className="size-12 text-brand sm:size-14" strokeWidth={2.5} />
          </div>
        </div>

        {/* Title */}
        <h1 className="mt-7 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Paiement réussi !
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
          Vos crédits SABLIN PHARMA ont été rechargés avec succès. Profitez
          pleinement de toutes les fonctionnalités avancées.
        </p>

        {/* Recap card */}
        <Card className="mt-8 w-full border-border/70 p-6 shadow-premium sm:p-7">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="flex items-center justify-center gap-2 text-base font-bold text-foreground">
              <Crown className="size-4 text-amber-500" />
              Récapitulatif de l&apos;abonnement
            </CardTitle>
          </CardHeader>

          <CardContent className="px-0 space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-lg bg-muted/40 px-4 py-2.5">
              <span className="text-muted-foreground">Formule</span>
              <span className="font-bold text-foreground">
                Recharge de crédits
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/40 px-4 py-2.5">
              <span className="text-muted-foreground">Montant</span>
              <span className="font-bold text-foreground">
                {formatFCFA(500)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-brand-light/40 px-4 py-2.5">
              <span className="text-muted-foreground">Statut</span>
              <Badge className="border-0 bg-brand-gradient text-xs font-bold text-white">
                <span className="mr-1 flex size-1.5 rounded-full bg-white/90" />
                Actif
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/40 px-4 py-2.5">
              <span className="text-muted-foreground">Renouvellement</span>
              <span className="font-bold text-foreground">
                dans 1 mois
              </span>
            </div>

            {user && (
              <>
                <Separator className="my-1" />
                <p className="pt-1 text-center text-xs text-muted-foreground">
                  Compte :{" "}
                  <span className="font-semibold text-foreground">
                    {user.name}
                  </span>{" "}
                  · Active jusqu&apos;au{" "}
                  <span className="font-semibold text-foreground">
                    {formatDate(renewalDate)}
                  </span>
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Bénéfices débloqués */}
        <Card className="mt-5 w-full border-brand/30 bg-brand-light p-6 shadow-premium sm:p-7">
          <div className="flex items-center justify-center gap-2">
            <Zap className="size-4 text-brand" />
            <h2 className="text-sm font-bold uppercase tracking-wide text-brand-dark">
              Bénéfices débloqués
            </h2>
          </div>
          <ul className="mt-4 grid gap-2.5 sm:grid-cols-3">
            {BENEFICES.map((b) => (
              <li
                key={b}
                className="flex flex-col items-center gap-2 rounded-xl border border-border/70 bg-background/80 p-3 text-center"
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-brand-light text-brand">
                  <CheckCircle2 className="size-5" />
                </span>
                <span className="text-xs font-semibold leading-tight text-foreground">
                  {b}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Actions */}
        <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            className="bg-brand-gradient text-white hover:opacity-90"
            size="lg"
            onClick={() => navigate("home")}
          >
            Commencer à explorer
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="border-brand/30 text-brand hover:bg-brand-light hover:text-brand-dark"
            onClick={() => navigate("profile")}
          >
            Voir mon profil
          </Button>
        </div>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3.5" />
          Un reçu vous a été envoyé par e-mail.
        </p>
      </div>
    </div>
  );
}
