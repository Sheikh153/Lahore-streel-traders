import type { Metadata } from "next";
import Link from "next/link";
import { verifySession } from "@/app/lib/dal";
import { formatCurrency, formatDateLong, formatNumber } from "@/app/dashboard/_lib/format";
import StatusBadge from "@/app/dashboard/_components/StatusBadge";
import { getRecords, type RecordFilter } from "./_lib/queries";

export const metadata: Metadata = { title: "Records" };

const FILTERS: { value: RecordFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "purchase", label: "Purchases" },
  { value: "sale", label: "Sales" },
];

export default async function RecordsPage({
  searchParams,
}: PageProps<"/dashboard/records">) {
  await verifySession();
  const { q, type } = await searchParams;
  const search = typeof q === "string" ? q : undefined;
  const filter: RecordFilter = type === "purchase" || type === "sale" ? type : "all";

  const { items, totalPurchases, totalSales, totalProfit } = await getRecords(search, filter);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
          Records
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Every purchase and sale, in one place.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <SummaryTile label="Total purchased" value={formatCurrency(totalPurchases)} />
        <SummaryTile label="Total sold" value={formatCurrency(totalSales)} />
        <SummaryTile
          label="Total profit"
          value={formatCurrency(totalProfit)}
          emphasize={totalProfit < 0 ? "bad" : "good"}
        />
      </div>

      <form className="flex flex-wrap items-center gap-3" method="get">
        <input
          type="search"
          name="q"
          defaultValue={search}
          placeholder="Search by ref, contact, or material…"
          className="w-full max-w-sm rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        <div className="flex rounded-lg border border-slate-200 p-1 dark:border-slate-800">
          {FILTERS.map((f) => (
            <Link
              key={f.value}
              href={{
                pathname: "/dashboard/records",
                query: { ...(search ? { q: search } : {}), ...(f.value !== "all" ? { type: f.value } : {}) },
              }}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === f.value
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>
      </form>

      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-50">No records match</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Try a different search or filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400">
                  <th className="px-5 py-2.5 font-medium">Ref</th>
                  <th className="px-5 py-2.5 font-medium">Date</th>
                  <th className="px-5 py-2.5 font-medium">Type</th>
                  <th className="px-5 py-2.5 font-medium">Contact</th>
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
                {items.map((item) => {
                  const href =
                    item.type === "purchase"
                      ? `/dashboard/purchases/${item.id}`
                      : `/dashboard/sales/${item.id}`;
                  return (
                    <tr key={`${item.type}-${item.id}`} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="whitespace-nowrap px-5 py-3 font-medium text-slate-900 dark:text-slate-50">
                        <Link href={href} className="hover:text-blue-600 dark:hover:text-blue-400">
                          {item.ref}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 tabular-nums text-slate-500 dark:text-slate-400">
                        {formatDateLong(item.date)}
                      </td>
                      <td className="px-5 py-3">
                        <span className={item.type === "purchase" ? "text-slate-600 dark:text-slate-300" : "text-blue-600 dark:text-blue-400"}>
                          {item.type === "purchase" ? "Purchase" : "Sale"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{item.contact}</td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{item.material}</td>
                      <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                        {formatNumber(item.weightKg)} kg
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums font-medium text-slate-900 dark:text-slate-50">
                        {formatCurrency(item.totalAmount)}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-5 py-3">
                        {item.type === "sale" && (
                          <Link
                            href={`/invoices/${item.id}`}
                            className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
                          >
                            Invoice
                          </Link>
                        )}
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

function SummaryTile({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: "good" | "bad";
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p
        className={`mt-1 text-lg font-semibold tabular-nums ${
          emphasize === "bad"
            ? "text-[#d03b3b]"
            : emphasize === "good"
              ? "text-[#006300] dark:text-[#0ca30c]"
              : "text-slate-900 dark:text-slate-50"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
