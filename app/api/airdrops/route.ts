/**
 * Airdrop CRUD API
 * GET    /api/airdrops - List all airdrops
 * POST   /api/airdrops - Create new airdrop (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { Prisma, AirdropStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

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

// Check admin authentication
function checkAdminAuth(request: NextRequest): boolean {
  const adminKey = request.headers.get("x-admin-key");
  const envAdminKey =
    process.env.ADMIN_KEY || "default-admin-key-change-in-production";
  return adminKey === envAdminKey;
}

/**
 * GET /api/airdrops
 * List all airdrops with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const chain = searchParams.get("chain");
    const isActive = searchParams.get("isActive");
    const multiplier = searchParams.get("multiplier");

    // Build filter
    const where: Prisma.AirdropWhereInput = {};
    if (status) where.status = status as AirdropStatus;
    if (chain) where.chain = chain;
    if (isActive !== null) where.isActive = isActive === "true";
    if (multiplier) where.multiplier = parseInt(multiplier);

    const airdrops = await prisma.airdrop.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: airdrops,
      count: airdrops.length,
      timestamp: new Date().toISOString(),
    });
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
    // Check admin auth
    if (!checkAdminAuth(request)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
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
