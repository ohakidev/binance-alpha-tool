/**
 * Premium Framer Motion Animation Variants Library
 * Luxurious, smooth animations for Binance Alpha Tool
 */

import { Variants, Transition } from "framer-motion";

// ============================================
// Premium Easing Functions
// ============================================

export const easings = {
  // Smooth, luxurious easing
  premium: [0.16, 1, 0.3, 1] as const,
  // Bouncy, playful easing
  bounce: [0.34, 1.56, 0.64, 1] as const,
  // Elegant spring-like easing
  spring: [0.175, 0.885, 0.32, 1.275] as const,
  // Quick snap
  snap: [0.68, -0.55, 0.265, 1.55] as const,
  // Smooth deceleration
  decel: [0, 0.55, 0.45, 1] as const,
  // Smooth acceleration
  accel: [0.55, 0, 1, 0.45] as const,
  // Standard ease out
  easeOut: [0, 0, 0.2, 1] as const,
  // Standard ease in out
  easeInOut: [0.4, 0, 0.2, 1] as const,
};

// ============================================
// Spring Configurations
// ============================================

export const springConfigs = {
  // Default spring
  default: { type: "spring" as const, stiffness: 200, damping: 30 },
  // Gentle, slow spring
  gentle: { type: "spring" as const, stiffness: 120, damping: 20 },
  // Bouncy spring
  bouncy: { type: "spring" as const, stiffness: 400, damping: 10 },
  // Stiff, snappy spring
  stiff: { type: "spring" as const, stiffness: 300, damping: 25 },
  // Very soft spring
  soft: { type: "spring" as const, stiffness: 100, damping: 15 },
  // Quick response spring
  quick: { type: "spring" as const, stiffness: 500, damping: 30 },
  // Wobbly spring
  wobbly: { type: "spring" as const, stiffness: 180, damping: 12 },
  // Slow, elegant spring
  elegant: { type: "spring" as const, stiffness: 80, damping: 20, mass: 1.2 },
};

// ============================================
// Timing Configurations
// ============================================

export const timings = {
  instant: 0.1,
  fast: 0.2,
  normal: 0.35,
  slow: 0.5,
  slower: 0.7,
  slowest: 1,
};

// ============================================
// Page Transition Variants
// ============================================

export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: easings.premium,
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.98,
    transition: {
      duration: 0.3,
      ease: easings.easeOut,
    },
  },
};

export const pageSlideVariants: Variants = {
  initial: { opacity: 0, x: 60 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: easings.premium },
  },
  exit: {
    opacity: 0,
    x: -60,
    transition: { duration: 0.3, ease: easings.easeOut },
  },
};

// ============================================
// Card Animation Variants
// ============================================

export const cardVariants: Variants = {
  initial: {
    opacity: 0,
    y: 30,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springConfigs.default,
  },
  hover: {
    y: -8,
    scale: 1.02,
    boxShadow:
      "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(251, 191, 36, 0.1)",
    transition: { duration: 0.3, ease: easings.premium },
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 },
  },
};

export const premiumCardVariants: Variants = {
  initial: {
    opacity: 0,
    y: 40,
    scale: 0.9,
    rotateX: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: {
      ...springConfigs.elegant,
      opacity: { duration: 0.4 },
    },
  },
  hover: {
    y: -12,
    scale: 1.03,
    rotateX: -2,
    boxShadow:
      "0 30px 60px -15px rgba(0, 0, 0, 0.6), 0 0 50px rgba(251, 191, 36, 0.15)",
    transition: { duration: 0.4, ease: easings.premium },
  },
  tap: {
    scale: 0.97,
    y: -4,
    transition: { duration: 0.15 },
  },
};

export const glassCardVariants: Variants = {
  initial: {
    opacity: 0,
    backdropFilter: "blur(0px)",
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    backdropFilter: "blur(20px)",
    scale: 1,
    transition: { duration: 0.5, ease: easings.premium },
  },
  hover: {
    scale: 1.02,
    backdropFilter: "blur(25px)",
    transition: { duration: 0.3 },
  },
};

