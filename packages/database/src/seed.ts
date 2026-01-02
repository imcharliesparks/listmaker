import { prisma } from "./index";

async function main() {
  console.log("🌱 Seeding database...");

  // Create some sample matches
  const match1 = await prisma.match.create({
    data: {
      name: "Championship Finals",
      description: "Epic showdown between the top two teams",
      homeTeam: "Warriors",
      awayTeam: "Dragons",
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      status: "UPCOMING",
      homeOdds: 1.85,
      awayOdds: 2.10,
      drawOdds: 3.20,
    },
  });

  const match2 = await prisma.match.create({
    data: {
      name: "Season Opener",
      description: "Start of the new season",
      homeTeam: "Eagles",
      awayTeam: "Lions",
      startTime: new Date(Date.now() + 48 * 60 * 60 * 1000), // In 2 days
      status: "UPCOMING",
      homeOdds: 2.00,
      awayOdds: 1.90,
      drawOdds: 3.00,
    },
  });

  const match3 = await prisma.match.create({
    data: {
      name: "Derby Match",
      description: "Local rivals face off",
      homeTeam: "Tigers",
      awayTeam: "Panthers",
      startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // In 3 days
      status: "UPCOMING",
      homeOdds: 2.20,
      awayOdds: 1.75,
      drawOdds: 3.50,
    },
  });

  console.log("✅ Created sample matches:", { match1, match2, match3 });
  console.log("🎉 Seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
