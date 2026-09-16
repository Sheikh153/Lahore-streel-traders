import "server-only";

import { prisma } from "@/app/lib/db";
import { getMaterialAvgCostPerKgMap } from "./costing";
import { deriveStatus } from "./balances";
import type { TrendPoint } from "../_components/TrendChart";
import type { MaterialSlice } from "../_components/MaterialBreakdown";
import type { RecentActivityItem } from "../_components/RecentTransactions";
import type { TopContact } from "../_components/TopContacts";
import type { Kpi } from "../_components/StatTile";

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
function startOfNextMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}
function startOfPrevMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1);
}

function percentDelta(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export async function getOverviewKpis(): Promise<Kpi[]> {
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const nextMonthStart = startOfNextMonth(now);
  const lastMonthStart = startOfPrevMonth(now);

  const [
    salesThisMonth,
    salesLastMonth,
    purchasesThisMonth,
    purchasesLastMonth,
    allSales,
    allPurchases,
    allPayments,
    materials,
    companyExpensesThisMonth,
    companyExpensesLastMonth,
  ] = await Promise.all([
    prisma.sale.findMany({ where: { date: { gte: thisMonthStart, lt: nextMonthStart } } }),
    prisma.sale.findMany({ where: { date: { gte: lastMonthStart, lt: thisMonthStart } } }),
    prisma.purchase.findMany({ where: { date: { gte: thisMonthStart, lt: nextMonthStart } } }),
    prisma.purchase.findMany({ where: { date: { gte: lastMonthStart, lt: thisMonthStart } } }),
    prisma.sale.findMany({ select: { totalAmount: true, grandTotal: true } }),
    prisma.purchase.findMany({ select: { totalAmount: true } }),
    prisma.payment.findMany({ select: { direction: true, amount: true } }),
    prisma.material.findMany({ select: { id: true, stockKg: true } }),
    prisma.companyExpense.findMany({
      where: { date: { gte: thisMonthStart, lt: nextMonthStart } },
      select: { amount: true },
    }),
    prisma.companyExpense.findMany({
      where: { date: { gte: lastMonthStart, lt: thisMonthStart } },
      select: { amount: true },
    }),
  ]);

  const sum = (items: { totalAmount: number }[]) => items.reduce((s, i) => s + i.totalAmount, 0);
  const sumWeight = (items: { weightKg: number }[]) => items.reduce((s, i) => s + i.weightKg, 0);
  const sumProfit = (items: { profitAmount: number }[]) => items.reduce((s, i) => s + i.profitAmount, 0);
  const sumAmount = (items: { amount: number }[]) => items.reduce((s, i) => s + i.amount, 0);

  const revenueThis = sum(salesThisMonth);
  const revenueLast = sum(salesLastMonth);
  const expensesThis = sumAmount(companyExpensesThisMonth);
  const expensesLast = sumAmount(companyExpensesLastMonth);
  // Net profit = gross profit on sales (already net of landed cost) minus
  // general overhead — freight/loading/etc. are already baked into landed
  // cost via profitAmount, so only company-wide expenses are subtracted here.
  const profitThis = sumProfit(salesThisMonth) - expensesThis;
  const profitLast = sumProfit(salesLastMonth) - expensesLast;
  const boughtThis = sumWeight(purchasesThisMonth);
  const boughtLast = sumWeight(purchasesLastMonth);
  const soldThis = sumWeight(salesThisMonth);
  const soldLast = sumWeight(salesLastMonth);

  const avgCostMap = await getMaterialAvgCostPerKgMap(materials.map((m) => m.id));
  const stockValue = materials.reduce((s, m) => s + m.stockKg * (avgCostMap.get(m.id) ?? 0), 0);

  // Receivables/payables use the amount actually owed — grandTotal (incl.
  // VAT) for sales, since that's the real cash the buyer owes.
  const totalSales = allSales.reduce((s, sale) => s + (sale.grandTotal || sale.totalAmount), 0);
  const totalPurchases = sum(allPurchases);
  const paidOut = allPayments.filter((p) => p.direction === "out").reduce((s, p) => s + p.amount, 0);
  const paidIn = allPayments.filter((p) => p.direction === "in").reduce((s, p) => s + p.amount, 0);
  const payables = totalPurchases - paidOut;
  const receivables = totalSales - paidIn;

  return [
    {
      label: "Revenue this month",
      value: `Rs ${Math.round(revenueThis).toLocaleString("en-US")}`,
      deltaPercent: percentDelta(revenueThis, revenueLast),
      upIsGood: true,
    },
    {
      label: "Net profit this month",
      value: `Rs ${Math.round(profitThis).toLocaleString("en-US")}`,
      deltaPercent: percentDelta(profitThis, profitLast),
      upIsGood: true,
    },
    {
      label: "Stock value",
      value: `Rs ${Math.round(stockValue).toLocaleString("en-US")}`,
      upIsGood: true,
    },
    {
      label: "Receivables",
      value: `Rs ${Math.round(receivables).toLocaleString("en-US")}`,
      upIsGood: false,
    },
    {
      label: "Payables",
      value: `Rs ${Math.round(payables).toLocaleString("en-US")}`,
      upIsGood: false,
    },
    {
      label: "Weight bought this month",
      value: `${boughtThis.toLocaleString("en-US")} kg`,
      deltaPercent: percentDelta(boughtThis, boughtLast),
      upIsGood: true,
    },
    {
      label: "Weight sold this month",
      value: `${soldThis.toLocaleString("en-US")} kg`,
      deltaPercent: percentDelta(soldThis, soldLast),
      upIsGood: true,
    },
  ];
}

async function dailyWeightTrend(
  model: "purchase" | "sale",
  days: number,
): Promise<TrendPoint[]> {
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);

  const rows =
    model === "purchase"
      ? await prisma.purchase.findMany({
          where: { date: { gte: since } },
          select: { date: true, weightKg: true },
        })
      : await prisma.sale.findMany({
          where: { date: { gte: since } },
          select: { date: true, weightKg: true },
        });

  const byDay = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    byDay.set(d.toISOString().slice(0, 10), 0);
  }
  for (const row of rows) {
    const key = row.date.toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + row.weightKg);
  }

  return Array.from(byDay.entries()).map(([date, weightKg]) => ({ date, weightKg }));
}

