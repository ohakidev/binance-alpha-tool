/**
 * Binance Alpha Airdrops API Route
 * GET /api/binance/alpha/airdrops
 * Returns current airdrop opportunities from database
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { airdropCalculator } from "@/lib/services/airdrop-calculator";
import type { Airdrop } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const chain = searchParams.get("chain");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Build filter
    const where: Record<string, unknown> = {};

    if (status) {
      // Map common status names to Prisma enum values
      const statusMap: Record<string, string> = {
        upcoming: "UPCOMING",
        live: "CLAIMABLE",
        claimable: "CLAIMABLE",
        snapshot: "SNAPSHOT",
        ended: "ENDED",
        cancelled: "CANCELLED",
      };
      const mappedStatus = statusMap[status.toLowerCase()];
      if (mappedStatus) {
        where.status = mappedStatus;
      }
    }

    if (chain) {
      where.chain = chain;
    }

    // Fetch airdrops from database
    const airdrops = await prisma.airdrop.findMany({
      where,
      orderBy: [{ claimStartDate: "asc" }, { createdAt: "desc" }],
      take: limit,
    });

    // คำนวณคะแนนสำหรับแต่ละ airdrop
    const airdropsWithScores = airdrops.map((airdrop: Airdrop) => {
      // Parse JSON strings to arrays
      const eligibility = JSON.parse(airdrop.eligibility || "[]");
      const requirements = JSON.parse(airdrop.requirements || "[]");

      return {
        id: airdrop.id,
        projectName: airdrop.name,
        symbol: airdrop.token,
        logo: "🎁",
        chain: airdrop.chain,
        status: airdrop.status.toLowerCase(),
        description: airdrop.description || "",
        website: airdrop.websiteUrl || "",
        twitter: airdrop.twitterUrl || "",
        discord: airdrop.discordUrl || "",
        eligibility,
        requirements,
        airdropAmount: airdrop.airdropAmount || "TBA",
        estimatedValue: airdrop.estimatedValue,
        snapshotDate: airdrop.snapshotDate,
        claimStartDate: airdrop.claimStartDate,
        claimEndDate: airdrop.claimEndDate,
        dropTime:
          airdrop.claimStartDate?.toISOString() || new Date().toISOString(),
        verified: airdrop.verified,
        participantCount: airdrop.participantCount,

        // New fields
        type: airdrop.type || "Airdrop",
        requiredPoints: airdrop.requiredPoints || 0,
        deductPoints: airdrop.deductPoints || 0,
        contractAddress: airdrop.contractAddress || "",

        score: airdropCalculator.calculateAirdropScore({
          estimatedValue: airdrop.estimatedValue || undefined,
          participantCount: airdrop.participantCount || undefined,
          verified: airdrop.verified,
          requirements,
          claimEndDate: airdrop.claimEndDate,
        }),
      };
    });

    // Sort by score
    airdropsWithScores.sort(
      (a: { score: number }, b: { score: number }) => b.score - a.score,
    );

    return NextResponse.json({
      success: true,
      data: airdropsWithScores,
      count: airdropsWithScores.length,
      source: "database",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Airdrops API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch airdrops",
      },
      { status: 500 },
    );
  }
}

// POST - สร้าง airdrop ใหม่
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const airdrop = await airdropCalculator.createAirdrop({
      name: body.name || body.projectName,
      token: body.symbol || body.token,
      chain: body.chain,
      description: body.description,
      eligibility: body.eligibility || [],
      requirements: body.requirements || [],
      snapshotDate: body.snapshotDate ? new Date(body.snapshotDate) : undefined,
      claimStartDate:
        body.claimStartDate || body.dropTime
          ? new Date(body.claimStartDate || body.dropTime)
          : undefined,
      claimEndDate: body.claimEndDate ? new Date(body.claimEndDate) : undefined,
      estimatedValue: body.estimatedValue,
      websiteUrl: body.website || body.websiteUrl,
      twitterUrl: body.twitter || body.twitterUrl,
    });

    return NextResponse.json({
      success: true,
      data: airdrop,
    });
  } catch (error) {
    console.error("Create Airdrop Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create airdrop",
      },
      { status: 500 },
    );
  }
}
