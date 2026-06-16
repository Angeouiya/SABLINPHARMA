"use client";

import { Lock, Coins, Crown, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNav } from "@/store/nav";
import { useCredits } from "@/store/credits";

interface LockedViewProps {
  title?: string;
  message?: string;
  cost?: number;
  showBack?: boolean;
  backLabel?: string;
  backView?: import("@/lib/types").View;
}

/**
 * Page verrouillée professionnelle — affichée quand l'utilisateur
 * n'a pas assez de crédits ni de Pass Ordonnance actif.
 */
export function LockedView({
  title = "Fonctionnalité verrouillée",
  message = "Vous devez disposer de crédits pour utiliser ce service.",
  cost,
  showBack = true,
  backLabel = "Retour à l'accueil",
  backView = "home",
}: LockedViewProps) {
  const { navigate } = useNav();
  const credits = useCredits((s) => s.credits);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-12">
      <Card className="w-full border-border/70 p-8 text-center shadow-premium">
        {/* Lock icon */}
        <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Lock className="size-8" />
        </span>

        <h1 className="mt-5 text-xl font-extrabold text-foreground sm:text-2xl">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {message}
        </p>

        {/* Cost + balance */}
        {cost !== undefined && (
          <div className="mt-4 rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Coût nécessaire</span>
              <span className="font-bold text-foreground">
                {cost} crédit{cost > 1 ? "s" : ""}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Votre solde</span>
              <span className="font-bold text-danger">
                {credits} crédit{credits > 1 ? "s" : ""}
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-5 flex flex-col gap-2.5">
          <Button
            className="h-11 w-full bg-brand text-white hover:bg-brand-dark"
            onClick={() => navigate("wallet")}
          >
            <Coins className="size-4" /> Recharger maintenant
          </Button>
          <Button
            variant="outline"
            className="h-11 w-full border-amber-500/40 bg-amber-50 text-amber-700 hover:bg-amber-100"
            onClick={() => navigate("payment", { passOrdonnance: true })}
          >
            <Crown className="size-4" /> Acheter un Pass Ordonnance — 300 FCFA
          </Button>
        </div>

        {/* Help text */}
        <p className="mt-4 text-xs text-muted-foreground">
          Aucun crédit ne sera débité sans confirmation. Les crédits servent
          uniquement aux services avancés.
        </p>

        {showBack && (
          <button
            onClick={() => navigate(backView)}
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-brand"
          >
            <ChevronLeft className="size-4" /> {backLabel}
          </button>
        )}
      </Card>
    </div>
  );
}
