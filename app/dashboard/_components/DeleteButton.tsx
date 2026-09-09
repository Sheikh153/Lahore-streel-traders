"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

export type DeleteState = { error?: string } | undefined;

// Uses an in-app modal rather than window.confirm/alert. Native dialogs can
// get silently suppressed by the browser (e.g. Chrome's "prevent this page
// from creating additional dialogs" after a few appear in a row) — once
// that happens, clicking Delete does nothing visible at all, which reads
// exactly like the feature being broken. A modal we render ourselves can't
// be suppressed that way, and it can show the error inline instead of
// depending on alert() firing.
export default function DeleteButton({
  action,
  confirmMessage,
  label = "Delete",
}: {
  action: (state: DeleteState, formData: FormData) => Promise<DeleteState>;
  confirmMessage: string;
  label?: string;
}) {
  const [state, formAction] = useActionState<DeleteState, FormData>(
    action,
    undefined,
  );
  const [open, setOpen] = useState(false);

  // A successful delete removes this row (and this component) from the tree
  // via revalidation, so there's nothing to close in that case — the modal
  // only ever needs to stay open here, which it already is (it can't submit
  // unless it was open to begin with), to show a fresh error inline.
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-red-600 hover:text-red-500 dark:text-red-400"
      >
        {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Cancel"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-slate-950/50"
          />
          <div
            role="alertdialog"
            aria-modal="true"
            className="relative w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="text-sm text-slate-700 dark:text-slate-300">{confirmMessage}</p>

            {state?.error && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
                {state.error}
              </p>
            )}

            <form action={formAction} className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <SubmitButton label={label} />
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  const pendingLabel = label === "Remove" ? "Removing…" : "Deleting…";
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-red-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
