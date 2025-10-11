/**
 * List Backup Files Script
 * List all available backup files
 *
 * Usage: pnpm db:list-backups
 */

import * as fs from "fs";
import * as path from "path";

function listBackups() {
  try {
    const backupsDir = path.join(process.cwd(), "data", "backups");

    // Check if directory exists
    if (!fs.existsSync(backupsDir)) {
      console.log("📂 Backups directory not found: data/backups");
      console.log("💡 Create directory: mkdir -p data/backups");
      return;
    }

    // Get all backup files
    const files = fs
      .readdirSync(backupsDir)
      .filter((f) => f.startsWith("airdrop-backup-") && f.endsWith(".json"))
      .sort()
      .reverse();

    if (files.length === 0) {
      console.log("📭 No backup files found");
      return;
    }

    console.log(`📚 Found ${files.length} backup file(s):\n`);

    files.forEach((file, index) => {
      const filePath = path.join(backupsDir, file);
      const stats = fs.statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      const date = new Date(stats.mtime).toLocaleString();

      // Extract date from filename
      const match = file.match(/airdrop-backup-(\d{4}-\d{2}-\d{2})\.json/);
      const backupDate = match ? match[1] : "unknown";

      console.log(`${index + 1}. ${file}`);
      console.log(`   📅 Date: ${backupDate}`);
      console.log(`   📦 Size: ${sizeKB} KB`);
      console.log(`   🕒 Modified: ${date}`);
      console.log("");
    });

    console.log("💡 Import latest: pnpm db:import");
    console.log(`💡 Import specific: pnpm db:import ${files[0]}`);
  } catch (error) {
    console.error("❌ Error listing backups:", error);
    process.exit(1);
  }
}

// Run list
listBackups();
