import "server-only";

import { prisma } from "@/app/lib/db";
import { getAvailableLotsForSale } from "@/app/dashboard/_lib/lots";

export function getMaterials(search?: string) {
  return prisma.material.findMany({
    where: search ? { name: { contains: search } } : undefined,
    orderBy: { name: "asc" },
  });
}

export function getMaterialById(id: string) {
  return prisma.material.findUnique({ where: { id } });
}

export function getAllMaterialsForSelect() {
  return prisma.material.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, unit: true, pricePerKg: true, stockKg: true },
  });
}

/** For the Sale form — only materials that actually have an unsold lot to
 * sell from (the Lot dropdown is what drives cost/remaining preview now,
 * not a material-wide blended average). Pass `excludeSaleId` when editing
 * a sale so its own material/lot still appears even if this sale is the
 * only thing keeping that lot's remaining above zero. */
export async function getMaterialsForSaleSelect(excludeSaleId?: string) {
  const [materials, lots] = await Promise.all([
    prisma.material.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, unit: true, pricePerKg: true },
    }),
    getAvailableLotsForSale(excludeSaleId),
  ]);
  const materialIdsWithStock = new Set(lots.map((l) => l.materialId));
  return materials.filter((m) => materialIdsWithStock.has(m.id));
}

/** All-time weight bought/sold per material — "how much sold, how much
 * purchased" at a glance, alongside current stock. */
export async function getMaterialWeightTotalsMap(
  materialIds: string[],
): Promise<Map<string, { purchased: number; sold: number }>> {
  const [purchases, sales] = await Promise.all([
    prisma.purchase.groupBy({
      by: ["materialId"],
      where: { materialId: { in: materialIds } },
      _sum: { weightKg: true },
    }),
    prisma.sale.groupBy({
      by: ["materialId"],
      where: { materialId: { in: materialIds } },
      _sum: { weightKg: true },
    }),
  ]);

  const result = new Map<string, { purchased: number; sold: number }>();
  for (const id of materialIds) result.set(id, { purchased: 0, sold: 0 });
  for (const p of purchases) {
    const entry = result.get(p.materialId);
    if (entry) entry.purchased = p._sum.weightKg ?? 0;
  }
  for (const s of sales) {
    const entry = result.get(s.materialId);
    if (entry) entry.sold = s._sum.weightKg ?? 0;
  }
  return result;
}
