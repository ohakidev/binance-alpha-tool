"use client";

import { motion, Variants, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ElementType, ReactNode, useMemo } from "react";

type AnimationType = "text" | "word" | "character" | "line";
type AnimationVariant =
  | "fadeIn"
  | "blurIn"
  | "blurInUp"
  | "blurInDown"
  | "slideUp"
  | "slideDown"
  | "slideLeft"
  | "slideRight"
  | "scaleUp"
  | "scaleDown";

interface TextAnimateProps {
  /**
   * The text content to animate
   */
  children: string;
  /**
   * The class name to be applied to the component
   */
  className?: string;
  /**
   * The class name to be applied to each segment
   */
  segmentClassName?: string;
  /**
   * The delay before the animation starts (in seconds)
   */
  delay?: number;
  /**
   * How to split the text for animation
   * @default "word"
   */
  by?: AnimationType;
  /**
   * The animation variant to use
   * @default "fadeIn"
   */
  animation?: AnimationVariant;
  /**
   * The element type to render as
   * @default "p"
   */
  as?: ElementType;
  /**
   * Duration of each segment animation
   * @default 0.3
   */
  duration?: number;
  /**
   * Stagger delay between segments
   * @default 0.05
   */
  stagger?: number;
}

const defaultVariants: Record<AnimationVariant, Variants> = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  blurIn: {
    hidden: { opacity: 0, filter: "blur(10px)" },
    visible: { opacity: 1, filter: "blur(0px)" },
  },
  blurInUp: {
    hidden: { opacity: 0, filter: "blur(10px)", y: 20 },
    visible: { opacity: 1, filter: "blur(0px)", y: 0 },
  },
  blurInDown: {
    hidden: { opacity: 0, filter: "blur(10px)", y: -20 },
    visible: { opacity: 1, filter: "blur(0px)", y: 0 },
  },
  slideUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  },
  slideDown: {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
  },
  slideLeft: {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
  },
  slideRight: {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  },
  scaleUp: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
  },
  scaleDown: {
    hidden: { opacity: 0, scale: 1.2 },
    visible: { opacity: 1, scale: 1 },
  },
};

