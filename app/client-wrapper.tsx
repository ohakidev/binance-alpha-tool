"use client";

/**
 * Client Animation Wrapper
 * Provides smooth entrance animations for content
 * Uses framer-motion for optimized animations with GPU acceleration
 */

import { motion, AnimatePresence } from "framer-motion";
import { ReactNode, useState, useEffect } from "react";

interface ClientAnimationWrapperProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

/**
 * Wrapper component that provides smooth fade-in and slide-up animation
 * Only animates on client-side to prevent hydration mismatches
 */
export function ClientAnimationWrapper({
  children,
  className = "",
  delay = 0,
}: ClientAnimationWrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Render children immediately for SSR, animate on client
  if (!mounted) {
    return <div className={className}>{children}</div>;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        className={className}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{
          duration: 0.5,
          delay,
          ease: [0.16, 1, 0.3, 1], // Custom easing for premium feel
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Staggered animation wrapper for lists
 * Children animate in sequence with configurable stagger delay
 */
interface StaggeredWrapperProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggeredWrapper({
  children,
  className = "",
  staggerDelay = 0.1,
}: StaggeredWrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Individual item for staggered animations
 */
export function StaggeredItem({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.4,
            ease: [0.16, 1, 0.3, 1],
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Fade wrapper - simple opacity animation
 */
export function FadeWrapper({
  children,
  className = "",
  duration = 0.3,
}: {
  children: ReactNode;
  className?: string;
  duration?: number;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Scale wrapper - scale in animation
 */
export function ScaleWrapper({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

export default ClientAnimationWrapper;
