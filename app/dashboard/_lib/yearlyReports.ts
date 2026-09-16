import "server-only";

import { prisma } from "@/app/lib/db";

function startOfYear(year: number): Date {
  return new Date(year, 0, 1);
}
function startOfNextYear(year: number): Date {
  return new Date(year + 1, 0, 1);
}
/** The last instant of Dec 31 of `year` — used as the cutoff for "as of
 * end of this (complete, past) year" balance reconstruction. */
function endOfYear(year: number): Date {
  return new Date(year, 11, 31, 23, 59, 59, 999);
}

/** Revenue/profit/weight bought&sold that happened strictly within one
 * calendar year — the same shape as the dashboard's "this month" figures,
 * just year-scoped. */
export async function getYearActivityTotals(year: number) {
  const start = startOfYear(year);
  const end = startOfNextYear(year);

  const [sales, purchases, companyExpenses] = await Promise.all([
    prisma.sale.findMany({ where: { date: { gte: start, lt: end } } }),
    prisma.purchase.findMany({ where: { date: { gte: start, lt: end } } }),
    prisma.companyExpense.findMany({
      where: { date: { gte: start, lt: end } },
      select: { amount: true },
    }),
  ]);

  const revenue = sales.reduce((s, x) => s + x.totalAmount, 0);
  const grossProfit = sales.reduce((s, x) => s + x.profitAmount, 0);
  const expenses = companyExpenses.reduce((s, x) => s + x.amount, 0);
  // Same convention as the monthly KPI: sale.profitAmount already nets out
  // that sale's own expenses (labour/loading/etc.) — only company-wide
  // overhead needs subtracting here.
  const netProfit = grossProfit - expenses;
  const weightBought = purchases.reduce((s, x) => s + x.weightKg, 0);
  const weightSold = sales.reduce((s, x) => s + x.weightKg, 0);

  return { revenue, netProfit, weightBought, weightSold };
}

/** Stock on hand/value and receivables/payables reconstructed from history
 * up to (and including) `asOf` — a real point-in-time balance, not today's
 * live figures, so a past year's report still reads correctly no matter
 * how much has happened since. Pass `new Date()` for a live snapshot. */
async function getBalancesAsOf(asOf: Date) {
  const [purchasesUpTo, salesUpTo, paymentsUpTo, materials] = await Promise.all([
    prisma.purchase.findMany({
      where: { date: { lte: asOf } },
      select: { materialId: true, weightKg: true, landedCostPerKg: true, totalAmount: true },
    }),
    prisma.sale.findMany({
      where: { date: { lte: asOf } },
      select: { materialId: true, weightKg: true, grandTotal: true, totalAmount: true },
    }),
    prisma.payment.findMany({
      where: { createdAt: { lte: asOf } },
      select: { direction: true, amount: true },
    }),
    prisma.material.findMany({ select: { id: true } }),
  ]);

  const purchasedWeightByMaterial = new Map<string, number>();
  const purchasedCostByMaterial = new Map<string, number>(); // Σ weight × landedCostPerKg
  const soldWeightByMaterial = new Map<string, number>();

  for (const p of purchasesUpTo) {
    purchasedWeightByMaterial.set(
      p.materialId,
      (purchasedWeightByMaterial.get(p.materialId) ?? 0) + p.weightKg,
    );
    purchasedCostByMaterial.set(
      p.materialId,
      (purchasedCostByMaterial.get(p.materialId) ?? 0) + p.weightKg * p.landedCostPerKg,
    );
  }
  for (const s of salesUpTo) {
    soldWeightByMaterial.set(s.materialId, (soldWeightByMaterial.get(s.materialId) ?? 0) + s.weightKg);
  }

  let stockOnHandKg = 0;
  let stockValue = 0;
  for (const m of materials) {
    const purchasedWeight = purchasedWeightByMaterial.get(m.id) ?? 0;
    const soldWeight = soldWeightByMaterial.get(m.id) ?? 0;
    const netWeight = purchasedWeight - soldWeight;
    // Weighted-average cost across every lot bought up to this instant —
    // same "never retroactively shifts" methodology as costing.ts, just
    // bounded to a historical cutoff instead of all-time.
    const avgCostPerKg = purchasedWeight > 0 ? (purchasedCostByMaterial.get(m.id) ?? 0) / purchasedWeight : 0;
    stockOnHandKg += netWeight;
    stockValue += netWeight * avgCostPerKg;
  }

  const totalPurchaseAmount = purchasesUpTo.reduce((s, p) => s + p.totalAmount, 0);
  const totalSaleGrandTotal = salesUpTo.reduce((s, x) => s + (x.grandTotal || x.totalAmount), 0);
  const paidOut = paymentsUpTo.filter((p) => p.direction === "out").reduce((s, p) => s + p.amount, 0);
  const paidIn = paymentsUpTo.filter((p) => p.direction === "in").reduce((s, p) => s + p.amount, 0);

  return {
    stockOnHandKg,
    stockValue,
    payables: totalPurchaseAmount - paidOut,
    receivables: totalSaleGrandTotal - paidIn,
  };
}

async function snapshotYear(year: number, asOf: Date) {
  const [activity, balances] = await Promise.all([
    getYearActivityTotals(year),
    getBalancesAsOf(asOf),
  ]);
  return { ...activity, ...balances };
}

/** Creates (or refreshes) the saved report for `year`, using live balances
 * if `year` is the current year, or balances reconstructed as of Dec 31
 * for a complete past year. */
export async function saveYearlyReport(year: number): Promise<void> {
  const isCurrentYear = year === new Date().getFullYear();
  const asOf = isCurrentYear ? new Date() : endOfYear(year);
  const snapshot = await snapshotYear(year, asOf);

  await prisma.yearlyReport.upsert({
    where: { year },
    create: { year, label: String(year), ...snapshot },
    update: { label: String(year), ...snapshot },
  });
}

/** Idempotent — saves a report for every complete past year that doesn't
 * have one yet (based on the earliest purchase/sale on record), so the
 * dashboard "just works" the first time anyone opens it after Jan 1
 * without needing a scheduled job. Safe to call on every page load. */
export async function ensureYearlyReportsArchived(): Promise<void> {
  const currentYear = new Date().getFullYear();

  const [earliestSale, earliestPurchase] = await Promise.all([
    prisma.sale.findFirst({ orderBy: { date: "asc" }, select: { date: true } }),
    prisma.purchase.findFirst({ orderBy: { date: "asc" }, select: { date: true } }),
  ]);
  const candidateYears = [earliestSale?.date.getFullYear(), earliestPurchase?.date.getFullYear()].filter(
    (y): y is number => y !== undefined,
  );
  if (candidateYears.length === 0) return; // nothing recorded yet

  const earliestYear = Math.min(...candidateYears);

  const existing = await prisma.yearlyReport.findMany({ select: { year: true } });
  const alreadySaved = new Set(existing.map((r) => r.year));

  for (let year = earliestYear; year < currentYear; year++) {
    if (!alreadySaved.has(year)) {
      await saveYearlyReport(year);
    }
  }
}

export function getYearlyReports() {
  return prisma.yearlyReport.findMany({ orderBy: { year: "desc" } });
}

export function getYearlyReportById(id: string) {
  return prisma.yearlyReport.findUnique({ where: { id } });
}
