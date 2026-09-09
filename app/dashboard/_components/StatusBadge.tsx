import type { TransactionStatus } from "../_lib/status";
import { STATUS } from "../_lib/colors";

const CONFIG: Record<TransactionStatus, { label: string; color: { light: string; dark: string } }> = {
  paid: { label: "Paid", color: STATUS.good },
  pending: { label: "Pending", color: STATUS.warning },
  partial: { label: "Partial", color: STATUS.serious },
};

export default function StatusBadge({ status }: { status: TransactionStatus }) {
  const { label, color } = CONFIG[status];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full dark:hidden"
        style={{ backgroundColor: color.light }}
      />
      <span
        className="hidden h-1.5 w-1.5 shrink-0 rounded-full dark:block"
        style={{ backgroundColor: color.dark }}
      />
      {label}
    </span>
  );
}
