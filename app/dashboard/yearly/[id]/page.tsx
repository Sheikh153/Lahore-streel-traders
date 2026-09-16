import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { verifySession } from "@/app/lib/dal";
import { formatCurrency, formatDateLong } from "@/app/dashboard/_lib/format";
import { getCompanySettings } from "@/app/dashboard/settings/_lib/queries";
import { getYearlyReportById } from "@/app/dashboard/_lib/yearlyReports";
import PrintButton from "@/app/dashboard/_components/PrintButton";

export const metadata: Metadata = { title: "Yearly report" };

export default async function YearlyReportPage({
  params,
}: PageProps<"/dashboard/yearly/[id]">) {
  await verifySession();
  const { id } = await params;

  const [report, company] = await Promise.all([
    getYearlyReportById(id),
    getCompanySettings(),
  ]);
  if (!report) notFound();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-6 print:p-0">
      <div className="flex items-center justify-between print:hidden">
        <Link href="/dashboard" className="text-sm font-medium text-blue-600 hover:text-blue-500">
          ← Back to overview
        </Link>
        <PrintButton />
      </div>

      {/* Intentionally light-themed regardless of viewer theme — same
          print-as-is convention as the invoice and expense archive pages. */}
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
              Yearly report
            </h2>
            <p className="mt-1 text-sm text-slate-600">{report.label}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 py-6 sm:grid-cols-3">
          <ReportStat label="Revenue" value={formatCurrency(report.revenue)} />
          <ReportStat label="Net profit" value={formatCurrency(report.netProfit)} />
          <ReportStat label="Stock value" value={formatCurrency(report.stockValue)} />
          <ReportStat label="Stock on hand" value={`${report.stockOnHandKg.toLocaleString("en-US")} kg`} />
          <ReportStat label="Weight bought" value={`${report.weightBought.toLocaleString("en-US")} kg`} />
          <ReportStat label="Weight sold" value={`${report.weightSold.toLocaleString("en-US")} kg`} />
          <ReportStat label="Receivables" value={formatCurrency(report.receivables)} />
          <ReportStat label="Payables" value={formatCurrency(report.payables)} />
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          Saved on {formatDateLong(report.createdAt)}
          {report.updatedAt.getTime() !== report.createdAt.getTime()
            ? ` (last refreshed ${formatDateLong(report.updatedAt)})`
            : ""}
          .
        </p>
      </div>
    </div>
  );
}

function ReportStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
