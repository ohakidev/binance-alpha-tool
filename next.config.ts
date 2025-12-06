import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

// Bundle analyzer
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  // ============================================
  // Performance Optimizations
  // ============================================

  // Enable gzip compression
  compress: true,

  // Remove X-Powered-By header for security
  poweredByHeader: false,

  // Generate ETags for caching
  generateEtags: true,

  // Enable React strict mode for better debugging
  reactStrictMode: true,

  // ============================================
  // Image Optimization
  // ============================================

  images: {
    // Modern formats for better compression
    formats: ["image/avif", "image/webp"],
    // Longer cache for images
    minimumCacheTTL: 31536000, // 1 year
    // Optimized device sizes
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    // Allowed remote image domains
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cryptologos.cc",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "**.binance.com",
      },
    ],
    // Disable blur placeholder for performance
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // ============================================
  // Experimental Features
  // ============================================

  experimental: {
    // Optimize package imports for faster builds
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "motion",
      "@tanstack/react-query",
      "@tanstack/react-table",
      "recharts",
      "date-fns",
      "lodash",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-tabs",
      "@radix-ui/react-tooltip",
      "@radix-ui/react-popover",
      "@radix-ui/react-select",
      "@radix-ui/react-accordion",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-switch",
      "@radix-ui/react-slider",
      "@radix-ui/react-scroll-area",
      "zod",
      "zustand",
      "clsx",
      "tailwind-merge",
      "class-variance-authority",
    ],
    // Enable CSS optimization
    optimizeCss: true,
    // Scroll restoration for better UX
    scrollRestoration: true,
  },

  // ============================================
  // Turbopack Configuration
  // ============================================

  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },

  // ============================================
  // Webpack Configuration
  // ============================================

  webpack: (config, { isServer, dev }) => {
    // Production optimizations only
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        // Minimize code
        minimize: true,
        // Module IDs for better caching
        moduleIds: "deterministic",
        // Split chunks for better caching
        splitChunks: {
          chunks: "all",
          maxInitialRequests: 30,
          minSize: 20000,
          maxSize: 200000,
          cacheGroups: {
            // Disable default groups
            default: false,
            defaultVendors: false,

            // Framework chunks (React, Next.js) - highest priority
            framework: {
              name: "framework",
              chunks: "all",
              test: /[\\/]node_modules[\\/](react|react-dom|next|scheduler)[\\/]/,
              priority: 60,
              enforce: true,
              reuseExistingChunk: true,
            },

            // UI library chunks
            ui: {
              name: "ui",
              test: /[\\/]node_modules[\\/](@radix-ui|@headlessui|cmdk)[\\/]/,
              chunks: "all",
              priority: 50,
              reuseExistingChunk: true,
            },

            // Animation library - separate chunk for lazy loading
            animations: {
              name: "animations",
              test: /[\\/]node_modules[\\/](framer-motion|motion)[\\/]/,
              chunks: "all",
              priority: 45,
              reuseExistingChunk: true,
            },

            // Data fetching libraries
            dataFetching: {
              name: "data-fetching",
              test: /[\\/]node_modules[\\/](@tanstack)[\\/]/,
              chunks: "all",
              priority: 45,
              reuseExistingChunk: true,
            },

            // Charts library - often lazy loaded
            charts: {
              name: "charts",
              test: /[\\/]node_modules[\\/](recharts|d3|victory)[\\/]/,
              chunks: "async",
              priority: 40,
              reuseExistingChunk: true,
            },

            // Date libraries
            dates: {
              name: "dates",
              test: /[\\/]node_modules[\\/](date-fns|dayjs|moment)[\\/]/,
              chunks: "all",
              priority: 40,
              reuseExistingChunk: true,
            },

            // Icons - often large, separate chunk
            icons: {
              name: "icons",
              test: /[\\/]node_modules[\\/](lucide-react|react-icons)[\\/]/,
              chunks: "all",
              priority: 35,
              reuseExistingChunk: true,
            },

            // Crypto/Blockchain related
            crypto: {
              name: "crypto",
              test: /[\\/]node_modules[\\/](moralis|crypto-js|ethers|web3)[\\/]/,
              chunks: "async",
              priority: 35,
              reuseExistingChunk: true,
            },

            // State management
            state: {
              name: "state",
              test: /[\\/]node_modules[\\/](zustand|zod)[\\/]/,
              chunks: "all",
              priority: 35,
              reuseExistingChunk: true,
            },

            // Common vendor chunks
            vendor: {
              name: "vendor",
              test: /[\\/]node_modules[\\/]/,
              chunks: "all",
              priority: 10,
              reuseExistingChunk: true,
            },

            // Common chunks from app code
            common: {
              name: "common",
              minChunks: 2,
              chunks: "all",
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        },
        // Runtime chunk for better caching
        runtimeChunk: {
          name: "runtime",
        },
      };

      // Tree shaking optimizations
      config.optimization.usedExports = true;
      config.optimization.sideEffects = true;
      config.optimization.providedExports = true;
      config.optimization.concatenateModules = true;
    }

    // SVG support
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    return config;
  },

  // ============================================
  // Headers Configuration
  // ============================================

  async headers() {
    return [
      // Security headers for all routes
      {
        source: "/:path*",
        headers: [
          // Prevent clickjacking
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // Prevent MIME type sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // DNS prefetching
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          // Referrer policy
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Permissions policy
          {
            key: "Permissions-Policy",
            value:
              "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), interest-cohort=(), browsing-topics=()",
          },
          // XSS Protection (legacy browsers)
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
      // Static assets - long cache with immutable
      {
        source: "/:all*(svg|jpg|jpeg|png|webp|avif|gif|ico|woff|woff2|ttf|eot)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Next.js static files - aggressive caching
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Chunks - aggressive caching
      {
        source: "/_next/static/chunks/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Manifest and service worker
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
          {
            key: "Content-Type",
            value: "application/manifest+json",
          },
        ],
      },
      // API routes - no cache by default with security headers
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value:
              "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
          },
          // CORS headers
          {
            key: "Access-Control-Allow-Origin",
            value: process.env.NEXT_PUBLIC_APP_URL || "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, PATCH, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "Content-Type, Authorization, X-Requested-With, X-CSRF-Token",
          },
          {
            key: "Access-Control-Max-Age",
            value: "86400",
          },
        ],
      },
      // API routes with caching (for read-only endpoints)
      {
        source: "/api/binance/alpha/airdrops",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=60, stale-while-revalidate=120",
          },
        ],
      },
      {
        source: "/api/binance/alpha/stability-data",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, max-age=0",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
          {
            key: "Expires",
            value: "0",
          },
        ],
      },
      {
        source: "/api/binance/alpha/stability",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, max-age=0",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
        ],
      },
      {
        source: "/api/binance/market/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=10, stale-while-revalidate=30",
          },
        ],
      },
      // Stability page - no cache for real-time data
      {
        source: "/stability",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, max-age=0",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
        ],
      },
      // HTML pages - short cache with revalidation
      {
        source: "/:path((?!api|_next|static|stability).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
          },
        ],
      },
    ];
  },

  // ============================================
  // Redirects
  // ============================================

  async redirects() {
    return [
      // Redirect old routes if needed
      {
        source: "/airdrops",
        destination: "/",
        permanent: true,
      },
      // Security: Prevent access to sensitive files
      {
        source: "/.env",
        destination: "/404",
        permanent: true,
      },
      {
        source: "/.git/:path*",
        destination: "/404",
        permanent: true,
      },
    ];
  },

  // ============================================
  // Rewrites (for API proxying if needed)
  // ============================================

  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [],
    };
  },

  // ============================================
  // Logging Configuration
  // ============================================

  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === "development",
    },
  },

  // ============================================
  // Output Configuration
  // ============================================

  // Output standalone for Docker deployments
  output: process.env.DOCKER ? "standalone" : undefined,

  // Disable source maps in production for security
  productionBrowserSourceMaps: false,

  // Trailing slash configuration
  trailingSlash: false,

  // Skip TypeScript errors in production build (use with caution)
  typescript: {
    // Only ignore in CI if explicitly set
    ignoreBuildErrors: process.env.SKIP_TYPE_CHECK === "true",
  },

  // Note: ESLint configuration has been removed in Next.js 16
  // Configure ESLint directly in eslint.config.mjs instead

  // ============================================
  // Server External Packages
  // ============================================

  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default withBundleAnalyzer(nextConfig);
