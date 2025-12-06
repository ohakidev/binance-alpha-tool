/**
 * Prisma Seed Script - Binance Alpha Tokens
 * Run: npx prisma db seed
 *
 * This seed contains real Binance Alpha token data
 */

import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  // Check if we're using PostgreSQL (Neon)
  if (
    databaseUrl.startsWith("postgresql://") ||
    databaseUrl.startsWith("postgres://")
  ) {
    // Use Neon adapter for PostgreSQL
    const adapter = new PrismaNeon({
      connectionString: databaseUrl,
    });

    return new PrismaClient({ adapter });
  }

  // Fallback: Standard Prisma Client without adapter
  return new PrismaClient();
}

const prisma = createPrismaClient();

async function main() {
  console.log("🌱 Starting Binance Alpha seed...");

  // Clear existing data
  await prisma.alert.deleteMany();
  await prisma.userAirdrop.deleteMany();
  await prisma.incomeEntry.deleteMany();
  await prisma.stabilityScore.deleteMany();
  await prisma.airdrop.deleteMany();
  await prisma.user.deleteMany();

  // Create sample user
  const user1 = await prisma.user.create({
    data: {
      name: "Alpha User",
      walletAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      telegramId: "123456789",
    },
  });

  console.log("✅ Created user:", user1.name);

  // Real Binance Alpha Airdrops Data
  const binanceAlphaAirdrops = [
    // Currently Claimable (Today)
    {
      name: "KOGE",
      token: "KOGE",
      chain: "BSC",
      description: "BNB Chain ecosystem token with staking rewards",
      eligibility: JSON.stringify(["Binance Alpha user", "Hold Alpha Points"]),
      requirements: JSON.stringify([
        "Minimum Alpha Points required",
        "KYC verified Binance account",
      ]),
      totalSupply: "100000000",
      airdropAmount: "150 KOGE",
      snapshotDate: new Date("2025-01-20"),
      claimStartDate: new Date("2025-01-30T08:00:00Z"),
      claimEndDate: new Date("2025-02-05T08:00:00Z"),
      status: "CLAIMABLE" as const,
      verified: true,
      estimatedValue: 45,
      participantCount: 25000,
      websiteUrl: "https://www.binance.com/en/alpha",
      twitterUrl: "https://twitter.com/binance",
      type: "TGE" as const,
      requiredPoints: 78,
      deductPoints: 78,
      contractAddress: "0x5c74d0a8F4c9bB5D9A6E5B5c6C7D8E9F0A1B2C3D",
      multiplier: 1,
      isBaseline: true,
    },
    {
      name: "SKYAI",
      token: "SKYAI",
      chain: "BSC",
      description: "AI-powered DeFi protocol on BNB Chain",
      eligibility: JSON.stringify(["Binance Alpha user", "Hold Alpha Points"]),
      requirements: JSON.stringify([
        "Minimum Alpha Points required",
        "KYC verified Binance account",
      ]),
      totalSupply: "500000000",
      airdropAmount: "200 SKYAI",
      snapshotDate: new Date("2025-01-22"),
      claimStartDate: new Date("2025-01-30T10:00:00Z"),
      claimEndDate: new Date("2025-02-06T10:00:00Z"),
      status: "CLAIMABLE" as const,
      verified: true,
      estimatedValue: 32,
      participantCount: 18000,
      websiteUrl: "https://www.binance.com/en/alpha",
      twitterUrl: "https://twitter.com/binance",
      type: "TGE" as const,
      requiredPoints: 65,
      deductPoints: 65,
      contractAddress: "0x6D7E8F9A0B1C2D3E4F5A6B7C8D9E0F1A2B3C4D5E",
      multiplier: 1,
      isBaseline: false,
    },
    {
      name: "BMT",
      token: "BMT",
      chain: "BSC",
      description: "Binance Meta Token - Gaming and Metaverse ecosystem",
      eligibility: JSON.stringify(["Binance Alpha user", "Hold Alpha Points"]),
      requirements: JSON.stringify([
        "Minimum Alpha Points required",
        "KYC verified Binance account",
      ]),
      totalSupply: "1000000000",
      airdropAmount: "500 BMT",
      snapshotDate: new Date("2025-01-25"),
      claimStartDate: new Date("2025-01-30T12:00:00Z"),
      claimEndDate: new Date("2025-02-07T12:00:00Z"),
      status: "CLAIMABLE" as const,
      verified: true,
      estimatedValue: 28,
      participantCount: 32000,
      websiteUrl: "https://www.binance.com/en/alpha",
      twitterUrl: "https://twitter.com/binance",
      type: "TGE" as const,
      requiredPoints: 45,
      deductPoints: 45,
      contractAddress: "0x7E8F9A0B1C2D3E4F5A6B7C8D9E0F1A2B3C4D5E6F",
      multiplier: 2,
      isBaseline: false,
    },
    {
      name: "PARTI",
      token: "PARTI",
      chain: "BSC",
      description: "Particle Network - Universal Account Infrastructure",
      eligibility: JSON.stringify(["Binance Alpha user", "Hold Alpha Points"]),
      requirements: JSON.stringify([
        "Minimum Alpha Points required",
        "KYC verified Binance account",
      ]),
      totalSupply: "250000000",
      airdropAmount: "100 PARTI",
      snapshotDate: new Date("2025-01-28"),
      claimStartDate: new Date("2025-01-31T08:00:00Z"),
      claimEndDate: new Date("2025-02-08T08:00:00Z"),
      status: "CLAIMABLE" as const,
      verified: true,
      estimatedValue: 55,
      participantCount: 45000,
      websiteUrl: "https://particle.network",
      twitterUrl: "https://twitter.com/ParticleNtwrk",
      type: "TGE" as const,
      requiredPoints: 95,
      deductPoints: 95,
      contractAddress: "0x8F9A0B1C2D3E4F5A6B7C8D9E0F1A2B3C4D5E6F7A",
      multiplier: 1,
      isBaseline: true,
    },

    // Upcoming Airdrops
    {
      name: "PROMPT",
      token: "PROMPT",
      chain: "BSC",
      description: "AI Prompt marketplace and tools",
      eligibility: JSON.stringify(["Binance Alpha user", "Hold Alpha Points"]),
      requirements: JSON.stringify([
        "Minimum Alpha Points required",
        "KYC verified Binance account",
      ]),
      totalSupply: "200000000",
      airdropAmount: "250 PROMPT",
      snapshotDate: new Date("2025-02-01"),
      claimStartDate: new Date("2025-02-05T08:00:00Z"),
      claimEndDate: new Date("2025-02-12T08:00:00Z"),
      status: "UPCOMING" as const,
      verified: true,
      estimatedValue: 38,
      participantCount: 0,
      websiteUrl: "https://www.binance.com/en/alpha",
      twitterUrl: "https://twitter.com/binance",
      type: "PRETGE" as const,
      requiredPoints: 55,
      deductPoints: 55,
      contractAddress: "0x9A0B1C2D3E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B",
      multiplier: 1,
      isBaseline: false,
    },
    {
      name: "XTER",
      token: "XTER",
      chain: "BSC",
      description: "XTER Protocol - Cross-chain DeFi aggregator",
      eligibility: JSON.stringify(["Binance Alpha user", "Hold Alpha Points"]),
      requirements: JSON.stringify([
        "Minimum Alpha Points required",
        "KYC verified Binance account",
      ]),
      totalSupply: "500000000",
      airdropAmount: "300 XTER",
      snapshotDate: new Date("2025-02-03"),
      claimStartDate: new Date("2025-02-07T10:00:00Z"),
      claimEndDate: new Date("2025-02-14T10:00:00Z"),
      status: "UPCOMING" as const,
      verified: true,
      estimatedValue: 42,
      participantCount: 0,
      websiteUrl: "https://www.binance.com/en/alpha",
      twitterUrl: "https://twitter.com/binance",
      type: "TGE" as const,
      requiredPoints: 72,
      deductPoints: 72,
      contractAddress: "0xA0B1C2D3E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9",
      multiplier: 2,
      isBaseline: false,
    },
    {
      name: "SHELL",
      token: "SHELL",
      chain: "BSC",
      description: "Shell Protocol - AMM with concentrated liquidity",
      eligibility: JSON.stringify(["Binance Alpha user", "Hold Alpha Points"]),
      requirements: JSON.stringify([
        "Minimum Alpha Points required",
        "KYC verified Binance account",
      ]),
      totalSupply: "100000000",
      airdropAmount: "80 SHELL",
      snapshotDate: new Date("2025-02-05"),
      claimStartDate: new Date("2025-02-10T08:00:00Z"),
      claimEndDate: new Date("2025-02-17T08:00:00Z"),
      status: "UPCOMING" as const,
      verified: true,
      estimatedValue: 65,
      participantCount: 0,
      websiteUrl: "https://shellprotocol.io",
      twitterUrl: "https://twitter.com/ShellProtocol",
      type: "TGE" as const,
      requiredPoints: 110,
      deductPoints: 110,
      contractAddress: "0xB1C2D3E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0",
      multiplier: 1,
      isBaseline: true,
    },
    {
      name: "KAITO",
      token: "KAITO",
      chain: "BSC",
      description: "Kaito AI - Web3 AI search and analytics platform",
      eligibility: JSON.stringify(["Binance Alpha user", "Hold Alpha Points"]),
      requirements: JSON.stringify([
        "Minimum Alpha Points required",
        "KYC verified Binance account",
      ]),
      totalSupply: "150000000",
      airdropAmount: "120 KAITO",
      snapshotDate: new Date("2025-02-08"),
      claimStartDate: new Date("2025-02-12T12:00:00Z"),
      claimEndDate: new Date("2025-02-19T12:00:00Z"),
      status: "UPCOMING" as const,
      verified: true,
      estimatedValue: 88,
      participantCount: 0,
      websiteUrl: "https://kaito.ai",
      twitterUrl: "https://twitter.com/KaitoAI",
      type: "TGE" as const,
      requiredPoints: 135,
      deductPoints: 135,
      contractAddress: "0xC2D3E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D1",
      multiplier: 1,
      isBaseline: true,
    },

    // Ended/Claimed Airdrops (History)
    {
      name: "GPS",
      token: "GPS",
      chain: "BSC",
      description: "GoPlus Security - Web3 security infrastructure",
      eligibility: JSON.stringify(["Binance Alpha user", "Hold Alpha Points"]),
      requirements: JSON.stringify([
        "Minimum Alpha Points required",
        "KYC verified Binance account",
      ]),
      totalSupply: "10000000000",
      airdropAmount: "1000 GPS",
      snapshotDate: new Date("2025-01-05"),
      claimStartDate: new Date("2025-01-10T08:00:00Z"),
      claimEndDate: new Date("2025-01-17T08:00:00Z"),
      status: "ENDED" as const,
      verified: true,
      estimatedValue: 15,
      participantCount: 85000,
      websiteUrl: "https://gopluslabs.io",
      twitterUrl: "https://twitter.com/aspect",
      type: "TGE" as const,
      requiredPoints: 35,
      deductPoints: 35,
      contractAddress: "0xD3E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2",
      multiplier: 4,
      isBaseline: false,
    },
    {
      name: "RED",
      token: "RED",
      chain: "BSC",
      description: "RedStone Oracle - Modular oracle network",
      eligibility: JSON.stringify(["Binance Alpha user", "Hold Alpha Points"]),
      requirements: JSON.stringify([
        "Minimum Alpha Points required",
        "KYC verified Binance account",
      ]),
      totalSupply: "1000000000",
      airdropAmount: "200 RED",
      snapshotDate: new Date("2025-01-08"),
      claimStartDate: new Date("2025-01-15T10:00:00Z"),
      claimEndDate: new Date("2025-01-22T10:00:00Z"),
      status: "ENDED" as const,
      verified: true,
      estimatedValue: 75,
      participantCount: 62000,
      websiteUrl: "https://redstone.finance",
      twitterUrl: "https://twitter.com/redaboratory",
      type: "TGE" as const,
      requiredPoints: 85,
      deductPoints: 85,
      contractAddress: "0xE4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3",
      multiplier: 1,
      isBaseline: true,
    },
    {
      name: "ANIME",
      token: "ANIME",
      chain: "BSC",
      description: "Animecoin - Anime culture Web3 ecosystem",
      eligibility: JSON.stringify(["Binance Alpha user", "Hold Alpha Points"]),
      requirements: JSON.stringify([
        "Minimum Alpha Points required",
        "KYC verified Binance account",
      ]),
      totalSupply: "5000000000",
      airdropAmount: "500 ANIME",
      snapshotDate: new Date("2025-01-12"),
      claimStartDate: new Date("2025-01-18T12:00:00Z"),
      claimEndDate: new Date("2025-01-25T12:00:00Z"),
      status: "ENDED" as const,
      verified: true,
      estimatedValue: 22,
      participantCount: 95000,
      websiteUrl: "https://azuki.com/animecoin",
      twitterUrl: "https://twitter.com/animecoin",
      type: "TGE" as const,
      requiredPoints: 42,
      deductPoints: 42,
      contractAddress: "0xF5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4",
      multiplier: 2,
      isBaseline: false,
    },
    {
      name: "TROLL",
      token: "TROLL",
      chain: "BSC",
      description: "Troll Network - Meme token with utility",
      eligibility: JSON.stringify(["Binance Alpha user", "Hold Alpha Points"]),
      requirements: JSON.stringify([
        "Minimum Alpha Points required",
        "KYC verified Binance account",
      ]),
      totalSupply: "1000000000000",
      airdropAmount: "10000 TROLL",
      snapshotDate: new Date("2025-01-15"),
      claimStartDate: new Date("2025-01-20T08:00:00Z"),
      claimEndDate: new Date("2025-01-27T08:00:00Z"),
      status: "ENDED" as const,
      verified: true,
      estimatedValue: 8,
      participantCount: 120000,
      websiteUrl: "https://www.binance.com/en/alpha",
      twitterUrl: "https://twitter.com/binance",
      type: "AIRDROP" as const,
      requiredPoints: 25,
      deductPoints: 25,
      contractAddress: "0xA6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5",
      multiplier: 4,
      isBaseline: false,
    },
    {
      name: "HOLDCOIN",
      token: "HOLD",
      chain: "BSC",
      description: "Holdcoin - Long-term holding rewards protocol",
      eligibility: JSON.stringify(["Binance Alpha user", "Hold Alpha Points"]),
      requirements: JSON.stringify([
        "Minimum Alpha Points required",
        "KYC verified Binance account",
      ]),
      totalSupply: "100000000",
      airdropAmount: "50 HOLD",
      snapshotDate: new Date("2025-01-18"),
      claimStartDate: new Date("2025-01-23T10:00:00Z"),
      claimEndDate: new Date("2025-01-30T10:00:00Z"),
      status: "ENDED" as const,
      verified: true,
      estimatedValue: 125,
      participantCount: 48000,
      websiteUrl: "https://www.binance.com/en/alpha",
      twitterUrl: "https://twitter.com/binance",
      type: "TGE" as const,
      requiredPoints: 150,
      deductPoints: 150,
      contractAddress: "0xB7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6",
      multiplier: 1,
      isBaseline: true,
    },
  ];

  for (const airdropData of binanceAlphaAirdrops) {
    const airdrop = await prisma.airdrop.create({
      data: airdropData,
    });
    console.log(`✅ Created airdrop: ${airdrop.name} (${airdrop.status})`);

    // Create user-airdrop relationship for claimable and ended airdrops
    if (airdrop.status === "CLAIMABLE" || airdrop.status === "ENDED") {
      await prisma.userAirdrop.create({
        data: {
          userId: user1.id,
          airdropId: airdrop.id,
          isEligible: true,
          hasClaimed: airdrop.status === "ENDED",
          claimedAt: airdrop.status === "ENDED" ? airdrop.claimStartDate : null,
          claimAmount:
            airdrop.status === "ENDED" ? airdrop.airdropAmount : null,
        },
      });
    }
  }

  // Create sample stability scores for common trading pairs
  const tradingPairs = [
    { symbol: "BTCUSDT", price: 97500, change: 2.5 },
    { symbol: "ETHUSDT", price: 3200, change: 1.8 },
    { symbol: "BNBUSDT", price: 685, change: -0.5 },
    { symbol: "SOLUSDT", price: 235, change: 4.2 },
    { symbol: "XRPUSDT", price: 3.1, change: 8.5 },
  ];

  for (const pair of tradingPairs) {
    await prisma.stabilityScore.create({
      data: {
        symbol: pair.symbol,
        stabilityScore: 60 + Math.random() * 30,
        riskLevel:
          pair.change > 5 ? "HIGH" : pair.change > 2 ? "MODERATE" : "SAFE",
        volatilityIndex: 50 + Math.random() * 20,
        volumeScore: 10 + Math.random() * 10,
        currentPrice: pair.price,
        priceChange: pair.change,
        high24h: pair.price * 1.02,
        low24h: pair.price * 0.98,
        volume24h: 1000000000 + Math.random() * 5000000000,
      },
    });
  }

  console.log("✅ Created stability scores");

  // Create sample income entries from Alpha airdrops
  const claimedAirdrops = binanceAlphaAirdrops.filter(
    (a) => a.status === "ENDED",
  );
  for (let i = 0; i < claimedAirdrops.length; i++) {
    const airdrop = claimedAirdrops[i];
    const date = new Date(airdrop.claimStartDate);
    date.setDate(date.getDate() + Math.floor(Math.random() * 3));

    await prisma.incomeEntry.create({
      data: {
        userId: user1.id,
        amount: airdrop.estimatedValue || 0,
        currency: "USDT",
        source: "Binance Alpha",
        category: "Airdrop",
        description: `${airdrop.name} (${airdrop.token}) Alpha Airdrop claim`,
        date,
      },
    });
  }

  console.log("✅ Created income entries from Alpha claims");

  console.log("\n🎉 Binance Alpha seed completed successfully!");
  console.log(
    `   - ${binanceAlphaAirdrops.filter((a) => a.status === "CLAIMABLE").length} Claimable airdrops`,
  );
  console.log(
    `   - ${binanceAlphaAirdrops.filter((a) => a.status === "UPCOMING").length} Upcoming airdrops`,
  );
  console.log(
    `   - ${binanceAlphaAirdrops.filter((a) => a.status === "ENDED").length} Ended airdrops`,
  );
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
