import "server-only";

import { prisma } from "@/app/lib/db";

/** A lot's landed cost/kg = (raw purchase cost + its expenses) ÷ its weight. */
export async function computeLandedCostPerKg(purchaseId: string): Promise<number> {
  const purchase = await prisma.purchase.findUniqueOrThrow({
    where: { id: purchaseId },
    include: { expenses: true },
  });
  const expenseTotal = purchase.expenses.reduce((sum, e) => sum + e.amount, 0);
  if (purchase.weightKg <= 0) return purchase.ratePerKg;
  return (purchase.weightKg * purchase.ratePerKg + expenseTotal) / purchase.weightKg;
}

/**
 * A material's average cost/kg, blended across every lot ever bought,
 * weighted by each lot's weight — the moving weighted-average-cost method.
 * Computed on the fly (not stored) so it can never drift out of sync with
 * the purchases/expenses it's derived from.
 */
export async function getMaterialAvgCostPerKg(materialId: string): Promise<number> {
  const purchases = await prisma.purchase.findMany({
    where: { materialId },
    select: { weightKg: true, landedCostPerKg: true },
  });
  const totalWeight = purchases.reduce((sum, p) => sum + p.weightKg, 0);
  if (totalWeight <= 0) return 0;
  const totalCost = purchases.reduce((sum, p) => sum + p.weightKg * p.landedCostPerKg, 0);
  return totalCost / totalWeight;
}

/** Batch version for list pages showing many materials at once. */
export async function getMaterialAvgCostPerKgMap(
  materialIds: string[],
): Promise<Map<string, number>> {
  const purchases = await prisma.purchase.findMany({
    where: { materialId: { in: materialIds } },
    select: { materialId: true, weightKg: true, landedCostPerKg: true },
  });

  const totals = new Map<string, { weight: number; cost: number }>();
  for (const p of purchases) {
    const entry = totals.get(p.materialId) ?? { weight: 0, cost: 0 };
    entry.weight += p.weightKg;
    entry.cost += p.weightKg * p.landedCostPerKg;
    totals.set(p.materialId, entry);
  }

  const result = new Map<string, number>();
  for (const id of materialIds) {
    const entry = totals.get(id);
    result.set(id, entry && entry.weight > 0 ? entry.cost / entry.weight : 0);
  }
  return result;
}
