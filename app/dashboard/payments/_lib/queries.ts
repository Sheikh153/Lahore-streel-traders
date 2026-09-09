import "server-only";

import { prisma } from "@/app/lib/db";

export function getAllPayments() {
  return prisma.payment.findMany({
    include: {
      contact: true,
      purchase: { select: { lotId: true } },
      sale: { select: { saleRef: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