// ============================================
// Container & Stagger Variants
// ============================================

export const containerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

export const fastContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
};

export const slowContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2,
    },
  },
};

// ============================================
// Modal & Overlay Variants
// ============================================

export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springConfigs.stiff,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: 0.2, ease: easings.easeOut },
  },
};

export const premiumModalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.85,
    y: 40,
    rotateX: 15,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    rotateX: 0,
    transition: {
      ...springConfigs.elegant,
      opacity: { duration: 0.3 },
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 20,
    transition: { duration: 0.25, ease: easings.easeOut },
  },
};

export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3, ease: easings.easeOut },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2, ease: easings.easeOut },
  },
};

export const backdropBlurVariants: Variants = {
  hidden: {
    opacity: 0,
    backdropFilter: "blur(0px)",
  },
  visible: {
    opacity: 1,
    backdropFilter: "blur(8px)",
    transition: { duration: 0.4 },
  },
  exit: {
    opacity: 0,
    backdropFilter: "blur(0px)",
    transition: { duration: 0.3 },
  },
};

// ============================================
// Slide Panel Variants
// ============================================

export const sidePanelVariants: Variants = {
  closed: { x: "100%", opacity: 0.5 },
  open: {
    x: 0,
    opacity: 1,
    transition: springConfigs.stiff,
  },
};

export const bottomSheetVariants: Variants = {
  closed: { y: "100%", opacity: 0.5 },
  open: {
    y: 0,
    opacity: 1,
    transition: springConfigs.stiff,
  },
};

export const leftPanelVariants: Variants = {
  closed: { x: "-100%", opacity: 0.5 },
  open: {
    x: 0,
    opacity: 1,
    transition: springConfigs.stiff,
  },
};

// ============================================
// Fade Variants
// ============================================

export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.4, ease: easings.easeOut },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easings.premium },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2 },
  },
};

export const fadeDownVariants: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easings.premium },
  },
};

export const fadeScaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: easings.premium },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

// ============================================
// Slide Variants
// ============================================

export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easings.premium },
  },
};

export const slideDownVariants: Variants = {
  hidden: { opacity: 0, y: -30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easings.premium },
  },
};

export const slideRightVariants: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: easings.premium },
  },
};

export const slideLeftVariants: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: easings.premium },
  },
};

// ============================================
// Scale Variants
// ============================================

export const scaleVariants: Variants = {
  initial: { scale: 1 },
  hover: { scale: 1.05, transition: { duration: 0.2 } },
  tap: { scale: 0.95, transition: { duration: 0.1 } },
};

