'use client';

/**
 * Premium Animated Button Component
 * High-end crypto game button with multiple variants
 */

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { MovingBorder } from './moving-border';

interface PremiumButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  className?: string;
  glowEffect?: boolean;
}

const variants = {
  primary: 'bg-gradient-to-r from-[#FFD700] via-[#FFA500] to-[#FFD700] text-black font-black shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:shadow-[0_0_40px_rgba(255,215,0,0.6)]',
  secondary: 'bg-gradient-to-r from-[#00CED1] via-[#00FFFF] to-[#00CED1] text-black font-black shadow-[0_0_20px_rgba(0,206,209,0.3)] hover:shadow-[0_0_40px_rgba(0,206,209,0.6)]',
  success: 'bg-gradient-to-r from-[#10B981] via-[#34D399] to-[#10B981] text-black font-black shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.6)]',
  danger: 'bg-gradient-to-r from-[#EF4444] via-[#F97316] to-[#EF4444] text-white font-black shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_40px_rgba(239,68,68,0.6)]',
  ghost: 'bg-white/5 backdrop-blur-xl border border-white/10 text-white font-bold hover:bg-white/10 hover:border-white/20',
};

const sizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

export function PremiumButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  className,
  glowEffect = true,
}: PremiumButtonProps) {
  return (
    <motion.button
      onClick={disabled || loading ? undefined : onClick}
      disabled={disabled || loading}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      className={cn(
        'relative inline-flex items-center justify-center gap-2',
        'rounded-xl overflow-hidden',
        'transition-all duration-300',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {/* Shimmer effect */}
      {glowEffect && !disabled && (
        <motion.div
          className="absolute inset-0 opacity-0 hover:opacity-100"
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
            backgroundSize: '200% 100%',
          }}
        />
      )}

      {/* Loading spinner */}
      {loading && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
        />
      )}

      {/* Icon left */}
      {icon && iconPosition === 'left' && !loading && (
        <motion.span
          initial={{ x: -5, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
        >
          {icon}
        </motion.span>
      )}

      {/* Content */}
      <span className="relative z-10">{children}</span>

      {/* Icon right */}
      {icon && iconPosition === 'right' && !loading && (
        <motion.span
          initial={{ x: 5, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
        >
          {icon}
        </motion.span>
      )}

      {/* Pulse effect on hover */}
      {glowEffect && !disabled && (
        <motion.div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100"
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0, 0.2, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
          }}
        />
      )}
    </motion.button>
  );
}

/**
 * Premium Moving Border Button - Ultra premium variant
 */
export function PremiumMovingBorderButton({
  children,
  onClick,
  borderColor = '#FFD700',
  duration = 2000,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  borderColor?: string;
  duration?: number;
  className?: string;
}) {
  return (
    <MovingBorder
      duration={duration}
      borderRadius="0.75rem"
      className={cn('bg-white/5 backdrop-blur-xl', className)}
    >
      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="relative px-8 py-4 text-white font-black text-lg"
      >
        <span className="relative z-10">{children}</span>
      </motion.button>
    </MovingBorder>
  );
}

/**
 * Premium Icon Button - For icon-only actions
 */
export function PremiumIconButton({
  icon,
  onClick,
  variant = 'ghost',
  size = 'md',
  className,
  tooltip,
}: {
  icon: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  tooltip?: string;
}) {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.1, rotate: 5 }}
      whileTap={{ scale: 0.9 }}
      title={tooltip}
      className={cn(
        'relative inline-flex items-center justify-center',
        'rounded-xl',
        'transition-all duration-300',
        variants[variant],
        iconSizes[size],
        className
      )}
    >
      {icon}
    </motion.button>
  );
}
