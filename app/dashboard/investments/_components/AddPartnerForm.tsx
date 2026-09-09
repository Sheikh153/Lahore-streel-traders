"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { PartnerFormState } from "../actions";

export default function AddPartnerForm({
  action,
}: {
  action: (
    state: PartnerFormState,
    formData: FormData,
  ) => Promise<PartnerFormState>;
}) {
  const [state, formAction] = useActionState<PartnerFormState, FormData>(
    action,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-wrap items-start gap-2">
      <input
        name="name"
        type="text"
        required
        placeholder="New partner name…"
        className="w-56 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
      />
      <SubmitButton />
      {state?.error && (
        <p className="w-full text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
    >
      {pending ? "Adding…" : "Add partner"}
    </button>
  );
}
