"use client";

import * as React from "react";
import { Loader2, LoaderIcon } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const spinnerVariants = cva("animate-spin", {
  variants: {
    variant: {
      default: "text-slate-400",
      primary: "text-amber-500",
      premium: "text-[#d4a948]",
      success: "text-emerald-500",
      danger: "text-rose-500",
      cyan: "text-cyan-500",
      muted: "text-slate-500",
    },
    size: {
      xs: "size-3",
      sm: "size-4",
      md: "size-5",
      lg: "size-6",
      xl: "size-8",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "md",
  },
});

interface SpinnerProps
  extends React.ComponentProps<"svg">,
    VariantProps<typeof spinnerVariants> {}

function Spinner({ className, variant, size, ...props }: SpinnerProps) {
  return (
    <LoaderIcon
      role="status"
      aria-label="Loading"
      className={cn(spinnerVariants({ variant, size }), className)}
      {...props}
    />
  );
}

// Pulse Dot Spinner - for subtle loading indication
interface PulseSpinnerProps {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "premium" | "success" | "danger";
  className?: string;
}

function PulseSpinner({
  size = "md",
  variant = "default",
  className,
}: PulseSpinnerProps) {
  const sizeClasses = {
    sm: "size-1.5",
    md: "size-2",
    lg: "size-2.5",
  };

  const colorClasses = {
    default: "bg-slate-400",
    premium: "bg-[#d4a948]",
    success: "bg-emerald-500",
    danger: "bg-rose-500",
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn(
            "rounded-full animate-pulse",
            sizeClasses[size],
            colorClasses[variant]
          )}
          style={{
            animationDelay: `${i * 150}ms`,
            animationDuration: "1s",
          }}
        />
      ))}
    </div>
  );
}

// Live Indicator - pulsing dot for real-time data
interface LiveIndicatorProps {
  isLive?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "success" | "warning" | "danger";
  showLabel?: boolean;
  className?: string;
}

function LiveIndicator({
  isLive = true,
  size = "md",
  variant = "success",
  showLabel = false,
  className,
}: LiveIndicatorProps) {
  const sizeClasses = {
    sm: "size-1.5",
    md: "size-2",
    lg: "size-2.5",
  };

  const colorClasses = {
    default: "bg-slate-400",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-rose-500",
  };

  const glowClasses = {
    default: "shadow-slate-400/50",
    success: "shadow-emerald-500/50",
    warning: "shadow-amber-500/50",
    danger: "shadow-rose-500/50",
  };

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span className="relative flex">
        <span
          className={cn(
            "absolute inline-flex h-full w-full rounded-full opacity-75",
            isLive && "animate-ping",
            colorClasses[variant]
          )}
        />
        <span
          className={cn(
            "relative inline-flex rounded-full",
            sizeClasses[size],
            colorClasses[variant],
            isLive && `shadow-lg ${glowClasses[variant]}`
          )}
        />
      </span>
      {showLabel && (
        <span
          className={cn(
            "text-xs font-medium",
            variant === "success" && "text-emerald-400",
            variant === "warning" && "text-amber-400",
            variant === "danger" && "text-rose-400",
            variant === "default" && "text-slate-400"
          )}
        >
          {isLive ? "LIVE" : "OFFLINE"}
        </span>
      )}
    </div>
  );
}

// Countdown Ring - circular countdown timer
interface CountdownRingProps {
  duration: number; // total duration in seconds
  remaining: number; // remaining time in seconds
  size?: "sm" | "md" | "lg";
  variant?: "default" | "premium" | "success" | "warning";
  showValue?: boolean;
  className?: string;
}

