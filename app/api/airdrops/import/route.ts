/**
 * Airdrop Import API
 * POST /api/airdrops/import
 *
 * Import airdrops from JSON file (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

// Check admin authentication
function checkAdminAuth(request: NextRequest): boolean {
  const adminKey = request.headers.get("x-admin-key");
  const envAdminKey = process.env.ADMIN_KEY || "default-admin-key-change-in-production";
  return adminKey === envAdminKey;
}

export async function POST(request: NextRequest) {
  try {
    // Check admin auth
    if (!checkAdminAuth(request)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!Array.isArray(body)) {
      return NextResponse.json(
        { success: false, error: "Expected array of airdrops" },
        { status: 400 }
      );
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const airdrop of body) {
      try {
        // Check if already exists (using token as unique identifier)
        const existing = await prisma.airdrop.findFirst({
          where: { token: airdrop.token },
        });

        if (existing) {
          skipped++;
          continue;
        }

        // Convert arrays to JSON strings
        const data = {
          ...airdrop,
          eligibility: Array.isArray(airdrop.eligibility)
            ? JSON.stringify(airdrop.eligibility)
            : airdrop.eligibility || "[]",
          requirements: Array.isArray(airdrop.requirements)
            ? JSON.stringify(airdrop.requirements)
            : airdrop.requirements || "[]",
          snapshotDate: airdrop.snapshotDate ? new Date(airdrop.snapshotDate) : null,
          claimStartDate: airdrop.claimStartDate ? new Date(airdrop.claimStartDate) : null,
          claimEndDate: airdrop.claimEndDate ? new Date(airdrop.claimEndDate) : null,
          listingDate: airdrop.listingDate ? new Date(airdrop.listingDate) : null,
        };

        await prisma.airdrop.create({ data });
        imported++;
      } catch (error) {
        errors.push(`Failed to import ${airdrop.token}: ${error}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import completed: ${imported} imported, ${skipped} skipped`,
      imported,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error importing airdrops:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to import airdrops",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
