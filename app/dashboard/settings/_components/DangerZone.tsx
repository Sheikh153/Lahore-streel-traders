"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import type { WipeState } from "../actions";

// Deliberately heavier-handed than DeleteButton's click-through modal: this
// is permanent for every sale and purchase ever recorded, so it's gated
// behind typing the phrase out, not just confirming a dialog.
export default function DangerZone({
  action,
  confirmPhrase,
}: {
  action: (state: WipeState, formData: FormData) => Promise<WipeState>;
  confirmPhrase: string;
}) {
  const [state, formAction] = useActionState<WipeState, FormData>(action, undefined);
  const [typed, setTyped] = useState("");
  const [open, setOpen] = useState(false);
  const matches = typed === confirmPhrase;

  return (
    <div className="rounded-xl border border-red-200 bg-red-50/50 p-5 dark:border-red-900/50 dark:bg-red-950/10">
      <h3 className="text-sm font-semibold text-red-700 dark:text-red-400">Danger zone</h3>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Permanently delete every sale and purchase on record, along with their payments, expenses,
        and attachments — resets every material&apos;s stock to zero and clears the saved yearly/monthly
        report snapshots too, so every reading goes back to zero. This cannot be undone.
      </p>

      <a
        href="/api/admin/export-sales-purchases"
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
      >
        Download a backup first →
      </a>

      {!open ? (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-lg border border-red-300 px-3.5 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            Delete all sales &amp; purchases…
          </button>
        </div>
      ) : (
        <form action={formAction} className="mt-4 flex flex-col gap-2.5">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Type <span className="font-mono font-semibold text-red-700 dark:text-red-400">{confirmPhrase}</span> to confirm
          </label>
          <input
            name="confirmation"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />

          {state?.error && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {state.error}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setTyped("");
              }}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <SubmitButton disabled={!matches} />
          </div>
        </form>
      )}
    </div>
  );
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="rounded-lg bg-red-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {pending ? "Deleting…" : "Permanently delete everything"}
    </button>
  );
}
