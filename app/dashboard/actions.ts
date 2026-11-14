"use server";

import { revalidatePath } from "next/cache";
import { verifySession } from "@/app/lib/dal";
import { saveYearlyReport } from "./_lib/yearlyReports";
import { saveMonthlyReport, periodStartFor } from "./_lib/monthlyReports";

/** Manually snapshots the current (in-progress) year's totals into the
 * Yearly reports list — lets you save a mid-year copy without waiting for
 * Jan 1 (which is when this happens automatically for past years). */
export async function saveCurrentYearReport() {
  await verifySession();
  await saveYearlyReport(new Date().getFullYear());
  revalidatePath("/dashboard");
}

/** Manually snapshots the current (in-progress) budget period's totals —
 * lets you save a mid-period copy without waiting for the 25th (which is
 * when this happens automatically for past periods). */
export async function saveCurrentMonthReport() {
  await verifySession();
  await saveMonthlyReport(periodStartFor(new Date()));
  revalidatePath("/dashboard");
}
