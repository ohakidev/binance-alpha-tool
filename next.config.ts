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
      "@tanstack/react-query",
      "@tanstack/react-table",
      "recharts",
      "date-fns",
      "lodash",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-tabs",
      "@radix-ui/react-tooltip",
    ],
    // Enable CSS optimization
    optimizeCss: true,
    // Turbo mode for faster development
    turbo: {
      rules: {
        "*.svg": {
          loaders: ["@svgr/webpack"],
          as: "*.js",
        },
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
          maxInitialRequests: 25,
          minSize: 20000,
          maxSize: 250000,
          cacheGroups: {
            // Disable default groups
            default: false,
            defaultVendors: false,

            // Framework chunks (React, Next.js)
            framework: {
              name: "framework",
              chunks: "all",
              test: /[\\/]node_modules[\\/](react|react-dom|next|scheduler)[\\/]/,
              priority: 50,
              enforce: true,
            },

            // UI library chunks
            ui: {
              name: "ui",
              test: /[\\/]node_modules[\\/](@radix-ui|@headlessui|cmdk)[\\/]/,
              chunks: "all",
              priority: 40,
            },

            // Animation library
            animations: {
              name: "animations",
              test: /[\\/]node_modules[\\/](framer-motion|motion)[\\/]/,
              chunks: "all",
              priority: 40,
            },

            // Data fetching libraries
            dataFetching: {
              name: "data-fetching",
              test: /[\\/]node_modules[\\/](@tanstack)[\\/]/,
              chunks: "all",
              priority: 40,
            },

            // Charts library
            charts: {
              name: "charts",
              test: /[\\/]node_modules[\\/](recharts|d3|victory)[\\/]/,
              chunks: "all",
              priority: 35,
            },

            // Date libraries
            dates: {
              name: "dates",
              test: /[\\/]node_modules[\\/](date-fns|dayjs|moment)[\\/]/,
              chunks: "all",
              priority: 35,
            },

            // Icons
            icons: {
              name: "icons",
              test: /[\\/]node_modules[\\/](lucide-react|react-icons)[\\/]/,
              chunks: "all",
              priority: 30,
            },

            // Common vendor chunks
            vendor: {
              name: "vendor",
              test: /[\\/]node_modules[\\/]/,
              chunks: "all",
              priority: 10,
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

      // Tree shaking
      config.optimization.usedExports = true;
      config.optimization.sideEffects = true;
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
              "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
        ],
      },
      // Static assets - long cache
      {
        source: "/:all*(svg|jpg|jpeg|png|webp|avif|gif|ico|woff|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Next.js static files
      {
        source: "/_next/static/:path*",
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
        ],
      },
      // API routes - no cache by default
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
          // CORS headers
          {
            key: "Access-Control-Allow-Origin",
            value: process.env.NEXT_PUBLIC_APP_URL || "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization, X-Requested-With",
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
        source: "/api/binance/alpha/stability",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=30, stale-while-revalidate=60",
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

  // Skip ESLint errors in production build (use with caution)
  eslint: {
    // Only ignore in CI if explicitly set
    ignoreDuringBuilds: process.env.SKIP_LINT === "true",
  },
};

export default withBundleAnalyzer(nextConfig);
