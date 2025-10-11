/**
 * Custom hook for animated number counting
 * Used for stats and metrics displays
 */

import { useEffect } from "react";
import {
  useMotionValue,
  useTransform,
  animate,
  MotionValue,
  EasingDefinition,
} from "framer-motion";

interface UseCountUpOptions {
  duration?: number;
  ease?: EasingDefinition;
  decimals?: number;
}

export function useCountUp(
  value: number,
  options: UseCountUpOptions = {}
): MotionValue<string> {
  const { duration = 1, ease = "easeOut", decimals = 0 } = options;

  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) => {
    if (decimals > 0) {
      return latest.toFixed(decimals);
    }
    return Math.round(latest).toString();
  });

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration,
      ease,
    });

    return () => controls.stop();
  }, [value, motionValue, duration, ease]);

  return rounded;
}
