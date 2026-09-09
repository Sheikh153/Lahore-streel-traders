import "server-only";

import { prisma } from "@/app/lib/db";

export function getContacts(search?: string) {
  return prisma.contact.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search } },
            { cnic: { contains: search } },
            { phone: { contains: search } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
  });
}

/** Contacts with how many purchases+sales they've had — repeat business
 * (2+ transactions) is the signal of a "good," recurring customer. */
export async function getContactsWithActivity(search?: string) {
  const contacts = await prisma.contact.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search } },
            { cnic: { contains: search } },
            { phone: { contains: search } },
          ],
        }
    : undefined,
    include: {
      _count: { select: { purchases: true, sales: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return contacts.map((c) => ({
    ...c,
    transactions: c._count.purchases + c._count.sales,
  }));
}

export function getContactById(id: string) {
  return prisma.contact.findUnique({ where: { id } });
}

/** For dropdowns — filtered by which side of a deal they can appear on. */
export function getContactsForSelect(role: "supplier" | "buyer") {
  return prisma.contact.findMany({
    where: { OR: [{ type: role }, { type: "both" }] },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}