export const popVariants: Variants = {
  initial: { scale: 0, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: springConfigs.bouncy,
  },
  exit: {
    scale: 0,
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

export const pulseVariants: Variants = {
  initial: { scale: 1, opacity: 1 },
  animate: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// ============================================
// Glow Animation Variants
// ============================================

export const glowVariants: Variants = {
  initial: {
    boxShadow: "0 0 5px rgba(251, 191, 36, 0.3)",
  },
  animate: {
    boxShadow: [
      "0 0 5px rgba(251, 191, 36, 0.3)",
      "0 0 25px rgba(251, 191, 36, 0.6)",
      "0 0 5px rgba(251, 191, 36, 0.3)",
    ],
    transition: {
      duration: 2.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

export const glowCyanVariants: Variants = {
  initial: {
    boxShadow: "0 0 5px rgba(6, 182, 212, 0.3)",
  },
  animate: {
    boxShadow: [
      "0 0 5px rgba(6, 182, 212, 0.3)",
      "0 0 25px rgba(6, 182, 212, 0.6)",
      "0 0 5px rgba(6, 182, 212, 0.3)",
    ],
    transition: {
      duration: 2.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

export const glowGradientVariants: Variants = {
  initial: {
    boxShadow:
      "0 0 10px rgba(251, 191, 36, 0.2), 0 0 20px rgba(6, 182, 212, 0.1)",
  },
  animate: {
    boxShadow: [
      "0 0 10px rgba(251, 191, 36, 0.2), 0 0 20px rgba(6, 182, 212, 0.1)",
      "0 0 25px rgba(251, 191, 36, 0.4), 0 0 40px rgba(6, 182, 212, 0.3)",
      "0 0 10px rgba(6, 182, 212, 0.2), 0 0 20px rgba(251, 191, 36, 0.1)",
      "0 0 10px rgba(251, 191, 36, 0.2), 0 0 20px rgba(6, 182, 212, 0.1)",
    ],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// ============================================
// Shimmer & Loading Variants
// ============================================

export const shimmerVariants: Variants = {
  initial: { backgroundPosition: "-200% 0" },
  animate: {
    backgroundPosition: "200% 0",
    transition: {
      repeat: Infinity,
      duration: 2,
      ease: "linear",
    },
  },
};

export const skeletonVariants: Variants = {
  initial: { opacity: 0.5 },
  animate: {
    opacity: [0.5, 0.8, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

export const spinnerVariants: Variants = {
  initial: { rotate: 0 },
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear",
    },
  },
};

// ============================================
// Notification & Toast Variants
// ============================================

export const bounceVariants: Variants = {
  initial: { y: -100, opacity: 0, scale: 0.8 },
  animate: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: springConfigs.bouncy,
  },
  exit: {
    y: -50,
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.2 },
  },
};

export const toastVariants: Variants = {
  initial: { x: 100, opacity: 0, scale: 0.9 },
  animate: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: springConfigs.stiff,
  },
  exit: {
    x: 100,
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.2, ease: easings.easeOut },
  },
};

export const notificationVariants: Variants = {
  initial: { y: -20, opacity: 0, scale: 0.95 },
  animate: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: springConfigs.stiff,
  },
  exit: {
    y: -10,
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.15 },
  },
};

// ============================================
// Tooltip Variants
// ============================================

export const tooltipVariants: Variants = {
  hidden: { opacity: 0, y: 8, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.15, ease: easings.easeOut },
  },
  exit: {
    opacity: 0,
    y: 4,
    scale: 0.98,
    transition: { duration: 0.1 },
  },
};

export const tooltipTopVariants: Variants = {
  hidden: { opacity: 0, y: -8, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.15, ease: easings.easeOut },
  },
};

// ============================================
// Expand/Collapse Variants
// ============================================

export const expandVariants: Variants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: {
      height: { duration: 0.3, ease: easings.easeOut },
      opacity: { duration: 0.2 },
    },
  },
  expanded: {
    height: "auto",
    opacity: 1,
    transition: {
      height: { duration: 0.4, ease: easings.premium },
      opacity: { duration: 0.3, delay: 0.1 },
    },
  },
};

export const accordionVariants: Variants = {
  collapsed: {
    height: 0,
    opacity: 0,
    scale: 0.98,
  },
  expanded: {
    height: "auto",
    opacity: 1,
    scale: 1,
    transition: {
      height: { duration: 0.4, ease: easings.premium },
      opacity: { duration: 0.3, delay: 0.05 },
      scale: { duration: 0.3 },
    },
  },
};

// ============================================
// Flip Variants
// ============================================

export const flipVariants: Variants = {
  initial: { rotateY: 0 },
  flip: {
    rotateY: 180,
    transition: { duration: 0.6, ease: easings.easeInOut },
  },
};

export const flipXVariants: Variants = {
  initial: { rotateX: 0 },
  flip: {
    rotateX: 180,
    transition: { duration: 0.6, ease: easings.easeInOut },
  },
};

// ============================================
// Shake & Wiggle Variants
// ============================================

export const shakeVariants: Variants = {
  initial: { x: 0 },
  shake: {
    x: [-10, 10, -8, 8, -5, 5, 0],
    transition: { duration: 0.5 },
  },
};

export const wiggleVariants: Variants = {
  initial: { rotate: 0 },
  wiggle: {
    rotate: [-3, 3, -2, 2, -1, 1, 0],
    transition: { duration: 0.5 },
  },
};

export const vibrateVariants: Variants = {
  initial: { x: 0, y: 0 },
  vibrate: {
    x: [-2, 2, -2, 2, -1, 1, 0],
    y: [-1, 1, -1, 1, 0],
    transition: { duration: 0.3 },
  },
};

// ============================================
// List Item Variants
// ============================================

export const listItemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: easings.premium },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: 0.2 },
  },
};

