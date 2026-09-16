import "server-only";

import { prisma } from "@/app/lib/db";

export type LotWithRemaining = {
  id: string;
  lotId: string;
  materialId: string;
  weightKg: number; // originally bought
  soldKg: number;
  remainingKg: number;
  landedCostPerKg: number;
  date: Date;
};

/** Every purchase lot with how much of it has been sold vs. still remains
 * — lots are never blended together, so this is a real per-batch balance,
 * not a share of a pooled material-wide stock figure. Pass `excludeSaleId`
 * when editing a sale, so that sale's own (about-to-change) weight doesn't
 * count against the lot it currently belongs to. */
export async function getLotsWithRemaining(opts?: {
  materialId?: string;
  excludeSaleId?: string;
}): Promise<LotWithRemaining[]> {
  const purchases = await prisma.purchase.findMany({
    where: opts?.materialId ? { materialId: opts.materialId } : undefined,
    orderBy: { date: "asc" },
    select: {
      id: true,
      lotId: true,
      materialId: true,
      weightKg: true,
      landedCostPerKg: true,
      date: true,
    },
  });
  if (purchases.length === 0) return [];

  const sales = await prisma.sale.findMany({
    where: {
      purchaseId: { in: purchases.map((p) => p.id) },
      ...(opts?.excludeSaleId ? { id: { not: opts.excludeSaleId } } : {}),
    },
    select: { purchaseId: true, weightKg: true },
  });
  const soldByLot = new Map<string, number>();
  for (const s of sales) {
    if (!s.purchaseId) continue;
    soldByLot.set(s.purchaseId, (soldByLot.get(s.purchaseId) ?? 0) + s.weightKg);
  }

  return purchases.map((p) => {
    const soldKg = soldByLot.get(p.id) ?? 0;
    return {
      id: p.id,
      lotId: p.lotId,
      materialId: p.materialId,
      weightKg: p.weightKg,
      soldKg,
      remainingKg: p.weightKg - soldKg,
      landedCostPerKg: p.landedCostPerKg,
      date: p.date,
    };
  });
}

/** Only lots with stock left — for the Sale form's lot picker. */
export async function getAvailableLotsForSale(excludeSaleId?: string): Promise<LotWithRemaining[]> {
  const lots = await getLotsWithRemaining({ excludeSaleId });
  return lots.filter((l) => l.remainingKg > 0.001);
}

/** Authoritative (server-side) remaining check for one lot — always
 * recomputed here rather than trusted from client input. */
export async function getLotRemaining(
  purchaseId: string,
  excludeSaleId?: string,
): Promise<{ materialId: string; weightKg: number; landedCostPerKg: number; remainingKg: number } | null> {
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    select: { materialId: true, weightKg: true, landedCostPerKg: true },
  });
  if (!purchase) return null;

  const sales = await prisma.sale.findMany({
    where: { purchaseId, ...(excludeSaleId ? { id: { not: excludeSaleId } } : {}) },
    select: { weightKg: true },
  });
  const soldKg = sales.reduce((s, x) => s + x.weightKg, 0);

  return { ...purchase, remainingKg: purchase.weightKg - soldKg };
}
