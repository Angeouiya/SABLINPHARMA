import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: number;
  variant?: "default" | "light";
}

/**
 * SABLIN PHARMA — Logo officiel
 * Croix médicale vert foncé + feuille vert clair insérée dans le bras inférieur
 * (légèrement inclinée à droite, avec nervure centrale et nervures latérales).
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
  const crossFill = variant === "light" ? "#ffffff" : "url(#sp_cross)";
  const leafFill = variant === "light" ? "#ffffff" : "url(#sp_leaf)";
  const veinStroke = variant === "light" ? "rgba(13,99,66,0.55)" : "#0a5336";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sp_cross" x1="24" y1="6" x2="24" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0c7a50" />
          <stop offset="1" stopColor="#095e3c" />
        </linearGradient>
        <linearGradient id="sp_leaf" x1="20" y1="26" x2="31" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#9af3c0" />
          <stop offset="0.5" stopColor="#5ccd92" />
          <stop offset="1" stopColor="#38b074" />
        </linearGradient>
      </defs>

      {/* Croix médicale (plus) à coins arrondis */}
      <path
        d="M22 6 H26 a3 3 0 0 1 3 3 V19 H39 a3 3 0 0 1 3 3 V26 a3 3 0 0 1 -3 3 H29 V39 a3 3 0 0 1 -3 3 H22 a3 3 0 0 1 -3 -3 V29 H9 a3 3 0 0 1 -3 -3 V22 a3 3 0 0 1 3 -3 H19 V9 a3 3 0 0 1 3 -3 Z"
        fill={crossFill}
      />

      {/* Feuille insérée dans le bras inférieur, inclinée à droite */}
      <g transform="translate(25 34) rotate(22)">
        {/* Corps de la feuille : pointe acérée en haut, base avec tige */}
        <path
          d="M0 -8
             C 2.6 -5.6 3.2 -1.8 2.5 1.8
             C 1.9 4.2 0.9 5.8 0.3 6.4
             L 0 6.7
             L -0.3 6.4
             C -0.9 5.8 -1.9 4.2 -2.5 1.8
             C -3.2 -1.8 -2.6 -5.6 0 -8 Z"
          fill={leafFill}
        />
        {/* Tige */}
        <path
          d="M0 6.7 L0.6 8.4"
          stroke={veinStroke}
          strokeWidth="0.8"
          strokeLinecap="round"
        />
        {/* Nervure centrale */}
        <path
          d="M0 -7.2 L0 6.4"
          stroke={veinStroke}
          strokeWidth="0.75"
          strokeLinecap="round"
        />
        {/* Nervures latérales */}
        <path
          d="M0 -3.2 L1.9 -1.4 M0 -3.2 L-1.9 -1.4 M0 0.4 L2.1 2.2 M0 0.4 L-2.1 2.2"
          stroke={veinStroke}
          strokeWidth="0.5"
          strokeLinecap="round"
          opacity="0.85"
        />
      </g>
    </svg>
  );
}

export function Logo({ className, showText = true, size = 40, variant = "default" }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark size={size} variant={variant} />
      {showText && (
        <div className="flex flex-col leading-none">
          <span
            className={cn(
              "text-[17px] font-extrabold tracking-tight",
              variant === "light" ? "text-white" : "text-brand-dark"
            )}
          >
            SABLIN
          </span>
          <span
            className={cn(
              "text-[11px] font-bold tracking-[0.16em] -mt-0.5",
              variant === "light" ? "text-white/85" : "text-brand-dark/85"
            )}
          >
            PHARMA
          </span>
        </div>
      )}
    </div>
  );
}
