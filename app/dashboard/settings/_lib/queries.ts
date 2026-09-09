import "server-only";

import { prisma } from "@/app/lib/db";

/** The settings row always exists once read — created with defaults on first access. */
export async function getCompanySettings() {
  return prisma.companySettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });
}

export function getTeamMembers() {
  return prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, createdAt: true },
  });
}
