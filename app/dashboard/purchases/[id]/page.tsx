import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { verifySession } from "@/app/lib/dal";
import { formatCurrency, formatCurrencyPerKg, formatDateLong, formatNumber } from "@/app/dashboard/_lib/format";
import PaymentsPanel from "@/app/dashboard/_components/PaymentsPanel";
import AttachmentsPanel from "@/app/dashboard/_components/AttachmentsPanel";
import { getPurchaseById } from "../_lib/queries";
import {
  addPurchasePayment,
  deletePurchasePayment,
  addPurchaseAttachment,
  removePurchaseAttachment,
  createExpense,
  deleteExpense,
} from "../actions";
import ExpensesPanel from "@/app/dashboard/_components/ExpensesPanel";
import { getLotRemaining } from "@/app/dashboard/_lib/lots";

export const metadata: Metadata = { title: "Purchase detail" };

export default async function PurchaseDetailPage({
  params,
}: PageProps<"/dashboard/purchases/[id]">) {
  await verifySession();
  const { id } = await params;

  const purchase = await getPurchaseById(id);
  if (!purchase) notFound();

  const lot = await getLotRemaining(id);
  const soldKg = lot ? lot.weightKg - lot.remainingKg : 0;

  const weightDifference =
    purchase.weighbridgeWeightKg !== null
      ? purchase.weighbridgeWeightKg - purchase.weightKg
      : null;
  const expenseTotal = purchase.expenses.reduce((s, e) => s + e.amount, 0);
  const landedTotal = purchase.weightKg * purchase.landedCostPerKg;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            {purchase.lotId}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {formatDateLong(purchase.date)} ·{" "}
            <Link
              href={`/dashboard/contacts/${purchase.contactId}`}
              className="hover:text-blue-600 dark:hover:text-blue-400"
            >
              {purchase.contact.name}
            </Link>{" "}
            · {purchase.material.name}
          </p>
        </div>
        <Link
          href={`/dashboard/purchases/${purchase.id}/edit`}
          className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Edit lot
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryTile label="Weight" value={`${formatNumber(purchase.weightKg)} ${purchase.material.unit}`} />
        <SummaryTile label="Rate" value={`${formatCurrency(purchase.ratePerKg)}/${purchase.material.unit}`} />
        <SummaryTile label="Purchase total" value={formatCurrency(purchase.totalAmount)} />
        <SummaryTile
          label="Landed cost/kg"
          value={formatCurrencyPerKg(purchase.landedCostPerKg)}
          hint={`incl. ${formatCurrency(expenseTotal)} expenses`}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <SummaryTile label="Sold from this lot" value={`${formatNumber(soldKg)} ${purchase.material.unit}`} />
        <SummaryTile
          label="Remaining in this lot"
          value={`${formatNumber(lot?.remainingKg ?? purchase.weightKg)} ${purchase.material.unit}`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-3 dark:border-slate-800 dark:bg-slate-900">
        <InfoField label="Weighbridge weight" value={purchase.weighbridgeWeightKg !== null ? `${formatNumber(purchase.weighbridgeWeightKg)} kg` : "—"} />
        <InfoField
          label="Weight difference"
          value={weightDifference !== null ? `${weightDifference > 0 ? "+" : ""}${weightDifference.toFixed(2)} kg` : "—"}
        />
        <InfoField label="Vehicle / container #" value={purchase.vehicleNumber ?? "—"} />
        <InfoField label="Bilty #" value={purchase.biltyNumber ?? "—"} />
        <InfoField label="Receipt # (supplier)" value={purchase.receiptNumber ?? "—"} />
        <InfoField label="Landed total cost" value={formatCurrency(landedTotal)} />
        <InfoField label="Thickness" value={purchase.thicknessMm !== null ? `${formatNumber(purchase.thicknessMm)} mm` : "—"} />
        <InfoField label="Height" value={purchase.heightFt !== null ? `${formatNumber(purchase.heightFt)} ft` : "—"} />
        <InfoField label="Length" value={purchase.lengthFt !== null ? `${formatNumber(purchase.lengthFt)} ft` : "—"} />
        <InfoField label="Notes" value={purchase.notes ?? "—"} />
      </div>

      <ExpensesPanel
        expenses={purchase.expenses}
        addAction={createExpense.bind(null, purchase.id)}
        deleteAction={deleteExpense}
      />

      <PaymentsPanel
        payments={purchase.payments}
        totalAmount={purchase.totalAmount}
        paidLabel="Paid to supplier"
        addAction={addPurchasePayment.bind(null, purchase.id, purchase.contactId)}
        deleteAction={deletePurchasePayment.bind(null, purchase.id)}
      />

      <AttachmentsPanel
        attachments={purchase.attachments}
        uploadAction={addPurchaseAttachment.bind(null, purchase.id)}
        deleteAction={removePurchaseAttachment.bind(null, purchase.id)}
      />
    </div>
  );
}

function SummaryTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-50">{value}</p>
      {hint && <p className="text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
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
