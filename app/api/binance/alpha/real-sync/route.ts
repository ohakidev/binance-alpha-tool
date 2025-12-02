/**
 * Real Binance Alpha Sync API
 * Uses official Binance Alpha API
 * Automatically sends Telegram notifications for new airdrops
 *
 * GET /api/binance/alpha/real-sync
 * Query params:
 * - force: boolean (force refresh cache)
 */

import { NextResponse } from "next/server";
import { binanceAlphaRealService } from "@/lib/services/binance-alpha-real";
import { prisma } from "@/lib/prisma";
import { telegramService } from "@/lib/services/telegram";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get("force") === "true";

    console.log("🔄 Starting real Binance Alpha sync...", { forceRefresh });

    // Fetch from real Binance Alpha API
    const response =
      await binanceAlphaRealService.fetchAlphaProjects(forceRefresh);

    if (!response.success || !response.data || response.data.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No data received from Binance Alpha API",
        },
        { status: 500 },
      );
    }

    console.log(
      `📦 Received ${response.data.length} projects from Binance Alpha`,
    );

    // Sync to database
    const syncResults = {
      created: 0,
      updated: 0,
      failed: 0,
      notified: 0,
      errors: [] as string[],
    };

    // Store new airdrops for batch notification
    const newAirdrops: Array<{
      name: string;
      symbol: string;
      chain: string;
      status: string;
      claimStartDate?: Date;
      claimEndDate?: Date;
      estimatedValue?: number;
      airdropAmount?: string;
      requiredPoints?: number;
      deductPoints?: number;
      contractAddress?: string;
    }> = [];

    for (const project of response.data) {
      try {
        const prismaData = binanceAlphaRealService.toPrismaFormat(project);

        // Check if project exists
        const existing = await prisma.airdrop.findUnique({
          where: { token: prismaData.token },
        });

        if (existing) {
          // Update existing
          await prisma.airdrop.update({
            where: { token: prismaData.token },
            data: {
              ...prismaData,
              updatedAt: new Date(),
            },
          });
          syncResults.updated++;
          console.log(`✏️  Updated: ${prismaData.name} (${prismaData.token})`);
        } else {
          // Create new
          const newAirdrop = await prisma.airdrop.create({
            data: prismaData,
          });
          syncResults.created++;
          console.log(`✨ Created: ${prismaData.name} (${prismaData.token})`);

          // Add to new airdrops list for notification
          newAirdrops.push({
            name: newAirdrop.name,
            symbol: newAirdrop.token,
            chain: newAirdrop.chain,
            status: newAirdrop.status,
            claimStartDate: newAirdrop.claimStartDate || undefined,
            claimEndDate: newAirdrop.claimEndDate || undefined,
            estimatedValue: newAirdrop.estimatedValue || undefined,
            airdropAmount: newAirdrop.airdropAmount || undefined,
            requiredPoints: newAirdrop.requiredPoints || undefined,
            deductPoints: newAirdrop.deductPoints || undefined,
            contractAddress: newAirdrop.contractAddress || undefined,
          });
        }
      } catch (error: any) {
        syncResults.failed++;
        const errorMsg = `Failed to sync ${project.symbol}: ${error.message}`;
        syncResults.errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    // Send Telegram notifications for new airdrops
    if (newAirdrops.length > 0) {
      console.log(
        `📤 Sending Telegram notifications for ${newAirdrops.length} new airdrops...`,
      );

      for (const airdrop of newAirdrops) {
        try {
          const sent = await telegramService.sendAirdropAlert(airdrop);
          if (sent) {
            syncResults.notified++;
            console.log(
              `✅ Telegram notification sent for: ${airdrop.name} (${airdrop.symbol})`,
            );
          } else {
            console.log(
              `⚠️ Telegram notification skipped (disabled): ${airdrop.name}`,
            );
          }

          // Add small delay between notifications to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error: any) {
          console.error(
            `❌ Failed to send Telegram notification for ${airdrop.symbol}:`,
            error.message,
          );
        }
      }
    }

    console.log("✅ Sync completed:", syncResults);

    return NextResponse.json({
      success: true,
      data: {
        source: "binance-alpha",
        lastUpdate: response.lastUpdate.toISOString(),
        total: response.data.length,
        ...syncResults,
      },
    });
  } catch (error: any) {
    console.error("❌ Real sync error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to sync from Binance Alpha API",
        details: error.toString(),
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/binance/alpha/real-sync
 * Force refresh and sync
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  url.searchParams.set("force", "true");
  return GET(new Request(url.toString()));
}
