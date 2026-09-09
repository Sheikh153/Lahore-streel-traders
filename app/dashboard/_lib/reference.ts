import "server-only";

import { prisma } from "@/app/lib/db";

/** Sequential, human-friendly IDs like "LOT-0001" / "SALE-0001". Good enough
 * for a single-user local app — not collision-proof under true concurrent
 * writes, which isn't a real risk here. */
export async function generateLotId(): Promise<string> {
  const count = await prisma.purchase.count();
  return `LOT-${String(count + 1).padStart(4, "0")}`;
}

export async function generateSaleRef(): Promise<string> {
  const count = await prisma.sale.count();
  return `SALE-${String(count + 1).padStart(4, "0")}`;
}
