import { PrismaClient } from "../generated/prisma";

async function main() {
  const prisma = new PrismaClient();
  await prisma.$connect();
  try {
    const existing = await prisma.user.findFirst({ where: { email: "admin@example.com" } });
    if (!existing) {
      await prisma.user.create({ data: { name: "Admin", email: "admin@example.com", isActive: true } });
      console.log("Seeded admin@example.com");
    } else {
      console.log("Admin already exists");
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
