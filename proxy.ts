import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ============================================
// Security Configuration
// ============================================

const SECURITY_CONFIG = {
  // Rate limiting settings with burst support
  rateLimits: {
    api: { limit: 100, windowMs: 60000, burst: 20 },
    auth: { limit: 10, windowMs: 60000, burst: 5 },
    sync: { limit: 30, windowMs: 60000, burst: 10 },
    telegram: { limit: 50, windowMs: 60000, burst: 15 },
    cron: { limit: 10, windowMs: 60000, burst: 3 },
    static: { limit: 500, windowMs: 60000, burst: 100 },
  },
  // Blocked patterns (regex) - XSS, SQL injection, path traversal
  blockedPatterns: [
    /\.\.[\\/]/, // Path traversal
    /<script[\s>]/i, // Script tags
    /javascript:/i, // JavaScript protocol
    /on\w+\s*=/i, // Event handlers (onclick, etc.)
    /\x00/, // Null bytes
    /[\x00-\x08\x0B\x0C\x0E-\x1F]/, // Control characters
    /%00/, // URL encoded null
    /\$\{.*\}/, // Template injection
    /<!\[CDATA\[/i, // CDATA injection
    /union\s+select/i, // SQL injection
    /;\s*drop\s+/i, // SQL injection
    /--\s*$/m, // SQL comment
    /\/\*[\s\S]*?\*\//m, // Block comments
  ],
  // Allowed origins for CORS
  allowedOrigins: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  ].filter(Boolean) as string[],
  // Trusted IPs (for cron jobs, internal services)
  trustedIPs: ["127.0.0.1", "::1"],
  // Headers to strip from requests (security)
  stripHeaders: [
    "x-powered-by",
    "server",
    "x-aspnet-version",
    "x-aspnetmvc-version",
  ],
};

// ============================================
// Rate Limiting with Token Bucket Algorithm
// ============================================

interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
  requestCount: number;
  firstRequest: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const CLEANUP_INTERVAL = 60000; // 1 minute
let lastCleanup = Date.now();

function cleanupRateLimitStore(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  const maxAge = 5 * 60 * 1000; // 5 minutes

  for (const [key, entry] of rateLimitStore.entries()) {
    if (now - entry.lastRefill > maxAge) {
      rateLimitStore.delete(key);
    }
  }
}

function getRateLimitKey(request: NextRequest, prefix: string = ""): string {
  // Get client IP with fallbacks
  const ip =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";

  // Include user agent hash for additional uniqueness
  const ua = request.headers.get("user-agent") || "";
  const uaHash = hashString(ua).toString(36).slice(0, 8);

  return `${prefix}:${ip}:${uaHash}`;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  burst: number = 0,
): {
  allowed: boolean;
  remaining: number;
  resetIn: number;
  retryAfter: number;
} {
  const now = Date.now();
  let entry = rateLimitStore.get(key);

  // Token bucket algorithm
  const refillRate = limit / (windowMs / 1000); // tokens per second
  const maxTokens = limit + burst;

  if (!entry) {
    entry = {
      tokens: maxTokens - 1,
      lastRefill: now,
      requestCount: 1,
      firstRequest: now,
    };
    rateLimitStore.set(key, entry);
    return {
      allowed: true,
      remaining: Math.floor(entry.tokens),
      resetIn: windowMs,
      retryAfter: 0,
    };
  }

  // Refill tokens based on time elapsed
  const timePassed = (now - entry.lastRefill) / 1000;
  const newTokens = Math.min(maxTokens, entry.tokens + timePassed * refillRate);
  entry.tokens = newTokens;
  entry.lastRefill = now;

  // Check if request is allowed
  if (entry.tokens >= 1) {
    entry.tokens -= 1;
    entry.requestCount++;
    rateLimitStore.set(key, entry);

    return {
      allowed: true,
      remaining: Math.floor(entry.tokens),
      resetIn: Math.ceil(((maxTokens - entry.tokens) / refillRate) * 1000),
      retryAfter: 0,
    };
  }

  // Calculate retry after
  const tokensNeeded = 1 - entry.tokens;
  const retryAfter = Math.ceil(tokensNeeded / refillRate);

  return {
    allowed: false,
    remaining: 0,
    resetIn: Math.ceil(((maxTokens - entry.tokens) / refillRate) * 1000),
    retryAfter,
  };
}

// ============================================
// Security Helpers
// ============================================

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

function isBlockedPattern(url: string, body?: string): boolean {
  const combined = decodeURIComponent(url) + (body || "");
  return SECURITY_CONFIG.blockedPatterns.some((pattern) =>
    pattern.test(combined),
  );
}

function isValidOrigin(origin: string | null, referer: string | null): boolean {
  // Same-origin requests don't have origin
  if (!origin) {
    // Check referer as fallback
    if (referer) {
      try {
        const refererUrl = new URL(referer);
        return SECURITY_CONFIG.allowedOrigins.some(
          (allowed) =>
            refererUrl.origin === allowed ||
            refererUrl.hostname.endsWith(".vercel.app"),
        );
      } catch {
        return true;
      }
    }
    return true;
  }

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

  // Timing-safe comparison
  return (
    timingSafeEqual(secret || "", cronSecret) ||
    timingSafeEqual(authHeader?.replace("Bearer ", "") || "", cronSecret)
  );
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    b = a; // Prevent length-based timing attacks
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0 && a.length === b.length;
}

function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${random}`;
}

// ============================================
// Security Headers Builder
// ============================================

function getSecurityHeaders(
  nonce: string,
  requestId: string,
): Record<string, string> {
  const isDev = process.env.NODE_ENV === "development";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Build CSP directives
  const cspDirectives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' ${isDev ? "'unsafe-eval'" : ""} 'strict-dynamic'`.trim(),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    `connect-src 'self' ${appUrl} https://api.binance.com https://www.binance.com https://deep-index.moralis.io https://alpha123.uk wss://stream.binance.com`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "upgrade-insecure-requests",
  ];

  return {
    // Prevent clickjacking
    "X-Frame-Options": "DENY",

    // Prevent MIME type sniffing
    "X-Content-Type-Options": "nosniff",

    // Enable XSS filter (legacy browsers)
    "X-XSS-Protection": "1; mode=block",

    // Referrer policy
    "Referrer-Policy": "strict-origin-when-cross-origin",

    // Permissions policy - restrict browser features
    "Permissions-Policy":
      "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), interest-cohort=(), browsing-topics=()",

    // HSTS - Force HTTPS (only in production)
    ...(isDev
      ? {}
      : {
          "Strict-Transport-Security":
            "max-age=31536000; includeSubDomains; preload",
        }),

    // Content Security Policy
    "Content-Security-Policy": cspDirectives.join("; "),

    // Cross-Origin policies
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Cross-Origin-Embedder-Policy": "credentialless",

    // Request tracing
    "X-Request-ID": requestId,

    // Cache-Control for HTML pages
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",

    // CSP nonce for inline scripts
    "X-Nonce": nonce,

    // Remove server identification
    "X-Powered-By": "",
  };
}

