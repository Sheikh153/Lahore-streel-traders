"use server";

import { revalidatePath } from "next/cache";
import { verifySession } from "@/app/lib/dal";
import { saveYearlyReport } from "./_lib/yearlyReports";

/** Manually snapshots the current (in-progress) year's totals into the
 * Yearly reports list — lets you save a mid-year copy without waiting for
 * Jan 1 (which is when this happens automatically for past years). */
export async function saveCurrentYearReport() {
  await verifySession();
  await saveYearlyReport(new Date().getFullYear());
  revalidatePath("/dashboard");
}
