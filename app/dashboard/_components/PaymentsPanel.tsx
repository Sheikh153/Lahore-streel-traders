"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { formatCurrency, formatDateLong } from "@/app/dashboard/_lib/format";
import type { PaymentActionState } from "@/app/dashboard/_lib/payments";
import DeleteButton, { type DeleteState } from "./DeleteButton";

type Payment = {
  id: string;
  amount: number;
  method: string | null;
  notes: string | null;
  createdAt: string | Date;
};

export default function PaymentsPanel({
  payments,
  totalAmount,
  paidLabel,
  addAction,
  deleteAction,
}: {
  payments: Payment[];
  totalAmount: number;
  /** e.g. "Paid to supplier" or "Received from buyer" */
  paidLabel: string;
  addAction: (
    state: PaymentActionState,
    formData: FormData,
  ) => Promise<PaymentActionState>;
  deleteAction: (id: string, state: DeleteState, formData: FormData) => Promise<DeleteState>;
}) {
  const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = totalAmount - paidAmount;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Payments</h3>

      <div className="mt-3 grid grid-cols-3 gap-3 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-950">
        <Stat label="Total" value={formatCurrency(totalAmount)} />
        <Stat label={paidLabel} value={formatCurrency(paidAmount)} />
        <Stat
          label="Balance"
          value={formatCurrency(balance)}
          emphasize={balance > 0}
        />
      </div>

      {payments.length > 0 && (
        <ul className="mt-4 flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
          {payments.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="text-slate-900 dark:text-slate-50">
                  {formatCurrency(p.amount)}
                  {p.method && <span className="text-slate-500 dark:text-slate-400"> · {p.method}</span>}
                </p>
                {p.notes && (
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">{p.notes}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {formatDateLong(p.createdAt)}
                </span>
                <DeleteButton
                  action={deleteAction.bind(null, p.id)}
                  confirmMessage="Delete this payment? The balance will go back up by this amount."
                  label="Remove"
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <AddPaymentForm action={addAction} />
    </div>
  );
}

function Stat({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p
        className={`font-semibold tabular-nums ${
          emphasize
            ? "text-[#d03b3b]"
            : "text-slate-900 dark:text-slate-50"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function AddPaymentForm({
  action,
}: {
  action: (
    state: PaymentActionState,
    formData: FormData,
  ) => Promise<PaymentActionState>;
}) {
  const [state, formAction] = useActionState<PaymentActionState, FormData>(action, undefined);

  return (
    <form action={formAction} className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <input
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          required
          placeholder="Amount"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
        <input
          name="method"
          type="text"
          placeholder="Method (cash, bank…)"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
        <input
          name="notes"
          type="text"
          placeholder="Notes (optional)"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
      </div>
      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="self-start rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Recording…" : "Record payment"}
    </button>
  );
}
