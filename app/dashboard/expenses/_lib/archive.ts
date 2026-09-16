import "server-only";

import { prisma } from "@/app/lib/db";

// Expense "periods" run the 10th of one month through the 9th of the next —
// not the calendar month. Change this single constant to move the cutover day.
const CUTOFF_DAY = 10;

/** The 10th-of-month that begins the period containing `date`. */
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

/** Idempotent — files away any past period's expenses that haven't been
 * archived yet, leaving only the current period's rows "live" on the
 * Expenses page. Safe (and cheap when there's nothing to do) to call on
 * every page load; this is what makes the "reset on the 10th" happen
 * without needing a separate scheduled job. Handles more than one missed
 * period (e.g. the app wasn't opened for a couple of months) by archiving
 * each one separately, oldest first, so the monthly breakdown stays accurate. */
export async function ensureExpensePeriodsArchived(): Promise<void> {
  const currentPeriodStart = periodStartFor(new Date());

  for (;;) {
    const stale = await prisma.companyExpense.findFirst({
      where: { archiveId: null, date: { lt: currentPeriodStart } },
      orderBy: { date: "asc" },
      select: { id: true, date: true },
    });
    if (!stale) return;

    const staleStart = periodStartFor(stale.date);
    const staleEnd = periodEndFor(staleStart);

    const items = await prisma.companyExpense.findMany({
      where: { archiveId: null, date: { gte: staleStart, lt: staleEnd } },
      select: { id: true, amount: true },
    });
    const totalAmount = items.reduce((s, e) => s + e.amount, 0);

    const archive = await prisma.expenseArchive.create({
      data: {
        label: periodLabel(staleStart, staleEnd),
        periodStart: staleStart,
        periodEnd: staleEnd,
        totalAmount,
      },
    });
    await prisma.companyExpense.updateMany({
      where: { id: { in: items.map((i) => i.id) } },
      data: { archiveId: archive.id },
    });
  }
}

export function getExpenseArchives() {
  return prisma.expenseArchive.findMany({ orderBy: { periodStart: "desc" } });
}

export function getExpenseArchiveById(id: string) {
  return prisma.expenseArchive.findUnique({
    where: { id },
    include: { expenses: { orderBy: { date: "asc" } } },
  });
}
