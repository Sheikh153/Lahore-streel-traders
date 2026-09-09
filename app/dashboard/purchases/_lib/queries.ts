import "server-only";

import { prisma } from "@/app/lib/db";

export function getPurchases(search?: string) {
  return prisma.purchase.findMany({
    where: search
      ? {
          OR: [
            { lotId: { contains: search } },
            { contact: { name: { contains: search } } },
            { material: { name: { contains: search } } },
          ],
        }
      : undefined,
    include: {
      contact: true,
      material: true,
      payments: { select: { amount: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export function getPurchaseById(id: string) {
  return prisma.purchase.findUnique({
    where: { id },
    include: {
      contact: true,
      material: true,
      expenses: { orderBy: { createdAt: "desc" } },
      payments: { orderBy: { createdAt: "desc" } },
      attachments: { orderBy: { createdAt: "desc" } },
    },
  });
}
