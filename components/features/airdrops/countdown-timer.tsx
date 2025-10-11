'use client';

/**
 * Countdown Timer Component
 * Flip animation countdown for airdrop drop times
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface CountdownTimerProps {
  targetDate: Date;
  onComplete?: () => void;
}

function FlipDigit({ value, label }: { value: number; label: string }) {
  const [prevValue, setPrevValue] = useState(value);

  useEffect(() => {
    if (value !== prevValue) {
      setPrevValue(value);
    }
  }, [value, prevValue]);

  const displayValue = value.toString().padStart(2, '0');

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-12 h-14 md:w-14 md:h-16">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={value}
            initial={{ rotateX: 90, opacity: 0 }}
            animate={{ rotateX: 0, opacity: 1 }}
            exit={{ rotateX: -90, opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute inset-0 flex items-center justify-center glass-card rounded-lg"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <span className="text-2xl md:text-3xl font-bold gradient-text-gold">
              {displayValue}
            </span>
          </motion.div>
        </AnimatePresence>

        {/* Middle divider line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-background/50 z-10" />
      </div>
      <span className="text-xs text-muted-foreground font-medium uppercase">
        {label}
      </span>
    </div>
  );
}

export function CountdownTimer({ targetDate, onComplete }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const difference = target - now;

      if (difference <= 0) {
        setIsComplete(true);
        if (onComplete) onComplete();
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      };
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate, onComplete]);

  if (isComplete) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-card px-4 py-2 rounded-lg text-center"
      >
        <span className="text-sm font-bold gradient-text-gold">🎉 LIVE NOW!</span>
      </motion.div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <FlipDigit value={timeLeft.days} label="Days" />
      <span className="text-2xl font-bold text-muted-foreground">:</span>
      <FlipDigit value={timeLeft.hours} label="Hours" />
      <span className="text-2xl font-bold text-muted-foreground">:</span>
      <FlipDigit value={timeLeft.minutes} label="Mins" />
      <span className="text-2xl font-bold text-muted-foreground">:</span>
      <FlipDigit value={timeLeft.seconds} label="Secs" />
    </div>
  );
}
