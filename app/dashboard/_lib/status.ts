export type TransactionStatus = "paid" | "pending" | "partial";

export const TRANSACTION_STATUSES: TransactionStatus[] = ["paid", "pending", "partial"];

export function isTransactionStatus(value: string): value is TransactionStatus {
  return (TRANSACTION_STATUSES as string[]).includes(value);
}
