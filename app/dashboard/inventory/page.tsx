import type { Metadata } from "next";
import Link from "next/link";
import { verifySession } from "@/app/lib/dal";
import { STATUS } from "@/app/dashboard/_lib/colors";
import { formatCurrency, formatNumber } from "@/app/dashboard/_lib/format";
import { getMaterialAvgCostPerKgMap } from "@/app/dashboard/_lib/costing";
import DeleteButton from "@/app/dashboard/_components/DeleteButton";
import { getMaterials, getMaterialWeightTotalsMap } from "./_lib/queries";
import { deleteMaterial } from "./actions";

export const metadata: Metadata = { title: "Inventory" };

export default async function InventoryPage({
  searchParams,
}: PageProps<"/dashboard/inventory">) {
  await verifySession();
  const { q } = await searchParams;
  const search = typeof q === "string" ? q : undefined;
  const materials = await getMaterials(search);
  const materialIds = materials.map((m) => m.id);
  const [avgCostMap, weightTotalsMap] = await Promise.all([
    getMaterialAvgCostPerKgMap(materialIds),
    getMaterialWeightTotalsMap(materialIds),
  ]);

  const totalStockValue = materials.reduce(
    (sum, m) => sum + m.stockKg * (avgCostMap.get(m.id) ?? 0),
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            Inventory
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {materials.length} {materials.length === 1 ? "material" : "materials"} tracked · {formatCurrency(totalStockValue)} in stock
          </p>
        </div>
        <Link
          href="/dashboard/inventory/new"
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
        >
          + Add material
        </Link>
      </div>

      <form className="flex" method="get">
        <input
          type="search"
          name="q"
          defaultValue={search}
          placeholder="Search materials…"
          className="w-full max-w-sm rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </form>

      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {materials.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
              {search ? "No materials match your search" : "No materials yet"}
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {search ? "Try a different name." : "Add the scrap material types you buy and sell."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400">
                  <th className="px-5 py-2.5 font-medium">Material</th>
                  <th className="px-5 py-2.5 font-medium">Location</th>
                  <th className="px-5 py-2.5 text-right font-medium">Purchased</th>
                  <th className="px-5 py-2.5 text-right font-medium">Sold</th>
                  <th className="px-5 py-2.5 text-right font-medium">Stock</th>
                  <th className="px-5 py-2.5 text-right font-medium">Avg cost/kg</th>
                  <th className="px-5 py-2.5 text-right font-medium">Stock value</th>
                  <th className="px-5 py-2.5 font-medium">Status</th>
                  <th className="px-5 py-2.5">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {materials.map((material) => {
                  const isLow =
                    material.lowStockKg !== null && material.stockKg <= material.lowStockKg;
                  const avgCost = avgCostMap.get(material.id) ?? 0;
                  const stockValue = material.stockKg * avgCost;
                  const weightTotals = weightTotalsMap.get(material.id) ?? { purchased: 0, sold: 0 };
                  return (
                    <tr key={material.id} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-50">
                        {material.name}
                      </td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                        {material.location ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                        {formatNumber(weightTotals.purchased)} {material.unit}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                        {formatNumber(weightTotals.sold)} {material.unit}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                        {formatNumber(material.stockKg)} {material.unit}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                        {formatCurrency(avgCost)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums font-medium text-slate-900 dark:text-slate-50">
                        {formatCurrency(stockValue)}
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          <span
                            className="h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ backgroundColor: isLow ? STATUS.warning.light : STATUS.good.light }}
                          />
                          {isLow ? "Low stock" : "In stock"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-4">
                          <Link
                            href={`/dashboard/inventory/${material.id}/edit`}
                            className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
                          >
                            Edit
                          </Link>
                          <DeleteButton
                            action={deleteMaterial.bind(null, material.id)}
                            confirmMessage={`Delete ${material.name}? This can't be undone.`}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
