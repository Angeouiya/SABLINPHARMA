"use client";

import { Lock, Phone, MessageCircle, Lightbulb, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreditCost } from "@/components/shared/credit-cost";
import { cn } from "@/lib/utils";

interface LockedContactProps {
  type: "phone" | "whatsapp" | "advice" | "confirmAvailability" | "confirmPrice" | "confirmFull";
  cost: number;
  unlocked: boolean;
  onUnlock: () => void;
  /** Valeur à afficher une fois débloquée (ex: numéro de téléphone) */
  value?: string;
  /** Action à exécuter une fois débloquée (ex: ouvrir tel:) */
  action?: () => void;
  actionLabel?: string;
  className?: string;
}

const CONFIG = {
  phone: { icon: Phone, label: "Contact verrouillé", unlockLabel: "Voir contact", actionLabel: "Appeler" },
  whatsapp: { icon: MessageCircle, label: "WhatsApp verrouillé", unlockLabel: "Débloquer WhatsApp", actionLabel: "Ouvrir WhatsApp" },
  advice: { icon: Lightbulb, label: "Conseau pharmacie", unlockLabel: "Demander conseil", actionLabel: "Conseil envoyé" },
  confirmAvailability: { icon: CheckCircle2, label: "Confirmation disponibilité", unlockLabel: "Confirmer disponibilité", actionLabel: "Demande envoyée" },
  confirmPrice: { icon: CheckCircle2, label: "Confirmation prix", unlockLabel: "Confirmer prix", actionLabel: "Demande envoyée" },
  confirmFull: { icon: CheckCircle2, label: "Confirmation complète", unlockLabel: "Confirmation complète", actionLabel: "Demande envoyée" },
} as const;

export function LockedContact({
  type,
  cost,
  unlocked,
  onUnlock,
  value,
  action,
  actionLabel,
  className,
}: LockedContactProps) {
  const config = CONFIG[type];
  const Icon = config.icon;

  // Unlocked state
  if (unlocked) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {value && (
          <span className="text-sm font-bold text-foreground">{value}</span>
        )}
        {action && (
          <Button size="sm" variant="outline" className="border-brand/30 text-brand-dark hover:bg-brand-light" onClick={action}>
            <Icon className="size-3.5" /> {actionLabel ?? config.actionLabel}
          </Button>
        )}
        <span className="inline-flex items-center gap-0.5 rounded-full bg-success-light px-1.5 py-0.5 text-[9px] font-bold text-success">
          <CheckCircle2 className="size-2.5" /> Débloqué
        </span>
      </div>
    );
  }

  // Locked state
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1.5">
        <Lock className="size-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold text-muted-foreground">
          {config.label}
        </span>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="border-brand/30 text-brand-dark hover:bg-brand-light"
        onClick={onUnlock}
      >
        {config.unlockLabel} <CreditCost cost={cost} />
      </Button>
    </div>
  );
}
