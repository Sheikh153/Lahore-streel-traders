import "server-only";

import { prisma } from "@/app/lib/db";

export function getSales(search?: string) {
  return prisma.sale.findMany({
    where: search
      ? {
          OR: [
            { saleRef: { contains: search } },
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
    orderBy: { date: "desc" },
  });
}

export function getSaleById(id: string) {
  return prisma.sale.findUnique({
    where: { id },
    include: {
      contact: true,
      material: true,
      purchase: { select: { lotId: true } },
      expenses: { orderBy: { createdAt: "desc" } },
      payments: { orderBy: { createdAt: "desc" } },
      attachments: { orderBy: { createdAt: "desc" } },
    },
  });
}
