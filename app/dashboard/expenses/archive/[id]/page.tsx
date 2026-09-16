import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { verifySession } from "@/app/lib/dal";
import { formatCurrency, formatDateLong } from "@/app/dashboard/_lib/format";
import { getCompanySettings } from "@/app/dashboard/settings/_lib/queries";
import { getExpenseArchiveById } from "../../_lib/archive";
import { CATEGORY_LABEL, type CompanyExpenseCategory } from "../../_lib/categories";
import PrintButton from "@/app/dashboard/_components/PrintButton";

export const metadata: Metadata = { title: "Archived expenses" };

export default async function ExpenseArchivePage({
  params,
}: PageProps<"/dashboard/expenses/archive/[id]">) {
  await verifySession();
  const { id } = await params;

  const [archive, company] = await Promise.all([
    getExpenseArchiveById(id),
    getCompanySettings(),
  ]);
  if (!archive) notFound();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-6 print:p-0">
      <div className="flex items-center justify-between print:hidden">
        <Link href="/dashboard/expenses" className="text-sm font-medium text-blue-600 hover:text-blue-500">
          ← Back to expenses
        </Link>
        <PrintButton />
      </div>

      {/* Intentionally light-themed regardless of viewer theme, since this
          is meant to be printed/exported as-is — same convention as the
          invoice page. */}
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-slate-900 print:rounded-none print:border-none print:p-0">
        <div className="flex items-start justify-between border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-xl font-semibold">{company.name}</h1>
            {company.address && <p className="mt-1 text-sm text-slate-600">{company.address}</p>}
            <p className="text-sm text-slate-600">
              {[company.phone, company.email].filter(Boolean).join(" · ")}
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold uppercase tracking-wide text-slate-800">
              Expense report
            </h2>
            <p className="mt-1 text-sm text-slate-600">{archive.label}</p>
          </div>
        </div>

        <table className="mt-6 w-full text-left text-sm">
          <thead>
            <tr className="border-y border-slate-200 text-slate-500">
              <th className="py-2 font-medium">Date</th>
              <th className="py-2 font-medium">Category</th>
              <th className="py-2 font-medium">Notes</th>
              <th className="py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {archive.expenses.map((e) => (
              <tr key={e.id} className="border-b border-slate-100">
                <td className="py-3 tabular-nums text-slate-600">{formatDateLong(e.date)}</td>
                <td className="py-3">{CATEGORY_LABEL[e.category as CompanyExpenseCategory] ?? e.category}</td>
                <td className="py-3 text-slate-600">{e.notes ?? "—"}</td>
                <td className="py-3 text-right tabular-nums font-medium">{formatCurrency(e.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end py-6">
          <div className="flex w-full max-w-xs justify-between border-t border-slate-200 py-2 text-base font-semibold">
            <span>Total</span>
            <span className="tabular-nums">{formatCurrency(archive.totalAmount)}</span>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          Archived automatically on {formatDateLong(archive.createdAt)}.
        </p>
      </div>
    </div>
  );
}
