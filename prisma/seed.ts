/**
 * Prisma Seed Script
 * Run: npx prisma db seed
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Clear existing data (ในการพัฒนาเท่านั้น)
  await prisma.alert.deleteMany();
  await prisma.userAirdrop.deleteMany();
  await prisma.incomeEntry.deleteMany();
  await prisma.stabilityScore.deleteMany();
  await prisma.airdrop.deleteMany();
  await prisma.user.deleteMany();

  // Create sample users
  const user1 = await prisma.user.create({
    data: {
      name: "Demo User",
      walletAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      telegramId: "123456789",
    },
  });

  console.log("✅ Created user:", user1.name);

  // Create sample airdrops
  const airdrops = [
    {
      name: "ZetaChain Protocol",
      symbol: "ZETA",
      chain: "BNB Chain",
      description:
        "Universal blockchain and smart contract platform enabling omnichain dApps",
      logoUrl: "https://cryptologos.cc/logos/zetachain-zeta-logo.png",
      eligibility: JSON.stringify(["Early adopter", "Testnet participant"]),
      requirements: JSON.stringify([
        "Complete at least 5 cross-chain transactions",
        "Hold minimum 0.1 BNB",
        "Connect wallet before snapshot",
      ]),
      totalSupply: "2100000000",
      airdropAmount: "500 ZETA",
      snapshotDate: new Date("2025-01-15"),
      claimStartDate: new Date("2025-02-01"),
      claimEndDate: new Date("2025-03-31"),
      status: "UPCOMING" as const,
      verified: true,
      estimatedValue: 250,
      participantCount: 50000,
      websiteUrl: "https://www.zetachain.com",
      twitterUrl: "https://twitter.com/zetablockchain",
    },
    {
      name: "Starknet",
      symbol: "STRK",
      chain: "Ethereum",
      description:
        "Decentralized ZK-Rollup operating as an L2 network over Ethereum",
      logoUrl: "https://cryptologos.cc/logos/starknet-strk-logo.png",
      eligibility: JSON.stringify(["Starknet user", "Developer"]),
      requirements: JSON.stringify([
        "Made at least 3 transactions on Starknet",
        "Deployed a smart contract",
        "Active during the snapshot period",
      ]),
      totalSupply: "10000000000",
      airdropAmount: "1000 STRK",
      snapshotDate: new Date("2024-12-20"),
      claimStartDate: new Date("2025-01-10"),
      claimEndDate: new Date("2025-06-30"),
      status: "CLAIMABLE" as const,
      verified: true,
      estimatedValue: 800,
      participantCount: 1000000,
      websiteUrl: "https://www.starknet.io",
      twitterUrl: "https://twitter.com/StarkNetEco",
    },
    {
      name: "LayerZero",
      symbol: "LZ",
      chain: "Multichain",
      description:
        "Omnichain interoperability protocol for cross-chain messaging",
      logoUrl: "https://cryptologos.cc/logos/layerzero-lz-logo.png",
      eligibility: JSON.stringify(["Multichain user", "Bridge user"]),
      requirements: JSON.stringify([
        "Used LayerZero protocol on at least 3 different chains",
        "Minimum $500 total transaction volume",
        "No sybil behavior detected",
      ]),
      totalSupply: "1000000000",
      airdropAmount: "300 LZ",
      snapshotDate: new Date("2025-01-05"),
      claimStartDate: new Date("2025-02-15"),
      claimEndDate: new Date("2025-05-15"),
      status: "SNAPSHOT" as const,
      verified: true,
      estimatedValue: 600,
      participantCount: 250000,
      websiteUrl: "https://layerzero.network",
      twitterUrl: "https://twitter.com/LayerZero_Labs",
    },
    {
      name: "zkSync Era",
      symbol: "ZKS",
      chain: "zkSync",
      description: "zkEVM Layer 2 scaling solution for Ethereum",
      logoUrl: "https://cryptologos.cc/logos/zksync-zks-logo.png",
      eligibility: JSON.stringify(["zkSync user", "Liquidity provider"]),
      requirements: JSON.stringify([
        "Hold assets on zkSync for minimum 30 days",
        "Made at least 10 transactions",
        "Provided liquidity in any zkSync DEX",
      ]),
      totalSupply: "21000000000",
      airdropAmount: "2000 ZKS",
      snapshotDate: new Date("2025-02-01"),
      claimStartDate: new Date("2025-03-01"),
      claimEndDate: new Date("2025-12-31"),
      status: "UPCOMING" as const,
      verified: true,
      estimatedValue: 1500,
      participantCount: 500000,
      websiteUrl: "https://zksync.io",
      twitterUrl: "https://twitter.com/zksync",
    },
    {
      name: "Polygon zkEVM",
      symbol: "POL",
      chain: "Polygon",
      description: "Zero-knowledge Ethereum Virtual Machine by Polygon",
      logoUrl: "https://cryptologos.cc/logos/polygon-matic-logo.png",
      eligibility: JSON.stringify(["Polygon user", "Early adopter"]),
      requirements: JSON.stringify([
        "Minimum 5 transactions on Polygon zkEVM",
        "Hold MATIC tokens",
        "Interact with at least 2 dApps",
      ]),
      totalSupply: "10000000000",
      airdropAmount: "500 POL",
      snapshotDate: new Date("2024-12-01"),
      claimStartDate: new Date("2024-12-15"),
      claimEndDate: new Date("2025-01-15"),
      status: "ENDED" as const,
      verified: true,
      estimatedValue: 300,
      participantCount: 750000,
      websiteUrl: "https://polygon.technology",
      twitterUrl: "https://twitter.com/0xPolygon",
    },
  ];

  for (const airdropData of airdrops) {
    const airdrop = await prisma.airdrop.create({
      data: airdropData,
    });
    console.log("✅ Created airdrop:", airdrop.name);

    // Create user-airdrop relationship for first 3 airdrops
    if (airdrops.indexOf(airdropData) < 3) {
      await prisma.userAirdrop.create({
        data: {
          userId: user1.id,
          airdropId: airdrop.id,
          isEligible: true,
        },
      });
    }
  }

  // Create sample stability scores
  const symbols = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT"];
  for (const symbol of symbols) {
    await prisma.stabilityScore.create({
      data: {
        symbol,
        stabilityScore: 60 + Math.random() * 30,
        riskLevel: "MODERATE",
        volatilityIndex: 50 + Math.random() * 20,
        volumeScore: 10 + Math.random() * 10,
        currentPrice: 1000 + Math.random() * 50000,
        priceChange: -5 + Math.random() * 10,
        high24h: 1000 + Math.random() * 50000,
        low24h: 1000 + Math.random() * 50000,
        volume24h: 1000000 + Math.random() * 10000000,
      },
    });
  }

  console.log("✅ Created stability scores");

  // Create sample income entries
  const incomeCategories = [
    "Staking",
    "Trading",
    "Airdrop",
    "Farming",
    "NFT Sale",
  ];
  for (let i = 0; i < 10; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    await prisma.incomeEntry.create({
      data: {
        userId: user1.id,
        amount: 10 + Math.random() * 500,
        currency: "USDT",
        source: "Binance",
        category:
          incomeCategories[Math.floor(Math.random() * incomeCategories.length)],
        description: `Income from crypto activities - Day ${i + 1}`,
        date,
      },
    });
  }

  console.log("✅ Created income entries");

  console.log("🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
