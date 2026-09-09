import "server-only";

import { prisma } from "@/app/lib/db";
import { deriveStatus } from "@/app/dashboard/_lib/balances";
import type { RecentActivityItem } from "@/app/dashboard/_components/RecentTransactions";

export type RecordFilter = "all" | "purchase" | "sale";

export async function getRecords(search?: string, filter: RecordFilter = "all") {
  const contactMaterialWhere = search
    ? {
        OR: [
          { contact: { name: { contains: search } } },
          { material: { name: { contains: search } } },
        ],
      }
    : undefined;

  const [purchases, sales] = await Promise.all([
    filter === "sale"
      ? []
      : prisma.purchase.findMany({
          where: search
            ? { OR: [{ lotId: { contains: search } }, ...(contactMaterialWhere?.OR ?? [])] }
            : undefined,
          include: { contact: true, material: true, payments: { select: { amount: true } } },
          orderBy: { createdAt: "desc" },
        }),
    filter === "purchase"
      ? []
      : prisma.sale.findMany({
          where: search
            ? { OR: [{ saleRef: { contains: search } }, ...(contactMaterialWhere?.OR ?? [])] }
            : undefined,
          include: { contact: true, material: true, payments: { select: { amount: true } } },
          orderBy: { createdAt: "desc" },
        }),
  ]);

  const items: RecentActivityItem[] = [
    ...purchases.map((p) => ({
      id: p.id,
      type: "purchase" as const,
      ref: p.lotId,
      date: p.createdAt,
      contact: p.contact.name,
      material: p.material.name,
      weightKg: p.weightKg,
      totalAmount: p.totalAmount,
      status: deriveStatus(p.totalAmount, p.payments.reduce((s, x) => s + x.amount, 0)),
    })),
    ...sales.map((s) => ({
      id: s.id,
      type: "sale" as const,
      ref: s.saleRef,
      date: s.createdAt,
      contact: s.contact.name,
      material: s.material.name,
      weightKg: s.weightKg,
      totalAmount: s.grandTotal,
      status: deriveStatus(s.grandTotal, s.payments.reduce((sum, x) => sum + x.amount, 0)),
    })),
  ];

  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    items,
    totalPurchases: purchases.reduce((s, p) => s + p.totalAmount, 0),
    totalSales: sales.reduce((s, sale) => s + sale.grandTotal, 0),
    totalProfit: sales.reduce((s, sale) => s + sale.profitAmount, 0),
    purchaseCount: purchases.length,
    saleCount: sales.length,
  };
}
