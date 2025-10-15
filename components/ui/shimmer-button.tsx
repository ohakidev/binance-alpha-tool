'use client';

/**
 * Premium Shimmer Button Component
 * Animated button with shimmer effect
 */

import { motion } from 'framer-motion';
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ShimmerButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  background?: string;
  shimmerDuration?: string;
}

export const ShimmerButton = forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  (
    {
      shimmerColor = '#ffffff',
      shimmerSize = '0.05em',
      borderRadius = '12px',
      background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      shimmerDuration = '2.5s',
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { onClick, disabled, type, ...restProps } = props;
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'relative overflow-hidden px-6 py-3 font-bold text-white shadow-2xl transition-all duration-300',
          className
        )}
        style={{
          borderRadius,
          background,
        }}
        onClick={onClick}
        disabled={disabled}
        type={type}
        {...(restProps as any)}
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
            transform: 'skewX(-20deg)',
          }}
          animate={{
            translateX: ['0%', '200%'],
          }}
          transition={{
            repeat: Infinity,
            duration: parseFloat(shimmerDuration),
            ease: 'linear',
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
);

ShimmerButton.displayName = 'ShimmerButton';