export const tableRowVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: easings.easeOut },
  },
  hover: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    transition: { duration: 0.15 },
  },
};

// ============================================
// Icon Animation Variants
// ============================================

export const iconBounceVariants: Variants = {
  initial: { y: 0 },
  animate: {
    y: [0, -4, 0],
    transition: {
      duration: 0.5,
      repeat: Infinity,
      repeatDelay: 2,
    },
  },
};

export const iconSpinVariants: Variants = {
  initial: { rotate: 0 },
  animate: {
    rotate: 360,
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "linear",
    },
  },
};

export const iconPulseVariants: Variants = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.2, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// ============================================
// Button Variants
// ============================================

export const buttonVariants: Variants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.03,
    transition: { duration: 0.2, ease: easings.easeOut },
  },
  tap: {
    scale: 0.97,
    transition: { duration: 0.1 },
  },
};

export const premiumButtonVariants: Variants = {
  initial: {
    scale: 1,
    boxShadow: "0 4px 15px rgba(251, 191, 36, 0.3)",
  },
  hover: {
    scale: 1.03,
    y: -2,
    boxShadow: "0 8px 25px rgba(251, 191, 36, 0.4)",
    transition: { duration: 0.25, ease: easings.premium },
  },
  tap: {
    scale: 0.97,
    y: 0,
    boxShadow: "0 2px 10px rgba(251, 191, 36, 0.3)",
    transition: { duration: 0.1 },
  },
};

// ============================================
// Progress & Meter Variants
// ============================================

export const progressVariants: Variants = {
  initial: { width: 0, opacity: 0 },
  animate: (custom: number) => ({
    width: `${custom}%`,
    opacity: 1,
    transition: { duration: 1, ease: easings.premium },
  }),
};

export const meterVariants: Variants = {
  initial: { scaleX: 0, transformOrigin: "left" },
  animate: {
    scaleX: 1,
    transition: { duration: 0.8, ease: easings.premium },
  },
};

// ============================================
// Count Animation Variants
// ============================================

export const countUpVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
};

export const countFlipVariants: Variants = {
  initial: { rotateX: -90, opacity: 0 },
  animate: {
    rotateX: 0,
    opacity: 1,
    transition: { duration: 0.4, ease: easings.easeOut },
  },
  exit: {
    rotateX: 90,
    opacity: 0,
    transition: { duration: 0.3 },
  },
};

// ============================================
// Particle & Effect Variants
// ============================================

export const particleVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0,
    x: 0,
    y: 0,
  },
  animate: (custom: { x: number; y: number; delay: number }) => ({
    opacity: [0, 1, 0],
    scale: [0, 1, 0.5],
    x: custom.x,
    y: custom.y,
    transition: {
      duration: 1.5,
      delay: custom.delay,
      ease: easings.easeOut,
    },
  }),
};

export const rippleVariants: Variants = {
  initial: {
    scale: 0,
    opacity: 0.5,
  },
  animate: {
    scale: 4,
    opacity: 0,
    transition: {
      duration: 0.8,
      ease: easings.easeOut,
    },
  },
};

export const sparkleVariants: Variants = {
  initial: { scale: 0, rotate: 0, opacity: 0 },
  animate: {
    scale: [0, 1, 0],
    rotate: [0, 180],
    opacity: [0, 1, 0],
    transition: {
      duration: 0.8,
      ease: easings.easeOut,
    },
  },
};

