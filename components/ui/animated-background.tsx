/**
 * Animated Background Component
 * Uses CSS animations for better performance (GPU accelerated)
 * No JavaScript animation libraries - pure CSS for smooth 60fps
 */

"use client";

import { memo } from "react";

interface AnimatedBackgroundProps {
  variant?: "default" | "subtle" | "intense";
  className?: string;
}

/**
 * Premium animated background with gold theme
 * Uses CSS animations and transforms for GPU acceleration
 */
export const AnimatedBackground = memo(function AnimatedBackground({
  variant = "default",
  className = "",
}: AnimatedBackgroundProps) {
  const intensityConfig = {
    default: {
      glow1Opacity: "0.08",
      glow2Opacity: "0.06",
      glow3Opacity: "0.04",
      glow1Size: "600px",
      glow2Size: "500px",
      glow3Size: "400px",
    },
    subtle: {
      glow1Opacity: "0.05",
      glow2Opacity: "0.04",
      glow3Opacity: "0.03",
      glow1Size: "500px",
      glow2Size: "400px",
      glow3Size: "300px",
    },
    intense: {
      glow1Opacity: "0.12",
      glow2Opacity: "0.10",
      glow3Opacity: "0.08",
      glow1Size: "700px",
      glow2Size: "600px",
      glow3Size: "500px",
    },
  };

  const config = intensityConfig[variant];

  return (
    <div
      className={`fixed inset-0 pointer-events-none overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* Base gradient - static, no animation */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#030305] via-[#0a0a0c] to-[#030305]" />

      {/* Animated gold glow - top left */}
      <div
        className="absolute -top-1/4 -left-1/4 rounded-full animate-glow-1"
        style={{
          width: config.glow1Size,
          height: config.glow1Size,
          background: `radial-gradient(circle, rgba(212,169,72,${config.glow1Opacity}) 0%, transparent 60%)`,
          filter: "blur(60px)",
          willChange: "transform, opacity",
        }}
      />

      {/* Animated gold glow - bottom right */}
      <div
        className="absolute -bottom-1/4 -right-1/4 rounded-full animate-glow-2"
        style={{
          width: config.glow2Size,
          height: config.glow2Size,
          background: `radial-gradient(circle, rgba(184,134,11,${config.glow2Opacity}) 0%, transparent 60%)`,
          filter: "blur(60px)",
          willChange: "transform, opacity",
        }}
      />

      {/* Animated gold glow - center */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full animate-glow-3"
        style={{
          width: config.glow3Size,
          height: config.glow3Size,
          background: `radial-gradient(circle, rgba(212,169,72,${config.glow3Opacity}) 0%, transparent 70%)`,
          filter: "blur(50px)",
          willChange: "transform, opacity",
        }}
      />

      {/* Mesh pattern overlay - static */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            radial-gradient(circle at 25% 25%, rgba(212,169,72,0.15) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(184,134,11,0.1) 0%, transparent 50%)
          `,
        }}
      />

      {/* Subtle noise texture - static */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
});

/**
 * Static background variant - no animations for maximum performance
 */
export const StaticBackground = memo(function StaticBackground({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`fixed inset-0 pointer-events-none overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#030305] via-[#0a0a0c] to-[#030305]" />

      {/* Static gold glows */}
      <div
        className="absolute top-0 left-1/4 w-[600px] h-[600px] opacity-60"
        style={{
          background:
            "radial-gradient(circle, rgba(212,169,72,0.08) 0%, transparent 60%)",
          filter: "blur(60px)",
        }}
      />
      <div
        className="absolute bottom-0 right-1/4 w-[500px] h-[500px] opacity-50"
        style={{
          background:
            "radial-gradient(circle, rgba(184,134,11,0.06) 0%, transparent 60%)",
          filter: "blur(60px)",
        }}
      />
    </div>
  );
});

/**
 * Bottom gradient fade overlay
 */
export const BottomGradientFade = memo(function BottomGradientFade() {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#030305] to-transparent pointer-events-none z-0"
      aria-hidden="true"
    />
  );
});

export default AnimatedBackground;
