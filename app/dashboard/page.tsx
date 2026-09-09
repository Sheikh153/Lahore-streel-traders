import type { Metadata } from "next";
import { verifySession } from "@/app/lib/dal";
import {
  getOverviewKpis,
  getPurchaseTrend,
  getSaleTrend,
  getStockByMaterial,
  getRecentActivity,
  getTopContacts,
} from "./_lib/overview";
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

  const [kpis, purchaseTrend, saleTrend, stockByMaterial, recentActivity, topContacts] =
    await Promise.all([
      getOverviewKpis(),
      getPurchaseTrend(),
      getSaleTrend(),
      getStockByMaterial(),
      getRecentActivity(),
      getTopContacts(),
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
    </div>
  );
}
