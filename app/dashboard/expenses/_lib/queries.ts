import "server-only";

import { prisma } from "@/app/lib/db";

/** Only the current (unarchived) period's rows — past periods are filed
 * away by ensureExpensePeriodsArchived and browsed separately. */
export function getCompanyExpenses(search?: string) {
  return prisma.companyExpense.findMany({
    where: {
      archiveId: null,
      ...(search
        ? {
            OR: [
              { category: { contains: search } },
              { notes: { contains: search } },
            ],
          }
        : {}),
    },
    orderBy: { date: "desc" },
  });
}

function monthRange(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return { start, end };
}

export async function getCompanyExpensesThisMonthTotal(): Promise<number> {
  const { start, end } = monthRange(new Date());
  const rows = await prisma.companyExpense.findMany({
    where: { date: { gte: start, lt: end } },
    select: { amount: true },
  });
  return rows.reduce((sum, r) => sum + r.amount, 0);
}
