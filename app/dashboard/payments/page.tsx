import type { Metadata } from "next";
import Link from "next/link";
import { verifySession } from "@/app/lib/dal";
import { formatCurrency, formatDateLong } from "@/app/dashboard/_lib/format";
import { getAllPayments } from "./_lib/queries";

export const metadata: Metadata = { title: "Payments" };

export default async function PaymentsPage() {
  await verifySession();
  const payments = await getAllPayments();

  const totalOut = payments.filter((p) => p.direction === "out").reduce((s, p) => s + p.amount, 0);
  const totalIn = payments.filter((p) => p.direction === "in").reduce((s, p) => s + p.amount, 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
          Payments
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Every payment made or received, across all purchases and sales.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs text-slate-500 dark:text-slate-400">Paid to suppliers</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-50">
            {formatCurrency(totalOut)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs text-slate-500 dark:text-slate-400">Received from buyers</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-50">
            {formatCurrency(totalIn)}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-50">No payments yet</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Record a payment from a purchase or sale&apos;s detail page.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400">
                  <th className="px-5 py-2.5 font-medium">Date</th>
                  <th className="px-5 py-2.5 font-medium">Direction</th>
                  <th className="px-5 py-2.5 font-medium">Contact</th>
                  <th className="px-5 py-2.5 font-medium">Against</th>
                  <th className="px-5 py-2.5 font-medium">Method</th>
                  <th className="px-5 py-2.5 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => {
                  const against = p.purchase
                    ? { label: p.purchase.lotId, href: `/dashboard/purchases/${p.purchaseId}` }
                    : p.sale
                      ? { label: p.sale.saleRef, href: `/dashboard/sales/${p.saleId}` }
                      : null;
                  return (
                    <tr key={p.id} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="whitespace-nowrap px-5 py-3 tabular-nums text-slate-500 dark:text-slate-400">
                        {formatDateLong(p.createdAt)}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`text-sm font-medium ${
                            p.direction === "out"
                              ? "text-[#d03b3b]"
                              : "text-[#006300] dark:text-[#0ca30c]"
                          }`}
                        >
                          {p.direction === "out" ? "Paid" : "Received"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-900 dark:text-slate-50">
                        <Link href={`/dashboard/contacts/${p.contactId}`} className="hover:text-blue-600 dark:hover:text-blue-400">
                          {p.contact.name}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                        {against ? (
                          <Link href={against.href} className="hover:text-blue-600 dark:hover:text-blue-400">
                            {against.label}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{p.method ?? "—"}</td>
                      <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums font-medium text-slate-900 dark:text-slate-50">
                        {formatCurrency(p.amount)}
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
