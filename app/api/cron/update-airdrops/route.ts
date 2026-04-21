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
import {
  binanceEventTrackerService,
  type EventSyncStats,
} from "@/lib/services/alpha/BinanceEventTrackerService";
import {
  telegramService,
  type AirdropReminderData,
} from "@/lib/services/telegram";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export type ScheduleNotificationStage = "20m" | "5m" | "live";

const SCHEDULE_NOTIFICATION_SOURCE_PREFIX = "airdrop-schedule";
const SCHEDULE_NOTIFICATION_ACTIONS: ScheduleNotificationStage[] = ["20m", "live"];
const OFFICIAL_SYNC_INTERVAL_MS = 30 * 60 * 1000;
const LIVE_NOTIFICATION_TOLERANCE_MS = 35 * 60 * 1000;
const REMINDER_LOOKAHEAD_MS = 40 * 60 * 1000;
const IMMEDIATE_NEW_EVENT_ALERT_WINDOW_MS = 30 * 60 * 1000;

function didOfficialSyncProduceUsableOutput(syncStats: EventSyncStats): boolean {
  return (
    syncStats.parsedSuccessCount > 0 ||
    syncStats.dedupedEvents > 0 ||
    syncStats.insertedEvents > 0 ||
    syncStats.updatedEvents > 0 ||
    syncStats.finalScheduleCount > 0
  );
}

function isOfficialSyncDegraded(syncStats: EventSyncStats): boolean {
  return (
    syncStats.squareFetchStatus === "degraded" || syncStats.errors.length > 0
  );
}

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

