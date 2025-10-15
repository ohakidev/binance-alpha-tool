'use client';

/**
 * Animated Border Card Component
 * Card with animated gradient border
 */

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedBorderCardProps {
  children: ReactNode;
  className?: string;
  borderRadius?: string;
  borderWidth?: string;
  duration?: number;
  gradientColors?: string[];
}

export function AnimatedBorderCard({
  children,
  className = '',
  borderRadius = '24px',
  borderWidth = '2px',
  duration = 4,
  gradientColors = ['#667eea', '#764ba2', '#f093fb', '#4facfe'],
}: AnimatedBorderCardProps) {
  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{
        borderRadius,
        padding: borderWidth,
      }}
    >
      {/* Animated gradient border */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `conic-gradient(from 0deg, ${gradientColors.join(', ')}, ${gradientColors[0]})`,
          borderRadius,
        }}
        animate={{
          rotate: 360,
        }}
        transition={{
          duration,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Content */}
      <div
        className="relative bg-background dark:bg-slate-900"
        style={{
          borderRadius: `calc(${borderRadius} - ${borderWidth})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
