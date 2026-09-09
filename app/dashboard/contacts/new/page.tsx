import type { Metadata } from "next";
import { verifySession } from "@/app/lib/dal";
import { createContact } from "../actions";
import ContactForm from "../_components/ContactForm";

export const metadata: Metadata = { title: "Add contact" };

export default async function NewContactPage() {
  await verifySession();

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
          Add contact
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Add a new supplier or buyer to your CRM.
        </p>
      </div>

      <ContactForm action={createContact} submitLabel="Add contact" />
    </div>
  );
}
