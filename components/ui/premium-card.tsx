'use client';

/**
 * Premium Animated Card Component
 * $10M-level crypto game design with advanced interactions
 */

import { motion } from 'framer-motion';
import { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';
import { Meteors } from './meteors';

interface PremiumCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: 'gold' | 'cyan' | 'purple' | 'green' | 'red';
  showMeteors?: boolean;
  interactive?: boolean;
  gradient?: boolean;
}

const glowColors = {
  gold: 'shadow-[0_0_30px_rgba(255,215,0,0.3)] hover:shadow-[0_0_50px_rgba(255,215,0,0.5)]',
  cyan: 'shadow-[0_0_30px_rgba(0,206,209,0.3)] hover:shadow-[0_0_50px_rgba(0,206,209,0.5)]',
  purple: 'shadow-[0_0_30px_rgba(155,89,182,0.3)] hover:shadow-[0_0_50px_rgba(155,89,182,0.5)]',
  green: 'shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_50px_rgba(16,185,129,0.5)]',
  red: 'shadow-[0_0_30px_rgba(239,68,68,0.3)] hover:shadow-[0_0_50px_rgba(239,68,68,0.5)]',
};

const gradientBorders = {
  gold: 'before:bg-gradient-to-r before:from-[#FFD700] before:via-[#FFA500] before:to-[#FFD700]',
  cyan: 'before:bg-gradient-to-r before:from-[#00CED1] before:via-[#00FFFF] before:to-[#00CED1]',
  purple: 'before:bg-gradient-to-r before:from-[#9B59B6] before:via-[#E74C3C] before:to-[#9B59B6]',
  green: 'before:bg-gradient-to-r before:from-[#10B981] before:via-[#34D399] before:to-[#10B981]',
  red: 'before:bg-gradient-to-r before:from-[#EF4444] before:via-[#F97316] before:to-[#EF4444]',
};

export function PremiumCard({
  children,
  className,
  glowColor = 'gold',
  showMeteors = false,
  interactive = true,
  gradient = true,
}: PremiumCardProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={interactive ? { y: -5, scale: 1.02 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'relative group overflow-hidden rounded-2xl',
        'backdrop-blur-xl bg-gradient-to-br from-white/10 via-white/5 to-transparent',
        'border border-white/10',
        'transition-all duration-500',
        glowColors[glowColor],
        gradient && 'before:absolute before:inset-0 before:rounded-2xl before:p-[1px] before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500',
        gradient && gradientBorders[glowColor],
        gradient && 'before:-z-10 before:blur-sm',
        className
      )}
    >
      {/* Animated gradient border */}
      {gradient && (
        <motion.div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.1), transparent 40%)`,
          }}
        />
      )}

      {/* Shine effect on hover */}
      {interactive && (
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.15), transparent 40%)`,
          }}
        />
      )}

      {/* Meteors effect */}
      {showMeteors && isHovered && <Meteors number={3} />}

      {/* Content */}
      <div className="relative z-10 p-6">
        {children}
      </div>

      {/* Bottom glow */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </motion.div>
  );
}

/**
 * Premium Stats Card - For metrics display
 */
interface PremiumStatsCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  change?: {
    value: number;
    isPositive: boolean;
  };
  glowColor?: 'gold' | 'cyan' | 'purple' | 'green' | 'red';
}

export function PremiumStatsCard({
  icon,
  label,
  value,
  change,
  glowColor = 'gold',
}: PremiumStatsCardProps) {
  return (
    <PremiumCard glowColor={glowColor} showMeteors gradient>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Icon */}
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className={cn(
              'inline-flex p-3 rounded-xl mb-4',
              'bg-gradient-to-br from-white/10 to-white/5',
              'border border-white/10'
            )}
          >
            {icon}
          </motion.div>

          {/* Label */}
          <p className="text-sm font-medium text-muted-foreground mb-1">
            {label}
          </p>

          {/* Value */}
          <motion.p
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="text-3xl font-black text-white mb-2"
          >
            {value}
          </motion.p>

          {/* Change indicator */}
          {change && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                'inline-flex items-center gap-1 text-sm font-bold',
                change.isPositive ? 'text-[#10B981]' : 'text-[#EF4444]'
              )}
            >
              <span>{change.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(change.value).toFixed(1)}%</span>
            </motion.div>
          )}
        </div>
      </div>
    </PremiumCard>
  );
}

/**
 * Premium Feature Card - For feature showcase
 */
interface PremiumFeatureCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  badge?: string;
  glowColor?: 'gold' | 'cyan' | 'purple' | 'green' | 'red';
  onClick?: () => void;
}

export function PremiumFeatureCard({
  title,
  description,
  icon,
  badge,
  glowColor = 'cyan',
  onClick,
}: PremiumFeatureCardProps) {
  return (
    <PremiumCard
      glowColor={glowColor}
      showMeteors
      gradient
      className="cursor-pointer"
    >
      <div onClick={onClick}>
        {/* Badge */}
        {badge && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="inline-block px-3 py-1 mb-4 text-xs font-bold rounded-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black"
          >
            {badge}
          </motion.span>
        )}

        {/* Icon */}
        <motion.div
          whileHover={{ scale: 1.1, rotate: 360 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center justify-center w-14 h-14 mb-4 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 border border-white/10"
        >
          {icon}
        </motion.div>

        {/* Title */}
        <h3 className="text-xl font-black text-white mb-2">{title}</h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>

        {/* Hover arrow */}
        <motion.div
          initial={{ x: -10, opacity: 0 }}
          whileHover={{ x: 0, opacity: 1 }}
          className="mt-4 flex items-center gap-2 text-sm font-bold text-[#FFD700]"
        >
          <span>Learn more</span>
          <span>→</span>
        </motion.div>
      </div>
    </PremiumCard>
  );
}