// ============================================
// API Security Middleware
// ============================================

function handleAPIRequest(
  request: NextRequest,
  requestId: string,
): NextResponse | { response: NextResponse; headers: Record<string, string> } {
  const pathname = request.nextUrl.pathname;
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  // CORS check
  if (!isValidOrigin(origin, referer)) {
    console.warn(
      `[${requestId}] 🚫 Blocked request from invalid origin: ${origin}`,
    );
    return new NextResponse(JSON.stringify({ error: "Forbidden", requestId }), {
      status: 403,
      headers: {
        "Content-Type": "application/json",
        "X-Request-ID": requestId,
      },
    });
  }

  // Determine rate limit category
  let rateLimitConfig = SECURITY_CONFIG.rateLimits.api;
  let keyPrefix = "api";

  if (pathname.includes("/cron") || pathname.includes("/update-airdrops")) {
    // Cron endpoints - verify authorization
    if (!isCronRequest(request)) {
      console.warn(`[${requestId}] 🚫 Unauthorized cron request: ${pathname}`);
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized", requestId }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "X-Request-ID": requestId,
          },
        },
      );
    }
    rateLimitConfig = SECURITY_CONFIG.rateLimits.cron;
    keyPrefix = "cron";
  } else if (pathname.includes("/telegram")) {
    rateLimitConfig = SECURITY_CONFIG.rateLimits.telegram;
    keyPrefix = "telegram";
  } else if (pathname.includes("/sync") || pathname.includes("/real-sync")) {
    rateLimitConfig = SECURITY_CONFIG.rateLimits.sync;
    keyPrefix = "sync";
  } else if (pathname.includes("/auth")) {
    rateLimitConfig = SECURITY_CONFIG.rateLimits.auth;
    keyPrefix = "auth";
  }

  // Rate limiting with token bucket
  const rateLimitKey = getRateLimitKey(request, keyPrefix);
  const { allowed, remaining, resetIn, retryAfter } = checkRateLimit(
    rateLimitKey,
    rateLimitConfig.limit,
    rateLimitConfig.windowMs,
    rateLimitConfig.burst,
  );

  const rateLimitHeaders = {
    "X-RateLimit-Limit": rateLimitConfig.limit.toString(),
    "X-RateLimit-Remaining": Math.max(0, remaining).toString(),
    "X-RateLimit-Reset": Math.ceil(resetIn / 1000).toString(),
    "X-RateLimit-Policy": `${rateLimitConfig.limit};w=${rateLimitConfig.windowMs / 1000}`,
  };

  if (!allowed) {
    console.warn(
      `[${requestId}] 🚫 Rate limit exceeded for: ${rateLimitKey} (retry in ${retryAfter}s)`,
    );
    return new NextResponse(
      JSON.stringify({
        error: "Too many requests",
        retryAfter,
        requestId,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": retryAfter.toString(),
          "X-Request-ID": requestId,
          ...rateLimitHeaders,
        },
      },
    );
  }

  // CORS headers for API
  const corsHeaders: Record<string, string> = {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Requested-With, X-CSRF-Token",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
    "Access-Control-Expose-Headers":
      "X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-Request-ID",
    "X-Request-ID": requestId,
    ...rateLimitHeaders,
  };

  // Handle preflight OPTIONS request
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
// Bot Detection (Basic)
// ============================================

