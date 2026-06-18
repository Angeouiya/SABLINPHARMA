"use client";

import { cn } from "@/lib/utils";

/* ============================================================
   SABLIN PHARMA — Typography primitives
   Hiérarchie claire : Eyebrow > Heading (h1-h4) > Text > Muted > Price
   ============================================================ */

type HeadingLevel = "h1" | "h2" | "h3" | "h4";

const headingSizes: Record<HeadingLevel, string> = {
  h1: "text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight",
  h2: "text-2xl sm:text-3xl font-extrabold tracking-tight",
  h3: "text-xl sm:text-2xl font-bold tracking-tight",
  h4: "text-base sm:text-lg font-bold",
};

export function Heading({
  level = "h2",
  className,
  children,
}: {
  level?: HeadingLevel;
  className?: string;
  children: React.ReactNode;
}) {
  const Tag = level;
  return (
    <Tag className={cn(headingSizes[level], "text-foreground", className)}>
      {children}
    </Tag>
  );
}

/** Petit label au-dessus des titres (eyebrow / kicker) */
export function Eyebrow({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-brand",
        className
      )}
    >
      {children}
    </span>
  );
}

export function Text({
  className,
  children,
  size = "md",
  weight,
}: {
  className?: string;
  children: React.ReactNode;
  size?: "xs" | "sm" | "md" | "lg";
  weight?: "normal" | "medium" | "semibold" | "bold";
}) {
  const sizes = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-[15px]",
    lg: "text-base",
  };
  const weights = {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
  };
  return (
    <p
      className={cn(
        sizes[size],
        weight ? weights[weight] : "font-normal",
        "leading-relaxed text-foreground",
        className
      )}
    >
      {children}
    </p>
  );
}

export function Muted({
  className,
  children,
  size = "sm",
}: {
  className?: string;
  children: React.ReactNode;
  size?: "xs" | "sm" | "md";
}) {
  const sizes = { xs: "text-xs", sm: "text-sm", md: "text-[15px]" };
  return (
    <p className={cn(sizes[size], "text-muted-foreground", className)}>
      {children}
    </p>
  );
}

/* ============================================================
   Price — affichage avance des montants en FCFA
   ============================================================ */

interface PriceProps {
  amount: number;
  /** Affiche "À partir de" au-dessus */
  from?: boolean;
  /** Taille du prix */
  size?: "sm" | "md" | "lg" | "xl";
  /** Variante de couleur */
  variant?: "brand" | "dark" | "muted";
  className?: string;
  /** Affiche uniquement le nombre formaté sans "FCFA" (pour usage inline) */
  numericOnly?: boolean;
}

const priceSizes = {
  sm: "text-sm",
  md: "text-lg",
  lg: "text-xl",
  xl: "text-3xl",
};

const priceVariants = {
  brand: "text-brand-dark",
  dark: "text-foreground",
  muted: "text-muted-foreground",
};

export function Price({
  amount,
  from = false,
  size = "md",
  variant = "brand",
  className,
  numericOnly = false,
}: PriceProps) {
  const formatted = new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(amount);
  const content = numericOnly ? formatted : `${formatted} FCFA`;

  return (
    <span className={cn("inline-flex flex-col leading-none", className)}>
      {from && (
        <span className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          À partir de
        </span>
      )}
      <span
        className={cn(
          "font-extrabold tabular-nums",
          priceSizes[size],
          priceVariants[variant]
        )}
      >
        {content}
      </span>
    </span>
  );
}

/** Fourchette de prix (min — max) */
export function PriceRange({
  min,
  max,
  size = "md",
  variant = "brand",
  className,
}: {
  min: number;
  max: number;
  size?: PriceProps["size"];
  variant?: PriceProps["variant"];
  className?: string;
}) {
  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n);
  return (
    <span
      className={cn(
        "font-extrabold tabular-nums",
        priceSizes[size],
        priceVariants[variant],
        className
      )}
    >
      {fmt(min)} <span className="font-normal text-muted-foreground">—</span>{" "}
      {fmt(max)} FCFA
    </span>
  );
}
