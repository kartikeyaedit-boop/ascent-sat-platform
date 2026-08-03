import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ACHIEVEMENTS } from "../src/server/gamification/achievements";
import { SHOP_ITEMS } from "../src/server/gamification/shop-items";

const prisma = new PrismaClient();

async function main() {
  const adminPasswordHash = await bcrypt.hash("Admin123!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@satplatform.dev" },
    update: {},
    create: {
      email: "admin@satplatform.dev",
      name: "Admin",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      emailVerified: true,
    },
  });

  const studentPasswordHash = await bcrypt.hash("Student123!", 12);
  const student = await prisma.user.upsert({
    where: { email: "student@satplatform.dev" },
    update: {},
    create: {
      email: "student@satplatform.dev",
      name: "Demo Student",
      passwordHash: studentPasswordHash,
      role: "STUDENT",
      emailVerified: true,
    },
  });

  console.log("Seeded users:", { admin: admin.email, student: student.email });

  // Pre-populate the full achievement/shop catalogs so the achievements and
  // store pages have something to list even before anyone unlocks/buys
  // anything — the gamification services also lazily upsert these by key
  // on first unlock/purchase, so this is a convenience, not a dependency.
  for (const a of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { key: a.key },
      update: { name: a.name, description: a.description, icon: a.icon, xpReward: a.xpReward, coinReward: a.coinReward },
      create: { key: a.key, name: a.name, description: a.description, icon: a.icon, xpReward: a.xpReward, coinReward: a.coinReward },
    });
  }
  for (const item of SHOP_ITEMS) {
    await prisma.shopItem.upsert({
      where: { key: item.key },
      update: { name: item.name, category: item.category, emoji: item.emoji, rarity: item.rarity, price: item.price },
      create: { key: item.key, name: item.name, category: item.category, emoji: item.emoji, rarity: item.rarity, price: item.price },
    });
  }
  console.log(`Seeded ${ACHIEVEMENTS.length} achievements and ${SHOP_ITEMS.length} shop items.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
