"use client";

import { type ComponentProps, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type ProfessionalActionButtonProps = Omit<ComponentProps<typeof Button>, "onClick"> & {
  action: string;
  label: string;
  pharmacySlug?: string;
  medicationName?: string;
  entityType?: string;
  entityId?: string;
  payload?: Record<string, unknown>;
  successPrefix?: string;
  onSuccess?: (data: unknown) => void;
};

export function ProfessionalActionButton({
  action,
  label,
  pharmacySlug,
  medicationName,
  entityType,
  entityId,
  payload,
  successPrefix,
  onSuccess,
  children,
  disabled,
  ...buttonProps
}: ProfessionalActionButtonProps) {
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const sessionKind = typeof window !== "undefined" && window.location.pathname.startsWith("/admin") ? "admin" : "pharmacy";
      const res = await fetch("/api/pharmacy-platform/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Sablin-Session-Kind": sessionKind },
        body: JSON.stringify({ action, label, pharmacySlug, medicationName, entityType, entityId, ...payload }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Action impossible.");
      toast.success(successPrefix ? `${successPrefix} ${data.message}` : data.message);
      onSuccess?.(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action impossible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button {...buttonProps} disabled={disabled || loading} onClick={run}>
      {loading ? "Traitement..." : children ?? label}
    </Button>
  );
}
