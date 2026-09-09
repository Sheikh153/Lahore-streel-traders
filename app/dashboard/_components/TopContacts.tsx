import Link from "next/link";
import { formatCurrency } from "../_lib/format";

export type TopContact = {
  id: string;
  name: string;
  totalAmount: number;
  transactions: number;
};

function initials(name: string) {
  return (
    name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?"
  );
}

export default function TopContacts({ data }: { data: TopContact[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
          Top contacts
        </h3>
        <Link
          href="/dashboard/contacts"
          className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
        >
          View all
        </Link>
      </div>

      {data.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">No activity yet.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-4">
          {data.map((contact) => (
            <li key={contact.id} className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                {initials(contact.name)}
              </span>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/dashboard/contacts/${contact.id}`}
                  className="block truncate text-sm font-medium text-slate-900 hover:text-blue-600 dark:text-slate-50 dark:hover:text-blue-400"
                >
                  {contact.name}
                </Link>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {contact.transactions} transactions
                </p>
              </div>
              <p className="text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-50">
                {formatCurrency(contact.totalAmount)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
