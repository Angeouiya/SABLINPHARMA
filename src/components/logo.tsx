import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: number;
  variant?: "default" | "light";
}

/**
 * SABLIN PHARMA — Logo officiel
 * Utilise l'image du logo directement (croix + feuille + texte SABLIN PHARMA).
 */
export function LogoMark({
  size = 40,
  className,
  variant = "default",
}: {
  size?: number;
  className?: string;
  variant?: "default" | "light";
}) {
  return (
    <img
      src="/images/logo-sablin-pharma.png"
      alt="SABLIN PHARMA"
      width={size * 2.7}
      height={size}
      className={cn(
        "object-contain",
        variant === "light" && "rounded-lg bg-white/95 p-1",
        className
      )}
      style={{ height: `${size}px`, width: "auto" }}
    />
  );
}

export function Logo({ className, showText = true, size = 40, variant = "default" }: LogoProps) {
  return (
    <div className={cn("flex items-center", className)}>
      <img
        src="/images/logo-sablin-pharma.png"
        alt="SABLIN PHARMA"
        className={cn(
          "object-contain",
          variant === "light" && "rounded-lg bg-white/95 p-1",
          className
        )}
        style={{ height: `${size}px`, width: "auto" }}
      />
    </div>
  );
}
