"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/db";
import { verifySession } from "@/app/lib/dal";
import { isForeignKeyError } from "@/app/lib/prisma-errors";
import { generateSaleRef } from "@/app/dashboard/_lib/reference";
import { getLotRemaining } from "@/app/dashboard/_lib/lots";
import { recordPaymentFor, removePaymentById, type PaymentActionState } from "@/app/dashboard/_lib/payments";
import { saveAttachmentFor, removeAttachmentById, type AttachmentActionState } from "@/app/dashboard/_lib/attachments";
import type { DeleteState } from "@/app/dashboard/_components/DeleteButton";

export type SaleFormState = { error?: string } | undefined;

function parsePositiveNumber(value: FormDataEntryValue | null): number | null {
  if (value === null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  const num = Number(trimmed);
  return Number.isFinite(num) && num >= 0 ? num : null;
}

function parseOptionalNumber(value: FormDataEntryValue | null): number | null {
  if (value === null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : null;
}

function parseDate(value: FormDataEntryValue | null): Date | null {
  if (value === null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date;
}

function readSaleFields(formData: FormData) {
  return {
    contactId: String(formData.get("contactId") ?? "").trim(),
    // materialId is intentionally not read here — purchaseId (the chosen
    // lot) is the source of truth for which material this sale draws
    // from, so a mismatched/stale materialId in the submitted form can't
    // silently disagree with the actual lot.
    purchaseId: String(formData.get("purchaseId") ?? "").trim(),
    date: parseDate(formData.get("date")),
    weightKg: parsePositiveNumber(formData.get("weightKg")),
    ratePerKg: parsePositiveNumber(formData.get("ratePerKg")),
    vatPercent: parsePositiveNumber(formData.get("vatPercent")) ?? 0,
    weighbridgeWeightKg: parseOptionalNumber(formData.get("weighbridgeWeightKg")),
    vehicleNumber: String(formData.get("vehicleNumber") ?? "").trim() || null,
    biltyNumber: String(formData.get("biltyNumber") ?? "").trim() || null,
    receiptNumber: String(formData.get("receiptNumber") ?? "").trim() || null,
    thicknessMm: parseOptionalNumber(formData.get("thicknessMm")),
    heightFt: parseOptionalNumber(formData.get("heightFt")),
    lengthFt: parseOptionalNumber(formData.get("lengthFt")),
    notes: String(formData.get("notes") ?? "").trim() || null,
  };
}

export async function createSale(
  _prevState: SaleFormState,
  formData: FormData,
): Promise<SaleFormState> {
  await verifySession();

  const data = readSaleFields(formData);
  if (!data.contactId) return { error: "Please select a buyer." };
  if (!data.purchaseId) return { error: "Please select which lot this sale comes from." };
  if (!data.date) return { error: "Please enter a valid date." };
  if (data.weightKg === null || data.weightKg <= 0) {
    return { error: "Weight must be a positive number." };
  }
  if (data.ratePerKg === null) {
    return { error: "Rate must be a valid, non-negative number." };
  }

  const { weightKg, ratePerKg, date } = data;

  // The chosen lot is never blended with any other lot — its own weight
  // and its own landed cost, not a material-wide average.
  const lot = await getLotRemaining(data.purchaseId);
  if (!lot) return { error: "That lot no longer exists." };
  if (weightKg > lot.remainingKg) {
    return { error: `Only ${lot.remainingKg.toFixed(2)} kg is left in that lot.` };
  }

  const costPerKgAtSale = lot.landedCostPerKg;
  const totalAmount = weightKg * ratePerKg;
  const profitAmount = totalAmount - weightKg * costPerKgAtSale;
  const vatAmount = totalAmount * (data.vatPercent / 100);
  const grandTotal = totalAmount + vatAmount;
  const saleRef = await generateSaleRef();

  const sale = await prisma.$transaction(async (tx) => {
    const created = await tx.sale.create({
      data: {
        saleRef,
        contactId: data.contactId,
        materialId: lot.materialId,
        purchaseId: data.purchaseId,
        date,
        weightKg,
        ratePerKg,
        totalAmount,
        vatPercent: data.vatPercent,
        vatAmount,
        grandTotal,
        costPerKgAtSale,
        profitAmount,
        weighbridgeWeightKg: data.weighbridgeWeightKg,
        vehicleNumber: data.vehicleNumber,
        biltyNumber: data.biltyNumber,
        receiptNumber: data.receiptNumber,
        thicknessMm: data.thicknessMm,
        heightFt: data.heightFt,
        lengthFt: data.lengthFt,
        notes: data.notes,
      },
    });
    await tx.material.update({
      where: { id: lot.materialId },
      data: { stockKg: { decrement: weightKg } },
    });
    return created;
  });

  revalidatePath("/dashboard/sales");
  revalidatePath("/dashboard/inventory");
  redirect(`/dashboard/sales/${sale.id}`);
}

export async function updateSale(
  id: string,
  _prevState: SaleFormState,
  formData: FormData,
): Promise<SaleFormState> {
  await verifySession();

  const existing = await prisma.sale.findUnique({
    where: { id },
    include: { expenses: true },
  });
  if (!existing) return { error: "This sale no longer exists." };

  const data = readSaleFields(formData);
  if (!data.contactId) return { error: "Please select a buyer." };
  if (!data.purchaseId) return { error: "Please select which lot this sale comes from." };
  if (!data.date) return { error: "Please enter a valid date." };
  if (data.weightKg === null || data.weightKg <= 0) {
    return { error: "Weight must be a positive number." };
  }
  if (data.ratePerKg === null) {
    return { error: "Rate must be a valid, non-negative number." };
  }

  const { weightKg, ratePerKg, date } = data;
  const expenseTotal = existing.expenses.reduce((s, e) => s + e.amount, 0);

  // Check the target lot's remaining capacity, excluding this sale's own
  // current weight if it's already drawing from that same lot.
  const lot = await getLotRemaining(data.purchaseId, id);
  if (!lot) return { error: "That lot no longer exists." };
  if (weightKg > lot.remainingKg) {
    return { error: `Only ${lot.remainingKg.toFixed(2)} kg is left in that lot.` };
  }

  const costPerKgAtSale = lot.landedCostPerKg;
  const totalAmount = weightKg * ratePerKg;
  const profitAmount = totalAmount - weightKg * costPerKgAtSale - expenseTotal;
  const vatAmount = totalAmount * (data.vatPercent / 100);
  const grandTotal = totalAmount + vatAmount;

  await prisma.$transaction(async (tx) => {
    await tx.sale.update({
      where: { id },
      data: {
        contactId: data.contactId,
        materialId: lot.materialId,
        purchaseId: data.purchaseId,
        date,
        weightKg,
        ratePerKg,
        totalAmount,
        vatPercent: data.vatPercent,
        vatAmount,
        grandTotal,
        costPerKgAtSale,
        profitAmount,
        weighbridgeWeightKg: data.weighbridgeWeightKg,
        vehicleNumber: data.vehicleNumber,
        biltyNumber: data.biltyNumber,
        receiptNumber: data.receiptNumber,
        thicknessMm: data.thicknessMm,
        heightFt: data.heightFt,
        lengthFt: data.lengthFt,
        notes: data.notes,
      },
    });

    if (existing.materialId === lot.materialId) {
      const delta = weightKg - existing.weightKg;
      if (delta !== 0) {
        await tx.material.update({
          where: { id: lot.materialId },
          data: { stockKg: { decrement: delta } },
        });
      }
    } else {
      await tx.material.update({
        where: { id: existing.materialId },
        data: { stockKg: { increment: existing.weightKg } },
      });
      await tx.material.update({
        where: { id: lot.materialId },
        data: { stockKg: { decrement: weightKg } },
      });
    }
  });

  revalidatePath("/dashboard/sales");
  revalidatePath(`/dashboard/sales/${id}`);
  revalidatePath("/dashboard/inventory");
  redirect(`/dashboard/sales/${id}`);
}

export async function deleteSale(
  id: string,
  _prevState: DeleteState,
): Promise<DeleteState> {
  await verifySession();

  const existing = await prisma.sale.findUnique({ where: { id } });
  if (!existing) return { error: "This sale no longer exists." };

  try {
    await prisma.$transaction([
      prisma.sale.delete({ where: { id } }),
      prisma.material.update({
        where: { id: existing.materialId },
        data: { stockKg: { increment: existing.weightKg } },
      }),
    ]);
  } catch (error) {
    if (isForeignKeyError(error)) {
      return {
        error: "Can't delete this sale — it has payments recorded against it. Delete those first.",
      };
    }
    throw error;
  }

  revalidatePath("/dashboard/sales");
  revalidatePath("/dashboard/inventory");
}

// --- Payments (from the buyer, against this sale) ---

export async function addSalePayment(
  saleId: string,
  contactId: string,
  _prevState: PaymentActionState,
  formData: FormData,
): Promise<PaymentActionState> {
  await verifySession();
  const result = await recordPaymentFor({ direction: "in", contactId, saleId }, formData);
  revalidatePath(`/dashboard/sales/${saleId}`);
  revalidatePath(`/dashboard/contacts/${contactId}`);
  revalidatePath("/dashboard/payments");
  return result;
}

export async function deleteSalePayment(
  saleId: string,
  id: string,
  _prevState: DeleteState,
): Promise<DeleteState> {
  await verifySession();
  const result = await removePaymentById(id);
  revalidatePath(`/dashboard/sales/${saleId}`);
  revalidatePath("/dashboard/payments");
  return result;
}

// --- Attachments (bill, weighbridge slip) ---

export async function addSaleAttachment(
  saleId: string,
  _prevState: AttachmentActionState,
  formData: FormData,
): Promise<AttachmentActionState> {
  await verifySession();
  const result = await saveAttachmentFor({ saleId }, formData);
  revalidatePath(`/dashboard/sales/${saleId}`);
  return result;
}

export async function removeSaleAttachment(
  saleId: string,
  id: string,
  _prevState: DeleteState,
): Promise<DeleteState> {
  await verifySession();
  const result = await removeAttachmentById(id);
  revalidatePath(`/dashboard/sales/${saleId}`);
  return result;
}

// --- Expenses (labour, loading, unloading, transport) — reduce this sale's profit ---

export type SaleExpenseFormState = { error?: string } | undefined;

async function recomputeSaleProfit(saleId: string) {
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: { expenses: true },
  });
  if (!sale) return;
  const expenseTotal = sale.expenses.reduce((s, e) => s + e.amount, 0);
  const profitAmount = sale.totalAmount - sale.weightKg * sale.costPerKgAtSale - expenseTotal;
  await prisma.sale.update({ where: { id: saleId }, data: { profitAmount } });
}

export async function createSaleExpense(
  saleId: string,
  _prevState: SaleExpenseFormState,
  formData: FormData,
): Promise<SaleExpenseFormState> {
  await verifySession();

  const category = String(formData.get("category") ?? "").trim();
  const amount = Number(String(formData.get("amount") ?? "").trim());
  const notes = String(formData.get("notes") ?? "").trim();

  if (!category) return { error: "Please choose a category." };
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Amount must be a positive number." };
  }

  await prisma.expense.create({
    data: { saleId, category, amount, notes: notes || null },
  });
  await recomputeSaleProfit(saleId);

  revalidatePath(`/dashboard/sales/${saleId}`);
  revalidatePath("/dashboard/records");
}

export async function deleteSaleExpense(
  id: string,
  _prevState: DeleteState,
): Promise<DeleteState> {
  await verifySession();

  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense || !expense.saleId) return { error: "That expense no longer exists." };

  await prisma.expense.delete({ where: { id } });
  await recomputeSaleProfit(expense.saleId);

  revalidatePath(`/dashboard/sales/${expense.saleId}`);
  revalidatePath("/dashboard/records");
}
