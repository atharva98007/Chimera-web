"use client";

import { motion } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { useLowPerf } from "@/hooks/useLowPerf";
import { useTheme } from "@/context/ThemeContext";
import { themeTokens } from "@/lib/themes";
import { APPLE_EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  variant?: "primary" | "ghost" | "outline";
  themeMode?: "dark" | "light";
};

export function MagneticButton({
  children,
  className,
  onClick,
  disabled,
  type = "button",
  variant = "primary",
  themeMode: themeProp,
}: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  const { theme: ctxTheme } = useTheme();
  const theme = themeProp ?? ctxTheme;
  const t = themeTokens[theme];

  const lowPerf = useLowPerf();

  if (lowPerf) {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        onClick={onClick}
        className={cn(
          "relative overflow-hidden rounded-full px-4 py-2 text-sm font-medium tracking-wide transition-shadow duration-300",
          variant === "primary" && t.btnPrimary,
          variant === "ghost" && t.btnGhost,
          variant === "outline" && t.btnGhost,
          disabled && "cursor-not-allowed opacity-45",
          className
        )}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
      </button>
    );
  }

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-full px-6 py-3 text-sm font-medium tracking-wide transition-shadow duration-500",
        variant === "primary" && t.btnPrimary,
        variant === "ghost" && t.btnGhost,
        variant === "outline" && t.btnGhost,
        disabled && "cursor-not-allowed opacity-45",
        className
      )}
      whileHover={
        disabled
          ? {}
          : {
              boxShadow:
                theme === "dark"
                  ? "0 0 0 1px rgba(255,255,255,0.32), 0 0 24px rgba(255,255,255,0.38), 0 0 44px rgba(255,255,255,0.14)"
                  : "0 0 0 1px rgba(113,113,122,0.28), 0 0 24px rgba(161,161,170,0.38), 0 0 44px rgba(212,212,216,0.28)",
            }
      }
      whileTap={disabled ? {} : { scale: 1 }}
      transition={{ duration: 0.35, ease: APPLE_EASE }}
    >
      <motion.span
        className="pointer-events-none absolute inset-0 bg-white/20"
        initial={{ scale: 0, opacity: 0.55 }}
        whileTap={{ scale: 2.2, opacity: 0 }}
        transition={{ duration: 0.5 }}
      />
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
    </motion.button>
  );
}
