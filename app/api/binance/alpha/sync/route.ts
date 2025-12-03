import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { telegramService } from "@/lib/services/telegram";

/**
 * API Route: Sync Alpha Projects
 *
 * Since external APIs (alpha123.uk) are blocked/protected,
 * this endpoint now provides options to:
 * 1. Re-seed the database with sample data
 * 2. Manually add new airdrops
 * 3. Check current data status
 *
 * GET /api/binance/alpha/sync - Check sync status
 * POST /api/binance/alpha/sync - Trigger re-seed or add new data
 */

export async function GET() {
  try {
    // Get current database stats
    const [claimable, upcoming, ended, total] = await Promise.all([
      prisma.airdrop.count({ where: { status: "CLAIMABLE" } }),
      prisma.airdrop.count({ where: { status: "UPCOMING" } }),
      prisma.airdrop.count({ where: { status: "ENDED" } }),
      prisma.airdrop.count(),
    ]);

    // Get last updated airdrop
    const lastUpdated = await prisma.airdrop.findFirst({
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true, name: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        status: "ready",
        database: {
          total,
          claimable,
          upcoming,
          ended,
        },
        lastUpdated: lastUpdated?.updatedAt || null,
        lastUpdatedProject: lastUpdated?.name || null,
        message:
          "Database is ready. Use POST to refresh data or add new airdrops.",
        help: {
          reseed: "POST with { action: 'reseed' } to reset all data",
          add: "POST with { action: 'add', airdrop: {...} } to add new airdrop",
          updateStatus:
            "POST with { action: 'updateStatus' } to auto-update statuses based on dates",
        },
      },
    });
  } catch (error: unknown) {
    console.error("❌ Sync status error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to get sync status";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action || "updateStatus";

    console.log(`🔄 Sync action: ${action}`);

    const syncResults = {
      action,
      created: 0,
      updated: 0,
      notified: 0,
      errors: [] as string[],
    };

    if (action === "updateStatus") {
      // Auto-update airdrop statuses based on current date
      const now = new Date();

      // Update UPCOMING -> CLAIMABLE (if claimStartDate has passed)
      const toClaimable = await prisma.airdrop.updateMany({
        where: {
          status: "UPCOMING",
          claimStartDate: { lte: now },
        },
        data: {
          status: "CLAIMABLE",
          updatedAt: now,
        },
      });
      syncResults.updated += toClaimable.count;
      if (toClaimable.count > 0) {
        console.log(`✅ Updated ${toClaimable.count} airdrops to CLAIMABLE`);
      }

      // Update CLAIMABLE -> ENDED (if claimEndDate has passed)
      const toEnded = await prisma.airdrop.updateMany({
        where: {
          status: "CLAIMABLE",
          claimEndDate: { lte: now },
        },
        data: {
          status: "ENDED",
          updatedAt: now,
        },
      });
      syncResults.updated += toEnded.count;
      if (toEnded.count > 0) {
        console.log(`✅ Updated ${toEnded.count} airdrops to ENDED`);
      }

      // Send notifications for newly claimable airdrops
      if (toClaimable.count > 0) {
        const newlyClaimable = await prisma.airdrop.findMany({
          where: {
            status: "CLAIMABLE",
            updatedAt: { gte: new Date(now.getTime() - 60000) }, // Updated in last minute
          },
        });

        for (const airdrop of newlyClaimable) {
          try {
            const sent = await telegramService.sendAirdropAlert({
              name: airdrop.name,
              symbol: airdrop.token,
              chain: airdrop.chain,
              status: "claimable",
              claimStartDate: airdrop.claimStartDate || undefined,
              claimEndDate: airdrop.claimEndDate || undefined,
              estimatedValue: airdrop.estimatedValue || undefined,
              airdropAmount: airdrop.airdropAmount || undefined,
              requiredPoints: airdrop.requiredPoints || undefined,
              deductPoints: airdrop.deductPoints || undefined,
              contractAddress: airdrop.contractAddress || undefined,
            });
            if (sent) syncResults.notified++;
          } catch (notifyError) {
            console.error(`Failed to notify for ${airdrop.name}:`, notifyError);
          }
        }
      }
    } else if (action === "add" && body.airdrop) {
      // Add a new airdrop manually
      const airdropData = body.airdrop;

      // Check if token already exists
      const existing = await prisma.airdrop.findUnique({
        where: { token: airdropData.token },
      });

      if (existing) {
        // Update existing
        await prisma.airdrop.update({
          where: { token: airdropData.token },
          data: {
            name: airdropData.name || existing.name,
            chain: airdropData.chain || existing.chain,
            airdropAmount: airdropData.airdropAmount || existing.airdropAmount,
            claimStartDate: airdropData.claimStartDate
              ? new Date(airdropData.claimStartDate)
              : existing.claimStartDate,
            claimEndDate: airdropData.claimEndDate
              ? new Date(airdropData.claimEndDate)
              : existing.claimEndDate,
            requiredPoints:
              airdropData.requiredPoints ?? existing.requiredPoints,
            deductPoints: airdropData.deductPoints ?? existing.deductPoints,
            estimatedValue:
              airdropData.estimatedValue ?? existing.estimatedValue,
            status: airdropData.status || existing.status,
            type: airdropData.type || existing.type,
            contractAddress:
              airdropData.contractAddress || existing.contractAddress,
            updatedAt: new Date(),
          },
        });
        syncResults.updated++;
        console.log(`✏️ Updated airdrop: ${airdropData.token}`);
      } else {
        // Create new
        await prisma.airdrop.create({
          data: {
            token: airdropData.token,
            name: airdropData.name || airdropData.token,
            chain: airdropData.chain || "BSC",
            airdropAmount: airdropData.airdropAmount || "TBA",
            claimStartDate: airdropData.claimStartDate
              ? new Date(airdropData.claimStartDate)
              : null,
            claimEndDate: airdropData.claimEndDate
              ? new Date(airdropData.claimEndDate)
              : null,
            requiredPoints: airdropData.requiredPoints || 0,
            deductPoints: airdropData.deductPoints || 0,
            estimatedValue: airdropData.estimatedValue || null,
            status: airdropData.status || "UPCOMING",
            type: airdropData.type || "TGE",
            contractAddress: airdropData.contractAddress || null,
            eligibility: JSON.stringify(airdropData.eligibility || []),
            requirements: JSON.stringify(airdropData.requirements || []),
            verified: true,
          },
        });
        syncResults.created++;
        console.log(`✨ Created airdrop: ${airdropData.token}`);

        // Send notification for new airdrop
        try {
          const sent = await telegramService.sendAirdropAlert({
            name: airdropData.name || airdropData.token,
            symbol: airdropData.token,
            chain: airdropData.chain || "BSC",
            status: airdropData.status || "upcoming",
            claimStartDate: airdropData.claimStartDate
              ? new Date(airdropData.claimStartDate)
              : undefined,
            estimatedValue: airdropData.estimatedValue,
            airdropAmount: airdropData.airdropAmount,
            requiredPoints: airdropData.requiredPoints,
          });
          if (sent) syncResults.notified++;
        } catch (notifyError) {
          console.error("Failed to send notification:", notifyError);
        }
      }
    } else if (action === "reseed") {
      // Clear and reseed - requires confirmation
      if (body.confirm !== true) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Reseed requires confirmation. Send { action: 'reseed', confirm: true }",
            warning: "This will delete all existing airdrop data!",
          },
          { status: 400 },
        );
      }

      // Delete all airdrops
      const deleted = await prisma.airdrop.deleteMany();
      console.log(`🗑️ Deleted ${deleted.count} existing airdrops`);

      // Run seed manually - import sample data
      const sampleAirdrops = getSampleBinanceAlphaData();

      for (const airdropData of sampleAirdrops) {
        await prisma.airdrop.create({ data: airdropData });
        syncResults.created++;
      }

      console.log(`✅ Reseeded with ${syncResults.created} airdrops`);
    }

    // Get updated stats
    const [claimable, upcoming, ended] = await Promise.all([
      prisma.airdrop.count({ where: { status: "CLAIMABLE" } }),
      prisma.airdrop.count({ where: { status: "UPCOMING" } }),
      prisma.airdrop.count({ where: { status: "ENDED" } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        ...syncResults,
        database: { claimable, upcoming, ended },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    console.error("❌ Sync error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to sync";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 },
    );
  }
}

/**
 * Sample Binance Alpha data for reseeding
 */
function getSampleBinanceAlphaData() {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  return [
    // Claimable Today
    {
      token: "KOGE",
      name: "KOGE",
      chain: "BSC",
      airdropAmount: "150 KOGE",
      claimStartDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      claimEndDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      status: "CLAIMABLE" as const,
      type: "TGE" as const,
      requiredPoints: 78,
      deductPoints: 78,
      estimatedValue: 45,
      contractAddress: "0x5c74d0a8F4c9bB5D9A6E5B5c6C7D8E9F0A1B2C3D",
      eligibility: JSON.stringify(["Binance Alpha user"]),
      requirements: JSON.stringify(["Minimum Alpha Points required"]),
      verified: true,
      multiplier: 1,
      isBaseline: true,
    },
    {
      token: "SKYAI",
      name: "SKYAI",
      chain: "BSC",
      airdropAmount: "200 SKYAI",
      claimStartDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      claimEndDate: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
      status: "CLAIMABLE" as const,
      type: "TGE" as const,
      requiredPoints: 65,
      deductPoints: 65,
      estimatedValue: 32,
      contractAddress: "0x6D7E8F9A0B1C2D3E4F5A6B7C8D9E0F1A2B3C4D5E",
      eligibility: JSON.stringify(["Binance Alpha user"]),
      requirements: JSON.stringify(["Minimum Alpha Points required"]),
      verified: true,
      multiplier: 1,
      isBaseline: false,
    },
    {
      token: "BMT",
      name: "BMT",
      chain: "BSC",
      airdropAmount: "500 BMT",
      claimStartDate: new Date(now.getTime() - 12 * 60 * 60 * 1000),
      claimEndDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      status: "CLAIMABLE" as const,
      type: "TGE" as const,
      requiredPoints: 45,
      deductPoints: 45,
      estimatedValue: 28,
      contractAddress: "0x7E8F9A0B1C2D3E4F5A6B7C8D9E0F1A2B3C4D5E6F",
      eligibility: JSON.stringify(["Binance Alpha user"]),
      requirements: JSON.stringify(["Minimum Alpha Points required"]),
      verified: true,
      multiplier: 2,
      isBaseline: false,
    },
    {
      token: "PARTI",
      name: "PARTI",
      chain: "BSC",
      airdropAmount: "100 PARTI",
      claimStartDate: now,
      claimEndDate: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000),
      status: "CLAIMABLE" as const,
      type: "TGE" as const,
      requiredPoints: 95,
      deductPoints: 95,
      estimatedValue: 55,
      contractAddress: "0x8F9A0B1C2D3E4F5A6B7C8D9E0F1A2B3C4D5E6F7A",
      eligibility: JSON.stringify(["Binance Alpha user"]),
      requirements: JSON.stringify(["Minimum Alpha Points required"]),
      verified: true,
      multiplier: 1,
      isBaseline: true,
    },
    // Upcoming
    {
      token: "PROMPT",
      name: "PROMPT",
      chain: "BSC",
      airdropAmount: "250 PROMPT",
      claimStartDate: tomorrow,
      claimEndDate: new Date(tomorrow.getTime() + 7 * 24 * 60 * 60 * 1000),
      status: "UPCOMING" as const,
      type: "PRETGE" as const,
      requiredPoints: 55,
      deductPoints: 55,
      estimatedValue: 38,
      contractAddress: "0x9A0B1C2D3E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B",
      eligibility: JSON.stringify(["Binance Alpha user"]),
      requirements: JSON.stringify(["Minimum Alpha Points required"]),
      verified: true,
      multiplier: 1,
      isBaseline: false,
    },
    {
      token: "XTER",
      name: "XTER",
      chain: "BSC",
      airdropAmount: "300 XTER",
      claimStartDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      claimEndDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      status: "UPCOMING" as const,
      type: "TGE" as const,
      requiredPoints: 72,
      deductPoints: 72,
      estimatedValue: 42,
      contractAddress: "0xA0B1C2D3E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9",
      eligibility: JSON.stringify(["Binance Alpha user"]),
      requirements: JSON.stringify(["Minimum Alpha Points required"]),
      verified: true,
      multiplier: 2,
      isBaseline: false,
    },
    {
      token: "SHELL",
      name: "SHELL",
      chain: "BSC",
      airdropAmount: "80 SHELL",
      claimStartDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      claimEndDate: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000),
      status: "UPCOMING" as const,
      type: "TGE" as const,
      requiredPoints: 110,
      deductPoints: 110,
      estimatedValue: 65,
      contractAddress: "0xB1C2D3E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0",
      eligibility: JSON.stringify(["Binance Alpha user"]),
      requirements: JSON.stringify(["Minimum Alpha Points required"]),
      verified: true,
      multiplier: 1,
      isBaseline: true,
    },
    {
      token: "KAITO",
      name: "KAITO",
      chain: "BSC",
      airdropAmount: "120 KAITO",
      claimStartDate: nextWeek,
      claimEndDate: new Date(nextWeek.getTime() + 7 * 24 * 60 * 60 * 1000),
      status: "UPCOMING" as const,
      type: "TGE" as const,
      requiredPoints: 135,
      deductPoints: 135,
      estimatedValue: 88,
      contractAddress: "0xC2D3E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D1",
      eligibility: JSON.stringify(["Binance Alpha user"]),
      requirements: JSON.stringify(["Minimum Alpha Points required"]),
      verified: true,
      multiplier: 1,
      isBaseline: true,
    },
    // Ended (History)
    {
      token: "GPS",
      name: "GPS",
      chain: "BSC",
      airdropAmount: "1000 GPS",
      claimStartDate: twoWeeksAgo,
      claimEndDate: lastWeek,
      status: "ENDED" as const,
      type: "TGE" as const,
      requiredPoints: 35,
      deductPoints: 35,
      estimatedValue: 15,
      contractAddress: "0xD3E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2",
      eligibility: JSON.stringify(["Binance Alpha user"]),
      requirements: JSON.stringify(["Minimum Alpha Points required"]),
      verified: true,
      multiplier: 4,
      isBaseline: false,
    },
    {
      token: "RED",
      name: "RED",
      chain: "BSC",
      airdropAmount: "200 RED",
      claimStartDate: new Date(twoWeeksAgo.getTime() + 3 * 24 * 60 * 60 * 1000),
      claimEndDate: new Date(lastWeek.getTime() + 1 * 24 * 60 * 60 * 1000),
      status: "ENDED" as const,
      type: "TGE" as const,
      requiredPoints: 85,
      deductPoints: 85,
      estimatedValue: 75,
      contractAddress: "0xE4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3",
      eligibility: JSON.stringify(["Binance Alpha user"]),
      requirements: JSON.stringify(["Minimum Alpha Points required"]),
      verified: true,
      multiplier: 1,
      isBaseline: true,
    },
    {
      token: "ANIME",
      name: "ANIME",
      chain: "BSC",
      airdropAmount: "500 ANIME",
      claimStartDate: new Date(lastWeek.getTime() - 5 * 24 * 60 * 60 * 1000),
      claimEndDate: new Date(lastWeek.getTime() + 2 * 24 * 60 * 60 * 1000),
      status: "ENDED" as const,
      type: "TGE" as const,
      requiredPoints: 42,
      deductPoints: 42,
      estimatedValue: 22,
      contractAddress: "0xF5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4",
      eligibility: JSON.stringify(["Binance Alpha user"]),
      requirements: JSON.stringify(["Minimum Alpha Points required"]),
      verified: true,
      multiplier: 2,
      isBaseline: false,
    },
    {
      token: "TROLL",
      name: "TROLL",
      chain: "BSC",
      airdropAmount: "10000 TROLL",
      claimStartDate: new Date(lastWeek.getTime() - 3 * 24 * 60 * 60 * 1000),
      claimEndDate: new Date(lastWeek.getTime() + 4 * 24 * 60 * 60 * 1000),
      status: "ENDED" as const,
      type: "AIRDROP" as const,
      requiredPoints: 25,
      deductPoints: 25,
      estimatedValue: 8,
      contractAddress: "0xA6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5",
      eligibility: JSON.stringify(["Binance Alpha user"]),
      requirements: JSON.stringify(["Minimum Alpha Points required"]),
      verified: true,
      multiplier: 4,
      isBaseline: false,
    },
    {
      token: "HOLD",
      name: "HOLDCOIN",
      chain: "BSC",
      airdropAmount: "50 HOLD",
      claimStartDate: new Date(lastWeek.getTime() - 1 * 24 * 60 * 60 * 1000),
      claimEndDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      status: "ENDED" as const,
      type: "TGE" as const,
      requiredPoints: 150,
      deductPoints: 150,
      estimatedValue: 125,
      contractAddress: "0xB7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6",
      eligibility: JSON.stringify(["Binance Alpha user"]),
      requirements: JSON.stringify(["Minimum Alpha Points required"]),
      verified: true,
      multiplier: 1,
      isBaseline: true,
    },
  ];
}
