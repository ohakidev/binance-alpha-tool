/**
 * Security Utilities
 * Comprehensive security helpers for input sanitization, CSRF protection,
 * and validation following OWASP best practices
 */

// ============================================
// Input Sanitization
// ============================================

/**
 * Sanitize HTML to prevent XSS attacks
 * Removes all HTML tags and decodes HTML entities
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== "string") return "";

  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .replace(/`/g, "&#x60;")
    .replace(/=/g, "&#x3D;");
}

/**
 * Strip all HTML tags from input
 */
export function stripHtml(input: string): string {
  if (!input || typeof input !== "string") return "";
  return input.replace(/<[^>]*>/g, "");
}

/**
 * Sanitize input for SQL-like queries (additional layer, use parameterized queries!)
 */
export function sanitizeForQuery(input: string): string {
  if (!input || typeof input !== "string") return "";

  return input
    .replace(/['";\\]/g, "")
    .replace(/--/g, "")
    .replace(/\/\*/g, "")
    .replace(/\*\//g, "")
    .trim();
}

/**
 * Sanitize filename to prevent path traversal
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== "string") return "";

  return filename
    .replace(/\.\./g, "")
    .replace(/[/\\:*?"<>|]/g, "")
    .replace(/^\.+/, "")
    .trim()
    .slice(0, 255);
}

/**
 * Sanitize URL to prevent open redirect vulnerabilities
 */
export function sanitizeUrl(
  url: string,
  allowedDomains: string[] = [],
): string | null {
  if (!url || typeof url !== "string") return null;

  try {
    const parsed = new URL(url);

    // Only allow http and https protocols
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }

    // Check against allowed domains if specified
    if (allowedDomains.length > 0) {
      const isAllowed = allowedDomains.some(
        (domain) =>
          parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`),
      );
      if (!isAllowed) return null;
    }

    // Prevent javascript: protocol injection
    if (parsed.href.toLowerCase().includes("javascript:")) {
      return null;
    }

    return parsed.href;
  } catch {
    // If relative URL, check for suspicious patterns
    if (url.startsWith("/") && !url.startsWith("//")) {
      // Remove any attempt at protocol injection
      if (url.toLowerCase().includes("javascript:")) return null;
      return url;
    }
    return null;
  }
}

// ============================================
// CSRF Protection
// ============================================

const CSRF_TOKEN_LENGTH = 32;
const CSRF_TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour

interface CSRFToken {
  token: string;
  createdAt: number;
}

// Server-side token storage (in production, use Redis or database)
const csrfTokens = new Map<string, CSRFToken>();

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCSRFToken(sessionId: string): string {
  const array = new Uint8Array(CSRF_TOKEN_LENGTH);
  crypto.getRandomValues(array);
  const token = Array.from(array, (b) => b.toString(16).padStart(2, "0")).join(
    "",
  );

  // Store token with timestamp
  csrfTokens.set(sessionId, {
    token,
    createdAt: Date.now(),
  });

  // Cleanup old tokens
  cleanupExpiredTokens();

  return token;
}

/**
 * Validate a CSRF token
 */
export function validateCSRFToken(sessionId: string, token: string): boolean {
  const stored = csrfTokens.get(sessionId);

  if (!stored) return false;

  // Check expiry
  if (Date.now() - stored.createdAt > CSRF_TOKEN_EXPIRY) {
    csrfTokens.delete(sessionId);
    return false;
  }

  // Timing-safe comparison
  return timingSafeEqual(stored.token, token);
}

/**
 * Cleanup expired CSRF tokens
 */
function cleanupExpiredTokens(): void {
  const now = Date.now();
  for (const [key, value] of csrfTokens.entries()) {
    if (now - value.createdAt > CSRF_TOKEN_EXPIRY) {
      csrfTokens.delete(key);
    }
  }
}

// ============================================
// Timing-Safe Comparison
// ============================================

/**
 * Timing-safe string comparison to prevent timing attacks
 */
export function timingSafeEqual(a: string, b: string): boolean {
  // Store original lengths before any modification
  const aLen = a.length;
  const bLen = b.length;

  // Use the longer string for comparison to prevent timing attacks
  const maxLen = Math.max(aLen, bLen);

  let result = 0;
  for (let i = 0; i < maxLen; i++) {
    // Use 0 as fallback for out-of-bounds to maintain constant time
    const aChar = i < aLen ? a.charCodeAt(i) : 0;
    const bChar = i < bLen ? b.charCodeAt(i) : 0;
    result |= aChar ^ bChar;
  }

  // Only return true if both strings are equal AND have same length
  return result === 0 && aLen === bLen;
}

// ============================================
// Input Validation
// ============================================

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;

  // RFC 5322 compliant email regex (simplified)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;

  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Validate hex color
 */
export function isValidHexColor(color: string): boolean {
  if (!color || typeof color !== "string") return false;
  return /^#([0-9A-Fa-f]{3}){1,2}$/.test(color);
}

/**
 * Validate positive number
 */
export function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && !isNaN(value) && value > 0;
}

/**
 * Validate non-negative integer
 */
export function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

/**
 * Validate string length
 */
export function isValidLength(str: string, min: number, max: number): boolean {
  if (!str || typeof str !== "string") return false;
  return str.length >= min && str.length <= max;
}

/**
 * Validate API key format (alphanumeric)
 */
export function isValidApiKey(key: string): boolean {
  if (!key || typeof key !== "string") return false;
  return /^[a-zA-Z0-9]{16,128}$/.test(key);
}

/**
 * Validate Ethereum address
 */
export function isValidEthAddress(address: string): boolean {
  if (!address || typeof address !== "string") return false;
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate Solana address
 */
export function isValidSolanaAddress(address: string): boolean {
  if (!address || typeof address !== "string") return false;
  // Base58 characters, 32-44 characters long
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

// ============================================
// Rate Limiting Helpers
// ============================================

interface RateLimitEntry {
  count: number;
  firstRequest: number;
  lastRequest: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Check if request should be rate limited
 */
export function shouldRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { limited: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now - entry.firstRequest > windowMs) {
    // Reset or create new entry
    rateLimitStore.set(key, {
      count: 1,
      firstRequest: now,
      lastRequest: now,
    });
    return { limited: false, remaining: limit - 1, resetIn: windowMs };
  }

  entry.count++;
  entry.lastRequest = now;

  const resetIn = windowMs - (now - entry.firstRequest);
  const remaining = Math.max(0, limit - entry.count);

  return {
    limited: entry.count > limit,
    remaining,
    resetIn,
  };
}

/**
 * Clear rate limit for a key
 */
export function clearRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

// ============================================
// Secure Random Generators
// ============================================

/**
 * Generate a secure random string
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generate a secure random ID (URL-safe)
 */
export function generateSecureId(length: number = 16): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => chars[b % chars.length]).join("");
}

/**
 * Generate a secure numeric OTP
 */
export function generateOTP(length: number = 6): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => (b % 10).toString()).join("");
}

// ============================================
// Request Validation
// ============================================

/**
 * Check if request is from a trusted origin
 */
export function isTrustedOrigin(
  origin: string | null,
  trustedOrigins: string[],
): boolean {
  if (!origin) return false;

  try {
    const parsed = new URL(origin);
    return trustedOrigins.some(
      (trusted) =>
        parsed.origin === trusted ||
        parsed.hostname.endsWith(`.${new URL(trusted).hostname}`),
    );
  } catch {
    return false;
  }
}

/**
 * Extract and validate content type
 */
export function isValidContentType(
  contentType: string | null,
  expected: string[],
): boolean {
  if (!contentType) return false;

  const type = contentType.split(";")[0].trim().toLowerCase();
  return expected.map((e) => e.toLowerCase()).includes(type);
}

/**
 * Check for suspicious patterns in request body
 */
export function hasSuspiciousPatterns(body: string): boolean {
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers
    /data:\s*text\/html/i,
    /\x00/, // Null bytes
    /\.\.[\\/]/, // Path traversal
    /\$\{.*\}/, // Template injection
    /<!\[CDATA\[/i,
    /<!--.*-->/,
  ];

  return suspiciousPatterns.some((pattern) => pattern.test(body));
}

// ============================================
// Environment Validation
// ============================================

/**
 * Validate required environment variables
 */
export function validateEnvVars(required: string[]): {
  valid: boolean;
  missing: string[];
} {
  const missing = required.filter((key) => !process.env[key]);
  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Get environment variable with validation
 */
export function getEnvVar(
  key: string,
  defaultValue?: string,
): string | undefined {
  const value = process.env[key];
  if (!value && defaultValue === undefined) {
    console.warn(`Missing environment variable: ${key}`);
  }
  return value || defaultValue;
}

/**
 * Get required environment variable (throws if missing)
 */
export function requireEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable missing: ${key}`);
  }
  return value;
}

// ============================================
// Content Security Policy Builder
// ============================================

interface CSPDirectives {
  defaultSrc?: string[];
  scriptSrc?: string[];
  styleSrc?: string[];
  imgSrc?: string[];
  fontSrc?: string[];
  connectSrc?: string[];
  frameSrc?: string[];
  frameAncestors?: string[];
  formAction?: string[];
  baseUri?: string[];
  objectSrc?: string[];
  mediaSrc?: string[];
  workerSrc?: string[];
  manifestSrc?: string[];
  upgradeInsecureRequests?: boolean;
  blockAllMixedContent?: boolean;
}

/**
 * Build Content Security Policy header value
 */
export function buildCSP(directives: CSPDirectives, nonce?: string): string {
  const parts: string[] = [];

  const addDirective = (name: string, values?: string[]) => {
    if (values && values.length > 0) {
      parts.push(`${name} ${values.join(" ")}`);
    }
  };

  const defaultNonce = nonce ? `'nonce-${nonce}'` : "";

  addDirective("default-src", directives.defaultSrc || ["'self'"]);
  addDirective(
    "script-src",
    directives.scriptSrc || ["'self'", defaultNonce].filter(Boolean),
  );
  addDirective(
    "style-src",
    directives.styleSrc || ["'self'", "'unsafe-inline'"],
  );
  addDirective("img-src", directives.imgSrc || ["'self'", "data:", "https:"]);
  addDirective("font-src", directives.fontSrc || ["'self'", "data:"]);
  addDirective("connect-src", directives.connectSrc || ["'self'"]);
  addDirective("frame-src", directives.frameSrc || ["'none'"]);
  addDirective("frame-ancestors", directives.frameAncestors || ["'none'"]);
  addDirective("form-action", directives.formAction || ["'self'"]);
  addDirective("base-uri", directives.baseUri || ["'self'"]);
  addDirective("object-src", directives.objectSrc || ["'none'"]);

  if (directives.mediaSrc) addDirective("media-src", directives.mediaSrc);
  if (directives.workerSrc) addDirective("worker-src", directives.workerSrc);
  if (directives.manifestSrc)
    addDirective("manifest-src", directives.manifestSrc);

  if (directives.upgradeInsecureRequests !== false) {
    parts.push("upgrade-insecure-requests");
  }

  if (directives.blockAllMixedContent) {
    parts.push("block-all-mixed-content");
  }

  return parts.join("; ");
}

// ============================================
// Exports
// ============================================

export const security = {
  // Sanitization
  sanitizeHtml,
  stripHtml,
  sanitizeForQuery,
  sanitizeFilename,
  sanitizeUrl,
  // CSRF
  generateCSRFToken,
  validateCSRFToken,
  // Validation
  isValidEmail,
  isValidUrl,
  isValidHexColor,
  isPositiveNumber,
  isNonNegativeInteger,
  isValidLength,
  isValidApiKey,
  isValidEthAddress,
  isValidSolanaAddress,
  // Rate Limiting
  shouldRateLimit,
  clearRateLimit,
  // Random Generation
  generateSecureToken,
  generateSecureId,
  generateOTP,
  // Request Validation
  isTrustedOrigin,
  isValidContentType,
  hasSuspiciousPatterns,
  // Environment
  validateEnvVars,
  getEnvVar,
  requireEnvVar,
  // CSP
  buildCSP,
  // Utilities
  timingSafeEqual,
};

export default security;