// ============================================
// Navigation Variants
// ============================================

export const navItemVariants: Variants = {
  initial: { opacity: 0.7 },
  active: {
    opacity: 1,
    transition: { duration: 0.2 },
  },
  hover: {
    opacity: 1,
    scale: 1.05,
    transition: { duration: 0.2 },
  },
};

export const navIndicatorVariants: Variants = {
  initial: { opacity: 0, scaleX: 0 },
  animate: {
    opacity: 1,
    scaleX: 1,
    transition: springConfigs.stiff,
  },
};

export const mobileNavVariants: Variants = {
  closed: {
    y: "100%",
    opacity: 0,
  },
  open: {
    y: 0,
    opacity: 1,
    transition: springConfigs.stiff,
  },
};

// ============================================
// Tab Variants
// ============================================

export const tabContentVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: easings.easeOut },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2 },
  },
};

export const tabIndicatorVariants: Variants = {
  initial: { scaleX: 0.8, opacity: 0 },
  animate: {
    scaleX: 1,
    opacity: 1,
    transition: springConfigs.stiff,
  },
};

// ============================================
// Utility Functions
// ============================================

export function createStaggerDelay(
  index: number,
  baseDelay: number = 0.05,
): number {
  return index * baseDelay;
}

export function createCustomTransition(
  duration: number = 0.3,
  easing: readonly number[] = easings.premium,
): Transition {
  return {
    duration,
    ease: easing as [number, number, number, number],
  };
}

export function createSpringTransition(
  stiffness: number = 200,
  damping: number = 30,
): Transition {
  return {
    type: "spring",
    stiffness,
    damping,
  };
}

// ============================================
// Preset Animation Configs
// ============================================

export const presets = {
  // Quick, snappy animations
  quick: {
    duration: 0.2,
    ease: easings.easeOut,
  },
  // Smooth, premium feel
  premium: {
    duration: 0.4,
    ease: easings.premium,
  },
  // Bouncy, playful
  bouncy: springConfigs.bouncy,
  // Elegant, slow
  elegant: {
    duration: 0.6,
    ease: easings.premium,
  },
  // Spring default
  spring: springConfigs.default,
};

const animationsModule = {
  easings,
  springConfigs,
  timings,
  pageVariants,
  pageSlideVariants,
  cardVariants,
  premiumCardVariants,
  glassCardVariants,
  containerVariants,
  fastContainerVariants,
  slowContainerVariants,
  modalVariants,
  premiumModalVariants,
  overlayVariants,
  backdropBlurVariants,
  sidePanelVariants,
  bottomSheetVariants,
  leftPanelVariants,
  fadeVariants,
  fadeUpVariants,
  fadeDownVariants,
  fadeScaleVariants,
  slideUpVariants,
  slideDownVariants,
  slideRightVariants,
  slideLeftVariants,
  scaleVariants,
  popVariants,
  pulseVariants,
  glowVariants,
  glowCyanVariants,
  glowGradientVariants,
  shimmerVariants,
  skeletonVariants,
  spinnerVariants,
  bounceVariants,
  toastVariants,
  notificationVariants,
  tooltipVariants,
  tooltipTopVariants,
  expandVariants,
  accordionVariants,
  flipVariants,
  flipXVariants,
  shakeVariants,
  wiggleVariants,
  vibrateVariants,
  listItemVariants,
  tableRowVariants,
  iconBounceVariants,
  iconSpinVariants,
  iconPulseVariants,
  buttonVariants,
  premiumButtonVariants,
  progressVariants,
  meterVariants,
  countUpVariants,
  countFlipVariants,
  particleVariants,
  rippleVariants,
  sparkleVariants,
  navItemVariants,
  navIndicatorVariants,
  mobileNavVariants,
  tabContentVariants,
  tabIndicatorVariants,
  presets,
  createStaggerDelay,
  createCustomTransition,
  createSpringTransition,
};

export default animationsModule;
