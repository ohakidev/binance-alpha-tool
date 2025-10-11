/**
 * Database Export Script
 * Export airdrops from database to backup file
 *
 * Usage: pnpm db:export
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function exportAirdrops() {
  try {
    console.log("📊 Fetching airdrops from database...");

    const airdrops = await prisma.airdrop.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`✅ Found ${airdrops.length} airdrops`);

    // Parse JSON strings back to arrays
    const formattedAirdrops = airdrops.map((airdrop) => ({
      ...airdrop,
      eligibility: JSON.parse(airdrop.eligibility),
      requirements: JSON.parse(airdrop.requirements),
    }));

    // Create backups directory if it doesn't exist
    const backupsDir = path.join(process.cwd(), "data", "backups");
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
      console.log("📁 Created backups directory");
    }

    // Generate filename with date
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `airdrop-backup-${timestamp}.json`;
    const filePath = path.join(backupsDir, filename);

    // Write to file
    fs.writeFileSync(filePath, JSON.stringify(formattedAirdrops, null, 2));

    const fileSize = fs.statSync(filePath).size;
    const fileSizeKB = (fileSize / 1024).toFixed(2);

    console.log("\n✅ Export completed successfully!");
    console.log(`📄 File: ${filename}`);
    console.log(`📦 Size: ${fileSizeKB} KB`);
    console.log(`📂 Location: ${filePath}`);
  } catch (error) {
    console.error("❌ Export failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run export
exportAirdrops();
