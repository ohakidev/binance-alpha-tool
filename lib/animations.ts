/**
 * Animation Variants
 * Centralized animation definitions for Framer Motion
 * Only includes variants that are actively used in the project
 */

import { Variants, Transition } from "framer-motion";

// ============= Timing & Easing =============

export const easings = {
  premium: [0.16, 1, 0.3, 1] as const,
  easeOut: [0.0, 0.0, 0.2, 1] as const,
  easeInOut: [0.4, 0, 0.2, 1] as const,
};

export const springConfigs = {
  default: {
    type: "spring" as const,
    stiffness: 300,
    damping: 30,
  },
  gentle: {
    type: "spring" as const,
    stiffness: 200,
    damping: 25,
  },
  bouncy: {
    type: "spring" as const,
    stiffness: 400,
    damping: 25,
  },
  stiff: {
    type: "spring" as const,
    stiffness: 400,
    damping: 30,
  },
} satisfies Record<string, Transition>;

// ============= Container Variants =============

export const containerVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

// ============= Card Variants =============

export const cardVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springConfigs.gentle,
  },
  hover: {
    y: -4,
    scale: 1.02,
    boxShadow:
      "0 20px 40px -12px rgba(0, 0, 0, 0.3), 0 0 20px rgba(245, 158, 11, 0.1)",
    transition: { duration: 0.2, ease: easings.premium },
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 },
  },
};

// ============= Modal Variants =============

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
    transition: springConfigs.default,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: 0.15, ease: easings.easeOut },
  },
};

// ============= Overlay Variants =============

export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2, ease: easings.easeOut },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15, ease: easings.easeOut },
  },
};

// ============= Side Panel Variants =============

export const sidePanelVariants: Variants = {
  closed: { x: "100%", opacity: 0 },
  open: {
    x: 0,
    opacity: 1,
    transition: springConfigs.default,
  },
};

// ============= Fade Variants =============

export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3 },
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

// ============= Bounce Variants (for toasts) =============

export const bounceVariants: Variants = {
  initial: { y: -50, opacity: 0, scale: 0.9 },
  animate: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: springConfigs.bouncy,
  },
  exit: {
    y: -20,
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

// ============= Navigation Variants =============

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

// ============= Default Export =============

const animations = {
  easings,
  springConfigs,
  containerVariants,
  cardVariants,
  modalVariants,
  overlayVariants,
  sidePanelVariants,
  fadeVariants,
  fadeUpVariants,
  bounceVariants,
  navItemVariants,
  navIndicatorVariants,
};

export default animations;
