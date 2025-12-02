import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ============================================
// Security Configuration
// ============================================

const SECURITY_CONFIG = {
  // Rate limiting settings
  rateLimits: {
    api: { limit: 60, windowMs: 60000 }, // 60 requests per minute for API
    auth: { limit: 10, windowMs: 60000 }, // 10 requests per minute for auth endpoints
    sync: { limit: 20, windowMs: 60000 }, // 20 requests per minute for sync
    telegram: { limit: 30, windowMs: 60000 }, // 30 requests per minute for telegram
    cron: { limit: 5, windowMs: 60000 }, // 5 requests per minute for cron
  },
  // Blocked patterns (regex)
  blockedPatterns: [
    /\.\.\//, // Path traversal
    /<script/i, // XSS attempt
    /javascript:/i, // JavaScript protocol
    /on\w+\s*=/i, // Event handlers
    /\x00/, // Null bytes
  ],
  // Allowed origins for CORS
  allowedOrigins: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  ].filter(Boolean) as string[],
  // Trusted IPs (for cron jobs, etc.)
  trustedIPs: [
    "127.0.0.1",
    "::1",
    // Vercel's IPs are dynamic, so we rely on headers
  ],
};

// ============================================
// Rate Limiting with Sliding Window
// ============================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
  tokens: number[];
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries periodically
function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime + 300000) {
      // 5 minutes after reset
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(cleanupRateLimitStore, 300000);
}

function getRateLimitKey(request: NextRequest, prefix: string = ""): string {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown";
  return `${prefix}:${ip}`;
}

function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  let entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    entry = {
      count: 1,
      resetTime: now + windowMs,
      tokens: [now],
    };
    rateLimitStore.set(key, entry);
    return { allowed: true, remaining: limit - 1, resetIn: windowMs };
  }

  // Sliding window: remove old tokens
  entry.tokens = entry.tokens.filter((t) => t > now - windowMs);
  entry.count = entry.tokens.length;

  if (entry.count >= limit) {
    const resetIn = entry.resetTime - now;
    return { allowed: false, remaining: 0, resetIn };
  }

  entry.tokens.push(now);
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    allowed: true,
    remaining: limit - entry.count,
    resetIn: entry.resetTime - now,
  };
}

// ============================================
// Security Helpers
// ============================================

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

function isBlockedPattern(url: string, body?: string): boolean {
  const combined = url + (body || "");
  return SECURITY_CONFIG.blockedPatterns.some((pattern) =>
    pattern.test(combined),
  );
}

function isValidOrigin(origin: string | null): boolean {
  if (!origin) return true; // Same-origin requests
  return SECURITY_CONFIG.allowedOrigins.some(
    (allowed) => origin === allowed || origin.endsWith(".vercel.app"),
  );
}

function isCronRequest(request: NextRequest): boolean {
  // Vercel cron header
  const vercelCron = request.headers.get("x-vercel-cron");
  if (vercelCron === "true") return true;

  // Check cron secret
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const authHeader = request.headers.get("authorization");

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;

  return secret === cronSecret || authHeader === `Bearer ${cronSecret}`;
}

function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

// ============================================
// Security Headers
// ============================================

function getSecurityHeaders(nonce: string): Record<string, string> {
  const isDev = process.env.NODE_ENV === "development";

  return {
    // Prevent clickjacking
    "X-Frame-Options": "DENY",

    // Prevent MIME type sniffing
    "X-Content-Type-Options": "nosniff",

    // Enable XSS filter
    "X-XSS-Protection": "1; mode=block",

    // Referrer policy
    "Referrer-Policy": "strict-origin-when-cross-origin",

    // Permissions policy
    "Permissions-Policy":
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=()",

    // HSTS (only in production)
    ...(isDev
      ? {}
      : {
          "Strict-Transport-Security":
            "max-age=31536000; includeSubDomains; preload",
        }),

    // Content Security Policy
    "Content-Security-Policy": [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}' ${isDev ? "'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.binance.com https://www.binance.com https://deep-index.moralis.io https://alpha123.uk wss://stream.binance.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; "),

    // Cross-Origin policies
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Cross-Origin-Embedder-Policy": "credentialless",

    // Request ID for tracing
    "X-Request-ID": nonce,
  };
}

