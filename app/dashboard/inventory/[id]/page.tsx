import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { verifySession } from "@/app/lib/dal";
import { formatCurrencyPerKg, formatDateLong, formatNumber } from "@/app/dashboard/_lib/format";
import { getMaterialById } from "../_lib/queries";
import { getLotsWithRemaining } from "@/app/dashboard/_lib/lots";

export const metadata: Metadata = { title: "Material lots" };

export default async function MaterialLotsPage({
  params,
}: PageProps<"/dashboard/inventory/[id]">) {
  await verifySession();
  const { id } = await params;

  const material = await getMaterialById(id);
  if (!material) notFound();

  const lots = await getLotsWithRemaining({ materialId: id });
  const totalBought = lots.reduce((s, l) => s + l.weightKg, 0);
  const totalRemaining = lots.reduce((s, l) => s + l.remainingKg, 0);
  const totalSold = lots.reduce((s, l) => s + l.soldKg, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            {material.name}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Each lot is tracked separately — nothing here is blended into one pooled number.
          </p>
        </div>
        <Link
          href="/dashboard/inventory"
          className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          ← Back to inventory
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <SummaryTile label="Total bought" value={`${formatNumber(totalBought)} ${material.unit}`} />
        <SummaryTile label="Total sold" value={`${formatNumber(totalSold)} ${material.unit}`} />
        <SummaryTile label="Remaining (all lots)" value={`${formatNumber(totalRemaining)} ${material.unit}`} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {lots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
              No lots purchased yet
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Record a purchase of this material to see it here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400">
                  <th className="px-5 py-2.5 font-medium">Lot</th>
                  <th className="px-5 py-2.5 font-medium">Date</th>
                  <th className="px-5 py-2.5 text-right font-medium">Bought</th>
                  <th className="px-5 py-2.5 text-right font-medium">Sold</th>
                  <th className="px-5 py-2.5 text-right font-medium">Remaining</th>
                  <th className="px-5 py-2.5 text-right font-medium">Cost/kg</th>
                  <th className="px-5 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {lots.map((l) => (
                  <tr key={l.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-5 py-3 font-medium">
                      <Link
                        href={`/dashboard/purchases/${l.id}`}
                        className="text-blue-600 hover:text-blue-500 dark:text-blue-400"
                      >
                        {l.lotId}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 tabular-nums text-slate-500 dark:text-slate-400">
                      {formatDateLong(l.date)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                      {formatNumber(l.weightKg)} {material.unit}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                      {formatNumber(l.soldKg)} {material.unit}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums font-medium text-slate-900 dark:text-slate-50">
                      {formatNumber(l.remainingKg)} {material.unit}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                      {formatCurrencyPerKg(l.landedCostPerKg)}
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: l.remainingKg > 0.001 ? "#0ca30c" : "#94a3b8" }}
                        />
                        {l.remainingKg > 0.001 ? "In stock" : "Sold out"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-50">{value}</p>
    </div>
  );
}
