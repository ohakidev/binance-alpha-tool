import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/layout/navigation";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/lib/providers/query-provider";
import { ThemeProvider } from "@/lib/providers/theme-provider";

const prompt = Prompt({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ["latin", "thai"],
  variable: "--font-prompt",
  display: 'swap',
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
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f59e0b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
      </head>
      <body
        className={`${prompt.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <QueryProvider>
            <Navigation />

            {/* Main content with padding for navigation */}
            <main className="pt-16 pb-20 md:pb-8 min-h-screen">{children}</main>

            {/* Toast notifications */}
            <Toaster richColors closeButton position="top-right" />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
