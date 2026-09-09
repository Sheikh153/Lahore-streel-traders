import Link from "next/link";
import { formatCurrency, formatDate, formatNumber } from "../_lib/format";
import type { TransactionStatus } from "../_lib/status";
import StatusBadge from "./StatusBadge";

export type RecentActivityItem = {
  id: string;
  type: "purchase" | "sale";
  ref: string;
  date: string | Date;
  contact: string;
  material: string;
  weightKg: number;
  totalAmount: number;
  status: TransactionStatus;
};

export default function RecentTransactions({ data }: { data: RecentActivityItem[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
          Recent activity
        </h3>
        <Link
          href="/dashboard/purchases"
          className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
        >
          View all
        </Link>
      </div>

      {data.length === 0 ? (
        <p className="p-5 text-sm text-slate-500 dark:text-slate-400">No activity yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="text-slate-500 dark:text-slate-400">
                <th className="px-5 py-2.5 font-medium">Date</th>
                <th className="px-5 py-2.5 font-medium">Type</th>
                <th className="px-5 py-2.5 font-medium">Contact</th>
                <th className="px-5 py-2.5 font-medium">Material</th>
                <th className="px-5 py-2.5 text-right font-medium">Weight</th>
                <th className="px-5 py-2.5 text-right font-medium">Total</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={`${item.type}-${item.id}`} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="whitespace-nowrap px-5 py-3 tabular-nums text-slate-500 dark:text-slate-400">
                    {formatDate(item.date)}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={
                        item.type === "purchase"
                          ? "text-slate-600 dark:text-slate-300"
                          : "text-blue-600 dark:text-blue-400"
                      }
                    >
                      {item.type === "purchase" ? "Purchase" : "Sale"}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-50">
                    <Link
                      href={item.type === "purchase" ? `/dashboard/purchases/${item.id}` : `/dashboard/sales/${item.id}`}
                      className="hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      {item.contact}
                    </Link>
                  </td>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
