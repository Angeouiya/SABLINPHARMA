"use client";

import {
  Thermometer,
  ShieldCheck,
  Pill,
  HeartPulse,
  Droplet,
  Wind,
  Hand,
  Baby,
  Droplets,
  ShieldPlus,
  type LucideIcon,
} from "lucide-react";
import type { Category } from "@/lib/types";

const ICONS: Record<string, LucideIcon> = {
  Thermometer,
  ShieldCheck,
  Pill,
  HeartPulse,
  Droplet,
  Wind,
  Hand,
  Baby,
  Droplets,
  ShieldPlus,
};

export function CategoryIcon({
  name,
  className,
  size = 22,
  color,
}: {
  name: string;
  className?: string;
  size?: number;
  color?: string;
}) {
  const Icon = ICONS[name] ?? Pill;
  return (
    <Icon
      className={className}
      size={size}
      strokeWidth={2}
      style={color ? { color } : undefined}
    />
  );
}

export function categoryStyle(color: string): {
  bg: string;
  text: string;
  ring: string;
} {
  return {
    bg: `background-color: ${color}14;`,
    text: `color: ${color};`,
    ring: `border-color: ${color}26;`,
  };
}

export const CATEGORY_ICONS = ICONS;

export function getCategoriesWithIcons(): Array<{ slug: string; icon: string; color: string }> {
  return [
    { slug: "douleur-fievre", icon: "Thermometer", color: "#ef4444" },
    { slug: "antibiotiques", icon: "ShieldCheck", color: "#0d9488" },
    { slug: "vitamines", icon: "Pill", color: "#f59e0b" },
    { slug: "cardiovasculaire", icon: "HeartPulse", color: "#e11d48" },
    { slug: "digestif", icon: "Droplet", color: "#d97706" },
    { slug: "respiratoire", icon: "Wind", color: "#0284c7" },
    { slug: "dermatologie", icon: "Hand", color: "#9333ea" },
    { slug: "mere-enfant", icon: "Baby", color: "#ec4899" },
    { slug: "hygiene", icon: "Droplets", color: "#06b6d4" },
    { slug: "antipaludeens", icon: "ShieldPlus", color: "#16a34a" },
  ];
}

export function renderCategory(cat: Pick<Category, "iconName" | "color">) {
  return { icon: cat.iconName, color: cat.color };
}
