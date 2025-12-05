/**
 * Airdrop Schedule Service
 * Manages airdrop schedules like alpha123.uk displays
 *
 * Features:
 * - Track today's airdrops
 * - Track upcoming airdrops
 * - Sync from Binance Alpha API
 * - Parse announcements for schedule data
 */

import { prisma } from "@/lib/db/prisma";
import { AirdropType } from "@prisma/client";
import {
  AirdropScheduleData,
  TodayAirdrop,
  UpcomingAirdrop,
  ScheduleServiceResponse,
  ScheduleSyncResult,
  ScheduleFilterOptions,
  ScheduleStatus,
} from "@/lib/types/alpha.types";
import { alphaService } from "./AlphaService";

/**
 * Format time to display format (e.g., "05:00 PM")
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Format date to display format (e.g., "2024-01-15")
 */
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Calculate days until a date
 */
function daysUntil(date: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Check if a date is today
 */
function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Determine schedule status based on time
 */
function determineScheduleStatus(
  scheduledTime: Date,
  endTime?: Date | null,
): ScheduleStatus {
  const now = new Date();

  if (endTime && now > endTime) {
    return "ENDED";
  }

  if (now >= scheduledTime) {
    return "LIVE";
  }

  if (isToday(scheduledTime)) {
    return "TODAY";
  }

  return "UPCOMING";
}

/**
 * Airdrop Schedule Service
 */
export class AirdropScheduleService {
  private lastSyncTime: Date | null = null;

  /**
   * Get today's airdrops formatted like alpha123.uk
   */
  async getTodayAirdrops(): Promise<TodayAirdrop[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const schedules = await (prisma as any).airdropSchedule.findMany({
      where: {
        scheduledTime: {
          gte: today,
          lt: tomorrow,
        },
        isActive: true,
      },
      orderBy: {
        scheduledTime: "asc",
      },
    });

    return schedules.map((schedule: any) => {
      const now = new Date();
      let status: "upcoming" | "live" | "ended" = "upcoming";

      if (schedule.endTime && now > schedule.endTime) {
        status = "ended";
      } else if (now >= schedule.scheduledTime) {
        status = "live";
      }

      return {
        token: schedule.token,
        name: schedule.name,
        points: schedule.points,
        amount: schedule.amount,
        time: formatTime(schedule.scheduledTime),
        chain: schedule.chain,
        contractAddress: schedule.contractAddress,
        logoUrl: schedule.logoUrl,
        status,
        estimatedValue: schedule.estimatedValue,
      };
    });
  }

  /**
   * Get upcoming airdrops formatted like alpha123.uk
   */
  async getUpcomingAirdrops(limit: number = 20): Promise<UpcomingAirdrop[]> {
    const tomorrow = new Date();
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const schedules = await (prisma as any).airdropSchedule.findMany({
      where: {
        scheduledTime: {
          gte: tomorrow,
        },
        isActive: true,
        status: {
          in: ["UPCOMING"],
        },
      },
      orderBy: {
        scheduledTime: "asc",
      },
      take: limit,
    });

    return schedules.map((schedule: any) => ({
      token: schedule.token,
      name: schedule.name,
      points: schedule.points,
      amount: schedule.amount,
      date: formatDate(schedule.scheduledTime),
      time: formatTime(schedule.scheduledTime),
      chain: schedule.chain,
      contractAddress: schedule.contractAddress,
      logoUrl: schedule.logoUrl,
      daysUntil: daysUntil(schedule.scheduledTime),
      estimatedValue: schedule.estimatedValue,
    }));
  }

  /**
   * Get all schedules with filters
   */
  async getSchedules(
    options: ScheduleFilterOptions = {},
  ): Promise<AirdropScheduleData[]> {
    const where: Record<string, unknown> = {
      isActive: true,
    };

    if (options.status) {
      where.status = Array.isArray(options.status)
        ? { in: options.status }
        : options.status;
    }

    if (options.type) {
      where.type = Array.isArray(options.type)
        ? { in: options.type }
        : options.type;
    }

    if (options.chain) {
      where.chain = Array.isArray(options.chain)
        ? { in: options.chain }
        : options.chain;
    }

    if (options.token) {
      where.token = {
        contains: options.token,
        mode: "insensitive",
      };
    }

    if (options.fromDate || options.toDate) {
      where.scheduledTime = {};
      if (options.fromDate) {
        (where.scheduledTime as Record<string, Date>).gte = options.fromDate;
      }
      if (options.toDate) {
        (where.scheduledTime as Record<string, Date>).lte = options.toDate;
      }
    }

    const schedules = await (prisma as any).airdropSchedule.findMany({
      where,
      orderBy: {
        scheduledTime: "asc",
      },
      take: options.limit || 50,
      skip: options.offset || 0,
    });

    return schedules.map((s: any) => ({
      id: s.id,
      token: s.token,
      name: s.name,
      scheduledTime: s.scheduledTime,
      endTime: s.endTime,
      points: s.points,
      deductPoints: s.deductPoints,
      amount: s.amount,
      chain: s.chain,
      contractAddress: s.contractAddress,
      status: s.status,
      type: s.type,
      estimatedPrice: s.estimatedPrice,
      estimatedValue: s.estimatedValue,
      source: s.source,
      sourceUrl: s.sourceUrl,
      logoUrl: s.logoUrl,
      description: s.description,
      isActive: s.isActive,
      isVerified: s.isVerified,
      notified: s.notified,
    }));
  }

  /**
   * Get combined response for UI (like alpha123.uk)
   */
  async getScheduleResponse(): Promise<ScheduleServiceResponse> {
    const [today, upcoming] = await Promise.all([
      this.getTodayAirdrops(),
      this.getUpcomingAirdrops(),
    ]);

    return {
      success: true,
      today,
      upcoming,
      lastUpdate: this.lastSyncTime || new Date(),
      source: "database",
    };
  }

  /**
   * Create or update a schedule
   */
  async upsertSchedule(data: AirdropScheduleData): Promise<void> {
    const status = determineScheduleStatus(data.scheduledTime, data.endTime);

    await (prisma as any).airdropSchedule.upsert({
      where: {
        token_scheduledTime: {
          token: data.token,
          scheduledTime: data.scheduledTime,
        },
      },
      create: {
        token: data.token,
        name: data.name,
        scheduledTime: data.scheduledTime,
        endTime: data.endTime,
        points: data.points,
        deductPoints: data.deductPoints,
        amount: data.amount,
        chain: data.chain,
        contractAddress: data.contractAddress,
        status,
        type: data.type,
        estimatedPrice: data.estimatedPrice,
        estimatedValue: data.estimatedValue,
        source: data.source,
        sourceUrl: data.sourceUrl,
        logoUrl: data.logoUrl,
        description: data.description,
        isActive: data.isActive,
        isVerified: data.isVerified,
      },
      update: {
        name: data.name,
        endTime: data.endTime,
        points: data.points,
        deductPoints: data.deductPoints,
        amount: data.amount,
        chain: data.chain,
        contractAddress: data.contractAddress,
        status,
        type: data.type,
        estimatedPrice: data.estimatedPrice,
        estimatedValue: data.estimatedValue,
        source: data.source,
        sourceUrl: data.sourceUrl,
        logoUrl: data.logoUrl,
        description: data.description,
        isActive: data.isActive,
        isVerified: data.isVerified,
      },
    });
  }

  /**
   * Sync schedules from Binance Alpha tokens
   * Creates schedules for tokens with onlineAirdrop or onlineTge flags
   */
  async syncFromBinanceAlpha(): Promise<ScheduleSyncResult> {
    const startTime = Date.now();
    let created = 0;
    let updated = 0;
    let errors = 0;

    try {
      // Get tokens from Alpha Service
      const response = await alphaService.getTokens(true);
      const tokens = response.data;

      console.log(`📅 Processing ${tokens.length} tokens for schedule sync...`);

      for (const token of tokens) {
        // Only process tokens with active airdrops or TGE
        if (!token.onlineAirdrop && !token.onlineTge) {
          continue;
        }

        try {
          // Determine scheduled time
          // If listingTime exists, use it; otherwise use current time + 1 hour
          const scheduledTime =
            token.listingTime || new Date(Date.now() + 3600000);

          // Check if schedule exists
          const existing = await (prisma as any).airdropSchedule.findFirst({
            where: {
              token: token.symbol,
              scheduledTime: {
                gte: new Date(scheduledTime.getTime() - 86400000), // Within 24 hours
                lte: new Date(scheduledTime.getTime() + 86400000),
              },
            },
          });

          const scheduleData: AirdropScheduleData = {
            token: token.symbol,
            name: token.name,
            scheduledTime,
            endTime: token.listingTime
              ? new Date(token.listingTime.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days after
              : null,
            points: token.score || null,
            deductPoints: token.score ? Math.floor(token.score * 0.1) : null,
            amount: token.score ? `Alpha Score: ${token.score}` : null,
            chain: token.chain,
            contractAddress: token.contractAddress || null,
            status: "UPCOMING",
            type: token.onlineTge ? "TGE" : "AIRDROP",
            estimatedPrice: token.price > 0 ? token.price : null,
            estimatedValue: token.estimatedValue,
            source: "binance-alpha",
            sourceUrl: null,
            logoUrl: token.iconUrl || null,
            description: `${token.name} (${token.symbol}) - ${token.mulPoint}x multiplier`,
            isActive: !token.isOffline,
            isVerified: true,
            notified: false,
          };

          await this.upsertSchedule(scheduleData);

          if (existing) {
            updated++;
          } else {
            created++;
          }
        } catch (error) {
          console.error(`Error processing token ${token.symbol}:`, error);
          errors++;
        }
      }

      // Update status for all schedules
      await this.updateAllStatuses();

      this.lastSyncTime = new Date();

      // Log sync result
      await this.logSync({
        source: "binance-alpha",
        action: "schedule-sync",
        success: errors === 0,
        tokensCount: tokens.length,
        created,
        updated,
        errors,
        duration: Date.now() - startTime,
      });

      console.log(
        `✅ Schedule sync completed: ${created} created, ${updated} updated, ${errors} errors`,
      );

      return {
        success: errors === 0,
        created,
        updated,
        errors,
        source: "binance-alpha",
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("❌ Schedule sync failed:", error);

      await this.logSync({
        source: "binance-alpha",
        action: "schedule-sync",
        success: false,
        tokensCount: 0,
        created,
        updated,
        errors: errors + 1,
        duration: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        created,
        updated,
        errors: errors + 1,
        source: "binance-alpha",
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Add a manual schedule entry
   */
  async addManualSchedule(data: {
    token: string;
    name: string;
    scheduledTime: Date;
    endTime?: Date;
    points?: number;
    deductPoints?: number;
    amount?: string;
    chain?: string;
    contractAddress?: string;
    type?: AirdropType;
    estimatedPrice?: number;
    estimatedValue?: number;
    sourceUrl?: string;
    logoUrl?: string;
    description?: string;
  }): Promise<void> {
    const scheduleData: AirdropScheduleData = {
      token: data.token,
      name: data.name,
      scheduledTime: data.scheduledTime,
      endTime: data.endTime || null,
      points: data.points || null,
      deductPoints: data.deductPoints || null,
      amount: data.amount || null,
      chain: data.chain || "BSC",
      contractAddress: data.contractAddress || null,
      status: "UPCOMING",
      type: data.type || "AIRDROP",
      estimatedPrice: data.estimatedPrice || null,
      estimatedValue: data.estimatedValue || null,
      source: "manual",
      sourceUrl: data.sourceUrl || null,
      logoUrl: data.logoUrl || null,
      description: data.description || null,
      isActive: true,
      isVerified: false,
      notified: false,
    };

    await this.upsertSchedule(scheduleData);
  }

  /**
   * Update statuses for all schedules based on current time
   */
  async updateAllStatuses(): Promise<void> {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Update UPCOMING -> TODAY (scheduled for today, not yet time)
    await (prisma as any).airdropSchedule.updateMany({
      where: {
        status: "UPCOMING",
        scheduledTime: {
          gte: today,
          lt: tomorrow,
        },
        isActive: true,
      },
      data: {
        status: "TODAY",
      },
    });

    // Update TODAY/UPCOMING -> LIVE (time has passed)
    await (prisma as any).airdropSchedule.updateMany({
      where: {
        status: {
          in: ["UPCOMING", "TODAY"],
        },
        scheduledTime: {
          lte: now,
        },
        isActive: true,
      },
      data: {
        status: "LIVE",
      },
    });

    // Update LIVE -> ENDED (end time has passed)
    await (prisma as any).airdropSchedule.updateMany({
      where: {
        status: "LIVE",
        endTime: {
          lte: now,
        },
        isActive: true,
      },
      data: {
        status: "ENDED",
      },
    });
  }

  /**
   * Get schedules that need notifications
   */
  async getSchedulesForNotification(): Promise<AirdropScheduleData[]> {
    const now = new Date();
    const notificationWindow = new Date(now.getTime() + 20 * 60 * 1000); // 20 minutes ahead

    const schedules = await (prisma as any).airdropSchedule.findMany({
      where: {
        scheduledTime: {
          gte: now,
          lte: notificationWindow,
        },
        notified: false,
        isActive: true,
        status: {
          in: ["UPCOMING", "TODAY"],
        },
      },
      orderBy: {
        scheduledTime: "asc",
      },
    });

    return schedules.map((s: any) => ({
      id: s.id,
      token: s.token,
      name: s.name,
      scheduledTime: s.scheduledTime,
      endTime: s.endTime,
      points: s.points,
      deductPoints: s.deductPoints,
      amount: s.amount,
      chain: s.chain,
      contractAddress: s.contractAddress,
      status: s.status,
      type: s.type,
      estimatedPrice: s.estimatedPrice,
      estimatedValue: s.estimatedValue,
      source: s.source,
      sourceUrl: s.sourceUrl,
      logoUrl: s.logoUrl,
      description: s.description,
      isActive: s.isActive,
      isVerified: s.isVerified,
      notified: s.notified,
    }));
  }

  /**
   * Mark schedule as notified
   */
  async markAsNotified(id: string): Promise<void> {
    await (prisma as any).airdropSchedule.update({
      where: { id },
      data: { notified: true },
    });
  }

  /**
   * Delete old ended schedules (cleanup)
   */
  async cleanupOldSchedules(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await (prisma as any).airdropSchedule.deleteMany({
      where: {
        status: "ENDED",
        scheduledTime: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<{
    today: number;
    upcoming: number;
    live: number;
    ended: number;
    total: number;
  }> {
    const counts = await (prisma as any).airdropSchedule.groupBy({
      by: ["status"],
      where: { isActive: true },
      _count: { status: true },
    });

    const stats = {
      today: 0,
      upcoming: 0,
      live: 0,
      ended: 0,
      total: 0,
    };

    counts.forEach((c: any) => {
      const count = c._count.status;
      stats.total += count;
      switch (c.status) {
        case "TODAY":
          stats.today = count;
          break;
        case "UPCOMING":
          stats.upcoming = count;
          break;
        case "LIVE":
          stats.live = count;
          break;
        case "ENDED":
          stats.ended = count;
          break;
      }
    });

    return stats;
  }

  /**
   * Log sync operation
   */
  private async logSync(data: {
    source: string;
    action: string;
    success: boolean;
    tokensCount: number;
    created: number;
    updated: number;
    errors: number;
    duration: number;
    errorMessage?: string;
  }): Promise<void> {
    try {
      await (prisma as any).syncLog.create({
        data: {
          source: data.source,
          action: data.action,
          success: data.success,
          tokensCount: data.tokensCount,
          created: data.created,
          updated: data.updated,
          errors: data.errors,
          duration: data.duration,
          errorMessage: data.errorMessage,
        },
      });
    } catch (error) {
      console.error("Failed to log sync:", error);
    }
  }
}

/**
 * Export singleton instance
 */
export const airdropScheduleService = new AirdropScheduleService();
