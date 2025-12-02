import { NextResponse } from "next/server";
import { realAlphaFetcher } from "@/lib/services/real-alpha-fetcher";
import { prisma } from "@/lib/prisma";
import { telegramService } from "@/lib/services/telegram";

/**
 * API Route: Auto-Sync Cron Job
 *
 * GET /api/binance/alpha/cron
 *
 * This endpoint is designed to be called by:
 * 1. Vercel Cron Jobs (in production)
 * 2. Client-side interval (in development)
 * 3. External cron service
 *
 * Security: Protected by CRON_SECRET environment variable
 *
 * Features:
 * - Automatically syncs data from alpha123.uk
 * - Sends Telegram notifications for new airdrops
 */
export async function GET(request: Request) {
  try {
    // Security check: Verify cron secret
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || secret !== cronSecret) {
      console.error("❌ Unauthorized cron request");
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }

    console.log(
      "⏰ Cron job triggered - Starting auto-sync from alpha123.uk...",
    );

    // Fetch latest data from alpha123.uk
    const projects = await realAlphaFetcher.fetchAllProjects(true); // Force refresh

    if (!projects || projects.length === 0) {
      console.warn("⚠️ No data received from alpha123.uk");
      return NextResponse.json({
        success: false,
        error: "No data available",
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`📦 Received ${projects.length} projects from alpha123.uk`);

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

    for (const project of projects) {
      try {
        const prismaData = realAlphaFetcher.toPrismaFormat(project);

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
        const errorMsg = `${project.token}: ${error.message}`;
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

    console.log("✅ Cron sync completed:", syncResults);

    return NextResponse.json({
      success: true,
      data: {
        source: "alpha123.uk",
        lastUpdate: new Date().toISOString(),
        total: projects.length,
        ...syncResults,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("❌ Cron job error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Cron job failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

/**
 * POST method - Alternative trigger method
 */
export async function POST(request: Request) {
  return GET(request);
}