export function TextAnimate({
  children,
  className,
  segmentClassName,
  delay = 0,
  by = "word",
  animation = "fadeIn",
  as: Component = "p",
  duration = 0.3,
  stagger = 0.05,
}: TextAnimateProps) {
  const segments = useMemo(() => {
    switch (by) {
      case "character":
        return children.split("");
      case "word":
        return children.split(/(\s+)/);
      case "line":
        return children.split("\n");
      case "text":
      default:
        return [children];
    }
  }, [children, by]);

  // Use a wrapper div for the container animation
  const Wrapper = Component as ElementType;

  return (
    <AnimatePresence>
      <motion.div
        className={cn("whitespace-pre-wrap", className)}
        initial="hidden"
        animate="visible"
        exit="hidden"
        transition={{
          staggerChildren: stagger,
          delayChildren: delay,
        }}
      >
        <Wrapper>
          {segments.map((segment, index) => (
            <motion.span
              key={`${segment}-${index}`}
              className={cn("inline-block", segmentClassName)}
              variants={defaultVariants[animation]}
              transition={{
                duration,
                ease: "easeOut",
              }}
            >
              {segment === " " ? "\u00A0" : segment}
            </motion.span>
          ))}
        </Wrapper>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Gradient Text with animation
 */
export function GradientText({
  children,
  className,
  colors = ["#ff0080", "#7928ca", "#ff0080"],
  animationDuration = 3,
}: {
  children: ReactNode;
  className?: string;
  colors?: string[];
  animationDuration?: number;
}) {
  return (
    <span
      className={cn(
        "bg-clip-text text-transparent bg-gradient-to-r",
        className,
      )}
      style={{
        backgroundImage: `linear-gradient(90deg, ${colors.join(", ")})`,
        backgroundSize: "200% auto",
        animation: `gradient-shift ${animationDuration}s linear infinite`,
      }}
    >
      {children}
      <style jsx>{`
        @keyframes gradient-shift {
          0% {
            background-position: 0% center;
          }
          100% {
            background-position: 200% center;
          }
        }
      `}</style>
    </span>
  );
}

/**
 * Shiny Text with moving highlight effect
 */
export function ShinyText({
  children,
  className,
  shimmerColor = "rgba(255, 255, 255, 0.5)",
  shimmerWidth = 100,
  duration = 3,
}: {
  children: ReactNode;
  className?: string;
  shimmerColor?: string;
  shimmerWidth?: number;
  duration?: number;
}) {
  return (
    <span
      className={cn("relative inline-block overflow-hidden", className)}
      style={
        {
          "--shimmer-color": shimmerColor,
          "--shimmer-width": `${shimmerWidth}px`,
        } as React.CSSProperties
      }
    >
      {children}
      <span
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent, var(--shimmer-color), transparent)`,
          backgroundSize: "var(--shimmer-width) 100%",
          animation: `shimmer ${duration}s infinite linear`,
        }}
      />
      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -100% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </span>
  );
}

/**
 * Typing Animation
 */
export function TypingAnimation({
  text,
  className,
  duration = 0.1,
  delay = 0,
  cursor = true,
  cursorClassName,
}: {
  text: string;
  className?: string;
  duration?: number;
  delay?: number;
  cursor?: boolean;
  cursorClassName?: string;
}) {
  const characters = text.split("");

  return (
    <span className={cn("inline-flex", className)}>
      <motion.span
        initial="hidden"
        animate="visible"
        transition={{
          staggerChildren: duration,
          delayChildren: delay,
        }}
      >
        {characters.map((char, index) => (
          <motion.span
            key={`${char}-${index}`}
            className="inline-block"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1 },
            }}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        ))}
      </motion.span>
      {cursor && (
        <motion.span
          className={cn("inline-block ml-1", cursorClassName)}
          animate={{ opacity: [1, 0] }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        >
          |
        </motion.span>
      )}
    </span>
  );
}

/**
 * Flip Text Animation
 */
export function FlipText({
  children,
  className,
  duration = 0.5,
  stagger = 0.05,
}: {
  children: string;
  className?: string;
  duration?: number;
  stagger?: number;
}) {
  const words = children.split(" ");

  return (
    <motion.span
      className={cn("inline-flex flex-wrap gap-x-2", className)}
      initial="hidden"
      animate="visible"
      transition={{
        staggerChildren: stagger,
      }}
    >
      {words.map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          className="inline-block origin-bottom"
          variants={{
            hidden: {
              rotateX: -90,
              opacity: 0,
              y: 20,
            },
            visible: {
              rotateX: 0,
              opacity: 1,
              y: 0,
            },
          }}
          transition={{
            duration,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          {word}
        </motion.span>
      ))}
    </motion.span>
  );
}

/**
 * Wavy Text Animation
 */
export function WavyText({
  children,
  className,
  delay = 0,
  duration = 0.05,
}: {
  children: string;
  className?: string;
  delay?: number;
  duration?: number;
}) {
  const letters = children.split("");

  return (
    <motion.span
      className={cn("inline-flex", className)}
      initial="hidden"
      animate="visible"
      transition={{
        staggerChildren: duration,
        delayChildren: delay,
      }}
    >
      {letters.map((letter, index) => (
        <motion.span
          key={`${letter}-${index}`}
          className="inline-block"
          variants={{
            hidden: { y: 0 },
            visible: {
              y: [0, -10, 0],
              transition: {
                repeat: Infinity,
                repeatDelay: letters.length * duration,
                duration: 0.3,
                ease: "easeInOut",
              },
            },
          }}
        >
          {letter === " " ? "\u00A0" : letter}
        </motion.span>
      ))}
    </motion.span>
  );
}

/**
 * Scramble Text Animation
 */
export function ScrambleText({
  children,
  className,
  duration = 1,
}: {
  children: string;
  className?: string;
  duration?: number;
}) {
  return (
    <motion.span
      className={cn("inline-block", className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {children.split("").map((char, index) => (
        <motion.span
          key={index}
          className="inline-block"
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
          }}
          transition={{
            delay: (index / children.length) * duration,
            duration: 0.1,
          }}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </motion.span>
  );
}