// ============================================
// API Security Middleware
// ============================================

function handleAPIRequest(
  request: NextRequest,
): NextResponse | { response: NextResponse; headers: Record<string, string> } {
  const pathname = request.nextUrl.pathname;
  const origin = request.headers.get("origin");

  // CORS check
  if (!isValidOrigin(origin)) {
    console.warn(`🚫 Blocked request from invalid origin: ${origin}`);
    return new NextResponse(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Determine rate limit category
  let rateLimitConfig = SECURITY_CONFIG.rateLimits.api;
  let keyPrefix = "api";

  if (pathname.includes("/cron") || pathname.includes("/update-airdrops")) {
    // Cron endpoints - verify authorization
    if (!isCronRequest(request)) {
      console.warn(`🚫 Unauthorized cron request: ${pathname}`);
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    rateLimitConfig = SECURITY_CONFIG.rateLimits.cron;
    keyPrefix = "cron";
  } else if (pathname.includes("/telegram")) {
    rateLimitConfig = SECURITY_CONFIG.rateLimits.telegram;
    keyPrefix = "telegram";
  } else if (pathname.includes("/sync") || pathname.includes("/real-sync")) {
    rateLimitConfig = SECURITY_CONFIG.rateLimits.sync;
    keyPrefix = "sync";
  }

  // Rate limiting
  const rateLimitKey = getRateLimitKey(request, keyPrefix);
  const { allowed, remaining, resetIn } = checkRateLimit(
    rateLimitKey,
    rateLimitConfig.limit,
    rateLimitConfig.windowMs,
  );

  const rateLimitHeaders = {
    "X-RateLimit-Limit": rateLimitConfig.limit.toString(),
    "X-RateLimit-Remaining": Math.max(0, remaining).toString(),
    "X-RateLimit-Reset": Math.ceil(resetIn / 1000).toString(),
  };

  if (!allowed) {
    console.warn(`🚫 Rate limit exceeded for: ${rateLimitKey}`);
    return new NextResponse(
      JSON.stringify({
        error: "Too many requests",
        retryAfter: Math.ceil(resetIn / 1000),
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": Math.ceil(resetIn / 1000).toString(),
          ...rateLimitHeaders,
        },
      },
    );
  }

  // CORS headers for API
  const corsHeaders: Record<string, string> = {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Max-Age": "86400",
    ...rateLimitHeaders,
  };

  // Handle preflight
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  return {
    response: NextResponse.next(),
    headers: corsHeaders,
  };
}

// ============================================
// Main Middleware
// ============================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const url = request.url;
  const nonce = generateNonce();

  // Log request (in development)
  if (process.env.NODE_ENV === "development") {
    console.log(`📨 ${request.method} ${pathname}`);
  }

  // Block suspicious patterns
  if (isBlockedPattern(url)) {
    console.warn(`🚫 Blocked suspicious request: ${url}`);
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Handle API routes
  if (pathname.startsWith("/api/")) {
    const result = handleAPIRequest(request);

    if (result instanceof NextResponse) {
      return result;
    }

    const { response, headers } = result;

    // Add security headers
    const securityHeaders = getSecurityHeaders(nonce);
    Object.entries({ ...securityHeaders, ...headers }).forEach(
      ([key, value]) => {
        response.headers.set(key, value);
      },
    );

    // Add cache control for API
    if (!response.headers.has("Cache-Control")) {
      response.headers.set(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate",
      );
    }

    return response;
  }

  // Handle page routes
  const response = NextResponse.next();

  // Add security headers for all pages
  const securityHeaders = getSecurityHeaders(nonce);
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Add nonce for inline scripts (if needed)
  response.headers.set("X-Nonce", nonce);

  return response;
}

// ============================================
// Middleware Configuration
// ============================================

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$).*)",
  ],
};
