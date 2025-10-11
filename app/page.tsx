"use client";

/**
 * Home Page - Unified Airdrop Dashboard
 * Clean, table-based UI with all airdrop information in one place
 */

import dynamic from "next/dynamic";

// Dynamic import for AirdropsTable for better performance
const AirdropsTable = dynamic(
  () => import("@/components/features/airdrops/airdrops-table").then(mod => ({ default: mod.AirdropsTable })),
  {
    loading: () => (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-24 bg-muted rounded-lg" />
            <div className="h-24 bg-muted rounded-lg" />
            <div className="h-24 bg-muted rounded-lg" />
          </div>
          <div className="h-96 bg-muted rounded-lg" />
        </div>
      </div>
    ),
    ssr: true,
  }
);

export default function Home() {
  return (
    <div className="min-h-screen bg-background" suppressHydrationWarning>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
        <AirdropsTable />
      </div>
    </div>
  );
}
