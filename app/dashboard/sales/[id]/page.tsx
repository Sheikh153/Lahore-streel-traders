import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { verifySession } from "@/app/lib/dal";
import { formatCurrency, formatDateLong, formatNumber } from "@/app/dashboard/_lib/format";
import PaymentsPanel from "@/app/dashboard/_components/PaymentsPanel";
import AttachmentsPanel from "@/app/dashboard/_components/AttachmentsPanel";
import ExpensesPanel from "@/app/dashboard/_components/ExpensesPanel";
import { getSaleById } from "../_lib/queries";
import {
  addSalePayment,
  deleteSalePayment,
  addSaleAttachment,
  removeSaleAttachment,
  createSaleExpense,
  deleteSaleExpense,
} from "../actions";

const SALE_EXPENSE_CATEGORIES = ["labour", "loading", "unloading", "transport", "other"];

export const metadata: Metadata = { title: "Sale detail" };

export default async function SaleDetailPage({
  params,
}: PageProps<"/dashboard/sales/[id]">) {
  await verifySession();
  const { id } = await params;

  const sale = await getSaleById(id);
  if (!sale) notFound();

  const weightDifference =
    sale.weighbridgeWeightKg !== null ? sale.weighbridgeWeightKg - sale.weightKg : null;
  const margin = sale.totalAmount > 0 ? (sale.profitAmount / sale.totalAmount) * 100 : 0;
  const profitPerKg = sale.weightKg > 0 ? sale.profitAmount / sale.weightKg : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            {sale.saleRef}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {formatDateLong(sale.date)} ·{" "}
            <Link href={`/dashboard/contacts/${sale.contactId}`} className="hover:text-blue-600 dark:hover:text-blue-400">
              {sale.contact.name}
            </Link>{" "}
            · {sale.material.name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/invoices/${sale.id}`}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
          >
            View invoice
          </Link>
          <Link
            href={`/dashboard/sales/${sale.id}/edit`}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Edit sale
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryTile label="Weight" value={`${formatNumber(sale.weightKg)} ${sale.material.unit}`} />
        <SummaryTile label="Sale value" value={formatCurrency(sale.totalAmount)} />
        <SummaryTile label="Grand total (incl. VAT)" value={formatCurrency(sale.grandTotal)} />
        <SummaryTile
          label="Profit"
          value={formatCurrency(sale.profitAmount)}
          emphasize={sale.profitAmount < 0 ? "bad" : "good"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-3 dark:border-slate-800 dark:bg-slate-900">
        <InfoField label="Rate" value={`${formatCurrency(sale.ratePerKg)}/${sale.material.unit}`} />
        <InfoField label="VAT" value={`${sale.vatPercent}% (${formatCurrency(sale.vatAmount)})`} />
        <InfoField label="Margin" value={`${margin.toFixed(1)}%`} />
        <InfoField label="Cost/kg at sale (avg)" value={formatCurrency(sale.costPerKgAtSale)} />
        <InfoField label="Profit/kg" value={formatCurrency(profitPerKg)} />
        <InfoField label="Weighbridge weight" value={sale.weighbridgeWeightKg !== null ? `${formatNumber(sale.weighbridgeWeightKg)} kg` : "—"} />
        <InfoField
          label="Weight difference"
          value={weightDifference !== null ? `${weightDifference > 0 ? "+" : ""}${weightDifference.toFixed(2)} kg` : "—"}
        />
        <InfoField label="Vehicle / container #" value={sale.vehicleNumber ?? "—"} />
        <InfoField label="Bilty #" value={sale.biltyNumber ?? "—"} />
        <InfoField label="Receipt # (buyer)" value={sale.receiptNumber ?? "—"} />
        <InfoField label="Thickness" value={sale.thicknessMm !== null ? `${formatNumber(sale.thicknessMm)} mm` : "—"} />
        <InfoField label="Height" value={sale.heightFt !== null ? `${formatNumber(sale.heightFt)} ft` : "—"} />
        <InfoField label="Length" value={sale.lengthFt !== null ? `${formatNumber(sale.lengthFt)} ft` : "—"} />
        <InfoField label="Notes" value={sale.notes ?? "—"} />
      </div>

      <ExpensesPanel
        expenses={sale.expenses}
        addAction={createSaleExpense.bind(null, sale.id)}
        deleteAction={deleteSaleExpense}
        categories={SALE_EXPENSE_CATEGORIES}
        heading="Expenses (labour, loading, unloading, transport…)"
      />

      <PaymentsPanel
        payments={sale.payments}
        totalAmount={sale.grandTotal}
        paidLabel="Received from buyer"
        addAction={addSalePayment.bind(null, sale.id, sale.contactId)}
        deleteAction={deleteSalePayment.bind(null, sale.id)}
      />

      <AttachmentsPanel
        attachments={sale.attachments}
        uploadAction={addSaleAttachment.bind(null, sale.id)}
        deleteAction={removeSaleAttachment.bind(null, sale.id)}
      />
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

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-sm text-slate-900 dark:text-slate-50">{value}</p>
    </div>
  );
}
