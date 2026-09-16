import type { Metadata } from "next";
import Link from "next/link";
import { verifySession } from "@/app/lib/dal";
import { formatCurrency } from "@/app/dashboard/_lib/format";
import {
  getOverviewKpis,
  getPurchaseTrend,
  getSaleTrend,
  getStockByMaterial,
  getRecentActivity,
  getTopContacts,
} from "./_lib/overview";
import { ensureYearlyReportsArchived, getYearlyReports } from "./_lib/yearlyReports";
import { saveCurrentYearReport } from "./actions";
import StatTile from "./_components/StatTile";
import TrendChart from "./_components/TrendChart";
import MaterialBreakdown from "./_components/MaterialBreakdown";
import RecentTransactions from "./_components/RecentTransactions";
import TopContacts from "./_components/TopContacts";

export const metadata: Metadata = {
  title: "Overview",
};

export default async function DashboardOverviewPage() {
  await verifySession();

  // Files away every complete past year that isn't saved yet — this is
  // what makes "save every year" happen without a separate scheduled job.
  await ensureYearlyReportsArchived();

  const [kpis, purchaseTrend, saleTrend, stockByMaterial, recentActivity, topContacts, yearlyReports] =
    await Promise.all([
      getOverviewKpis(),
      getPurchaseTrend(),
      getSaleTrend(),
      getStockByMaterial(),
      getRecentActivity(),
      getTopContacts(),
      getYearlyReports(),
    ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
          Overview
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Here&apos;s what&apos;s happening in your yard today.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <StatTile key={kpi.label} kpi={kpi} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <TrendChart data={purchaseTrend} title="Purchases (kg)" />
        <TrendChart data={saleTrend} title="Sales (kg)" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RecentTransactions data={recentActivity} />
        </div>
        <MaterialBreakdown data={stockByMaterial} />
      </div>

      <TopContacts data={topContacts} />

      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Yearly reports
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Every complete year is saved here automatically after Jan 1. Open one to view or print it.
            </p>
          </div>
          <form action={saveCurrentYearReport}>
            <button
              type="submit"
              className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Save this year&apos;s report
            </button>
          </form>
        </div>
        {yearlyReports.length === 0 ? (
          <p className="px-5 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
            No yearly reports saved yet.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {yearlyReports.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/dashboard/yearly/${r.id}`}
                  className="flex items-center justify-between gap-3 px-5 py-3 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <span className="text-slate-900 dark:text-slate-50">{r.label}</span>
                  <span className="tabular-nums font-medium text-slate-700 dark:text-slate-300">
                    {formatCurrency(r.revenue)} revenue
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
