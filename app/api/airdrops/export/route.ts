/**
 * Airdrop Export API
 * GET /api/airdrops/export
 *
 * Export all airdrops to JSON
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Check admin authentication
function checkAdminAuth(request: NextRequest): boolean {
  const adminKey = request.headers.get("x-admin-key");
  const envAdminKey =
    process.env.ADMIN_KEY || "default-admin-key-change-in-production";
  return adminKey === envAdminKey;
}

export async function GET(request: NextRequest) {
  try {
    // Check admin auth (optional - you can allow public export)
    checkAdminAuth(request);

    const airdrops = await prisma.airdrop.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    // Parse JSON strings back to arrays
    const formattedAirdrops = airdrops.map((airdrop) => ({
      ...airdrop,
      eligibility: JSON.parse(airdrop.eligibility),
      requirements: JSON.parse(airdrop.requirements),
    }));

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `airdrop-backup-${timestamp}.json`;

    return new NextResponse(JSON.stringify(formattedAirdrops, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting airdrops:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to export airdrops",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
