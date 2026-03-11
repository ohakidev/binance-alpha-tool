/**
 * Official Binance Alpha event sync cron.
 *
 * Flow:
 * 1. Ingest Binance Wallet Square posts
 * 2. Verify linked official announcements
 * 3. Enrich with Binance Alpha token metadata and price
 * 4. Persist canonical events + raw sources
 * 5. Refresh legacy schedule rows for notifications/UI compatibility
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { binanceEventTrackerService } from "@/lib/services/alpha/BinanceEventTrackerService";
import {
  telegramService,
  type AirdropReminderData,
} from "@/lib/services/telegram";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export type ScheduleNotificationStage = "20m" | "5m" | "live";

const SCHEDULE_NOTIFICATION_SOURCE_PREFIX = "airdrop-schedule";
const SCHEDULE_NOTIFICATION_ACTIONS: ScheduleNotificationStage[] = [
  "20m",
  "5m",
  "live",
];

function isAuthorized(request: Request): boolean {
  if (request.headers.get("x-vercel-cron")) {
    return true;
  }

  if (request.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`) {
    return true;
  }

  const { searchParams } = new URL(request.url);
  if (searchParams.get("secret") === process.env.CRON_SECRET) {
    return true;
  }

  return process.env.NODE_ENV === "development";
}

function extractSlotText(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const match = value.match(/\b\d+(?:\.\d+)?k?\s+slots\b/i);
  return match?.[0] || null;
}

function formatAmount(event: {
  tokenAmountText?: string | null;
  tokenAmount?: number | null;
  symbol?: string | null;
}): string | null {
  if (event.tokenAmountText) {
    return event.tokenAmountText;
  }

  if (
    event.tokenAmount !== null &&
    event.tokenAmount !== undefined &&
    event.symbol
  ) {
    const numeric = Number.isInteger(event.tokenAmount)
      ? String(event.tokenAmount)
      : event.tokenAmount.toFixed(4).replace(/\.?0+$/, "");
    return `${numeric} ${event.symbol}`;
  }

  return null;
}

export function getScheduleNotificationStage(
  scheduledTime: Date,
  now: Date = new Date(),
): ScheduleNotificationStage | null {
  const diffMs = scheduledTime.getTime() - now.getTime();

  if (diffMs <= 0 && diffMs > -5 * 60 * 1000) {
    return "live";
  }

  if (diffMs > 0 && diffMs <= 5 * 60 * 1000) {
    return "5m";
  }

  if (diffMs > 15 * 60 * 1000 && diffMs <= 20 * 60 * 1000) {
    return "20m";
  }

  return null;
}

function getScheduleNotificationSource(scheduleId: string): string {
  return `${SCHEDULE_NOTIFICATION_SOURCE_PREFIX}:${scheduleId}`;
}

function getScheduleNotificationAction(stage: ScheduleNotificationStage): string {
  return `notify-${stage}`;
}

function getReminderMinutesForStage(stage: ScheduleNotificationStage): number {
  switch (stage) {
    case "20m":
      return 20;
    case "5m":
      return 5;
    case "live":
      return 0;
  }
}

export async function GET(request: Request) {
  const startedAt = Date.now();
  const notificationSummary = {
    newEvent: 0,
    reminder20m: 0,
    reminder5m: 0,
    live: 0,
    total: 0,
  };

  try {
    if (!isAuthorized(request)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const syncStats = await binanceEventTrackerService.syncEvents();

    console.log("[cron:update-airdrops] source fetch", {
      squareFetchStatus: syncStats.squareFetchStatus,
      squarePostCount: syncStats.squarePostCount,
    });
    console.log("[cron:update-airdrops] parse", {
      success: syncStats.parsedSuccessCount,
      failure: syncStats.parseFailureCount,
    });
    console.log("[cron:update-airdrops] persistence", {
      inserted: syncStats.insertedEvents,
      updated: syncStats.updatedEvents,
      deduped: syncStats.dedupedEvents,
      enrichmentSuccess: syncStats.enrichmentSuccessCount,
      enrichmentFailure: syncStats.enrichmentFailureCount,
      finalScheduleCount: syncStats.finalScheduleCount,
    });

    for (const event of syncStats.newEvents) {
      if (!["upcoming", "today", "live", "claimable"].includes(event.status)) {
        continue;
      }

      try {
        const sent = await telegramService.sendAirdropAlert({
          name: event.projectName,
          symbol: event.symbol || "UNKNOWN",
          chain: event.chain || "BSC",
          status: event.status,
          claimStartDate: event.claimStartAt || event.listingTime || undefined,
          estimatedPrice: event.latestPrice ?? undefined,
          estimatedValue: event.estimatedUsdValue ?? undefined,
          airdropAmount: formatAmount(event) ?? undefined,
          requiredPoints: event.requiredAlphaPoints ?? undefined,
          pointsText:
            event.requiredAlphaPoints !== null &&
            event.requiredAlphaPoints !== undefined
              ? String(event.requiredAlphaPoints)
              : undefined,
          deductPoints: event.deductPoints ?? undefined,
          slotText: extractSlotText(event.sourceRawText) ?? undefined,
          contractAddress: event.contractAddress ?? undefined,
        });

        if (sent) {
          notificationSummary.newEvent++;
          notificationSummary.total++;
        }
      } catch (error) {
        console.error("[cron:update-airdrops] new-event notification failed", {
          sourceUrl: event.sourceUrl,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    try {
      const now = new Date();
      const schedules = await (prisma as any).airdropSchedule.findMany({
        where: {
          scheduledTime: {
            gte: new Date(now.getTime() - 5 * 60 * 1000),
            lte: new Date(now.getTime() + 20 * 60 * 1000),
          },
          isActive: true,
          status: {
            notIn: ["ENDED", "CANCELLED"],
          },
        },
        orderBy: {
          scheduledTime: "asc",
        },
      });

      const deliveredNotificationKeys = new Set<string>();
      if (schedules.length > 0) {
        const syncLogs = await (prisma as any).syncLog.findMany({
          where: {
            source: {
              in: schedules.map((schedule: { id: string }) =>
                getScheduleNotificationSource(schedule.id),
              ),
            },
            action: {
              in: SCHEDULE_NOTIFICATION_ACTIONS.map(getScheduleNotificationAction),
            },
            success: true,
          },
          select: {
            source: true,
            action: true,
          },
        });

        for (const log of syncLogs) {
          deliveredNotificationKeys.add(`${log.source}:${log.action}`);
        }
      }

      for (const schedule of schedules) {
        const stage = getScheduleNotificationStage(schedule.scheduledTime, now);
        if (!stage) {
          continue;
        }

        const notificationSource = getScheduleNotificationSource(schedule.id);
        const notificationAction = getScheduleNotificationAction(stage);
        const notificationKey = `${notificationSource}:${notificationAction}`;

        if (deliveredNotificationKeys.has(notificationKey)) {
          continue;
        }

        const payload: AirdropReminderData = {
          name: schedule.name,
          symbol: schedule.token,
          scheduledTime: schedule.scheduledTime,
          minutesUntil: getReminderMinutesForStage(stage),
          chain: schedule.chain,
          points: schedule.points,
          amount: schedule.amount,
          slotText: extractSlotText(schedule.description),
          contractAddress: schedule.contractAddress,
          type: schedule.type,
          estimatedPrice: schedule.estimatedPrice ?? null,
          estimatedValue: schedule.estimatedValue ?? null,
          marketCap: null,
        };

        try {
          const sent = stage === "live"
            ? await telegramService.sendAirdropLive(payload)
            : await telegramService.sendAirdropReminder(payload);

          if (!sent) {
            continue;
          }

          await (prisma as any).syncLog.create({
            data: {
              source: notificationSource,
              action: notificationAction,
              success: true,
              tokensCount: 1,
              created: 0,
              updated: 0,
              errors: 0,
              duration: 0,
              details: JSON.stringify({
                scheduleId: schedule.id,
                symbol: schedule.token,
                scheduledTime: schedule.scheduledTime.toISOString(),
                stage,
              }),
            },
          });
          deliveredNotificationKeys.add(notificationKey);

          if (stage === "live") {
            await (prisma as any).airdropSchedule.update({
              where: { id: schedule.id },
              data: { notified: true },
            });
            notificationSummary.live++;
          } else if (stage === "20m") {
            notificationSummary.reminder20m++;
          } else {
            notificationSummary.reminder5m++;
          }

          notificationSummary.total++;
        } catch (error) {
          console.error("[cron:update-airdrops] schedule notification failed", {
            scheduleId: schedule.id,
            stage,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    } catch (error) {
      console.warn("[cron:update-airdrops] reminder/live notifications degraded", {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    const duration = Date.now() - startedAt;

    try {
      await (prisma as any).syncLog.create({
        data: {
          source: "official-binance-event-tracker",
          action: "sync",
          success: syncStats.errors.length === 0,
          tokensCount: syncStats.squarePostCount,
          created: syncStats.insertedEvents,
          updated: syncStats.updatedEvents,
          errors: syncStats.errors.length,
          duration,
          details: JSON.stringify({
            squareFetchStatus: syncStats.squareFetchStatus,
            parsedSuccessCount: syncStats.parsedSuccessCount,
            parseFailureCount: syncStats.parseFailureCount,
            dedupedEvents: syncStats.dedupedEvents,
            enrichmentSuccessCount: syncStats.enrichmentSuccessCount,
            enrichmentFailureCount: syncStats.enrichmentFailureCount,
            finalScheduleCount: syncStats.finalScheduleCount,
            finalEventCount: syncStats.finalEventCount,
            notificationSummary,
            errors: syncStats.errors.slice(0, 20),
          }),
        },
      });
    } catch (error) {
      console.error("[cron:update-airdrops] sync log write failed", error);
    }

    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      await (prisma as any).airdropSchedule.deleteMany({
        where: {
          status: "ENDED",
          scheduledTime: { lt: cutoff },
        },
      });
    } catch (error) {
      console.warn("[cron:update-airdrops] cleanup degraded", error);
    }

    return NextResponse.json({
      success: true,
      data: {
        duration,
        squareFetchStatus: syncStats.squareFetchStatus,
        squarePostCount: syncStats.squarePostCount,
        parsedSuccessCount: syncStats.parsedSuccessCount,
        parseFailureCount: syncStats.parseFailureCount,
        insertedEvents: syncStats.insertedEvents,
        updatedEvents: syncStats.updatedEvents,
        dedupedEvents: syncStats.dedupedEvents,
        enrichmentSuccessCount: syncStats.enrichmentSuccessCount,
        enrichmentFailureCount: syncStats.enrichmentFailureCount,
        finalScheduleCount: syncStats.finalScheduleCount,
        finalEventCount: syncStats.finalEventCount,
        notified: notificationSummary.total,
        notificationSummary,
        errors: syncStats.errors,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[cron:update-airdrops] critical failure", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Sync failed",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
