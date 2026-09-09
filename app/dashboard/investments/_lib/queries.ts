import "server-only";

import { prisma } from "@/app/lib/db";

export function getPartners() {
  return prisma.partner.findMany({ orderBy: { name: "asc" } });
}

export async function getInvestments(search?: string) {
  return prisma.investment.findMany({
    where: search
      ? {
          OR: [
            { partner: { name: { contains: search } } },
            { notes: { contains: search } },
          ],
        }
      : undefined,
    include: { partner: true },
    orderBy: { date: "desc" },
  });
}

/** Total invested per partner, plus the grand total — the headline numbers
 * for the Investments page. */
export async function getInvestmentTotals() {
  const partners = await prisma.partner.findMany({
    orderBy: { name: "asc" },
    include: { investments: { select: { amount: true } } },
  });

  const byPartner = partners.map((p) => ({
    id: p.id,
    name: p.name,
    total: p.investments.reduce((s, i) => s + i.amount, 0),
  }));

  return {
    byPartner,
    grandTotal: byPartner.reduce((s, p) => s + p.total, 0),
  };
}
