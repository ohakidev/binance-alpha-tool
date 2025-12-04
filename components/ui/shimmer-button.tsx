"use client";

/**
 * Premium Shimmer Button Component
 * Animated button with shimmer effect
 */

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ShimmerButtonProps {
  shimmerColor?: string;
  borderRadius?: string;
  background?: string;
  shimmerDuration?: string;
  className?: string;
  children?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

export function ShimmerButton({
  shimmerColor = "#ffffff",
  borderRadius = "12px",
  background = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  shimmerDuration = "2.5s",
  className,
  children,
  onClick,
  disabled,
  type = "button",
}: ShimmerButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative overflow-hidden px-6 py-3 font-bold text-white shadow-2xl transition-all duration-300",
        className,
      )}
      style={{
        borderRadius,
        background,
      }}
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>

      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 -translate-x-full"
        style={{
          background: `linear-gradient(90deg, transparent, ${shimmerColor}, transparent)`,
          transform: "skewX(-20deg)",
        }}
        animate={{
          translateX: ["0%", "200%"],
        }}
        transition={{
          repeat: Infinity,
          duration: parseFloat(shimmerDuration),
          ease: "linear",
        }}
      />

      {/* Glow effect */}
      <div
        className="absolute inset-0 opacity-50 blur-xl"
        style={{
          background,
        }}
      />
    </motion.button>
  );
}

ShimmerButton.displayName = "ShimmerButton";
