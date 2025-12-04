import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AirdropType, AirdropStatus } from "@prisma/client";

interface ProcessedProject {
  token: string;
  name: string;
  chain: string;
  airdropAmount: string;
  claimStartDate: Date | null;
  contractAddress: string | null;
  requiredPoints: number;
  deductPoints: number;
  type: AirdropType;
  status: AirdropStatus;
  estimatedValue: number | null;
}

/**
 * API Route: Save Alpha Projects to Database
 *
 * POST /api/binance/alpha/save
 *
 * Receives processed project data from client-side and saves to database
 * This endpoint is designed to work with client-side fetching to bypass 403 errors
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projects } = body;

    if (!projects || !Array.isArray(projects)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request: projects array is required",
        },
        { status: 400 },
      );
    }

    console.log(`💾 Saving ${projects.length} projects to database...`);

    const syncResults = {
      created: 0,
      updated: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const project of projects as ProcessedProject[]) {
      try {
        const prismaData = {
          token: project.token,
          name: project.name,
          chain: project.chain,
          airdropAmount: project.airdropAmount,
          claimStartDate: project.claimStartDate
            ? new Date(project.claimStartDate)
            : null,
          claimEndDate: project.claimStartDate
            ? new Date(
                new Date(project.claimStartDate).getTime() +
                  30 * 24 * 60 * 60 * 1000,
              )
            : null,
          contractAddress: project.contractAddress,
          requiredPoints: project.requiredPoints,
          deductPoints: project.deductPoints,
          type: project.type,
          status: project.status,
          estimatedValue: project.estimatedValue,
          websiteUrl: null,
          twitterUrl: null,
          description: null,
          eligibility: JSON.stringify([]),
          requirements: JSON.stringify([]),
          verified: true,
        };

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
          await prisma.airdrop.create({
            data: prismaData,
          });
          syncResults.created++;
        }
      } catch (error) {
        syncResults.failed++;
        const errorMsg = `Failed to save ${project.token}: ${error instanceof Error ? error.message : "Unknown error"}`;
        syncResults.errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    console.log("✅ Save completed:", syncResults);

    return NextResponse.json({
      success: true,
      data: {
        source: "alpha123.uk (client-side)",
        lastUpdate: new Date().toISOString(),
        total: projects.length,
        ...syncResults,
      },
    });
  } catch (error) {
    console.error("❌ Save error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to save projects",
      },
      { status: 500 },
    );
  }
}
