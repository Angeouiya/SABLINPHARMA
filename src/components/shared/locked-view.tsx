"use client";

import { useNav } from "@/store/nav";
import { LockedFeature } from "@/components/shared/locked-feature";

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
 * n'a pas assez de crédits ni de Pass Ordonnance Unique actif.
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

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-12">
      <LockedFeature
        title={title}
        description={message}
        cost={cost}
        backLabel={backLabel}
        onBack={showBack ? () => navigate(backView) : undefined}
      />
    </div>
  );
}
