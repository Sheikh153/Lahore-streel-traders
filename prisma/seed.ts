import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
});
const prisma = new PrismaClient({ adapter });

const PARTNER_NAMES = ["Haji Sahab", "Subhan Madir Sohail"];

// Only seeds the first login and the two business partners — no demo
// contacts/materials/purchases/sales. This is a real business's data now;
// add your own through the app.
async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@scrapbusiness.local").toLowerCase();
  const name = process.env.SEED_ADMIN_NAME ?? "Admin";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash },
    create: { email, name, passwordHash },
  });
  console.log(`Seeded admin user: ${user.email}`);

  for (const partnerName of PARTNER_NAMES) {
    await prisma.partner.upsert({
      where: { name: partnerName },
      update: {},
      create: { name: partnerName },
    });
  }
  console.log(`Seeded partners: ${PARTNER_NAMES.join(", ")}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
