import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: number;
  variant?: "default" | "light";
}

export function LogoMark({ size = 40, className }: { size?: number; className?: string }) {
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
      <rect width="48" height="48" rx="14" fill="url(#sp_grad)" />
      <path
        d="M19 12h10a2 2 0 0 1 2 2v5h5a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-5v5a2 2 0 0 1-2 2H19a2 2 0 0 1-2-2v-5h-5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h5v-5a2 2 0 0 1 2-2Z"
        fill="white"
      />
      <defs>
        <linearGradient id="sp_grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#16a37a" />
          <stop offset="1" stopColor="#0d8a5f" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function Logo({ className, showText = true, size = 40, variant = "default" }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
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
              "text-[11px] font-semibold tracking-[0.2em] -mt-0.5",
              variant === "light" ? "text-white/80" : "text-brand"
            )}
          >
            PHARMA
          </span>
        </div>
      )}
    </div>
  );
}
