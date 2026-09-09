import "server-only";

import { prisma } from "@/app/lib/db";
import { getMaterialAvgCostPerKgMap } from "@/app/dashboard/_lib/costing";

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

/** For the Sale form — needs each material's current blended average cost
 * to preview profit/margin before the sale is even submitted. */
export async function getMaterialsForSaleSelect() {
  const materials = await getAllMaterialsForSelect();
  const avgCostMap = await getMaterialAvgCostPerKgMap(materials.map((m) => m.id));
  return materials.map((m) => ({ ...m, avgCostPerKg: avgCostMap.get(m.id) ?? 0 }));
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
