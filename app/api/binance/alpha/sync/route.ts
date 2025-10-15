import { NextResponse } from 'next/server';
import { realAlphaFetcher } from '@/lib/services/real-alpha-fetcher';
import { prisma } from '@/lib/prisma';

/**
 * API Route: Sync Alpha Projects from Binance/Alpha123
 *
 * GET /api/binance/alpha/sync
 * Query params:
 * - force: boolean (force refresh cache)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('force') === 'true';

    console.log('🔄 Starting Alpha projects sync from alpha123.uk...', { forceRefresh });

    // Fetch real data from alpha123.uk
    const projects = await realAlphaFetcher.fetchAllProjects(forceRefresh);

    if (!projects || projects.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No data received from alpha123.uk',
        },
        { status: 500 }
      );
    }

    console.log(`📦 Received ${projects.length} projects from alpha123.uk`);

    // Sync to database
    const syncResults = {
      created: 0,
      updated: 0,
      failed: 0,
      errors: [] as string[],
    };

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
          console.log(`✏️  Updated: ${prismaData.name} (${prismaData.token})`);
        } else {
          // Create new
          await prisma.airdrop.create({
            data: prismaData,
          });
          syncResults.created++;
          console.log(`✨ Created: ${prismaData.name} (${prismaData.token})`);
        }
      } catch (error: any) {
        syncResults.failed++;
        const errorMsg = `Failed to sync ${project.token}: ${error.message}`;
        syncResults.errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    console.log('✅ Sync completed:', syncResults);

    return NextResponse.json({
      success: true,
      data: {
        source: 'alpha123.uk',
        lastUpdate: new Date().toISOString(),
        total: projects.length,
        ...syncResults,
      },
    });
  } catch (error: any) {
    console.error('❌ Sync error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to sync Alpha projects',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/binance/alpha/sync
 * Force refresh and sync
 */
export async function POST(request: Request) {
  // Force refresh on POST
  const url = new URL(request.url);
  url.searchParams.set('force', 'true');

  // Call GET with force parameter
  return GET(new Request(url.toString()));
}
