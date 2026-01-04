import { prisma } from "./index";

async function main() {
  console.log("No seed data defined for Listmaker.");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
