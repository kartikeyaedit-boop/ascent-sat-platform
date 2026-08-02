import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

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
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
