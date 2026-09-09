import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { verifySession } from "@/app/lib/dal";
import { getContactById } from "../../_lib/queries";
import { updateContact } from "../../actions";
import ContactForm from "../../_components/ContactForm";

export const metadata: Metadata = { title: "Edit contact" };

export default async function EditContactPage({
  params,
}: PageProps<"/dashboard/contacts/[id]/edit">) {
  await verifySession();
  const { id } = await params;
  const contact = await getContactById(id);

  if (!contact) {
    notFound();
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
          Edit contact
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Update {contact.name}&apos;s details.
        </p>
      </div>

      <ContactForm
        action={updateContact.bind(null, contact.id)}
        defaultValues={contact}
        submitLabel="Save changes"
      />
    </div>
  );
}
