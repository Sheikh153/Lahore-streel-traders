import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { verifySession } from "@/app/lib/dal";
import { formatCurrency, formatDateLong } from "@/app/dashboard/_lib/format";
import { getContactById } from "../_lib/queries";
import { getContactLedger } from "../_lib/ledger";
import ContactTypeBadge from "../_components/ContactTypeBadge";

export const metadata: Metadata = { title: "Contact ledger" };

const ENTRY_LABEL: Record<string, string> = {
  purchase: "Purchase (payable)",
  sale: "Sale (receivable)",
  "payment-out": "Payment made",
  "payment-in": "Payment received",
};

export default async function ContactLedgerPage({
  params,
}: PageProps<"/dashboard/contacts/[id]">) {
  await verifySession();
  const { id } = await params;

  const contact = await getContactById(id);
  if (!contact) notFound();

  const ledger = await getContactLedger(id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
              {contact.name}
            </h1>
            <ContactTypeBadge type={contact.type} />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {[contact.phone, contact.cnic, contact.address].filter(Boolean).join(" · ") || "No contact details"}
          </p>
        </div>
        <Link
          href={`/dashboard/contacts/${contact.id}/edit`}
          className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Edit contact
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryTile label="Total purchased" value={formatCurrency(ledger.purchasesTotal)} />
        <SummaryTile label="Total sold" value={formatCurrency(ledger.salesTotal)} />
        <SummaryTile
          label="Payable (we owe)"
          value={formatCurrency(ledger.payableBalance)}
          emphasize={ledger.payableBalance > 0}
        />
        <SummaryTile
          label="Receivable (owed to us)"
          value={formatCurrency(ledger.receivableBalance)}
          emphasize={ledger.receivableBalance > 0}
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 p-5 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            Transaction &amp; payment history
          </h2>
        </div>
        {ledger.entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
              No activity yet
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Purchases, sales, and payments involving {contact.name} will show up here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400">
                  <th className="px-5 py-2.5 font-medium">Date</th>
                  <th className="px-5 py-2.5 font-medium">Type</th>
                  <th className="px-5 py-2.5 font-medium">Details</th>
                  <th className="px-5 py-2.5 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {ledger.entries.map((entry) => {
                  const href =
                    entry.type === "purchase"
                      ? `/dashboard/purchases/${entry.id}`
                      : entry.type === "sale"
                        ? `/dashboard/sales/${entry.id}`
                        : null;
                  return (
                    <tr key={`${entry.type}-${entry.id}`} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="whitespace-nowrap px-5 py-3 tabular-nums text-slate-500 dark:text-slate-400">
                        {formatDateLong(entry.date)}
                      </td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                        {ENTRY_LABEL[entry.type]}
                      </td>
                      <td className="px-5 py-3 text-slate-900 dark:text-slate-50">
                        {href ? (
                          <Link href={href} className="hover:text-blue-600 dark:hover:text-blue-400">
                            {entry.label}
                          </Link>
                        ) : (
                          entry.label
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums font-medium text-slate-900 dark:text-slate-50">
                        {formatCurrency(entry.amount)}
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
  emphasize?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p
        className={`mt-1 text-lg font-semibold tabular-nums ${
          emphasize ? "text-[#d03b3b]" : "text-slate-900 dark:text-slate-50"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
