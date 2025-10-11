/**
 * Skeleton Loading Component
 * Shimmer effect for loading states
 */

import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export function Skeleton({ className = '', variant = 'rectangular' }: SkeletonProps) {
  const baseClasses = 'bg-white/10 animate-shimmer';

  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    />
  );
}

export function AirdropCardSkeleton() {
  return (
    <div className="glass-card">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Skeleton variant="circular" className="w-12 h-12" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between mb-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-2 w-full" />
      </div>

      {/* Amount */}
      <div className="mb-4">
        <Skeleton className="h-3 w-20 mb-1" />
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-3 w-24 mt-1" />
      </div>

      {/* Countdown */}
      <div className="mb-4">
        <Skeleton className="h-3 w-20 mx-auto mb-2" />
        <div className="flex justify-center gap-2">
          <Skeleton className="w-12 h-16" />
          <Skeleton className="w-12 h-16" />
          <Skeleton className="w-12 h-16" />
          <Skeleton className="w-12 h-16" />
        </div>
      </div>

      {/* Button */}
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="glass-card">
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" className="w-12 h-12" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="glass-card">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-8 w-32" />
      </div>
      <Skeleton className="h-[200px] w-full" />
      <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-white/10">
        <div className="text-center">
          <Skeleton className="h-4 w-16 mx-auto mb-2" />
          <Skeleton className="h-6 w-20 mx-auto" />
        </div>
        <div className="text-center">
          <Skeleton className="h-4 w-16 mx-auto mb-2" />
          <Skeleton className="h-6 w-20 mx-auto" />
        </div>
        <div className="text-center">
          <Skeleton className="h-4 w-16 mx-auto mb-2" />
          <Skeleton className="h-6 w-20 mx-auto" />
        </div>
      </div>
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div className="glass-card">
      <Skeleton className="h-8 w-48 mb-4" />
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square" />
        ))}
      </div>
    </div>
  );
}