export function getPurchaseTrend(days = 14): Promise<TrendPoint[]> {
  return dailyWeightTrend("purchase", days);
}

export function getSaleTrend(days = 14): Promise<TrendPoint[]> {
  return dailyWeightTrend("sale", days);
}

export async function getStockByMaterial(): Promise<MaterialSlice[]> {
  const materials = await prisma.material.findMany({
    orderBy: { name: "asc" },
    take: 6,
  });
  const avgCostMap = await getMaterialAvgCostPerKgMap(materials.map((m) => m.id));

  return materials.map((m, i) => ({
    material: m.name,
    weightKg: m.stockKg,
    valueAmount: m.stockKg * (avgCostMap.get(m.id) ?? 0),
    colorSlot: ((i % 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6,
  }));
}

export async function getRecentActivity(limit = 8): Promise<RecentActivityItem[]> {
  const [purchases, sales] = await Promise.all([
    prisma.purchase.findMany({
      include: { contact: true, material: true, payments: { select: { amount: true } } },
      orderBy: { date: "desc" },
      take: limit,
    }),
    prisma.sale.findMany({
      include: { contact: true, material: true, payments: { select: { amount: true } } },
      orderBy: { date: "desc" },
      take: limit,
    }),
  ]);

  const items: RecentActivityItem[] = [
    ...purchases.map((p) => ({
      id: p.id,
      type: "purchase" as const,
      ref: p.lotId,
      date: p.date,
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
      date: s.date,
      contact: s.contact.name,
      material: s.material.name,
      weightKg: s.weightKg,
      totalAmount: s.totalAmount,
      status: deriveStatus(s.totalAmount, s.payments.reduce((sum, x) => sum + x.amount, 0)),
    })),
  ];

  return items
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}

export async function getTopContacts(limit = 5): Promise<TopContact[]> {
  const contacts = await prisma.contact.findMany({
    include: {
      purchases: { select: { totalAmount: true } },
      sales: { select: { totalAmount: true } },
    },
  });

  return contacts
    .map((c) => ({
      id: c.id,
      name: c.name,
      totalAmount:
        c.purchases.reduce((s, p) => s + p.totalAmount, 0) +
        c.sales.reduce((s, sale) => s + sale.totalAmount, 0),
      transactions: c.purchases.length + c.sales.length,
    }))
    .filter((c) => c.transactions > 0)
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, limit);
}
