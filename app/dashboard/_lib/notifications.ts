import "server-only";

import { prisma } from "@/app/lib/db";
import { deriveStatus, sumPayments } from "./balances";
import { formatCurrency, formatNumber } from "./format";

export type Notification = {
  id: string;
  type: "low-stock" | "unpaid";
  message: string;
  href: string;
  date: Date;
};

const MAX_NOTIFICATIONS = 8;

/** Real, derived alerts — not a stored/dismissable feed: materials at or
 * below their low-stock threshold, and purchases/sales that aren't fully
 * paid yet. Capped and sorted most-recent-first for the dropdown. */
export async function getNotifications(): Promise<Notification[]> {
  const [materials, purchases, sales] = await Promise.all([
    prisma.material.findMany({ where: { lowStockKg: { not: null } } }),
    prisma.purchase.findMany({
      include: { contact: true, payments: { select: { amount: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.sale.findMany({
      include: { contact: true, payments: { select: { amount: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const notifications: Notification[] = [];

  for (const m of materials) {
    if (m.lowStockKg !== null && m.stockKg <= m.lowStockKg) {
      notifications.push({
        id: `low-stock-${m.id}`,
        type: "low-stock",
        message: `${m.name} is low on stock — ${formatNumber(m.stockKg)} ${m.unit} left`,
        href: "/dashboard/inventory",
        date: m.updatedAt,
      });
    }
  }

  for (const p of purchases) {
    const paid = sumPayments(p.payments);
    const status = deriveStatus(p.totalAmount, paid);
    if (status !== "paid") {
      notifications.push({
        id: `purchase-${p.id}`,
        type: "unpaid",
        message: `${p.lotId} from ${p.contact.name} is ${status} — ${formatCurrency(p.totalAmount - paid)} owed`,
        href: `/dashboard/purchases/${p.id}`,
        date: p.createdAt,
      });
    }
  }

  for (const s of sales) {
    const paid = sumPayments(s.payments);
    const status = deriveStatus(s.grandTotal, paid);
    if (status !== "paid") {
      notifications.push({
        id: `sale-${s.id}`,
        type: "unpaid",
        message: `${s.saleRef} to ${s.contact.name} is ${status} — ${formatCurrency(s.grandTotal - paid)} due`,
        href: `/dashboard/sales/${s.id}`,
        date: s.createdAt,
      });
    }
  }

  return notifications
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, MAX_NOTIFICATIONS);
}
