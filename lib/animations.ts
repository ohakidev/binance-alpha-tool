/**
 * Framer Motion Animation Variants Library
 * Game-style animations for Binance Alpha Tool
 */

import { Variants } from 'framer-motion';

// Page transitions
export const pageVariants: Variants = {
  initial: { opacity: 0, x: 50 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: 'easeOut' }
  },
  exit: {
    opacity: 0,
    x: -50,
    transition: { duration: 0.3 }
  },
};

// Card animations
export const cardVariants: Variants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 200, damping: 30 }
  },
  hover: {
    scale: 1.02,
    y: -5,
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
    transition: { duration: 0.2 }
  },
  tap: { scale: 0.98 },
};

// Stagger container
export const containerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

// Modal animations
export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 25 }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 }
  },
};

// Overlay animations
export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3 }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 }
  },
};

// Slide panel (from right)
export const sidePanelVariants: Variants = {
  closed: { x: '100%' },
  open: {
    x: 0,
    transition: { type: 'spring', stiffness: 300, damping: 30 }
  },
};

// Slide panel (from bottom) - for mobile
export const bottomSheetVariants: Variants = {
  closed: { y: '100%' },
  open: {
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 30 }
  },
};

// Fade in/out
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3 }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 }
  },
};

// Slide up (for list items)
export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 }
  },
};

// Scale animation (for buttons)
export const scaleVariants: Variants = {
  initial: { scale: 1 },
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
};

// Glow animation (for important elements)
export const glowVariants: Variants = {
  initial: { boxShadow: '0 0 5px rgba(255, 215, 0, 0.3)' },
  animate: {
    boxShadow: [
      '0 0 5px rgba(255, 215, 0, 0.3)',
      '0 0 20px rgba(255, 215, 0, 0.8)',
      '0 0 5px rgba(255, 215, 0, 0.3)',
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Shimmer loading animation
export const shimmerVariants: Variants = {
  initial: { backgroundPosition: '-200% 0' },
  animate: {
    backgroundPosition: '200% 0',
    transition: {
      repeat: Infinity,
      duration: 2,
      ease: 'linear',
    },
  },
};

// Flip animation (for countdown digits)
export const flipVariants: Variants = {
  initial: { rotateX: 0 },
  animate: {
    rotateX: 360,
    transition: { duration: 0.6, ease: 'easeInOut' },
  },
};

// Bounce animation (for notifications)
export const bounceVariants: Variants = {
  initial: { y: -100, opacity: 0 },
  animate: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 10,
    },
  },
  exit: {
    y: -100,
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

// Expand/Collapse animation
export const expandVariants: Variants = {
  collapsed: { height: 0, opacity: 0 },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: { duration: 0.3 },
      opacity: { duration: 0.25, delay: 0.05 },
    },
  },
};

// Pulse animation (for live indicators)
export const pulseVariants: Variants = {
  initial: { scale: 1, opacity: 1 },
  animate: {
    scale: [1, 1.2, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Shake animation (for errors)
export const shakeVariants: Variants = {
  initial: { x: 0 },
  shake: {
    x: [-10, 10, -10, 10, 0],
    transition: { duration: 0.5 },
  },
};

// Tooltip animation
export const tooltipVariants: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.15 },
  },
  exit: {
    opacity: 0,
    y: 10,
    scale: 0.95,
    transition: { duration: 0.1 },
  },
};

// Spring configurations
export const springConfigs = {
  default: { type: 'spring' as const, stiffness: 200, damping: 30 },
  gentle: { type: 'spring' as const, stiffness: 100, damping: 20 },
  bouncy: { type: 'spring' as const, stiffness: 400, damping: 10 },
  stiff: { type: 'spring' as const, stiffness: 300, damping: 25 },
};

// Timing configurations
export const timings = {
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
};
