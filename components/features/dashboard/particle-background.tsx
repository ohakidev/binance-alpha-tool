'use client';

/**
 * Particle Background Component - Optimized
 * Subtle floating particles with CSS animations for better performance
 */

import { useEffect, useState, memo } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}

function ParticleBackgroundComponent({ count = 15 }: { count?: number }) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      setParticles([]);
      return;
    }

    // Generate random particles (reduced count for better performance)
    const newParticles: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 2, // 2-5px
      duration: Math.random() * 10 + 20, // 20-30s (slower for smoother animation)
      delay: Math.random() * 5,
    }));

    setParticles(newParticles);
  }, [count, prefersReducedMotion]);

  if (prefersReducedMotion || particles.length === 0) {
    return null;
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full particle-float"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            background: 'radial-gradient(circle, rgba(255, 215, 0, 0.2) 0%, rgba(0, 206, 209, 0.05) 100%)',
            boxShadow: '0 0 8px rgba(255, 215, 0, 0.2)',
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
            // Use will-change for better performance
            willChange: 'transform, opacity',
          }}
        />
      ))}
      <style jsx>{`
        @keyframes particleFloat {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.2;
          }
          50% {
            transform: translateY(-30px) translateX(10px);
            opacity: 0.4;
          }
        }
        .particle-float {
          animation: particleFloat linear infinite;
        }
      `}</style>
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export const ParticleBackground = memo(ParticleBackgroundComponent);
