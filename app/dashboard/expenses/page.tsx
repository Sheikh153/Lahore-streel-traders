import type { Metadata } from "next";
import Link from "next/link";
import { verifySession } from "@/app/lib/dal";
import { formatCurrency, formatDateLong } from "@/app/dashboard/_lib/format";
import DeleteButton from "@/app/dashboard/_components/DeleteButton";
import { getCompanyExpenses } from "./_lib/queries";
import { ensureExpensePeriodsArchived, getExpenseArchives, periodStartFor } from "./_lib/archive";
import { deleteCompanyExpense, createCompanyExpense } from "./actions";
import { CATEGORY_LABEL, type CompanyExpenseCategory } from "./_lib/categories";
import CompanyExpenseForm from "./_components/CompanyExpenseForm";

export const metadata: Metadata = { title: "Expenses" };

export default async function ExpensesPage({
  searchParams,
}: PageProps<"/dashboard/expenses">) {
  await verifySession();
  const { q } = await searchParams;
  const search = typeof q === "string" ? q : undefined;

  // Files away any past period (10th-to-9th) that hasn't been archived
  // yet — this is what makes the list "reset" on the 10th of each month.
  await ensureExpensePeriodsArchived();

  const [expenses, archives] = await Promise.all([
    getCompanyExpenses(search),
    getExpenseArchives(),
  ]);
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const currentPeriodStart = periodStartFor(new Date());

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
          Expenses
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Business overhead — rent, utilities, salaries, and other running costs.
          These reduce net profit but aren&apos;t tied to any purchase or sale.
          The list below resets on the 10th of each month — last month&apos;s
          entries are filed under Archived months.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {search ? "Matching total" : "Total (this period)"}
        </p>
        <p className="mt-1 text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-50">
          {formatCurrency(total)}
        </p>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          Since {formatDateLong(currentPeriodStart)}
        </p>
      </div>

      <CompanyExpenseForm action={createCompanyExpense} />

      <form className="flex" method="get">
        <input
          type="search"
          name="q"
          defaultValue={search}
          placeholder="Search by category or notes…"
          className="w-full max-w-sm rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </form>

      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
              {search ? "No expenses match your search" : "No expenses recorded yet"}
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Add your first overhead expense above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400">
                  <th className="px-5 py-2.5 font-medium">Date</th>
                  <th className="px-5 py-2.5 font-medium">Category</th>
                  <th className="px-5 py-2.5 font-medium">Notes</th>
                  <th className="px-5 py-2.5 text-right font-medium">Amount</th>
                  <th className="px-5 py-2.5">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="whitespace-nowrap px-5 py-3 tabular-nums text-slate-500 dark:text-slate-400">
                      {formatDateLong(e.date)}
                    </td>
                    <td className="px-5 py-3 text-slate-900 dark:text-slate-50">
                      {CATEGORY_LABEL[e.category as CompanyExpenseCategory] ?? e.category}
                    </td>
                    <td className="max-w-[280px] truncate px-5 py-3 text-slate-600 dark:text-slate-300">
                      {e.notes ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums font-medium text-slate-900 dark:text-slate-50">
                      {formatCurrency(e.amount)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <DeleteButton
                        action={deleteCompanyExpense.bind(null, e.id)}
                        confirmMessage="Delete this expense?"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {archives.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 px-5 py-3 dark:border-slate-800">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Archived months
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Filed away automatically at the start of each period. Open one to view or print it.
            </p>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {archives.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/dashboard/expenses/archive/${a.id}`}
                  className="flex items-center justify-between gap-3 px-5 py-3 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <span className="text-slate-900 dark:text-slate-50">{a.label}</span>
                  <span className="tabular-nums font-medium text-slate-700 dark:text-slate-300">
                    {formatCurrency(a.totalAmount)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
