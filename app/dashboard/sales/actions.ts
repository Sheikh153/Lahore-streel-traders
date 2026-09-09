"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/db";
import { verifySession } from "@/app/lib/dal";
import { isForeignKeyError } from "@/app/lib/prisma-errors";
import { generateSaleRef } from "@/app/dashboard/_lib/reference";
import { getMaterialAvgCostPerKg } from "@/app/dashboard/_lib/costing";
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

function readSaleFields(formData: FormData) {
  return {
    contactId: String(formData.get("contactId") ?? "").trim(),
    materialId: String(formData.get("materialId") ?? "").trim(),
    weightKg: parsePositiveNumber(formData.get("weightKg")),
    ratePerKg: parsePositiveNumber(formData.get("ratePerKg")),
    vatPercent: parsePositiveNumber(formData.get("vatPercent")) ?? 0,
    weighbridgeWeightKg: parseOptionalNumber(formData.get("weighbridgeWeightKg")),
    vehicleNumber: String(formData.get("vehicleNumber") ?? "").trim() || null,
    biltyNumber: String(formData.get("biltyNumber") ?? "").trim() || null,
    receiptNumber: String(formData.get("receiptNumber") ?? "").trim() || null,
    thicknessMm: parseOptionalNumber(formData.get("thicknessMm")),
    heightMm: parseOptionalNumber(formData.get("heightMm")),
    lengthMm: parseOptionalNumber(formData.get("lengthMm")),
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
  if (!data.materialId) return { error: "Please select a material." };
  if (data.weightKg === null || data.weightKg <= 0) {
    return { error: "Weight must be a positive number." };
  }
  if (data.ratePerKg === null) {
    return { error: "Rate must be a valid, non-negative number." };
  }

  const { weightKg, ratePerKg } = data;

  const material = await prisma.material.findUnique({ where: { id: data.materialId } });
  if (!material) return { error: "That material no longer exists." };
  if (weightKg > material.stockKg) {
    return {
      error: `Only ${material.stockKg} ${material.unit} of ${material.name} is in stock.`,
    };
  }

  const costPerKgAtSale = await getMaterialAvgCostPerKg(data.materialId);
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
        materialId: data.materialId,
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
        heightMm: data.heightMm,
        lengthMm: data.lengthMm,
        notes: data.notes,
      },
    });
    await tx.material.update({
      where: { id: data.materialId },
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

  const existing = await prisma.sale.findUnique({ where: { id } });
  if (!existing) return { error: "This sale no longer exists." };

  const data = readSaleFields(formData);
  if (!data.contactId) return { error: "Please select a buyer." };
  if (!data.materialId) return { error: "Please select a material." };
  if (data.weightKg === null || data.weightKg <= 0) {
    return { error: "Weight must be a positive number." };
  }
  if (data.ratePerKg === null) {
    return { error: "Rate must be a valid, non-negative number." };
  }

  const { weightKg, ratePerKg } = data;

  // Check stock availability, accounting for this sale's own weight being reversed first.
  if (existing.materialId === data.materialId) {
    const material = await prisma.material.findUnique({ where: { id: data.materialId } });
    if (!material) return { error: "That material no longer exists." };
    const availableAfterReversal = material.stockKg + existing.weightKg;
    if (weightKg > availableAfterReversal) {
      return {
        error: `Only ${availableAfterReversal} ${material.unit} of ${material.name} would be available.`,
      };
    }
  } else {
    const newMaterial = await prisma.material.findUnique({ where: { id: data.materialId } });
    if (!newMaterial) return { error: "That material no longer exists." };
    if (weightKg > newMaterial.stockKg) {
      return {
        error: `Only ${newMaterial.stockKg} ${newMaterial.unit} of ${newMaterial.name} is in stock.`,
      };
    }
  }

  const costPerKgAtSale = await getMaterialAvgCostPerKg(data.materialId);
  const totalAmount = weightKg * ratePerKg;
  const profitAmount = totalAmount - weightKg * costPerKgAtSale;
  const vatAmount = totalAmount * (data.vatPercent / 100);
  const grandTotal = totalAmount + vatAmount;

  await prisma.$transaction(async (tx) => {
    await tx.sale.update({
      where: { id },
      data: {
        contactId: data.contactId,
        materialId: data.materialId,
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
        heightMm: data.heightMm,
        lengthMm: data.lengthMm,
        notes: data.notes,
      },
    });

    if (existing.materialId === data.materialId) {
      const delta = weightKg - existing.weightKg;
      if (delta !== 0) {
        await tx.material.update({
          where: { id: data.materialId },
          data: { stockKg: { decrement: delta } },
        });
      }
    } else {
      await tx.material.update({
        where: { id: existing.materialId },
        data: { stockKg: { increment: existing.weightKg } },
      });
      await tx.material.update({
        where: { id: data.materialId },
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
