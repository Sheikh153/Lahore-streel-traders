import type { TransactionStatus } from "./status";

/** Derives paid/pending/partial from actual payments against a total —
 * there's no stored status field, so this can never drift out of sync. */
export function deriveStatus(totalAmount: number, paidAmount: number): TransactionStatus {
  if (paidAmount <= 0) return "pending";
  if (paidAmount >= totalAmount) return "paid";
  return "partial";
}

export function sumPayments(payments: { amount: number }[]): number {
  return payments.reduce((sum, p) => sum + p.amount, 0);
}
