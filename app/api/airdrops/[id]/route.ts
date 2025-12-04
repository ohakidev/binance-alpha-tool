/**
 * Single Airdrop CRUD API
 * GET    /api/airdrops/[id] - Get single airdrop
 * PUT    /api/airdrops/[id] - Update airdrop (admin only)
 * DELETE /api/airdrops/[id] - Delete airdrop (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// Partial schema for updates
const UpdateAirdropSchema = z.object({
  token: z.string().min(1).max(20).optional(),
  name: z.string().min(1).max(100).optional(),
  chain: z.string().min(1).optional(),
  logoUrl: z.string().url().optional().nullable(),
  multiplier: z.number().int().min(1).max(10).optional(),
  isBaseline: z.boolean().optional(),
  alphaUrl: z.string().url().optional().nullable(),
  description: z.string().optional().nullable(),
  totalSupply: z.string().optional().nullable(),
  airdropAmount: z.string().optional().nullable(),
  initialPrice: z.number().optional().nullable(),
  currentPrice: z.number().optional().nullable(),
  eligibility: z.array(z.string()).optional(),
  requirements: z.array(z.string()).optional(),
  snapshotDate: z.string().datetime().optional().nullable(),
  claimStartDate: z.string().datetime().optional().nullable(),
  claimEndDate: z.string().datetime().optional().nullable(),
  listingDate: z.string().datetime().optional().nullable(),
  requiredPoints: z.number().int().optional().nullable(),
  pointsPerDay: z.number().int().optional().nullable(),
  status: z
    .enum(["UPCOMING", "SNAPSHOT", "CLAIMABLE", "ENDED", "CANCELLED"])
    .optional(),
  verified: z.boolean().optional(),
  isActive: z.boolean().optional(),
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
 * GET /api/airdrops/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const airdrop = await prisma.airdrop.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            isEligible: true,
            hasClaimed: true,
            claimedAt: true,
            claimAmount: true,
          },
        },
      },
    });

    if (!airdrop) {
      return NextResponse.json(
        { success: false, error: "Airdrop not found" },
        { status: 404 },
      );
    }

    // Parse JSON strings
    const formattedAirdrop = {
      ...airdrop,
      eligibility: JSON.parse(airdrop.eligibility),
      requirements: JSON.parse(airdrop.requirements),
    };

    return NextResponse.json({
      success: true,
      data: formattedAirdrop,
    });
  } catch (error) {
    console.error("Error fetching airdrop:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch airdrop",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/airdrops/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Check admin auth
    if (!checkAdminAuth(request)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();

    // Validate input
    const validatedData = UpdateAirdropSchema.parse(body);

    // Check if airdrop exists
    const existing = await prisma.airdrop.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Airdrop not found" },
        { status: 404 },
      );
    }

    // Prepare update data - exclude arrays that need transformation
    const {
      eligibility: _eligibility,
      requirements: _requirements,
      snapshotDate: _snapshotDate,
      claimStartDate: _claimStartDate,
      claimEndDate: _claimEndDate,
      listingDate: _listingDate,
      ...scalarData
    } = validatedData;

    // Suppress unused variable warnings - these are intentionally destructured to exclude them
    void _eligibility;
    void _requirements;
    void _snapshotDate;
    void _claimStartDate;
    void _claimEndDate;
    void _listingDate;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = { ...scalarData };

    // Convert arrays to JSON strings
    if (validatedData.eligibility) {
      updateData.eligibility = JSON.stringify(validatedData.eligibility);
    }
    if (validatedData.requirements) {
      updateData.requirements = JSON.stringify(validatedData.requirements);
    }

    // Convert date strings to Date objects
    if (validatedData.snapshotDate) {
      updateData.snapshotDate = new Date(validatedData.snapshotDate);
    }
    if (validatedData.claimStartDate) {
      updateData.claimStartDate = new Date(validatedData.claimStartDate);
    }
    if (validatedData.claimEndDate) {
      updateData.claimEndDate = new Date(validatedData.claimEndDate);
    }
    if (validatedData.listingDate) {
      updateData.listingDate = new Date(validatedData.listingDate);
    }

    const airdrop = await prisma.airdrop.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: airdrop,
      message: "Airdrop updated successfully",
    });
  } catch (error) {
    console.error("Error updating airdrop:", error);

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
        error: "Failed to update airdrop",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/airdrops/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Check admin auth
    if (!checkAdminAuth(request)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Check if airdrop exists
    const existing = await prisma.airdrop.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Airdrop not found" },
        { status: 404 },
      );
    }

    await prisma.airdrop.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Airdrop deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting airdrop:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete airdrop",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
