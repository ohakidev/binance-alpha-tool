/**
 * Backup & Restore Utility
 * Handle data export/import for users and income entries
 */

import { z } from "zod";
import { User, IncomeEntry, UserSettings } from "@/lib/types";

// Backup data schema - using loose validation for flexibility
const BackupSchema = z.object({
  version: z.string(),
  timestamp: z.string(),
  data: z.object({
    users: z.array(z.any()),
    entries: z.array(z.any()),
    settings: z.any().optional(),
  }),
  metadata: z.object({
    totalUsers: z.number(),
    totalEntries: z.number(),
    estimatedSize: z.number(),
  }),
});

export type BackupData = z.infer<typeof BackupSchema>;

/**
 * Create backup from current state
 */
export function createBackup(
  users: User[],
  entries: IncomeEntry[],
  settings?: UserSettings
): BackupData {
  const timestamp = new Date().toISOString();
  const data = { users, entries, settings };
  const json = JSON.stringify(data);
  const estimatedSize = new Blob([json]).size;

  return {
    version: "1.0.0",
    timestamp,
    data,
    metadata: {
      totalUsers: users.length,
      totalEntries: entries.length,
      estimatedSize,
    },
  };
}

/**
 * Validate backup data
 */
export function validateBackup(data: unknown): {
  valid: boolean;
  error?: string;
  data?: BackupData;
} {
  try {
    const parsed = BackupSchema.parse(data);
    return { valid: true, data: parsed };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        error: error.issues[0]?.message || "Invalid backup format",
      };
    }
    return { valid: false, error: "Invalid backup data" };
  }
}

/**
 * Download backup as JSON file
 */
export function downloadBackup(backup: BackupData) {
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  const filename = `binance-alpha-backup-${
    new Date().toISOString().split("T")[0]
  }.json`;
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

/**
 * Read backup file
 */
export function readBackupFile(file: File): Promise<BackupData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);
        const validation = validateBackup(data);

        if (validation.valid && validation.data) {
          resolve(validation.data);
        } else {
          reject(new Error(validation.error || "Invalid backup"));
        }
      } catch {
        reject(new Error("Failed to parse backup file"));
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Compare backup with current data
 */
export function compareBackup(
  backup: BackupData,
  currentUsers: User[],
  currentEntries: IncomeEntry[]
): {
  usersDiff: { added: number; removed: number; total: number };
  entriesDiff: { added: number; removed: number; total: number };
} {
  // Type assertion for backup data
  const backupUsers = backup.data.users as unknown as User[];
  const backupEntries = backup.data.entries as unknown as IncomeEntry[];

  const backupUserIds = new Set(backupUsers.map((u) => u.id));
  const currentUserIds = new Set(currentUsers.map((u) => u.id));

  const backupEntryIds = new Set(backupEntries.map((e) => e.id));
  const currentEntryIds = new Set(currentEntries.map((e) => e.id));

  return {
    usersDiff: {
      added: backupUsers.filter((u) => !currentUserIds.has(u.id)).length,
      removed: currentUsers.filter((u) => !backupUserIds.has(u.id)).length,
      total: backupUsers.length,
    },
    entriesDiff: {
      added: backupEntries.filter((e) => !currentEntryIds.has(e.id)).length,
      removed: currentEntries.filter((e) => !backupEntryIds.has(e.id)).length,
      total: backupEntries.length,
    },
  };
}

/**
 * Export data as CSV
 */
export function exportToCSV(entries: IncomeEntry[]): void {
  if (entries.length === 0) {
    throw new Error("No data to export");
  }

  // CSV headers
  const headers = ["Date", "User", "Project", "Amount", "Category", "Notes"];

  // CSV rows
  const rows = entries.map((entry) => [
    new Date(entry.date).toLocaleDateString(),
    entry.userId,
    entry.projectName,
    entry.amount,
    entry.category,
    (entry.notes || "").replace(/"/g, '""'), // Escape quotes
  ]);

  // Build CSV
  const csv = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  // Download
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  const filename = `binance-alpha-entries-${
    new Date().toISOString().split("T")[0]
  }.csv`;
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}
