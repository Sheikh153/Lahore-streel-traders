import "server-only";

import { prisma } from "@/app/lib/db";

export type LedgerEntry = {
  id: string;
  type: "purchase" | "sale" | "payment-out" | "payment-in";
  date: Date;
  label: string;
  amount: number;
};

export async function getContactLedger(contactId: string) {
  const [purchases, sales, payments] = await Promise.all([
    prisma.purchase.findMany({
      where: { contactId },
      include: { material: true },
      orderBy: { date: "desc" },
    }),
    prisma.sale.findMany({
      where: { contactId },
      include: { material: true },
      orderBy: { date: "desc" },
    }),
    prisma.payment.findMany({
      where: { contactId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const purchasesTotal = purchases.reduce((s, p) => s + p.totalAmount, 0);
  // grandTotal (incl. VAT) is what the buyer actually owes.
  const salesTotal = sales.reduce((s, s2) => s + s2.grandTotal, 0);
  const paidOutTotal = payments
    .filter((p) => p.direction === "out")
    .reduce((s, p) => s + p.amount, 0);
  const paidInTotal = payments
    .filter((p) => p.direction === "in")
    .reduce((s, p) => s + p.amount, 0);

  const payableBalance = purchasesTotal - paidOutTotal;
  const receivableBalance = salesTotal - paidInTotal;

  const entries: LedgerEntry[] = [
    ...purchases.map((p) => ({
      id: p.id,
      type: "purchase" as const,
      date: p.date,
      label: `${p.lotId} — ${p.weightKg}kg ${p.material.name} bought`,
      amount: p.totalAmount,
    })),
    ...sales.map((s) => ({
      id: s.id,
      type: "sale" as const,
      date: s.date,
      label: `${s.saleRef} — ${s.weightKg}kg ${s.material.name} sold`,
      amount: s.grandTotal,
    })),
    ...payments.map((p) => ({
      id: p.id,
      type: (p.direction === "out" ? "payment-out" : "payment-in") as
        | "payment-out"
        | "payment-in",
      date: p.createdAt,
      label: p.direction === "out" ? "Payment made" : "Payment received",
      amount: p.amount,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return {
    purchasesTotal,
    salesTotal,
    paidOutTotal,
    paidInTotal,
    payableBalance,
    receivableBalance,
    entries,
    purchaseCount: purchases.length,
    saleCount: sales.length,
  };
}
