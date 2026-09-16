import type { Metadata } from "next";
import Link from "next/link";
import { verifySession } from "@/app/lib/dal";
import { formatCurrency, formatDate, formatNumber } from "@/app/dashboard/_lib/format";
import StatusBadge from "@/app/dashboard/_components/StatusBadge";
import DeleteButton from "@/app/dashboard/_components/DeleteButton";
import { deriveStatus, sumPayments } from "@/app/dashboard/_lib/balances";
import { getPurchases } from "./_lib/queries";
import { deletePurchase } from "./actions";

export const metadata: Metadata = { title: "Purchases" };

export default async function PurchasesPage({
  searchParams,
}: PageProps<"/dashboard/purchases">) {
  await verifySession();
  const { q } = await searchParams;
  const search = typeof q === "string" ? q : undefined;
  const purchases = await getPurchases(search);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            Purchases
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {purchases.length} {purchases.length === 1 ? "lot" : "lots"} recorded
          </p>
        </div>
        <Link
          href="/dashboard/purchases/new"
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
        >
          + Record purchase
        </Link>
      </div>

      <form className="flex" method="get">
        <input
          type="search"
          name="q"
          defaultValue={search}
          placeholder="Search by lot ID, supplier, or material…"
          className="w-full max-w-sm rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </form>

      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {purchases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
              {search ? "No purchases match your search" : "No purchases yet"}
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {search
                ? "Try a different lot ID, supplier, or material name."
                : "Record your first scrap purchase to get started."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400">
                  <th className="px-5 py-2.5 font-medium">Lot</th>
                  <th className="px-5 py-2.5 font-medium">Date</th>
                  <th className="px-5 py-2.5 font-medium">Supplier</th>
                  <th className="px-5 py-2.5 font-medium">Material</th>
                  <th className="px-5 py-2.5 text-right font-medium">Weight</th>
                  <th className="px-5 py-2.5 text-right font-medium">Total</th>
                  <th className="px-5 py-2.5 font-medium">Status</th>
                  <th className="px-5 py-2.5">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((purchase) => {
                  const paid = sumPayments(purchase.payments);
                  const status = deriveStatus(purchase.totalAmount, paid);
                  return (
                    <tr key={purchase.id} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="whitespace-nowrap px-5 py-3 font-medium text-slate-900 dark:text-slate-50">
                        <Link href={`/dashboard/purchases/${purchase.id}`} className="hover:text-blue-600 dark:hover:text-blue-400">
                          {purchase.lotId}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 tabular-nums text-slate-500 dark:text-slate-400">
                        {formatDate(purchase.date)}
                      </td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                        {purchase.contact.name}
                      </td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                        {purchase.material.name}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                        {formatNumber(purchase.weightKg)} {purchase.material.unit}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums font-medium text-slate-900 dark:text-slate-50">
                        {formatCurrency(purchase.totalAmount)}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={status} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-4">
                          <Link
                            href={`/dashboard/purchases/${purchase.id}/edit`}
                            className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
                          >
                            Edit
                          </Link>
                          <DeleteButton
                            action={deletePurchase.bind(null, purchase.id)}
                            confirmMessage={`Delete lot ${purchase.lotId}? This will also reverse the stock it added.`}
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
