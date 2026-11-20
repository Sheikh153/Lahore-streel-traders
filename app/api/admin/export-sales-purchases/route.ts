import { NextResponse } from "next/server";
import { verifySession } from "@/app/lib/dal";
import { prisma } from "@/app/lib/db";

// A manual safety-net export for the Danger Zone wipe in Settings — pulls
// every sale/purchase and everything that hangs off or derives from them
// (payments, expenses, attachments, each material's current stock level,
// and the saved yearly/monthly report snapshots) so there's a local copy
// before all of it is permanently deleted/reset.
export async function GET() {
  await verifySession();

  const [purchases, sales, payments, materials, yearlyReports, monthlyReports] = await Promise.all([
    prisma.purchase.findMany({ include: { expenses: true, attachments: true } }),
    prisma.sale.findMany({ include: { expenses: true, attachments: true } }),
    prisma.payment.findMany(),
    prisma.material.findMany(),
    prisma.yearlyReport.findMany(),
    prisma.monthlyReport.findMany(),
  ]);

  const backup = {
    exportedAt: new Date().toISOString(),
    purchases,
    sales,
    payments,
    materials,
    yearlyReports,
    monthlyReports,
  };

  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="sales-purchases-backup-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
