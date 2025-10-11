'use client';

/**
 * Airdrop Logo Component
 * Handles both emoji and external image URLs with proper error handling
 */

import { useState } from 'react';
import Image from 'next/image';
import { Sparkles } from 'lucide-react';

interface AirdropLogoProps {
  logo: string;
  alt: string;
  className?: string;
  size?: number;
}

export function AirdropLogo({ logo, alt, className = '', size = 48 }: AirdropLogoProps) {
  const [error, setError] = useState(false);

  // Check if logo is a URL
  const isUrl = logo.startsWith('http://') || logo.startsWith('https://');

  // If it's an emoji or not a URL, render it as text
  if (!isUrl) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.6 }}
      >
        {logo}
      </div>
    );
  }

  // If image failed to load or there's an error, show fallback icon
  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-lg ${className}`}
        style={{ width: size, height: size }}
      >
        <Sparkles className="text-primary" style={{ width: size * 0.5, height: size * 0.5 }} />
      </div>
    );
  }

  // Render Next.js Image for URLs
  return (
    <div className={`relative overflow-hidden rounded-lg ${className}`} style={{ width: size, height: size }}>
      <Image
        src={logo}
        alt={alt}
        width={size}
        height={size}
        className="object-contain"
        onError={() => setError(true)}
        unoptimized // Force unoptimized to avoid 403 errors from external domains
      />
    </div>
  );
}
