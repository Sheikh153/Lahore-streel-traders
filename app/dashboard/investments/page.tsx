import type { Metadata } from "next";
import { verifySession } from "@/app/lib/dal";
import { formatCurrency, formatDateLong } from "@/app/dashboard/_lib/format";
import DeleteButton from "@/app/dashboard/_components/DeleteButton";
import { getInvestments, getInvestmentTotals, getPartners } from "./_lib/queries";
import { createInvestment, deleteInvestment, createPartner, deletePartner } from "./actions";
import InvestmentForm from "./_components/InvestmentForm";
import AddPartnerForm from "./_components/AddPartnerForm";

export const metadata: Metadata = { title: "Investments" };

export default async function InvestmentsPage({
  searchParams,
}: PageProps<"/dashboard/investments">) {
  await verifySession();
  const { q } = await searchParams;
  const search = typeof q === "string" ? q : undefined;

  const [investments, totals, partners] = await Promise.all([
    getInvestments(search),
    getInvestmentTotals(),
    getPartners(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
          Investments
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Capital the partners have put into the business — equity, not revenue.
          It doesn&apos;t affect profit or loss.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Total capital invested
          </p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-50">
            {formatCurrency(totals.grandTotal)}
          </p>
        </div>
        {totals.byPartner.map((p) => (
          <div
            key={p.id}
            className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="text-xs text-slate-500 dark:text-slate-400">{p.name}</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-50">
              {formatCurrency(p.total)}
            </p>
          </div>
        ))}
      </div>

      <InvestmentForm action={createInvestment} partners={partners} />

      <details className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <summary className="cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-200">
          Manage partners
        </summary>
        <div className="mt-3 flex flex-col gap-3">
          <AddPartnerForm action={createPartner} />
          {partners.length > 0 && (
            <ul className="flex flex-col gap-1.5">
              {partners.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-1.5 text-sm dark:border-slate-800"
                >
                  <span className="text-slate-900 dark:text-slate-50">{p.name}</span>
                  <DeleteButton
                    action={deletePartner.bind(null, p.id)}
                    confirmMessage={`Remove partner "${p.name}"? This only works if they have no investments on record.`}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </details>

      <form className="flex" method="get">
        <input
          type="search"
          name="q"
          defaultValue={search}
          placeholder="Search by partner or notes…"
          className="w-full max-w-sm rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </form>

      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {investments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
              {search ? "No investments match your search" : "No investments recorded yet"}
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Add the first capital contribution above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400">
                  <th className="px-5 py-2.5 font-medium">Date</th>
                  <th className="px-5 py-2.5 font-medium">Partner</th>
                  <th className="px-5 py-2.5 font-medium">Notes</th>
                  <th className="px-5 py-2.5 text-right font-medium">Amount</th>
                  <th className="px-5 py-2.5">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {investments.map((inv) => (
                  <tr key={inv.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="whitespace-nowrap px-5 py-3 tabular-nums text-slate-500 dark:text-slate-400">
                      {formatDateLong(inv.date)}
                    </td>
                    <td className="px-5 py-3 text-slate-900 dark:text-slate-50">
                      {inv.partner.name}
                    </td>
                    <td className="max-w-[280px] truncate px-5 py-3 text-slate-600 dark:text-slate-300">
                      {inv.notes ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums font-medium text-slate-900 dark:text-slate-50">
                      {formatCurrency(inv.amount)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <DeleteButton
                        action={deleteInvestment.bind(null, inv.id)}
                        confirmMessage="Delete this investment record?"
                      />
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
