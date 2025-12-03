/**
 * Skeleton Loading Component
 * Premium Gold & Black Theme with shimmer effect
 */

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular" | "premium";
  style?: React.CSSProperties;
}

export function Skeleton({
  className = "",
  variant = "rectangular",
  style,
}: SkeletonProps) {
  const variantClasses = {
    text: "h-4 rounded-md",
    circular: "rounded-full",
    rectangular: "rounded-xl",
    premium: "rounded-xl",
  };

  if (variant === "premium") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          "relative overflow-hidden rounded-xl",
          "bg-gradient-to-r from-[rgba(212,169,72,0.04)] via-[rgba(212,169,72,0.08)] to-[rgba(212,169,72,0.04)]",
          "before:absolute before:inset-0",
          "before:bg-gradient-to-r before:from-transparent before:via-[rgba(212,169,72,0.12)] before:to-transparent",
          "before:animate-[shimmer_2s_infinite]",
          "before:-translate-x-full",
          className,
        )}
        style={style}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "relative overflow-hidden",
        "bg-gradient-to-r from-[rgba(212,169,72,0.05)] via-[rgba(212,169,72,0.1)] to-[rgba(212,169,72,0.05)]",
        "bg-[length:200%_100%]",
        "animate-[shimmer_2s_ease-in-out_infinite]",
        variantClasses[variant],
        className,
      )}
      style={style}
    />
  );
}

// Premium skeleton with gold glow effect
export function SkeletonPremium({ className = "" }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "relative overflow-hidden rounded-xl",
        "bg-gradient-to-br from-[rgba(212,169,72,0.06)] via-[#0a0a0c] to-[rgba(184,134,11,0.04)]",
        "border border-[rgba(212,169,72,0.1)]",
        // Shimmer overlay
        "before:absolute before:inset-0",
        "before:bg-gradient-to-r before:from-transparent before:via-[rgba(212,169,72,0.15)] before:to-transparent",
        "before:animate-[shimmer_2.5s_ease-in-out_infinite]",
        "before:-translate-x-full",
        className,
      )}
    />
  );
}

export function AirdropCardSkeleton() {
  return (
    <div
      className={cn(
        "relative rounded-2xl p-6",
        "bg-gradient-to-br from-[rgba(212,169,72,0.04)] via-[#0a0a0c] to-[rgba(184,134,11,0.03)]",
        "border border-[rgba(212,169,72,0.12)]",
        "shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-5">
        <Skeleton variant="circular" className="w-14 h-14" />
        <div className="flex-1 space-y-2.5">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>

      {/* Progress */}
      <div className="mb-5">
        <div className="flex justify-between mb-2.5">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-2.5 w-full rounded-full" />
      </div>

      {/* Amount */}
      <div className="mb-5">
        <Skeleton className="h-3 w-24 mb-2" />
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-3 w-28 mt-2" />
      </div>

      {/* Countdown */}
      <div className="mb-5">
        <Skeleton className="h-3 w-24 mx-auto mb-3" />
        <div className="flex justify-center gap-3">
          <Skeleton className="w-14 h-16 rounded-xl" />
          <Skeleton className="w-14 h-16 rounded-xl" />
          <Skeleton className="w-14 h-16 rounded-xl" />
          <Skeleton className="w-14 h-16 rounded-xl" />
        </div>
      </div>

      {/* Button */}
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  );
}

export function MetricCardSkeleton() {
  return (
    <div
      className={cn(
        "relative rounded-xl p-5",
        "bg-gradient-to-br from-[rgba(212,169,72,0.05)] via-[#0a0a0c] to-[rgba(184,134,11,0.03)]",
        "border border-[rgba(212,169,72,0.1)]",
        "shadow-[0_4px_20px_rgba(0,0,0,0.3)]",
      )}
    >
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" className="w-14 h-14" />
        <div className="flex-1 space-y-2.5">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-4 w-36" />
        </div>
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div
      className={cn(
        "relative rounded-2xl p-6",
        "bg-gradient-to-br from-[rgba(212,169,72,0.04)] via-[#0a0a0c] to-[rgba(184,134,11,0.03)]",
        "border border-[rgba(212,169,72,0.12)]",
        "shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
      )}
    >
      <div className="flex items-center justify-between mb-5">
        <Skeleton className="h-6 w-52" />
        <Skeleton className="h-9 w-36 rounded-xl" />
      </div>
      <Skeleton className="h-[220px] w-full rounded-xl" />
      <div
        className={cn(
          "grid grid-cols-3 gap-5 mt-6 pt-5",
          "border-t border-[rgba(212,169,72,0.1)]",
        )}
      >
        <div className="text-center">
          <Skeleton className="h-4 w-18 mx-auto mb-2" />
          <Skeleton className="h-6 w-24 mx-auto" />
        </div>
        <div className="text-center">
          <Skeleton className="h-4 w-18 mx-auto mb-2" />
          <Skeleton className="h-6 w-24 mx-auto" />
        </div>
        <div className="text-center">
          <Skeleton className="h-4 w-18 mx-auto mb-2" />
          <Skeleton className="h-6 w-24 mx-auto" />
        </div>
      </div>
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div
      className={cn(
        "relative rounded-2xl p-6",
        "bg-gradient-to-br from-[rgba(212,169,72,0.04)] via-[#0a0a0c] to-[rgba(184,134,11,0.03)]",
        "border border-[rgba(212,169,72,0.12)]",
        "shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
      )}
    >
      <Skeleton className="h-8 w-52 mb-5" />
      <div className="grid grid-cols-7 gap-2.5">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton
            key={i}
            className="aspect-square rounded-lg"
            style={{ animationDelay: `${i * 30}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b border-[rgba(212,169,72,0.08)]">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4 first:pl-6 last:pr-6">
          <Skeleton
            className={cn(
              "h-5",
              i === 0 ? "w-32" : i === columns - 1 ? "w-20" : "w-24",
            )}
            style={{ animationDelay: `${i * 100}ms` }}
          />
        </td>
      ))}
    </tr>
  );
}

export function StatsCardSkeleton() {
  return (
    <div
      className={cn(
        "relative rounded-xl p-5",
        "bg-gradient-to-br from-[rgba(212,169,72,0.06)] via-[#0a0a0c] to-[rgba(184,134,11,0.04)]",
        "border border-[rgba(212,169,72,0.12)]",
        "shadow-[0_6px_24px_rgba(0,0,0,0.35)]",
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton variant="circular" className="w-10 h-10" />
      </div>
      <Skeleton className="h-9 w-32 mb-2" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="flex items-center gap-4">
      <Skeleton variant="circular" className="w-16 h-16" />
      <div className="space-y-2.5">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-28" />
      </div>
    </div>
  );
}

// Full page loading skeleton with premium background
export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-[#030305] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-11 w-32 rounded-xl" />
        </div>

        {/* Stats grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <StatsCardSkeleton key={i} />
          ))}
        </div>

        {/* Main content skeleton */}
        <div
          className={cn(
            "relative rounded-2xl p-6",
            "bg-gradient-to-br from-[rgba(212,169,72,0.04)] via-[#0a0a0c] to-[rgba(184,134,11,0.03)]",
            "border border-[rgba(212,169,72,0.12)]",
          )}
        >
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-7 w-44" />
            <div className="flex gap-3">
              <Skeleton className="h-11 w-28 rounded-xl" />
              <Skeleton className="h-11 w-36 rounded-xl" />
            </div>
          </div>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-16 w-full rounded-xl"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
