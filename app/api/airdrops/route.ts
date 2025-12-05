/**
 * Airdrop CRUD API
 * GET    /api/airdrops - List all airdrops
 * POST   /api/airdrops - Create new airdrop (admin only)
 *
 * Security Features:
 * - Rate limiting per IP
 * - Admin authentication with secure key validation
 * - Input validation with Zod
 * - Timing-safe comparison for auth
 */

import { NextRequest, NextResponse } from "next/server";
import { Prisma, AirdropStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  shouldRateLimit,
  timingSafeEqual,
  sanitizeForQuery,
} from "@/lib/utils/security";

// Validation schema
const AirdropSchema = z.object({
  token: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  chain: z.string().min(1),
  logoUrl: z.string().url().optional().nullable(),
  multiplier: z.number().int().min(1).max(10).default(1),
  isBaseline: z.boolean().default(false),
  alphaUrl: z.string().url().optional().nullable(),
  description: z.string().optional().nullable(),
  totalSupply: z.string().optional().nullable(),
  airdropAmount: z.string().optional().nullable(),
  initialPrice: z.number().optional().nullable(),
  currentPrice: z.number().optional().nullable(),
  eligibility: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  snapshotDate: z.string().datetime().optional().nullable(),
  claimStartDate: z.string().datetime().optional().nullable(),
  claimEndDate: z.string().datetime().optional().nullable(),
  listingDate: z.string().datetime().optional().nullable(),
  requiredPoints: z.number().int().optional().nullable(),
  pointsPerDay: z.number().int().optional().nullable(),
  status: z
    .enum(["UPCOMING", "SNAPSHOT", "CLAIMABLE", "ENDED", "CANCELLED"])
    .default("UPCOMING"),
  verified: z.boolean().default(false),
  isActive: z.boolean().default(true),
  websiteUrl: z.string().url().optional().nullable(),
  twitterUrl: z.string().url().optional().nullable(),
  discordUrl: z.string().url().optional().nullable(),
  telegramUrl: z.string().url().optional().nullable(),
  estimatedValue: z.number().optional().nullable(),
  participantCount: z.number().int().optional().nullable(),
  addedBy: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  read: { limit: 100, windowMs: 60 * 1000 }, // 100 requests per minute for GET
  write: { limit: 20, windowMs: 60 * 1000 }, // 20 requests per minute for POST
};

/**
 * Get client IP from request
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  return "unknown";
}

/**
 * Check admin authentication with timing-safe comparison
 * IMPORTANT: Always set ADMIN_KEY in production environment
 */
function checkAdminAuth(request: NextRequest): {
  valid: boolean;
  error?: string;
} {
  const adminKey = request.headers.get("x-admin-key");

  // Check if admin key is configured
  const envAdminKey = process.env.ADMIN_KEY;

  if (!envAdminKey) {
    console.error("⚠️ ADMIN_KEY environment variable is not set!");
    // In production, reject if no admin key is configured
    if (process.env.NODE_ENV === "production") {
      return { valid: false, error: "Admin authentication not configured" };
    }
    // In development, allow with warning
    console.warn(
      "⚠️ Development mode: Using default admin key (not secure for production)",
    );
    return { valid: adminKey === "dev-admin-key-12345" };
  }

  if (!adminKey) {
    return { valid: false, error: "Missing admin key" };
  }

  // Validate admin key length to prevent timing attacks
  if (adminKey.length < 16) {
    return { valid: false, error: "Invalid admin key format" };
  }

  // Use timing-safe comparison
  const isValid = timingSafeEqual(adminKey, envAdminKey);

  return { valid: isValid };
}

/**
 * Create rate limit response
 */
function createRateLimitResponse(resetIn: number): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: "Too many requests",
      message: `Rate limit exceeded. Please try again in ${Math.ceil(resetIn / 1000)} seconds.`,
    },
    {
      status: 429,
      headers: {
        "Retry-After": Math.ceil(resetIn / 1000).toString(),
        "X-RateLimit-Reset": new Date(Date.now() + resetIn).toISOString(),
      },
    },
  );
}

