"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import type { MaterialFormState } from "../actions";

type MaterialFormProps = {
  action: (
    state: MaterialFormState,
    formData: FormData,
  ) => Promise<MaterialFormState>;
  defaultValues?: {
    name: string;
    unit: string;
    pricePerKg: number;
    stockKg: number;
    lowStockKg: number | null;
    location: string | null;
  };
  submitLabel: string;
  /** Only editable once a material exists — a new one always starts from opening stock. */
  showStockField?: boolean;
};

export default function MaterialForm({
  action,
  defaultValues,
  submitLabel,
  showStockField = false,
}: MaterialFormProps) {
  const [state, formAction] = useActionState<MaterialFormState, FormData>(
    action,
    undefined,
  );

  return (
    <form
      action={formAction}
      className="flex flex-col gap-5 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field
          label="Material name"
          name="name"
          required
          defaultValue={defaultValues?.name}
        />
        <Field
          label="Unit"
          name="unit"
          defaultValue={defaultValues?.unit ?? "kg"}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field
          label="Price per unit (Rs)"
          name="pricePerKg"
          type="number"
          step="0.01"
          min="0"
          required
          defaultValue={defaultValues?.pricePerKg?.toString()}
        />
        <Field
          label="Low stock threshold (optional)"
          name="lowStockKg"
          type="number"
          step="0.01"
          min="0"
          defaultValue={defaultValues?.lowStockKg?.toString() ?? ""}
        />
      </div>

      <Field
        label="Location (optional)"
        name="location"
        defaultValue={defaultValues?.location ?? ""}
        hint="Which yard, shed, or bin this material is stored in."
      />

      <Field
        label={showStockField ? "Current stock" : "Opening stock (optional)"}
        name="stockKg"
        type="number"
        step="0.01"
        min="0"
        defaultValue={defaultValues?.stockKg?.toString() ?? "0"}
        hint={
          showStockField
            ? "Normally kept in sync by purchases — edit only to correct a mistake."
            : "How much of this material you already have on hand, if any."
        }
      />

      {state?.error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400"
        >
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <SubmitButton label={submitLabel} />
        <Link
          href="/dashboard/inventory"
          className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Cancel
        </Link>
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
  step,
  min,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  step?: string;
  min?: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={name}
        className="text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        step={step}
        min={min}
        required={required}
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
      />
      {hint && (
        <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      )}
    </div>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}
