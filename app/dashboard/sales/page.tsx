import type { Metadata } from "next";
import Link from "next/link";
import { verifySession } from "@/app/lib/dal";
import { formatCurrency, formatDate, formatNumber } from "@/app/dashboard/_lib/format";
import StatusBadge from "@/app/dashboard/_components/StatusBadge";
import DeleteButton from "@/app/dashboard/_components/DeleteButton";
import { deriveStatus, sumPayments } from "@/app/dashboard/_lib/balances";
import { getSales } from "./_lib/queries";
import { deleteSale } from "./actions";

export const metadata: Metadata = { title: "Sales" };

export default async function SalesPage({
  searchParams,
}: PageProps<"/dashboard/sales">) {
  await verifySession();
  const { q } = await searchParams;
  const search = typeof q === "string" ? q : undefined;
  const sales = await getSales(search);

  const totalProfit = sales.reduce((s, sale) => s + sale.profitAmount, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            Sales
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {sales.length} {sales.length === 1 ? "sale" : "sales"} recorded · {formatCurrency(totalProfit)} total profit
          </p>
        </div>
        <Link
          href="/dashboard/sales/new"
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
        >
          + Record sale
        </Link>
      </div>

      <form className="flex" method="get">
        <input
          type="search"
          name="q"
          defaultValue={search}
          placeholder="Search by sale ref, buyer, or material…"
          className="w-full max-w-sm rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </form>

      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {sales.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
              {search ? "No sales match your search" : "No sales yet"}
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {search ? "Try a different sale ref, buyer, or material name." : "Record your first sale to get started."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] text-left text-sm">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400">
                  <th className="px-5 py-2.5 font-medium">Ref</th>
                  <th className="px-5 py-2.5 font-medium">Date</th>
                  <th className="px-5 py-2.5 font-medium">Buyer</th>
                  <th className="px-5 py-2.5 font-medium">Material</th>
                  <th className="px-5 py-2.5 text-right font-medium">Weight</th>
                  <th className="px-5 py-2.5 text-right font-medium">Sale value</th>
                  <th className="px-5 py-2.5 text-right font-medium">Profit</th>
                  <th className="px-5 py-2.5 font-medium">Status</th>
                  <th className="px-5 py-2.5">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => {
                  const paid = sumPayments(sale.payments);
                  const status = deriveStatus(sale.grandTotal, paid);
                  return (
                    <tr key={sale.id} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="whitespace-nowrap px-5 py-3 font-medium text-slate-900 dark:text-slate-50">
                        <Link href={`/dashboard/sales/${sale.id}`} className="hover:text-blue-600 dark:hover:text-blue-400">
                          {sale.saleRef}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 tabular-nums text-slate-500 dark:text-slate-400">
                        {formatDate(sale.createdAt)}
                      </td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{sale.contact.name}</td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{sale.material.name}</td>
                      <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                        {formatNumber(sale.weightKg)} {sale.material.unit}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums font-medium text-slate-900 dark:text-slate-50">
                        {formatCurrency(sale.totalAmount)}
                      </td>
                      <td
                        className={`whitespace-nowrap px-5 py-3 text-right tabular-nums font-medium ${
                          sale.profitAmount < 0 ? "text-[#d03b3b]" : "text-[#006300] dark:text-[#0ca30c]"
                        }`}
                      >
                        {formatCurrency(sale.profitAmount)}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={status} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-4">
                          <Link
                            href={`/dashboard/sales/${sale.id}/edit`}
                            className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
                          >
                            Edit
                          </Link>
                          <DeleteButton
                            action={deleteSale.bind(null, sale.id)}
                            confirmMessage={`Delete sale ${sale.saleRef}? This will also reverse the stock it removed.`}
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
