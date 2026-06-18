"use client";

import { useState, type ReactNode } from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { Loader2, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LogoutConfirmDialogProps = {
  children?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onConfirm: () => Promise<void> | void;
  title?: string;
  description?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  className?: string;
};

export function LogoutConfirmDialog({
  children,
  open,
  onOpenChange,
  onConfirm,
  title = "Confirmer la déconnexion",
  description = "Voulez-vous vraiment vous déconnecter de cet espace ? Vous pourrez vous reconnecter à tout moment.",
  cancelLabel = "Non, rester connecté",
  confirmLabel = "Oui, me déconnecter",
  className,
}: LogoutConfirmDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  const updateOpen = (nextOpen: boolean) => {
    if (pending && !nextOpen) return;
    onOpenChange?.(nextOpen);
    if (!isControlled) setInternalOpen(nextOpen);
  };

  const confirmLogout = async () => {
    setPending(true);
    try {
      await onConfirm();
      updateOpen(false);
    } finally {
      setPending(false);
    }
  };

  return (
    <AlertDialogPrimitive.Root open={isOpen} onOpenChange={updateOpen}>
      {children ? (
        <AlertDialogPrimitive.Trigger asChild>{children}</AlertDialogPrimitive.Trigger>
      ) : null}

      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="fixed inset-0 z-[80] bg-slate-950/35 backdrop-blur-md data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <AlertDialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-[81] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-950 shadow-2xl outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            className
          )}
        >
          <div className="flex items-start gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-700">
              <LogOut className="size-5" />
            </span>
            <div className="min-w-0">
              <AlertDialogPrimitive.Title className="text-lg font-extrabold tracking-tight text-slate-950">
                {title}
              </AlertDialogPrimitive.Title>
              <AlertDialogPrimitive.Description className="mt-1 text-sm leading-relaxed text-slate-600">
                {description}
              </AlertDialogPrimitive.Description>
            </div>
          </div>

          <div className="px-5 py-4 sm:px-6">
            <p className="rounded-xl border border-brand/20 bg-brand-light/60 px-3 py-2 text-xs font-bold leading-relaxed text-brand-dark">
              Votre session sera fermée uniquement si vous confirmez cette action.
            </p>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 pb-5 pt-4 sm:flex-row sm:justify-end sm:px-6 sm:pb-6">
            <AlertDialogPrimitive.Cancel asChild>
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 sm:w-auto"
              >
                {cancelLabel}
              </Button>
            </AlertDialogPrimitive.Cancel>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={() => void confirmLogout()}
              className="w-full bg-red-600 text-white hover:bg-red-700 sm:w-auto"
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
              {pending ? "Déconnexion..." : confirmLabel}
            </Button>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
