import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { verifySession } from "@/app/lib/dal";
import { formatCurrency, formatDateLong, formatNumber } from "@/app/dashboard/_lib/format";
import { getSaleById } from "@/app/dashboard/sales/_lib/queries";
import { getCompanySettings } from "@/app/dashboard/settings/_lib/queries";
import PrintButton from "./_components/PrintButton";

export const metadata: Metadata = { title: "Invoice" };

export default async function InvoicePage({
  params,
}: PageProps<"/invoices/[saleId]">) {
  await verifySession();
  const { saleId } = await params;

  const [sale, company] = await Promise.all([getSaleById(saleId), getCompanySettings()]);
  if (!sale) notFound();

  const paidAmount = sale.payments.reduce((s, p) => s + p.amount, 0);
  const balanceDue = sale.grandTotal - paidAmount;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-6 print:p-0">
      <div className="flex items-center justify-between print:hidden">
        <Link href={`/dashboard/sales/${sale.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-500">
          ← Back to sale
        </Link>
        <PrintButton />
      </div>

      {/* Invoice document — intentionally light-themed regardless of viewer
          theme, since this is meant to be printed/exported as-is. */}
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
            <h2 className="text-2xl font-bold uppercase tracking-wide text-slate-800">Invoice</h2>
            <p className="mt-1 text-sm text-slate-600">{sale.saleRef}</p>
            <p className="text-sm text-slate-600">{formatDateLong(sale.date)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 py-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Bill to</p>
            <p className="mt-1 font-medium">{sale.contact.name}</p>
            {sale.contact.address && <p className="text-sm text-slate-600">{sale.contact.address}</p>}
            <p className="text-sm text-slate-600">
              {[sale.contact.phone, sale.contact.cnic].filter(Boolean).join(" · ")}
            </p>
          </div>
          <div className="text-right">
            {sale.vehicleNumber && (
              <p className="text-sm text-slate-600">Vehicle/container: {sale.vehicleNumber}</p>
            )}
            {sale.biltyNumber && <p className="text-sm text-slate-600">Bilty #: {sale.biltyNumber}</p>}
            {sale.receiptNumber && (
              <p className="text-sm text-slate-600">Receipt #: {sale.receiptNumber}</p>
            )}
            {sale.weighbridgeWeightKg !== null && (
              <p className="text-sm text-slate-600">
                Weighbridge weight: {formatNumber(sale.weighbridgeWeightKg)} kg
              </p>
            )}
            {(sale.thicknessMm !== null || sale.heightFt !== null || sale.lengthFt !== null) && (
              <p className="text-sm text-slate-600">
                Dimensions:{" "}
                {[
                  sale.thicknessMm !== null ? `${formatNumber(sale.thicknessMm)}mm (T)` : null,
                  sale.heightFt !== null ? `${formatNumber(sale.heightFt)}ft (H)` : null,
                  sale.lengthFt !== null ? `${formatNumber(sale.lengthFt)}ft (L)` : null,
                ]
                  .filter(Boolean)
                  .join(" × ")}
              </p>
            )}
          </div>
        </div>

        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-y border-slate-200 text-slate-500">
              <th className="py-2 font-medium">Description</th>
              <th className="py-2 text-right font-medium">Weight</th>
              <th className="py-2 text-right font-medium">Rate</th>
              <th className="py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100">
              <td className="py-3">{sale.material.name}</td>
              <td className="py-3 text-right tabular-nums">
                {formatNumber(sale.weightKg)} {sale.material.unit}
              </td>
              <td className="py-3 text-right tabular-nums">
                {formatCurrency(sale.ratePerKg)}/{sale.material.unit}
              </td>
              <td className="py-3 text-right tabular-nums font-medium">
                {formatCurrency(sale.totalAmount)}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="flex justify-end py-6">
          <div className="w-full max-w-xs text-sm">
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Subtotal</span>
              <span className="tabular-nums">{formatCurrency(sale.totalAmount)}</span>
            </div>
            {sale.vatPercent > 0 && (
              <div className="flex justify-between py-1">
                <span className="text-slate-500">VAT ({sale.vatPercent}%)</span>
                <span className="tabular-nums">{formatCurrency(sale.vatAmount)}</span>
              </div>
            )}
            <div className="flex justify-between py-1 font-medium">
              <span className="text-slate-500">Total</span>
              <span className="tabular-nums">{formatCurrency(sale.grandTotal)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Amount paid</span>
              <span className="tabular-nums">{formatCurrency(paidAmount)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 py-2 text-base font-semibold">
              <span>Balance due</span>
              <span className="tabular-nums">{formatCurrency(balanceDue)}</span>
            </div>
          </div>
        </div>

        {sale.notes && (
          <div className="border-t border-slate-200 pt-4 text-sm text-slate-600">
            <p className="font-medium text-slate-500">Notes</p>
            <p className="mt-1">{sale.notes}</p>
          </div>
        )}

        <p className="mt-8 text-center text-xs text-slate-400">Thank you for your business.</p>
      </div>
    </div>
  );
}