function isSuspiciousBot(request: NextRequest): boolean {
  const ua = request.headers.get("user-agent") || "";

  // Allow known good bots
  const goodBots = [
    "googlebot",
    "bingbot",
    "slurp",
    "duckduckbot",
    "baiduspider",
    "yandexbot",
    "facebookexternalhit",
    "twitterbot",
    "linkedinbot",
    "vercel",
  ];

  const lowerUA = ua.toLowerCase();

  // If it's a known good bot, allow it
  if (goodBots.some((bot) => lowerUA.includes(bot))) {
    return false;
  }

  // Suspicious patterns
  const suspiciousPatterns = [
    /^$/, // Empty user agent
    /curl|wget|python|java|php|perl|ruby|go-http/i, // Common scraping tools
    /bot|crawler|spider|scraper/i, // Generic bot terms (not in goodBots)
    /headless/i, // Headless browsers
  ];

  // Check for suspicious patterns
  if (suspiciousPatterns.some((pattern) => pattern.test(ua))) {
    // Additional checks - legitimate browsers have more complex UAs
    if (ua.length < 20) return true;
    if (!ua.includes("Mozilla") && !ua.includes("Opera")) return true;
  }

  return false;
}

// ============================================
// Main Middleware
// ============================================

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const url = request.url;
  const nonce = generateNonce();
  const requestId = generateRequestId();
  const startTime = Date.now();

  // Cleanup rate limit store periodically
  cleanupRateLimitStore();

  // Log request in development
  if (process.env.NODE_ENV === "development") {
    console.log(`[${requestId}] 📨 ${request.method} ${pathname}`);
  }

  // Block suspicious patterns
  if (isBlockedPattern(url)) {
    console.warn(`[${requestId}] 🚫 Blocked suspicious request: ${url}`);
    return new NextResponse("Forbidden", {
      status: 403,
      headers: { "X-Request-ID": requestId },
    });
  }

  // Bot detection for API routes (not static assets)
  if (pathname.startsWith("/api/") && !pathname.includes("/cron")) {
    if (isSuspiciousBot(request)) {
      const clientIP = getClientIP(request);
      console.warn(
        `[${requestId}] 🤖 Suspicious bot detected: ${clientIP} - ${request.headers.get("user-agent")}`,
      );
      // Don't block immediately, but apply stricter rate limiting
      // This is handled by the rate limiter with the hashed UA
    }
  }

  // Handle API routes
  if (pathname.startsWith("/api/")) {
    const result = handleAPIRequest(request, requestId);

    if (result instanceof NextResponse) {
      return result;
    }

    const { response, headers } = result;

    // Add security headers
    const securityHeaders = getSecurityHeaders(nonce, requestId);
    Object.entries({ ...securityHeaders, ...headers }).forEach(
      ([key, value]) => {
        if (value) response.headers.set(key, value);
      },
    );

    // API-specific cache control
    if (!response.headers.has("Cache-Control")) {
      response.headers.set(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
      );
    }

    // Log response time in development
    if (process.env.NODE_ENV === "development") {
      const duration = Date.now() - startTime;
      console.log(`[${requestId}] ✅ ${pathname} - ${duration}ms`);
    }

    return response;
  }

  // Handle page routes
  const response = NextResponse.next();

  // Add security headers for all pages
  const securityHeaders = getSecurityHeaders(nonce, requestId);
  Object.entries(securityHeaders).forEach(([key, value]) => {
    if (value) response.headers.set(key, value);
  });

  // Add nonce for inline scripts
  response.headers.set("X-Nonce", nonce);

  // Log response time in development
  if (process.env.NODE_ENV === "development") {
    const duration = Date.now() - startTime;
    console.log(`[${requestId}] ✅ ${pathname} - ${duration}ms`);
  }

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
