"use client";

import { Lock, Coins, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CreditCostBadge } from "@/components/shared/credit-cost";
import { useAuth } from "@/store/auth";
import { useCredits } from "@/store/credits";
import { useNav } from "@/store/nav";
import { cn } from "@/lib/utils";

interface LockedFeatureProps {
  title: string;
  description: string;
  cost?: number;
  showPassAction?: boolean;
  className?: string;
  backLabel?: string;
  onBack?: () => void;
}

export function LockedFeature({
  title,
  description,
  cost,
  showPassAction = true,
  className,
  backLabel = "Retour",
  onBack,
}: LockedFeatureProps) {
  const { navigate } = useNav();
  const user = useAuth((s) => s.user);
  const credits = useCredits((s) => s.credits);
  const isLoggedIn = !!user;

  return (
    <Card className={cn("w-full border-border/70 p-6 text-center shadow-avance sm:p-8", className)}>
      <span className="mx-auto flex size-14 items-center justify-center rounded-xl bg-muted text-muted-foreground sm:size-16">
        <Lock className="size-7 sm:size-8" />
      </span>

      <h2 className="mt-4 text-xl font-extrabold text-foreground">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>

      {isLoggedIn ? (
        <div className="mt-4 rounded-xl border border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">Coût nécessaire</span>
            {cost !== undefined ? (
              <CreditCostBadge cost={cost} />
            ) : (
              <CreditCostBadge variant="locked" label="Nécessite crédits" />
            )}
          </div>
          <div className="mt-2 flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">Solde actuel</span>
            <span className={cn("font-bold", credits > 0 ? "text-foreground" : "text-danger")}>
              {credits} crédit{credits > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-brand/20 bg-brand-light p-4 text-sm font-semibold text-brand-dark">
          Connectez-vous pour consulter votre solde, acheter des crédits SABLIN ou utiliser un Pass Ordonnance Unique.
        </div>
      )}

      <div className="mt-5 flex flex-col gap-2">
        {isLoggedIn ? (
          <>
            <Button className="h-11 w-full bg-brand text-white hover:bg-brand-dark" onClick={() => navigate("wallet")}>
              <Coins className="size-4" /> Recharger mes crédits
            </Button>
            {showPassAction && (
              <Button
                variant="outline"
                className="h-11 w-full border-brand/30 text-brand-dark hover:bg-brand-light"
                onClick={() => navigate("payment", { passOrdonnance: true })}
              >
                <ClipboardList className="size-4" /> Acheter un Pass Ordonnance Unique — 500 FCFA
              </Button>
            )}
          </>
        ) : (
          <Button
            className="h-11 w-full bg-brand text-white hover:bg-brand-dark"
            onClick={() => navigate("auth", { authMode: "login" })}
          >
            Se connecter / S'inscrire
          </Button>
        )}
        {onBack && (
          <Button variant="ghost" className="h-11 w-full" onClick={onBack}>
            {backLabel}
          </Button>
        )}
      </div>
    </Card>
  );
}
