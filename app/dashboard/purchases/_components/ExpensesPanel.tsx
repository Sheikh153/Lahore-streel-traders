"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { formatCurrency } from "@/app/dashboard/_lib/format";
import type { ExpenseFormState } from "../actions";
import type { DeleteState } from "@/app/dashboard/_components/DeleteButton";
import DeleteButton from "@/app/dashboard/_components/DeleteButton";

type Expense = {
  id: string;
  category: string;
  amount: number;
  notes: string | null;
};

const CATEGORIES = ["freight", "loading", "unloading", "labour", "other"];

export default function ExpensesPanel({
  expenses,
  addAction,
  deleteAction,
}: {
  expenses: Expense[];
  addAction: (
    state: ExpenseFormState,
    formData: FormData,
  ) => Promise<ExpenseFormState>;
  deleteAction: (id: string, state: DeleteState, formData: FormData) => Promise<DeleteState>;
}) {
  const total = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
          Expenses (freight, loading, labour…)
        </h3>
        <span className="text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-50">
          {formatCurrency(total)}
        </span>
      </div>

      {expenses.length > 0 && (
        <ul className="mt-3 flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
          {expenses.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="capitalize text-slate-900 dark:text-slate-50">{e.category}</p>
                {e.notes && (
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">{e.notes}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="tabular-nums text-slate-700 dark:text-slate-300">
                  {formatCurrency(e.amount)}
                </span>
                <DeleteButton
                  action={deleteAction.bind(null, e.id)}
                  confirmMessage="Delete this expense?"
                  label="Remove"
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <AddExpenseForm action={addAction} />
    </div>
  );
}

function AddExpenseForm({
  action,
}: {
  action: (
    state: ExpenseFormState,
    formData: FormData,
  ) => Promise<ExpenseFormState>;
}) {
  const [state, formAction] = useActionState<ExpenseFormState, FormData>(action, undefined);

  return (
    <form action={formAction} className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <select
          name="category"
          required
          defaultValue=""
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm capitalize text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        >
          <option value="" disabled>
            Category…
          </option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c} className="capitalize">
              {c}
            </option>
          ))}
        </select>
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
          name="notes"
          type="text"
          placeholder="Notes (optional)"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
      </div>
      {state?.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}
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
      {pending ? "Adding…" : "Add expense"}
    </button>
  );
}
