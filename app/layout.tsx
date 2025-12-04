import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/layout/navigation";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/lib/providers/query-provider";
import { ThemeProvider } from "@/lib/providers/theme-provider";

// Optimized font loading with display swap and preload
const prompt = Prompt({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin", "thai"],
  variable: "--font-prompt",
  display: "swap",
  preload: true,
  fallback: [
    "system-ui",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "sans-serif",
  ],
});

export const metadata: Metadata = {
  title: "Binance Alpha Tool - Airdrop & Profit Tracker",
  description: "Track airdrops, stability, and income with game-style UI",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Binance Alpha",
  },
  formatDetection: {
    telephone: false,
  },
  // Security headers as metadata
  other: {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#d4a948" },
    { media: "(prefers-color-scheme: dark)", color: "#030305" },
  ],
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to critical external domains for faster loading */}
        <link
          rel="preconnect"
          href="https://api.binance.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://www.binance.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://alpha123.uk"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://deep-index.moralis.io"
          crossOrigin="anonymous"
        />

        {/* DNS prefetch for non-critical domains */}
        <link rel="dns-prefetch" href="https://stream.binance.com" />
        <link rel="dns-prefetch" href="https://cryptologos.cc" />

        {/* Apple touch icon */}
        <link rel="apple-touch-icon" href="/icon-192.png" />

        {/* Prefetch critical resources */}
        <link
          rel="prefetch"
          href="/api/binance/alpha/airdrops"
          as="fetch"
          crossOrigin="anonymous"
        />

        {/* Security: Referrer policy */}
        <meta name="referrer" content="strict-origin-when-cross-origin" />

        {/* PWA: Theme color for browser chrome */}
        <meta name="theme-color" content="#030305" />
        <meta name="msapplication-TileColor" content="#030305" />

        {/* Performance: Resource hints for faster subsequent navigations */}
        <link rel="prerender" href="/" />
      </head>
      <body
        className={`${prompt.variable} font-sans antialiased bg-[#030305] text-[#fafaf9]`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <QueryProvider>
            {/* Skip to main content for accessibility */}
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#d4a948] focus:text-[#030305] focus:rounded-lg focus:font-medium"
            >
              Skip to main content
            </a>

            <Navigation />

            {/* Main content with padding for navigation */}
            <main
              id="main-content"
              className="pt-16 pb-20 md:pb-8 min-h-screen"
            >
              {children}
            </main>

            {/* Toast notifications - lazy loaded */}
            <Toaster richColors closeButton position="top-right" />
          </QueryProvider>
        </ThemeProvider>

        {/* Noscript fallback */}
        <noscript>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030305] text-[#fafaf9]">
            <div className="text-center p-8 max-w-md">
              <h1 className="text-2xl font-bold text-[#d4a948] mb-4">
                JavaScript Required
              </h1>
              <p className="text-[#a3a3a3]">
                This application requires JavaScript to function properly.
                Please enable JavaScript in your browser settings.
              </p>
            </div>
          </div>
        </noscript>
      </body>
    </html>
  );
}
