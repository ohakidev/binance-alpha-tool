/**
 * Cron Job API - Auto-update airdrop statuses and send notifications
 * Call this endpoint periodically (e.g., every hour) via cron job
 * GET /api/cron/update-airdrops
 */

import { NextResponse } from "next/server";
import { airdropCalculator } from "@/lib/services/airdrop-calculator";
import { prisma } from "@/lib/db/prisma";
import { telegramService } from "@/lib/services/telegram";

export const dynamic = "force-dynamic";

// Security: Verify request from Vercel Cron or with secret
function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get("authorization");

  // Check Vercel Cron header
  if (authHeader === `Bearer ${process.env.CRON_SECRET}`) {
    return true;
  }

  // Check query parameter (for manual testing)
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  if (secret === process.env.CRON_SECRET) {
    return true;
  }

  return false;
}

export async function GET(request: Request) {
  try {
    // Verify authorization
    if (!isAuthorized(request)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("🔄 Starting cron job: Update airdrops...");

    // 1. Update all airdrop statuses
    await airdropCalculator.updateAllAirdropStatuses();

    // 2. Check for upcoming snapshots (within next 24 hours)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const upcomingSnapshots = await prisma.airdrop.findMany({
      where: {
        snapshotDate: {
          gte: new Date(),
          lte: tomorrow,
        },
        status: "SNAPSHOT",
      },
    });

    // Send snapshot alerts
    for (const airdrop of upcomingSnapshots) {
      await telegramService.sendSnapshotAlert({
        name: airdrop.name,
        symbol: airdrop.token,
        snapshotDate: airdrop.snapshotDate || undefined,
      });
    }

    // 3. Check for claimable airdrops ending soon (within next 3 days)
    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    const endingSoon = await prisma.airdrop.findMany({
      where: {
        status: "CLAIMABLE",
        claimEndDate: {
          gte: new Date(),
          lte: threeDaysLater,
        },
      },
    });

    // Send ending soon alerts
    for (const airdrop of endingSoon) {
      await telegramService.sendClaimableAlert({
        name: airdrop.name,
        symbol: airdrop.token,
        claimEndDate: airdrop.claimEndDate || undefined,
      });
    }

    // 4. Get summary
    const summary = await prisma.airdrop.groupBy({
      by: ["status"],
      _count: true,
    });

    console.log("✅ Cron job completed");

    return NextResponse.json({
      success: true,
      message: "Airdrop statuses updated successfully",
      summary,
      upcomingSnapshots: upcomingSnapshots.length,
      endingSoon: endingSoon.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Cron job error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Cron job failed",
      },
      { status: 500 }
    );
  }
}
