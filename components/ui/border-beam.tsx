"use client";

import { motion, Transition } from "framer-motion";
import { cn } from "@/lib/utils";

interface BorderBeamProps {
  /**
   * The size of the border beam.
   */
  size?: number;
  /**
   * The duration of the border beam animation.
   */
  duration?: number;
  /**
   * The delay before the animation starts.
   */
  delay?: number;
  /**
   * The starting color of the border beam gradient.
   */
  colorFrom?: string;
  /**
   * The ending color of the border beam gradient.
   */
  colorTo?: string;
  /**
   * Custom motion transition settings.
   */
  transition?: Transition;
  /**
   * Additional class names for styling.
   */
  className?: string;
  /**
   * Custom inline styles.
   */
  style?: React.CSSProperties;
  /**
   * Whether to reverse the animation direction.
   */
  reverse?: boolean;
  /**
   * The initial offset position (0-100).
   */
  initialOffset?: number;
  /**
   * The border width of the beam.
   */
  borderWidth?: number;
}

export function BorderBeam({
  className,
  size = 50,
  delay = 0,
  duration = 6,
  colorFrom = "#ffaa40",
  colorTo = "#9c40ff",
  transition,
  style,
  reverse = false,
  initialOffset = 0,
  borderWidth = 1.5,
}: BorderBeamProps) {
  return (
    <div
      className="pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden"
      style={
        {
          "--border-beam-width": `${borderWidth}px`,
        } as React.CSSProperties
      }
    >
      {/* Border mask container */}
      <div
        className="absolute inset-0 rounded-[inherit]"
        style={{
          padding: borderWidth,
          background: "transparent",
          WebkitMask:
            "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      >
        {/* Animated beam */}
        <motion.div
          className={cn("absolute", className)}
          style={{
            width: size,
            height: size,
            background: `linear-gradient(${reverse ? "90deg" : "270deg"}, ${colorFrom} 0%, ${colorTo} 100%)`,
            borderRadius: "50%",
            filter: "blur(4px)",
            ...style,
          }}
          initial={{
            offsetDistance: `${initialOffset}%`,
            opacity: 0,
          }}
          animate={{
            offsetDistance: [`${initialOffset}%`, `${100 + initialOffset}%`],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration,
            delay,
            ease: "linear",
            repeat: Infinity,
            repeatType: "loop",
            ...transition,
          }}
        />
      </div>

      {/* Alternative implementation using CSS animations for better performance */}
      <motion.div
        className={cn(
          "absolute h-full w-[100px] rounded-full",
          className
        )}
        style={{
          background: `linear-gradient(${reverse ? "to left" : "to right"}, transparent, ${colorFrom}, ${colorTo}, transparent)`,
          ...style,
        }}
        initial={{ x: "-100%", opacity: 0 }}
        animate={{
          x: ["calc(-100%)", "calc(100% + 100vw)"],
          opacity: [0, 1, 1, 0],
        }}
        transition={{
          duration,
          delay,
          ease: "linear",
          repeat: Infinity,
          repeatType: "loop",
          ...transition,
        }}
      />
    </div>
  );
}

// Alternative simpler beam that travels along the top edge
export function TopBorderBeam({
  className,
  size = 100,
  duration = 3,
  delay = 0,
  colorFrom = "#ffaa40",
  colorTo = "#9c40ff",
}: {
  className?: string;
  size?: number;
  duration?: number;
  delay?: number;
  colorFrom?: string;
  colorTo?: string;
}) {
  return (
    <motion.div
      className={cn(
        "pointer-events-none absolute top-0 left-0 h-[2px] rounded-full",
        className
      )}
      style={{
        width: size,
        background: `linear-gradient(to right, transparent, ${colorFrom}, ${colorTo}, transparent)`,
      }}
      initial={{ x: "-100%", opacity: 0 }}
      animate={{
        x: ["calc(-100%)", "calc(100vw)"],
        opacity: [0, 1, 1, 0],
      }}
      transition={{
        duration,
        delay,
        ease: "linear",
        repeat: Infinity,
        repeatType: "loop",
      }}
    />
  );
}

// Corner glow effect
export function CornerGlow({
  className,
  color = "rgba(102, 126, 234, 0.5)",
  size = 150,
  position = "top-right",
}: {
  className?: string;
  color?: string;
  size?: number;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}) {
  const positionClasses = {
    "top-left": "top-0 left-0",
    "top-right": "top-0 right-0",
    "bottom-left": "bottom-0 left-0",
    "bottom-right": "bottom-0 right-0",
  };

  return (
    <motion.div
      className={cn(
        "pointer-events-none absolute rounded-full blur-3xl",
        positionClasses[position],
        className
      )}
      style={{
        width: size,
        height: size,
        background: color,
      }}
      animate={{
        opacity: [0.3, 0.6, 0.3],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}
