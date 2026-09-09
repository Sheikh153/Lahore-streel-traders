import "server-only";

import { prisma } from "@/app/lib/db";

export function getCompanyExpenses(search?: string) {
  return prisma.companyExpense.findMany({
    where: search
      ? {
          OR: [
            { category: { contains: search } },
            { notes: { contains: search } },
          ],
        }
      : undefined,
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
