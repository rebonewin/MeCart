import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminUsername = process.env.ADMIN_USERNAME ?? "A153TA";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "Welcome@Port153";
  const adminHashed = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { username: adminUsername },
    update: { password: adminHashed, role: "ADMIN", deletedAt: null },
    create: {
      username: adminUsername,
      email: `${adminUsername.toLowerCase()}@mecart.local`,
      name: "Administrator",
      password: adminHashed,
      role: "ADMIN",
    },
  });

  const customerUsername = process.env.CUSTOMER_USERNAME ?? "customer01";
  const customerPassword = process.env.CUSTOMER_PASSWORD ?? "Welcome@Customer153";
  const customerHashed = await bcrypt.hash(customerPassword, 12);

  await prisma.user.upsert({
    where: { username: customerUsername },
    update: {
      password: customerHashed,
      role: "USER",
      email: process.env.CUSTOMER_EMAIL ?? "customer@mecart.demo",
      name: "Demo Customer",
      deletedAt: null,
    },
    create: {
      username: customerUsername,
      email: process.env.CUSTOMER_EMAIL ?? "customer@mecart.demo",
      name: "Demo Customer",
      password: customerHashed,
      role: "USER",
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