function isForcedSyncRequest(request: Request): boolean {
  const { searchParams } = new URL(request.url);
  return (
    searchParams.get("force") === "true" ||
    request.headers.get("x-force-sync") === "true"
  );
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

  // GitHub scheduled workflows can drift, so prefer a single reminder band plus
  // a broad live tolerance. Dedupe logs prevent duplicate sends.
  if (diffMs <= 0 && diffMs > -LIVE_NOTIFICATION_TOLERANCE_MS) {
    return "live";
  }

  if (diffMs > 0 && diffMs <= REMINDER_LOOKAHEAD_MS) {
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

function getReminderMinutesUntil(
  scheduledTime: Date,
  now: Date = new Date(),
): number {
  const diffMs = scheduledTime.getTime() - now.getTime();
  if (diffMs <= 0) {
    return 0;
  }

  return Math.max(1, Math.ceil(diffMs / (60 * 1000)));
}

export function shouldRunOfficialSync(
  lastSuccessfulSyncAt: Date | null,
  now: Date = new Date(),
  force: boolean = false,
): boolean {
  if (force || !lastSuccessfulSyncAt) {
    return true;
  }

  return now.getTime() - lastSuccessfulSyncAt.getTime() >= OFFICIAL_SYNC_INTERVAL_MS;
}

function shouldSendImmediateNewEventAlert(
  event: {
    status: string;
    claimStartAt?: Date | null;
    listingTime?: Date | null;
  },
  now: Date = new Date(),
): boolean {
  if (event.status === "live" || event.status === "claimable") {
    return true;
  }

  const anchorTime = event.claimStartAt || event.listingTime;
  if (!anchorTime) {
    return false;
  }

  const diffMs = anchorTime.getTime() - now.getTime();
  return (
    diffMs <= IMMEDIATE_NEW_EVENT_ALERT_WINDOW_MS &&
    diffMs > -LIVE_NOTIFICATION_TOLERANCE_MS
  );
}

async function getLastSuccessfulOfficialSyncAt(): Promise<Date | null> {
  try {
    const syncLog = await (prisma as any).syncLog.findFirst({
      where: {
        source: "official-binance-event-tracker",
        action: "sync",
        success: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        createdAt: true,
      },
    });

    return syncLog?.createdAt ?? null;
  } catch (error) {
    console.warn("[cron:update-airdrops] last successful sync lookup failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
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

    const now = new Date();
    const forceSync = isForcedSyncRequest(request);
    const lastSuccessfulSyncAt = await getLastSuccessfulOfficialSyncAt();
    const runOfficialSync = shouldRunOfficialSync(
      lastSuccessfulSyncAt,
      now,
      forceSync,
    );
    let syncStats: EventSyncStats | null = null;

    if (runOfficialSync) {
      syncStats = await binanceEventTrackerService.syncEvents(now);

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
        if (!shouldSendImmediateNewEventAlert(event, now)) {
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
    } else {
      console.log("[cron:update-airdrops] skipping full sync heartbeat", {
        forceSync,
        lastSuccessfulSyncAt: lastSuccessfulSyncAt?.toISOString() ?? null,
        nextSyncAfterMs: lastSuccessfulSyncAt
          ? Math.max(
              0,
              OFFICIAL_SYNC_INTERVAL_MS - (now.getTime() - lastSuccessfulSyncAt.getTime()),
            )
          : 0,
      });
    }

    try {
      const schedules = await (prisma as any).airdropSchedule.findMany({
        where: {
          scheduledTime: {
            gte: new Date(now.getTime() - LIVE_NOTIFICATION_TOLERANCE_MS),
            lte: new Date(now.getTime() + REMINDER_LOOKAHEAD_MS),
          },
          isActive: true,
          status: {
            notIn: ["ENDED", "CANCELLED"],
          },
        },
        select: {
          id: true,
          name: true,
          token: true,
          scheduledTime: true,
          chain: true,
          points: true,
          amount: true,
          description: true,
          contractAddress: true,
          type: true,
          estimatedPrice: true,
          estimatedValue: true,
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
          minutesUntil: getReminderMinutesUntil(schedule.scheduledTime, now),
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
              select: { id: true },
            });
            notificationSummary.live++;
          } else if (stage === "20m") {
            notificationSummary.reminder20m++;
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
    const officialSyncSuccess = syncStats
      ? didOfficialSyncProduceUsableOutput(syncStats)
      : true;
    const officialSyncDegraded = syncStats
      ? isOfficialSyncDegraded(syncStats)
      : false;

    if (syncStats) {
      try {
        await (prisma as any).syncLog.create({
          data: {
            source: "official-binance-event-tracker",
            action: "sync",
            success: officialSyncSuccess,
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
              degraded: officialSyncDegraded,
              notificationSummary,
              errors: syncStats.errors.slice(0, 20),
            }),
          },
        });
      } catch (error) {
        console.error("[cron:update-airdrops] sync log write failed", error);
      }

      try {
        const cutoff = new Date(now);
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
    }

    return NextResponse.json({
      success: officialSyncSuccess,
      data: {
        syncSkipped: !runOfficialSync,
        syncIntervalMinutes: OFFICIAL_SYNC_INTERVAL_MS / (60 * 1000),
        lastSuccessfulSyncAt: lastSuccessfulSyncAt?.toISOString() ?? null,
        forceSync,
        duration,
        squareFetchStatus: syncStats?.squareFetchStatus ?? null,
        squarePostCount: syncStats?.squarePostCount ?? null,
        parsedSuccessCount: syncStats?.parsedSuccessCount ?? null,
        parseFailureCount: syncStats?.parseFailureCount ?? null,
        insertedEvents: syncStats?.insertedEvents ?? null,
        updatedEvents: syncStats?.updatedEvents ?? null,
        dedupedEvents: syncStats?.dedupedEvents ?? null,
        enrichmentSuccessCount: syncStats?.enrichmentSuccessCount ?? null,
        enrichmentFailureCount: syncStats?.enrichmentFailureCount ?? null,
        finalScheduleCount: syncStats?.finalScheduleCount ?? null,
        finalEventCount: syncStats?.finalEventCount ?? null,
        degraded: officialSyncDegraded,
        notified: notificationSummary.total,
        notificationSummary,
        errors: syncStats?.errors ?? [],
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