/**
 * GET /api/airdrops
 * List all airdrops with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const clientIP = getClientIP(request);
    const rateLimitKey = `airdrops:get:${clientIP}`;
    const rateLimit = shouldRateLimit(
      rateLimitKey,
      RATE_LIMIT_CONFIG.read.limit,
      RATE_LIMIT_CONFIG.read.windowMs,
    );

    if (rateLimit.limited) {
      return createRateLimitResponse(rateLimit.resetIn);
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const chain = searchParams.get("chain");
    const isActive = searchParams.get("isActive");
    const multiplier = searchParams.get("multiplier");

    // Build filter with sanitization
    const where: Prisma.AirdropWhereInput = {};
    if (status) where.status = sanitizeForQuery(status) as AirdropStatus;
    if (chain) where.chain = sanitizeForQuery(chain);
    if (isActive !== null) where.isActive = isActive === "true";
    if (multiplier) {
      const parsedMultiplier = parseInt(multiplier, 10);
      if (
        !isNaN(parsedMultiplier) &&
        parsedMultiplier >= 1 &&
        parsedMultiplier <= 10
      ) {
        where.multiplier = parsedMultiplier;
      }
    }

    const airdrops = await prisma.airdrop.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: airdrops,
        count: airdrops.length,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          "X-RateLimit-Remaining": rateLimit.remaining.toString(),
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      },
    );
  } catch (error) {
    console.error("Error fetching airdrops:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch airdrops",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/airdrops
 * Create new airdrop (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting for write operations
    const clientIP = getClientIP(request);
    const rateLimitKey = `airdrops:post:${clientIP}`;
    const rateLimit = shouldRateLimit(
      rateLimitKey,
      RATE_LIMIT_CONFIG.write.limit,
      RATE_LIMIT_CONFIG.write.windowMs,
    );

    if (rateLimit.limited) {
      return createRateLimitResponse(rateLimit.resetIn);
    }

    // Check admin auth with improved security
    const authResult = checkAdminAuth(request);
    if (!authResult.valid) {
      console.warn(`⚠️ Unauthorized POST attempt from IP: ${clientIP}`);
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          message: authResult.error || "Invalid or missing authentication",
        },
        { status: 401 },
      );
    }

    const body = await request.json();

    // Validate input
    const validatedData = AirdropSchema.parse(body);

    // Check if token already exists
    const existing = await prisma.airdrop.findFirst({
      where: { token: validatedData.token },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Token already exists" },
        { status: 400 },
      );
    }

    // Convert arrays to JSON strings
    const airdrop = await prisma.airdrop.create({
      data: {
        token: validatedData.token,
        name: validatedData.name,
        chain: validatedData.chain,
        logoUrl: validatedData.logoUrl,
        multiplier: validatedData.multiplier,
        isBaseline: validatedData.isBaseline,
        alphaUrl: validatedData.alphaUrl,
        description: validatedData.description,
        totalSupply: validatedData.totalSupply,
        airdropAmount: validatedData.airdropAmount,
        initialPrice: validatedData.initialPrice,
        currentPrice: validatedData.currentPrice,
        eligibility: JSON.stringify(validatedData.eligibility),
        requirements: JSON.stringify(validatedData.requirements),
        snapshotDate: validatedData.snapshotDate
          ? new Date(validatedData.snapshotDate)
          : null,
        claimStartDate: validatedData.claimStartDate
          ? new Date(validatedData.claimStartDate)
          : null,
        claimEndDate: validatedData.claimEndDate
          ? new Date(validatedData.claimEndDate)
          : null,
        listingDate: validatedData.listingDate
          ? new Date(validatedData.listingDate)
          : null,
        requiredPoints: validatedData.requiredPoints,
        pointsPerDay: validatedData.pointsPerDay,
        status: validatedData.status,
        verified: validatedData.verified,
        isActive: validatedData.isActive,
        websiteUrl: validatedData.websiteUrl,
        twitterUrl: validatedData.twitterUrl,
        discordUrl: validatedData.discordUrl,
        telegramUrl: validatedData.telegramUrl,
        estimatedValue: validatedData.estimatedValue,
        participantCount: validatedData.participantCount,
        addedBy: validatedData.addedBy,
        notes: validatedData.notes,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: airdrop,
        message: "Airdrop created successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating airdrop:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          details: error.issues,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create airdrop",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
