"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ShineBorderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Width of the border in pixels
   * @default 1
   */
  borderWidth?: number;
  /**
   * Duration of the animation in seconds
   * @default 14
   */
  duration?: number;
  /**
   * Color of the border, can be a single color or an array of colors
   * @default "#000000"
   */
  shineColor?: string | string[];
  /**
   * Border radius of the component
   * @default "0.5rem"
   */
  borderRadius?: string;
}

/**
 * Shine Border
 *
 * An animated background border effect component with configurable properties.
 * Creates a beautiful shining gradient animation around the border.
 */
export function ShineBorder({
  borderWidth = 1,
  duration = 14,
  shineColor = "#000000",
  borderRadius = "0.5rem",
  className,
  style,
  children,
  ...props
}: ShineBorderProps) {
  const colorString = Array.isArray(shineColor)
    ? shineColor.join(",")
    : shineColor;

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{
        borderRadius,
        ...style,
      }}
      {...props}
    >
      {/* Shine border animation */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] will-change-[background-position]"
        style={
          {
            "--border-width": `${borderWidth}px`,
            "--duration": `${duration}s`,
            backgroundImage: `radial-gradient(transparent, transparent, ${colorString}, transparent, transparent)`,
            backgroundSize: "300% 300%",
            WebkitMask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
            WebkitMaskComposite: "xor",
            mask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
            maskComposite: "exclude",
            padding: "var(--border-width)",
            animation: `shine var(--duration) infinite linear`,
          } as React.CSSProperties
        }
      />
      {/* Content */}
      {children}
      {/* CSS Keyframes */}
      <style jsx>{`
        @keyframes shine {
          0% {
            background-position: 0% 0%;
          }
          50% {
            background-position: 100% 100%;
          }
          100% {
            background-position: 0% 0%;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Shine Border Card
 *
 * A card component with the shine border effect pre-applied
 */
export function ShineBorderCard({
  children,
  className,
  shineColor = ["#A07CFE", "#FE8FB5", "#FFBE7B"],
  borderWidth = 1.5,
  duration = 10,
  ...props
}: ShineBorderProps) {
  return (
    <ShineBorder
      className={cn(
        "bg-background/80 backdrop-blur-sm",
        className
      )}
      shineColor={shineColor}
      borderWidth={borderWidth}
      duration={duration}
      {...props}
    >
      {children}
    </ShineBorder>
  );
}

/**
 * Animated Gradient Border
 *
 * Alternative implementation with a rotating gradient border
 */
export function AnimatedGradientBorder({
  children,
  className,
  gradientColors = ["#ff0080", "#7928ca", "#ff0080"],
  borderWidth = 2,
  duration = 3,
  borderRadius = "0.75rem",
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  gradientColors?: string[];
  borderWidth?: number;
  duration?: number;
  borderRadius?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("relative p-[var(--border-width)] rounded-[var(--border-radius)]", className)}
      style={
        {
          "--border-width": `${borderWidth}px`,
          "--border-radius": borderRadius,
          background: `linear-gradient(90deg, ${gradientColors.join(", ")})`,
          backgroundSize: "200% 100%",
          animation: `gradient-shift ${duration}s linear infinite`,
        } as React.CSSProperties
      }
      {...props}
    >
      <div
        className="relative h-full w-full bg-background rounded-[calc(var(--border-radius)-var(--border-width))]"
      >
        {children}
      </div>
      <style jsx>{`
        @keyframes gradient-shift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Pulse Border
 *
 * A border with a pulsing glow effect
 */
export function PulseBorder({
  children,
  className,
  color = "rgba(102, 126, 234, 0.5)",
  borderRadius = "0.75rem",
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  color?: string;
  borderRadius?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("relative", className)}
      style={{ borderRadius }}
      {...props}
    >
      {/* Pulse glow */}
      <div
        className="absolute -inset-[2px] rounded-[inherit] opacity-75"
        style={{
          background: color,
          filter: "blur(8px)",
          animation: "pulse-border 2s ease-in-out infinite",
        }}
      />
      {/* Content container */}
      <div className="relative bg-background rounded-[inherit]">
        {children}
      </div>
      <style jsx>{`
        @keyframes pulse-border {
          0%, 100% {
            opacity: 0.5;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.01);
          }
        }
      `}</style>
    </div>
  );
}
