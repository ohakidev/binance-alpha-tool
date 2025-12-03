"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const progressVariants = cva(
  "relative w-full overflow-hidden rounded-full transition-all duration-300",
  {
    variants: {
      variant: {
        default: "bg-[rgba(212,169,72,0.1)]",
        premium:
          "bg-gradient-to-r from-[rgba(212,169,72,0.08)] to-[rgba(184,134,11,0.05)] border border-[rgba(212,169,72,0.15)]",
        glass:
          "bg-[rgba(212,169,72,0.05)] backdrop-blur-sm border border-[rgba(212,169,72,0.1)]",
        dark: "bg-[rgba(24,24,27,0.8)] border border-[rgba(212,169,72,0.1)]",
        success: "bg-[rgba(22,163,74,0.1)]",
        danger: "bg-[rgba(220,38,38,0.1)]",
      },
      size: {
        default: "h-2.5",
        sm: "h-1.5",
        md: "h-3",
        lg: "h-4",
        xl: "h-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const indicatorVariants = cva(
  "h-full w-full flex-1 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-[#b8860b] via-[#d4a948] to-[#f5d485] shadow-[0_0_10px_rgba(212,169,72,0.4)]",
        premium:
          "bg-gradient-to-r from-[#8b7355] via-[#d4a948] to-[#f5d485] shadow-[0_0_15px_rgba(212,169,72,0.5),inset_0_1px_0_rgba(255,255,255,0.2)]",
        glass:
          "bg-gradient-to-r from-[rgba(212,169,72,0.6)] to-[rgba(245,212,133,0.8)] backdrop-blur-sm",
        dark: "bg-gradient-to-r from-[#d4a948] to-[#b8860b] shadow-[0_0_12px_rgba(212,169,72,0.4)]",
        success:
          "bg-gradient-to-r from-[#15803d] via-[#16a34a] to-[#22c55e] shadow-[0_0_10px_rgba(22,163,74,0.4)]",
        danger:
          "bg-gradient-to-r from-[#991b1b] via-[#dc2626] to-[#ef4444] shadow-[0_0_10px_rgba(220,38,38,0.4)]",
      },
      animated: {
        true: "animate-shimmer bg-[length:200%_100%]",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      animated: false,
    },
  },
);

interface ProgressProps
  extends
    React.ComponentProps<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressVariants> {
  indicatorVariant?: VariantProps<typeof indicatorVariants>["variant"];
  animated?: boolean;
  showValue?: boolean;
  showGlow?: boolean;
}

function Progress({
  className,
  value,
  variant,
  size,
  indicatorVariant,
  animated = false,
  showValue = false,
  showGlow = false,
  ...props
}: ProgressProps) {
  const indicatorVar = indicatorVariant || variant || "default";

  return (
    <div className="relative w-full">
      <ProgressPrimitive.Root
        data-slot="progress"
        className={cn(progressVariants({ variant, size }), className)}
        {...props}
      >
        <ProgressPrimitive.Indicator
          data-slot="progress-indicator"
          className={cn(
            indicatorVariants({ variant: indicatorVar, animated }),
            "rounded-full",
          )}
          style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />

        {/* Glow effect on the progress edge */}
        {showGlow && (value || 0) > 0 && (
          <div
            className="absolute top-0 bottom-0 w-4 rounded-full pointer-events-none"
            style={{
              left: `calc(${value || 0}% - 8px)`,
              background:
                "radial-gradient(circle, rgba(212,169,72,0.6) 0%, transparent 70%)",
              filter: "blur(4px)",
            }}
          />
        )}
      </ProgressPrimitive.Root>

      {/* Value label */}
      {showValue && (
        <div className="absolute -top-6 right-0 text-xs font-medium text-[#d4a948]">
          {Math.round(value || 0)}%
        </div>
      )}
    </div>
  );
}

// Circular Progress variant
interface CircularProgressProps {
  value: number;
  size?: "sm" | "md" | "lg" | "xl";
  strokeWidth?: number;
  showValue?: boolean;
  className?: string;
  variant?: "default" | "premium";
}

function CircularProgress({
  value,
  size = "md",
  strokeWidth = 4,
  showValue = true,
  className,
  variant = "default",
}: CircularProgressProps) {
  const sizes = {
    sm: 40,
    md: 60,
    lg: 80,
    xl: 100,
  };

  const diameter = sizes[size];
  const radius = (diameter - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  const gradientId = React.useId();

  return (
    <div className={cn("relative inline-flex", className)}>
      <svg width={diameter} height={diameter} className="transform -rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#b8860b" />
            <stop offset="50%" stopColor="#d4a948" />
            <stop offset="100%" stopColor="#f5d485" />
          </linearGradient>
          {variant === "premium" && (
            <filter id={`glow-${gradientId}`}>
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          )}
        </defs>

        {/* Background circle */}
        <circle
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          fill="none"
          stroke="rgba(212,169,72,0.1)"
          strokeWidth={strokeWidth}
        />

        {/* Progress circle */}
        <circle
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
          filter={
            variant === "premium" ? `url(#glow-${gradientId})` : undefined
          }
        />
      </svg>

      {/* Value display */}
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={cn(
              "font-semibold tabular-nums",
              size === "sm" && "text-xs",
              size === "md" && "text-sm",
              size === "lg" && "text-base",
              size === "xl" && "text-lg",
              variant === "premium"
                ? "text-[#d4a948] text-glow-gold-soft"
                : "text-[#d4a948]",
            )}
          >
            {Math.round(value)}%
          </span>
        </div>
      )}
    </div>
  );
}

export { Progress, CircularProgress };