function CountdownRing({
  duration,
  remaining,
  size = "md",
  variant = "default",
  showValue = true,
  className,
}: CountdownRingProps) {
  const sizes = {
    sm: 24,
    md: 32,
    lg: 40,
  };

  const strokeWidths = {
    sm: 2,
    md: 3,
    lg: 4,
  };

  const diameter = sizes[size];
  const strokeWidth = strokeWidths[size];
  const radius = (diameter - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = duration > 0 ? remaining / duration : 0;
  const offset = circumference * (1 - progress);

  const colorClasses = {
    default: "stroke-slate-400",
    premium: "stroke-[#d4a948]",
    success: "stroke-emerald-500",
    warning: "stroke-amber-500",
  };

  const bgColorClasses = {
    default: "stroke-slate-700/30",
    premium: "stroke-[#d4a948]/20",
    success: "stroke-emerald-500/20",
    warning: "stroke-amber-500/20",
  };

  const textColorClasses = {
    default: "text-slate-400",
    premium: "text-[#d4a948]",
    success: "text-emerald-400",
    warning: "text-amber-400",
  };

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={diameter}
        height={diameter}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          fill="none"
          className={bgColorClasses[variant]}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          fill="none"
          className={cn(colorClasses[variant], "transition-all duration-200")}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      {showValue && (
        <span
          className={cn(
            "absolute text-[10px] font-bold tabular-nums",
            textColorClasses[variant]
          )}
        >
          {Math.ceil(remaining)}
        </span>
      )}
    </div>
  );
}

// Refresh Timer - shows countdown with refresh indication
interface RefreshTimerProps {
  intervalMs: number; // polling interval in milliseconds
  lastUpdated: number; // timestamp of last update
  variant?: "default" | "premium" | "minimal";
  className?: string;
}

function RefreshTimer({
  intervalMs,
  lastUpdated,
  variant = "default",
  className,
}: RefreshTimerProps) {
  const [remaining, setRemaining] = React.useState(intervalMs / 1000);

  React.useEffect(() => {
    const updateRemaining = () => {
      const elapsed = Date.now() - lastUpdated;
      const remainingMs = Math.max(0, intervalMs - elapsed);
      setRemaining(remainingMs / 1000);
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 100);

    return () => clearInterval(interval);
  }, [intervalMs, lastUpdated]);

  const isRefreshing = remaining < 0.5;

  if (variant === "minimal") {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {isRefreshing ? (
          <Spinner size="xs" variant="premium" />
        ) : (
          <CountdownRing
            duration={intervalMs / 1000}
            remaining={remaining}
            size="sm"
            variant="premium"
            showValue={false}
          />
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {isRefreshing ? (
        <>
          <Spinner size="sm" variant="premium" />
          <span className="text-xs text-[#d4a948] animate-pulse">
            Updating...
          </span>
        </>
      ) : (
        <>
          <CountdownRing
            duration={intervalMs / 1000}
            remaining={remaining}
            size="md"
            variant="premium"
          />
          {variant === "default" && (
            <span className="text-xs text-slate-500">
              Next update
            </span>
          )}
        </>
      )}
    </div>
  );
}

// Data Freshness Indicator - shows how fresh the data is
interface DataFreshnessProps {
  lastUpdated: number;
  staleAfterMs?: number; // consider stale after this many ms
  className?: string;
}

function DataFreshness({
  lastUpdated,
  staleAfterMs = 30000,
  className,
}: DataFreshnessProps) {
  const [age, setAge] = React.useState(0);

  React.useEffect(() => {
    const updateAge = () => {
      setAge(Date.now() - lastUpdated);
    };

    updateAge();
    const interval = setInterval(updateAge, 1000);

    return () => clearInterval(interval);
  }, [lastUpdated]);

  const isFresh = age < 5000;
  const isRecent = age < staleAfterMs;

  const formatAge = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <LiveIndicator
        isLive={isFresh}
        size="sm"
        variant={isFresh ? "success" : isRecent ? "warning" : "danger"}
      />
      <span
        className={cn(
          "text-xs",
          isFresh
            ? "text-emerald-400"
            : isRecent
            ? "text-amber-400"
            : "text-rose-400"
        )}
      >
        {formatAge(age)}
      </span>
    </div>
  );
}

export {
  Spinner,
  PulseSpinner,
  LiveIndicator,
  CountdownRing,
  RefreshTimer,
  DataFreshness,
};
