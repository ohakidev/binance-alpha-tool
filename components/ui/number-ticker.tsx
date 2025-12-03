"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

interface NumberTickerProps {
  /**
   * The target value to animate to
   */
  value: number;
  /**
   * The direction of the animation
   * @default "up"
   */
  direction?: "up" | "down";
  /**
   * Number of decimal places to display
   * @default 0
   */
  decimals?: number;
  /**
   * Delay before animation starts (in seconds)
   * @default 0
   */
  delay?: number;
  /**
   * Additional class names
   */
  className?: string;
  /**
   * Whether to start animation only when in view
   * @default true
   */
  startOnView?: boolean;
  /**
   * Prefix to display before the number (e.g., "$")
   */
  prefix?: string;
  /**
   * Suffix to display after the number (e.g., "%")
   */
  suffix?: string;
  /**
   * Whether to format with thousand separators
   * @default true
   */
  formatNumber?: boolean;
  /**
   * Spring stiffness for animation
   * @default 100
   */
  stiffness?: number;
  /**
   * Spring damping for animation
   * @default 30
   */
  damping?: number;
}

export function NumberTicker({
  value,
  direction = "up",
  decimals = 0,
  delay = 0,
  className,
  startOnView = true,
  prefix = "",
  suffix = "",
  formatNumber = true,
  stiffness = 100,
  damping = 30,
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [hasStarted, setHasStarted] = useState(!startOnView);

  const motionValue = useMotionValue(direction === "down" ? value : 0);

  // Memoize spring config to prevent infinite re-render loop
  const springConfig = useMemo(() => ({
    stiffness,
    damping,
  }), [stiffness, damping]);

  const springValue = useSpring(motionValue, springConfig);

  const [displayValue, setDisplayValue] = useState(
    direction === "down" ? value : 0
  );

  // Handle delay and view-based start
  useEffect(() => {
    if (startOnView && isInView && !hasStarted) {
      const timeout = setTimeout(() => {
        setHasStarted(true);
      }, delay * 1000);
      return () => clearTimeout(timeout);
    }
  }, [isInView, delay, startOnView, hasStarted]);

  // Animate to target value
  useEffect(() => {
    if (hasStarted || !startOnView) {
      motionValue.set(direction === "down" ? 0 : value);
    }
  }, [motionValue, hasStarted, startOnView, value, direction]);

  // Update display value on spring change
  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      setDisplayValue(latest);
    });
    return () => unsubscribe();
  }, [springValue]);

  // Format the number
  const formattedValue = formatNumber
    ? displayValue.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    : displayValue.toFixed(decimals);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}
      {formattedValue}
      {suffix}
    </span>
  );
}

/**
 * Animated Counter with slot machine effect
 */
export function SlotCounter({
  value,
  className,
  digitClassName,
}: {
  value: number;
  className?: string;
  digitClassName?: string;
}) {
  const digits = value.toString().split("");

  return (
    <span className={cn("inline-flex tabular-nums", className)}>
      {digits.map((digit, index) => (
        <span
          key={index}
          className={cn(
            "relative inline-block overflow-hidden",
            digitClassName
          )}
          style={{
            animation: `slot-spin 0.5s ease-out ${index * 0.1}s forwards`,
          }}
        >
          {digit}
        </span>
      ))}
      <style jsx>{`
        @keyframes slot-spin {
          0% {
            transform: translateY(-100%);
            opacity: 0;
          }
          50% {
            opacity: 0.5;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </span>
  );
}

/**
 * Animated Stats Display
 * Displays a stat with label and animated number
 */
export function AnimatedStat({
  value,
  label,
  prefix = "",
  suffix = "",
  decimals = 0,
  className,
  valueClassName,
  labelClassName,
  trend,
  trendValue,
}: {
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  valueClassName?: string;
  labelClassName?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}) {
  const trendColors = {
    up: "text-emerald-500",
    down: "text-red-500",
    neutral: "text-muted-foreground",
  };

  const trendIcons = {
    up: "↑",
    down: "↓",
    neutral: "→",
  };

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className={cn("flex items-baseline gap-2", valueClassName)}>
        <NumberTicker
          value={value}
          prefix={prefix}
          suffix={suffix}
          decimals={decimals}
          className="text-3xl font-bold"
        />
        {trend && trendValue && (
          <span className={cn("text-sm font-medium", trendColors[trend])}>
            {trendIcons[trend]} {trendValue}
          </span>
        )}
      </div>
      <span className={cn("text-sm text-muted-foreground", labelClassName)}>
        {label}
      </span>
    </div>
  );
}

/**
 * Percentage Ring with animated number
 */
export function PercentageRing({
  value,
  size = 80,
  strokeWidth = 8,
  className,
  color = "hsl(var(--primary))",
  backgroundColor = "hsl(var(--muted))",
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  color?: string;
  backgroundColor?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {/* Center number */}
      <div className="absolute inset-0 flex items-center justify-center">
        <NumberTicker
          value={value}
          suffix="%"
          className="text-sm font-bold"
          decimals={0}
        />
      </div>
    </div>
  );
}
