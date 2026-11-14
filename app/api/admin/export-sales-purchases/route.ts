import { NextResponse } from "next/server";
import { verifySession } from "@/app/lib/dal";
import { prisma } from "@/app/lib/db";

// A manual safety-net export for the Danger Zone wipe in Settings — pulls
// every sale/purchase and everything that hangs off them (payments,
// expenses, attachments) so there's a local copy before that data is
// permanently deleted.
export async function GET() {
  await verifySession();

  const [purchases, sales, payments] = await Promise.all([
    prisma.purchase.findMany({ include: { expenses: true, attachments: true } }),
    prisma.sale.findMany({ include: { expenses: true, attachments: true } }),
    prisma.payment.findMany(),
  ]);

  const backup = {
    exportedAt: new Date().toISOString(),
    purchases,
    sales,
    payments,
  };

  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="sales-purchases-backup-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
