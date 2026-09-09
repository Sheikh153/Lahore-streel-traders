"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/db";
import { verifySession } from "@/app/lib/dal";
import { isForeignKeyError, isUniqueConstraintError } from "@/app/lib/prisma-errors";
import type { DeleteState } from "@/app/dashboard/_components/DeleteButton";

export type MaterialFormState = { error?: string } | undefined;

function parseNumber(value: FormDataEntryValue | null): number | null {
  if (value === null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : null;
}

export async function createMaterial(
  _prevState: MaterialFormState,
  formData: FormData,
): Promise<MaterialFormState> {
  await verifySession();

  const name = String(formData.get("name") ?? "").trim();
  const unit = String(formData.get("unit") ?? "kg").trim() || "kg";
  const pricePerKg = parseNumber(formData.get("pricePerKg"));
  const stockKg = parseNumber(formData.get("stockKg"));
  const lowStockKg = parseNumber(formData.get("lowStockKg"));
  const location = String(formData.get("location") ?? "").trim() || null;

  if (!name) {
    return { error: "Material name is required." };
  }
  if (pricePerKg === null || pricePerKg < 0) {
    return { error: "Price per kg must be a valid, non-negative number." };
  }
  if (stockKg !== null && stockKg < 0) {
    return { error: "Opening stock can't be negative." };
  }

  try {
    await prisma.material.create({
      data: {
        name,
        unit,
        pricePerKg,
        stockKg: stockKg ?? 0,
        lowStockKg,
        location,
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { error: `A material named "${name}" already exists.` };
    }
    throw error;
  }

  revalidatePath("/dashboard/inventory");
  redirect("/dashboard/inventory");
}

export async function updateMaterial(
  id: string,
  _prevState: MaterialFormState,
  formData: FormData,
): Promise<MaterialFormState> {
  await verifySession();

  const name = String(formData.get("name") ?? "").trim();
  const unit = String(formData.get("unit") ?? "kg").trim() || "kg";
  const pricePerKg = parseNumber(formData.get("pricePerKg"));
  const stockKg = parseNumber(formData.get("stockKg"));
  const lowStockKg = parseNumber(formData.get("lowStockKg"));
  const location = String(formData.get("location") ?? "").trim() || null;

  if (!name) {
    return { error: "Material name is required." };
  }
  if (pricePerKg === null || pricePerKg < 0) {
    return { error: "Price per kg must be a valid, non-negative number." };
  }
  if (stockKg === null || stockKg < 0) {
    return { error: "Stock must be a valid, non-negative number." };
  }

  try {
    await prisma.material.update({
      where: { id },
      data: { name, unit, pricePerKg, stockKg, lowStockKg, location },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { error: `A material named "${name}" already exists.` };
    }
    throw error;
  }

  revalidatePath("/dashboard/inventory");
  redirect("/dashboard/inventory");
}

export async function deleteMaterial(
  id: string,
  _prevState: DeleteState,
): Promise<DeleteState> {
  await verifySession();

  try {
    await prisma.material.delete({ where: { id } });
  } catch (error) {
    if (isForeignKeyError(error)) {
      return {
        error:
          "Can't delete this material — it has purchases on record. Delete those first.",
      };
    }
    throw error;
  }

  revalidatePath("/dashboard/inventory");
}
