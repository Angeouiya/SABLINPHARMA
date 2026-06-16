"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Coins, CheckCircle2, AlertCircle, Loader2, Crown } from "lucide-react";
import { useCredits } from "@/store/credits";
import { useNav } from "@/store/nav";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CreditConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  cost: number;
  description: string;
  benefits: string[];
  onConfirm: () => void;
}

export function CreditConfirmDialog({
  open,
  onOpenChange,
  title,
  cost,
  description,
  benefits,
  onConfirm,
}: CreditConfirmDialogProps) {
  const { credits, debit } = useCredits();
  const { navigate } = useNav();
  const [loading, setLoading] = useState(false);
  const insufficient = credits < cost;

  const handleConfirm = async () => {
    if (insufficient) {
      navigate("wallet");
      onOpenChange(false);
      return;
    }
    setLoading(true);
    const result = await debit(cost, title);
    setLoading(false);
    if (result.success) {
      toast.success(`${cost} crédit${cost > 1 ? "s" : ""} débité${cost > 1 ? "s" : ""}`, {
        description: `Solde restant : ${result.balance} crédits`,
      });
      onOpenChange(false);
      onConfirm();
    } else {
      toast.error(result.error ?? "Solde insuffisant");
      navigate("wallet");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex size-12 items-center justify-center rounded-xl",
                insufficient ? "bg-danger-light text-danger" : "bg-brand-light text-brand"
              )}
            >
              {insufficient ? <AlertCircle className="size-6" /> : <Coins className="size-6" />}
            </span>
            <div>
              <h2 className="text-lg font-extrabold text-foreground">{title}</h2>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>

          {/* Cost info */}
          <div className="mt-4 rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Coût de l'action</span>
              <span className="font-bold text-foreground">{cost} crédit{cost > 1 ? "s" : ""}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Solde actuel</span>
              <span className="font-bold text-foreground">{credits} crédits</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Solde après</span>
              <span className={cn("font-bold", insufficient ? "text-danger" : "text-success")}>
                {Math.max(0, credits - cost)} crédits
              </span>
            </div>
          </div>

          {/* Benefits */}
          <ul className="mt-4 space-y-1.5">
            {benefits.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm text-foreground/80">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand" />
                <span>{b}</span>
              </li>
            ))}
          </ul>

          {/* Actions */}
          <div className="mt-5 flex flex-col gap-2">
            {insufficient ? (
              <>
                <div className="text-center text-sm font-bold text-danger">
                  Solde insuffisant
                </div>
                <Button
                  className="h-11 w-full bg-brand text-white hover:bg-brand-dark"
                  onClick={handleConfirm}
                >
                  Recharger maintenant
                </Button>
                <Button
                  variant="outline"
                  className="h-11 w-full border-amber-500/40 bg-amber-50 text-amber-700 hover:bg-amber-100"
                  onClick={() => {
                    onOpenChange(false);
                    navigate("payment", { passOrdonnance: true });
                  }}
                >
                  Acheter un Pass Ordonnance — 300 FCFA
                </Button>
              </>
            ) : (
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-brand text-white hover:bg-brand-dark"
                  onClick={handleConfirm}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Traitement…
                    </>
                  ) : (
                    <>
                      <Coins className="size-4" /> Confirmer — {cost} crédit{cost > 1 ? "s" : ""}
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Annuler
                </Button>
              </div>
            )}
          </div>

          <p className="mt-3 text-center text-xs text-muted-foreground">
            Vous payez seulement les services avancés. Les recherches simples sont gratuites.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
