/**
 * Database Import Script
 * Import airdrops from backup file to database
 *
 * Usage: pnpm db:import [backup-file]
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

interface AirdropBackup {
  token: string;
  name: string;
  [key: string]: any;
}

async function importAirdrops(backupFile?: string) {
  try {
    const backupsDir = path.join(process.cwd(), "data", "backups");

    // Ensure backups directory exists
    if (!fs.existsSync(backupsDir)) {
      console.error("❌ Backups directory not found: data/backups");
      console.log("💡 Create directory: mkdir -p data/backups");
      process.exit(1);
    }

    let filePath: string;

    if (backupFile) {
      filePath = path.join(backupsDir, backupFile);
    } else {
      // Find the latest backup file
      const files = fs
        .readdirSync(backupsDir)
        .filter((f) => f.startsWith("airdrop-backup-") && f.endsWith(".json"))
        .sort()
        .reverse();

      if (files.length === 0) {
        console.error("❌ No backup files found in data/backups");
        process.exit(1);
      }

      filePath = path.join(backupsDir, files[0]);
      console.log(`📂 Using latest backup: ${files[0]}`);
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Backup file not found: ${filePath}`);
      process.exit(1);
    }

    // Read and parse backup file
    console.log(`📖 Reading backup file...`);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const airdrops: AirdropBackup[] = JSON.parse(fileContent);

    if (!Array.isArray(airdrops)) {
      console.error("❌ Invalid backup file format (expected array)");
      process.exit(1);
    }

    console.log(`📊 Found ${airdrops.length} airdrops in backup`);

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const airdrop of airdrops) {
      try {
        // Check if already exists
        const existing = await prisma.airdrop.findFirst({
          where: { symbol: airdrop.symbol },
        });

        if (existing) {
          console.log(`⏭️  Skipped (exists): ${airdrop.symbol}`);
          skipped++;
          continue;
        }

        // Prepare data
        const data: any = {
          ...airdrop,
          eligibility: Array.isArray(airdrop.eligibility)
            ? JSON.stringify(airdrop.eligibility)
            : airdrop.eligibility || "[]",
          requirements: Array.isArray(airdrop.requirements)
            ? JSON.stringify(airdrop.requirements)
            : airdrop.requirements || "[]",
          snapshotDate: airdrop.snapshotDate ? new Date(airdrop.snapshotDate) : null,
          claimStartDate: airdrop.claimStartDate
            ? new Date(airdrop.claimStartDate)
            : null,
          claimEndDate: airdrop.claimEndDate ? new Date(airdrop.claimEndDate) : null,
          listingDate: airdrop.listingDate ? new Date(airdrop.listingDate) : null,
        };

        // Remove fields that shouldn't be imported
        delete data.id;
        delete data.createdAt;
        delete data.updatedAt;

        await prisma.airdrop.create({ data });
        console.log(`✅ Imported: ${airdrop.token} (${airdrop.name})`);
        imported++;
      } catch (error) {
        console.error(`❌ Failed to import ${airdrop.token}:`, error);
        errors++;
      }
    }

    console.log("\n📊 Import Summary:");
    console.log(`   ✅ Imported: ${imported}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);

    if (imported > 0) {
      console.log("\n🎉 Import completed successfully!");
    }
  } catch (error) {
    console.error("❌ Import failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run import
const backupFile = process.argv[2];
importAirdrops(backupFile);
