"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { CompanySettingsFormState } from "../actions";

export default function CompanySettingsForm({
  action,
  defaultValues,
}: {
  action: (
    state: CompanySettingsFormState,
    formData: FormData,
  ) => Promise<CompanySettingsFormState>;
  defaultValues: {
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    defaultVatPercent: number | null;
  };
}) {
  const [state, formAction] = useActionState<CompanySettingsFormState, FormData>(
    action,
    undefined,
  );

  return (
    <form
      action={formAction}
      className="flex flex-col gap-5 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
    >
      <Field label="Business name" name="name" required defaultValue={defaultValues.name} />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Phone" name="phone" type="tel" defaultValue={defaultValues.phone ?? ""} />
        <Field label="Email" name="email" type="email" defaultValue={defaultValues.email ?? ""} />
      </div>
      <Field label="Address" name="address" defaultValue={defaultValues.address ?? ""} />
      <Field
        label="Default VAT %"
        name="defaultVatPercent"
        type="number"
        defaultValue={defaultValues.defaultVatPercent?.toString() ?? ""}
      />
      <p className="text-xs text-slate-500 dark:text-slate-400">
        The business details appear as the letterhead on generated invoices; the
        default VAT % is prefilled on new sales (still editable per sale).
      </p>

      {state?.error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <SubmitButton />
        {state?.success && (
          <span className="text-sm font-medium text-[#006300] dark:text-[#0ca30c]">Saved</span>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
      />
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save changes"}
    </button>
  );
}
