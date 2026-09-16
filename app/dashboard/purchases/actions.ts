"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/db";
import { verifySession } from "@/app/lib/dal";
import { isForeignKeyError } from "@/app/lib/prisma-errors";
import { generateLotId } from "@/app/dashboard/_lib/reference";
import { computeLandedCostPerKg } from "@/app/dashboard/_lib/costing";
import { recordPaymentFor, removePaymentById, type PaymentActionState } from "@/app/dashboard/_lib/payments";
import { saveAttachmentFor, removeAttachmentById, type AttachmentActionState } from "@/app/dashboard/_lib/attachments";
import type { DeleteState } from "@/app/dashboard/_components/DeleteButton";

export type PurchaseFormState = { error?: string } | undefined;

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

function readPurchaseFields(formData: FormData) {
  return {
    contactId: String(formData.get("contactId") ?? "").trim(),
    materialId: String(formData.get("materialId") ?? "").trim(),
    date: parseDate(formData.get("date")),
    weightKg: parsePositiveNumber(formData.get("weightKg")),
    ratePerKg: parsePositiveNumber(formData.get("ratePerKg")),
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

export async function createPurchase(
  _prevState: PurchaseFormState,
  formData: FormData,
): Promise<PurchaseFormState> {
  await verifySession();

  const data = readPurchaseFields(formData);
  if (!data.contactId) return { error: "Please select a supplier." };
  if (!data.materialId) return { error: "Please select a material." };
  if (!data.date) return { error: "Please enter a valid date." };
  if (data.weightKg === null || data.weightKg <= 0) {
    return { error: "Weight must be a positive number." };
  }
  if (data.ratePerKg === null) {
    return { error: "Rate must be a valid, non-negative number." };
  }

  const { weightKg, ratePerKg, date } = data;
  const lotId = await generateLotId();

  const purchase = await prisma.$transaction(async (tx) => {
    const created = await tx.purchase.create({
      data: {
        lotId,
        contactId: data.contactId,
        materialId: data.materialId,
        date,
        weightKg,
        ratePerKg,
        totalAmount: weightKg * ratePerKg,
        landedCostPerKg: ratePerKg, // no expenses yet
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
      where: { id: data.materialId },
      data: { stockKg: { increment: weightKg } },
    });
    return created;
  });

  revalidatePath("/dashboard/purchases");
  revalidatePath("/dashboard/inventory");
  redirect(`/dashboard/purchases/${purchase.id}`);
}

export async function updatePurchase(
  id: string,
  _prevState: PurchaseFormState,
  formData: FormData,
): Promise<PurchaseFormState> {
  await verifySession();

  const existing = await prisma.purchase.findUnique({
    where: { id },
    include: { expenses: true },
  });
  if (!existing) return { error: "This purchase no longer exists." };

  const data = readPurchaseFields(formData);
  if (!data.contactId) return { error: "Please select a supplier." };
  if (!data.materialId) return { error: "Please select a material." };
  if (!data.date) return { error: "Please enter a valid date." };
  if (data.weightKg === null || data.weightKg <= 0) {
    return { error: "Weight must be a positive number." };
  }
  if (data.ratePerKg === null) {
    return { error: "Rate must be a valid, non-negative number." };
  }

  const { weightKg, ratePerKg, date } = data;
  const expenseTotal = existing.expenses.reduce((s, e) => s + e.amount, 0);
  const landedCostPerKg = weightKg > 0 ? (weightKg * ratePerKg + expenseTotal) / weightKg : ratePerKg;

  await prisma.$transaction(async (tx) => {
    await tx.purchase.update({
      where: { id },
      data: {
        contactId: data.contactId,
        materialId: data.materialId,
        date,
        weightKg,
        ratePerKg,
        totalAmount: weightKg * ratePerKg,
        landedCostPerKg,
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

    if (existing.materialId === data.materialId) {
      const delta = weightKg - existing.weightKg;
      if (delta !== 0) {
        await tx.material.update({
          where: { id: data.materialId },
          data: { stockKg: { increment: delta } },
        });
      }
    } else {
      await tx.material.update({
        where: { id: existing.materialId },
        data: { stockKg: { decrement: existing.weightKg } },
      });
      await tx.material.update({
        where: { id: data.materialId },
        data: { stockKg: { increment: weightKg } },
      });
    }
  });

  revalidatePath("/dashboard/purchases");
  revalidatePath(`/dashboard/purchases/${id}`);
  revalidatePath("/dashboard/inventory");
  redirect(`/dashboard/purchases/${id}`);
}

export async function deletePurchase(
  id: string,
  _prevState: DeleteState,
): Promise<DeleteState> {
  await verifySession();

  const existing = await prisma.purchase.findUnique({ where: { id } });
  if (!existing) return { error: "This purchase no longer exists." };

  try {
    await prisma.$transaction([
      prisma.purchase.delete({ where: { id } }),
      prisma.material.update({
        where: { id: existing.materialId },
        data: { stockKg: { decrement: existing.weightKg } },
      }),
    ]);
  } catch (error) {
    if (isForeignKeyError(error)) {
      return {
        error: "Can't delete this lot — it has payments recorded against it. Delete those first.",
      };
    }
    throw error;
  }

  revalidatePath("/dashboard/purchases");
  revalidatePath("/dashboard/inventory");
}

// --- Expenses (freight, loading, unloading, labour, etc.) ---

export type ExpenseFormState = { error?: string } | undefined;

async function recomputeLandedCost(purchaseId: string) {
  const landedCostPerKg = await computeLandedCostPerKg(purchaseId);
  await prisma.purchase.update({ where: { id: purchaseId }, data: { landedCostPerKg } });
}

export async function createExpense(
  purchaseId: string,
  _prevState: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  await verifySession();

  const category = String(formData.get("category") ?? "").trim();
  const amount = Number(String(formData.get("amount") ?? "").trim());
  const notes = String(formData.get("notes") ?? "").trim();

  if (!category) return { error: "Please choose a category." };
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Amount must be a positive number." };
  }

  await prisma.expense.create({
    data: { purchaseId, category, amount, notes: notes || null },
  });
  await recomputeLandedCost(purchaseId);

  revalidatePath(`/dashboard/purchases/${purchaseId}`);
  revalidatePath("/dashboard/inventory");
}

export async function deleteExpense(
  id: string,
  _prevState: DeleteState,
): Promise<DeleteState> {
  await verifySession();

  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense || !expense.purchaseId) return { error: "That expense no longer exists." };

  await prisma.expense.delete({ where: { id } });
  await recomputeLandedCost(expense.purchaseId);

  revalidatePath(`/dashboard/purchases/${expense.purchaseId}`);
  revalidatePath("/dashboard/inventory");
}

// --- Payments (to the supplier, against this lot) ---

export async function addPurchasePayment(
  purchaseId: string,
  contactId: string,
  _prevState: PaymentActionState,
  formData: FormData,
): Promise<PaymentActionState> {
  await verifySession();
  const result = await recordPaymentFor({ direction: "out", contactId, purchaseId }, formData);
  revalidatePath(`/dashboard/purchases/${purchaseId}`);
  revalidatePath(`/dashboard/contacts/${contactId}`);
  revalidatePath("/dashboard/payments");
  return result;
}

export async function deletePurchasePayment(
  purchaseId: string,
  id: string,
  _prevState: DeleteState,
): Promise<DeleteState> {
  await verifySession();
  const result = await removePaymentById(id);
  revalidatePath(`/dashboard/purchases/${purchaseId}`);
  revalidatePath("/dashboard/payments");
  return result;
}

// --- Attachments (weighbridge slip, bilty, bill) ---

export async function addPurchaseAttachment(
  purchaseId: string,
  _prevState: AttachmentActionState,
  formData: FormData,
): Promise<AttachmentActionState> {
  await verifySession();
  const result = await saveAttachmentFor({ purchaseId }, formData);
  revalidatePath(`/dashboard/purchases/${purchaseId}`);
  return result;
}

export async function removePurchaseAttachment(
  purchaseId: string,
  id: string,
  _prevState: DeleteState,
): Promise<DeleteState> {
  await verifySession();
  const result = await removeAttachmentById(id);
  revalidatePath(`/dashboard/purchases/${purchaseId}`);
  return result;
}
