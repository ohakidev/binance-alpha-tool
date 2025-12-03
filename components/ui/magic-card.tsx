"use client";

import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { MouseEvent, ReactNode, useCallback } from "react";
import { cn } from "@/lib/utils";

interface MagicCardProps {
  children: ReactNode;
  className?: string;
  gradientColor?: string;
  gradientOpacity?: number;
  gradientSize?: number;
  borderColor?: string;
  spotlight?: boolean;
  spotlightColor?: string;
}

/**
 * Magic Card
 *
 * A card component with mouse-tracking gradient spotlight effect
 */
export function MagicCard({
  children,
  className,
  gradientColor = "rgba(120, 119, 198, 0.3)",
  gradientOpacity = 0.8,
  gradientSize = 200,
  borderColor = "rgba(255, 255, 255, 0.1)",
  spotlight = true,
  spotlightColor = "rgba(120, 119, 198, 0.15)",
}: MagicCardProps) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = useCallback(
    ({ currentTarget, clientX, clientY }: MouseEvent) => {
      const { left, top } = currentTarget.getBoundingClientRect();
      mouseX.set(clientX - left);
      mouseY.set(clientY - top);
    },
    [mouseX, mouseY]
  );

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  const background = useMotionTemplate`
    radial-gradient(
      ${gradientSize}px circle at ${mouseX}px ${mouseY}px,
      ${gradientColor},
      transparent 80%
    )
  `;

  const spotlightBackground = useMotionTemplate`
    radial-gradient(
      ${gradientSize * 1.5}px circle at ${mouseX}px ${mouseY}px,
      ${spotlightColor},
      transparent 80%
    )
  `;

  return (
    <motion.div
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-background/50 backdrop-blur-sm transition-all duration-300",
        "hover:shadow-2xl hover:shadow-primary/5",
        className
      )}
      style={{
        borderColor,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.01, y: -2 }}
      transition={{ duration: 0.2 }}
    >
      {/* Gradient overlay */}
      <motion.div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background,
          opacity: gradientOpacity,
        }}
      />

      {/* Spotlight effect */}
      {spotlight && (
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: spotlightBackground,
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

/**
 * Bento Card
 *
 * A card with grid-ready styling and hover effects
 */
export function BentoCard({
  children,
  className,
  hoverEffect = true,
}: {
  children: ReactNode;
  className?: string;
  hoverEffect?: boolean;
}) {
  return (
    <motion.div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/50 to-slate-900/30 p-6 backdrop-blur-xl",
        hoverEffect && "hover:border-white/20 hover:shadow-lg hover:shadow-primary/5",
        className
      )}
      whileHover={hoverEffect ? { y: -4 } : undefined}
      transition={{ duration: 0.2 }}
    >
      {/* Background glow */}
      <div className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover:opacity-100">
        <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-br from-primary/20 via-transparent to-cyan-500/20 blur-xl" />
      </div>

      {/* Content */}
      <div className="relative">{children}</div>
    </motion.div>
  );
}

/**
 * Glass Card
 *
 * A glassmorphism style card
 */
export function GlassCard({
  children,
  className,
  blur = "md",
  opacity = 50,
}: {
  children: ReactNode;
  className?: string;
  blur?: "sm" | "md" | "lg" | "xl";
  opacity?: number;
}) {
  const blurClasses = {
    sm: "backdrop-blur-sm",
    md: "backdrop-blur-md",
    lg: "backdrop-blur-lg",
    xl: "backdrop-blur-xl",
  };

  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/20",
        blurClasses[blur],
        className
      )}
      style={{
        background: `rgba(255, 255, 255, ${opacity / 1000})`,
      }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      {/* Glass reflection */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative">{children}</div>
    </motion.div>
  );
}

/**
 * Neon Card
 *
 * A card with neon glow effect
 */
export function NeonCard({
  children,
  className,
  neonColor = "#ff00ff",
  glowIntensity = 20,
}: {
  children: ReactNode;
  className?: string;
  neonColor?: string;
  glowIntensity?: number;
}) {
  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-xl border-2 bg-background/80 backdrop-blur-sm",
        className
      )}
      style={{
        borderColor: neonColor,
        boxShadow: `0 0 ${glowIntensity}px ${neonColor}40, inset 0 0 ${glowIntensity / 2}px ${neonColor}20`,
      }}
      whileHover={{
        boxShadow: `0 0 ${glowIntensity * 1.5}px ${neonColor}60, inset 0 0 ${glowIntensity}px ${neonColor}30`,
      }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Hover Card with 3D tilt effect
 */
export function TiltCard({
  children,
  className,
  tiltAmount = 10,
}: {
  children: ReactNode;
  className?: string;
  tiltAmount?: number;
}) {
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);

  const handleMouseMove = useCallback(
    ({ currentTarget, clientX, clientY }: MouseEvent) => {
      const { left, top, width, height } = currentTarget.getBoundingClientRect();
      const x = clientX - left;
      const y = clientY - top;
      const centerX = width / 2;
      const centerY = height / 2;

      rotateX.set(((y - centerY) / centerY) * -tiltAmount);
      rotateY.set(((x - centerX) / centerX) * tiltAmount);
    },
    [rotateX, rotateY, tiltAmount]
  );

  const handleMouseLeave = useCallback(() => {
    rotateX.set(0);
    rotateY.set(0);
  }, [rotateX, rotateY]);

  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-xl border border-white/10 bg-background/50 backdrop-blur-sm",
        className
      )}
      style={{
        transformStyle: "preserve-3d",
        perspective: "1000px",
        rotateX,
        rotateY,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Stats Card with gradient and animation
 */
export function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  gradientFrom = "primary",
  gradientTo = "cyan-500",
  className,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  gradientFrom?: string;
  gradientTo?: string;
  className?: string;
}) {
  const trendColors = {
    up: "text-emerald-400",
    down: "text-red-400",
    neutral: "text-muted-foreground",
  };

  const trendIcons = {
    up: "↑",
    down: "↓",
    neutral: "→",
  };

  return (
    <MagicCard className={cn("p-6", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2">
            <motion.p
              className={cn(
                "text-3xl font-bold",
                `bg-gradient-to-r from-${gradientFrom} to-${gradientTo} bg-clip-text text-transparent`
              )}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {value}
            </motion.p>
            {trend && trendValue && (
              <span className={cn("text-sm font-medium", trendColors[trend])}>
                {trendIcons[trend]} {trendValue}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="rounded-full bg-primary/10 p-3">{icon}</div>
        )}
      </div>
    </MagicCard>
  );
}

/**
 * Feature Card with icon and description
 */
export function FeatureCard({
  title,
  description,
  icon,
  className,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  className?: string;
}) {
  return (
    <MagicCard className={cn("p-6", className)}>
      <div className="space-y-4">
        <div className="inline-flex rounded-lg bg-primary/10 p-3">
          {icon}
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </MagicCard>
  );
}
