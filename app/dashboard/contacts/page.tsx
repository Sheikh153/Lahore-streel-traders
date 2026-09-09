import type { Metadata } from "next";
import Link from "next/link";
import { verifySession } from "@/app/lib/dal";
import DeleteButton from "@/app/dashboard/_components/DeleteButton";
import { getContactsWithActivity } from "./_lib/queries";
import { deleteContact } from "./actions";
import ContactTypeBadge from "./_components/ContactTypeBadge";

export const metadata: Metadata = { title: "Contacts" };

export default async function ContactsPage({
  searchParams,
}: PageProps<"/dashboard/contacts">) {
  await verifySession();
  const { q } = await searchParams;
  const search = typeof q === "string" ? q : undefined;
  const contacts = await getContactsWithActivity(search);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            Contacts
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {contacts.length} {contacts.length === 1 ? "contact" : "contacts"} — suppliers and buyers
          </p>
        </div>
        <Link
          href="/dashboard/contacts/new"
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
        >
          + Add contact
        </Link>
      </div>

      <form className="flex" method="get">
        <input
          type="search"
          name="q"
          defaultValue={search}
          placeholder="Search by name, CNIC, or phone…"
          className="w-full max-w-sm rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </form>

      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
              {search ? "No contacts match your search" : "No contacts yet"}
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {search
                ? "Try a different name, CNIC, or phone number."
                : "Add your first supplier or buyer to get started."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400">
                  <th className="px-5 py-2.5 font-medium">Name</th>
                  <th className="px-5 py-2.5 font-medium">Type</th>
                  <th className="px-5 py-2.5 font-medium">Phone</th>
                  <th className="px-5 py-2.5 font-medium">CNIC</th>
                  <th className="px-5 py-2.5 text-right font-medium">Transactions</th>
                  <th className="px-5 py-2.5">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => (
                  <tr key={contact.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-50">
                      <Link
                        href={`/dashboard/contacts/${contact.id}`}
                        className="hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        {contact.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <ContactTypeBadge type={contact.type} />
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                      {contact.phone ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                      {contact.cnic ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="tabular-nums text-slate-600 dark:text-slate-300">
                          {contact.transactions}
                        </span>
                        {contact.transactions >= 2 && (
                          <span className="rounded-full bg-[#0ca30c]/10 px-2 py-0.5 text-xs font-medium text-[#006300] dark:text-[#0ca30c]">
                            Repeat
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-4">
                        <Link
                          href={`/dashboard/contacts/${contact.id}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
                        >
                          Ledger
                        </Link>
                        <Link
                          href={`/dashboard/contacts/${contact.id}/edit`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
                        >
                          Edit
                        </Link>
                        <DeleteButton
                          action={deleteContact.bind(null, contact.id)}
                          confirmMessage={`Delete ${contact.name}? This can't be undone.`}
                        />
                      </div>
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
