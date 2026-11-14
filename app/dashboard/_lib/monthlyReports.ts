import "server-only";

import { prisma } from "@/app/lib/db";
import { getBalancesAsOf } from "./yearlyReports";

// Monthly "budget periods" run the 25th of one month through the 24th of
// the next — not the calendar month. Change this single constant to move
// the cutover day.
const CUTOFF_DAY = 25;

/** The 25th-of-month that begins the period containing `date`. */
export function periodStartFor(date: Date): Date {
  const day = date.getDate();
  const y = date.getFullYear();
  const m = date.getMonth();
  return day >= CUTOFF_DAY ? new Date(y, m, CUTOFF_DAY) : new Date(y, m - 1, CUTOFF_DAY);
}

function periodEndFor(periodStart: Date): Date {
  return new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, CUTOFF_DAY);
}

function periodLabel(periodStart: Date, periodEnd: Date): string {
  const lastDay = new Date(periodEnd.getTime() - 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(periodStart)} – ${fmt(lastDay)}, ${periodStart.getFullYear()}`;
}

/** Revenue/profit/weight bought&sold that happened strictly within one
 * budget period — same shape as the dashboard's "this month" figures, just
 * scoped to the 25th-to-24th period instead of the calendar month. */
async function getPeriodActivityTotals(periodStart: Date, periodEnd: Date) {
  const [sales, purchases, companyExpenses] = await Promise.all([
    prisma.sale.findMany({ where: { date: { gte: periodStart, lt: periodEnd } } }),
    prisma.purchase.findMany({ where: { date: { gte: periodStart, lt: periodEnd } } }),
    prisma.companyExpense.findMany({
      where: { date: { gte: periodStart, lt: periodEnd } },
      select: { amount: true },
    }),
  ]);

  const revenue = sales.reduce((s, x) => s + x.totalAmount, 0);
  const grossProfit = sales.reduce((s, x) => s + x.profitAmount, 0);
  const expenses = companyExpenses.reduce((s, x) => s + x.amount, 0);
  // Same convention as the yearly/monthly KPI: sale.profitAmount already
  // nets out that sale's own expenses — only company-wide overhead needs
  // subtracting here.
  const netProfit = grossProfit - expenses;
  const weightBought = purchases.reduce((s, x) => s + x.weightKg, 0);
  const weightSold = sales.reduce((s, x) => s + x.weightKg, 0);

  return { revenue, netProfit, weightBought, weightSold };
}

async function snapshotPeriod(periodStart: Date, periodEnd: Date, asOf: Date) {
  const [activity, balances] = await Promise.all([
    getPeriodActivityTotals(periodStart, periodEnd),
    getBalancesAsOf(asOf),
  ]);
  return { ...activity, ...balances };
}

/** Creates (or refreshes) the saved report for the period starting on
 * `periodStart`, using live balances if that period is still in progress,
 * or balances reconstructed as of the period's last day for a complete one. */
export async function saveMonthlyReport(periodStart: Date): Promise<void> {
  const periodEnd = periodEndFor(periodStart);
  const now = new Date();
  const isComplete = periodEnd <= now;
  const asOf = isComplete ? new Date(periodEnd.getTime() - 1) : now;
  const snapshot = await snapshotPeriod(periodStart, periodEnd, asOf);
  const label = periodLabel(periodStart, periodEnd);

  await prisma.monthlyReport.upsert({
    where: { periodStart },
    create: { periodStart, label, ...snapshot },
    update: { label, ...snapshot },
  });
}

/** Idempotent — saves a report for every complete past period that doesn't
 * have one yet (based on the earliest purchase/sale on record), so the
 * dashboard "just works" without needing a scheduled job. Safe to call on
 * every page load. Handles more than one missed period in one go, oldest
 * first, same as the expense archiver. */
export async function ensureMonthlyReportsArchived(): Promise<void> {
  const currentPeriodStart = periodStartFor(new Date());

  const [earliestSale, earliestPurchase] = await Promise.all([
    prisma.sale.findFirst({ orderBy: { date: "asc" }, select: { date: true } }),
    prisma.purchase.findFirst({ orderBy: { date: "asc" }, select: { date: true } }),
  ]);
  const candidates = [earliestSale?.date, earliestPurchase?.date].filter((d): d is Date => d !== undefined);
  if (candidates.length === 0) return; // nothing recorded yet

  const earliestPeriodStart = periodStartFor(
    new Date(Math.min(...candidates.map((d) => d.getTime()))),
  );

  const existing = await prisma.monthlyReport.findMany({ select: { periodStart: true } });
  const alreadySaved = new Set(existing.map((r) => r.periodStart.getTime()));

  for (
    let periodStart = earliestPeriodStart;
    periodStart.getTime() < currentPeriodStart.getTime();
    periodStart = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, CUTOFF_DAY)
  ) {
    if (!alreadySaved.has(periodStart.getTime())) {
      await saveMonthlyReport(periodStart);
    }
  }
}

export function getMonthlyReports() {
  return prisma.monthlyReport.findMany({ orderBy: { periodStart: "desc" } });
}

export function getMonthlyReportById(id: string) {
  return prisma.monthlyReport.findUnique({ where: { id } });
}
