import "server-only";

import { prisma } from "@/app/lib/db";

export type PaymentActionState = { error?: string } | undefined;

export async function recordPaymentFor(
  target: {
    direction: "out" | "in";
    contactId: string;
    purchaseId?: string;
    saleId?: string;
  },
  formData: FormData,
): Promise<PaymentActionState> {
  const amount = Number(String(formData.get("amount") ?? "").trim());
  const method = String(formData.get("method") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Amount must be a positive number." };
  }

  await prisma.payment.create({
    data: {
      direction: target.direction,
      amount,
      contactId: target.contactId,
      purchaseId: target.purchaseId,
      saleId: target.saleId,
      method: method || null,
      notes: notes || null,
    },
  });
}

export async function removePaymentById(id: string): Promise<PaymentActionState> {
  const payment = await prisma.payment.findUnique({ where: { id } });
  if (!payment) return { error: "That payment no longer exists." };
  await prisma.payment.delete({ where: { id } });
}
