"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/app/lib/db";
import { verifySession } from "@/app/lib/dal";
import { isForeignKeyError, isUniqueConstraintError } from "@/app/lib/prisma-errors";
import type { DeleteState } from "@/app/dashboard/_components/DeleteButton";

export type InvestmentFormState = { error?: string } | undefined;

export async function createInvestment(
  _prevState: InvestmentFormState,
  formData: FormData,
): Promise<InvestmentFormState> {
  await verifySession();

  const partnerId = String(formData.get("partnerId") ?? "").trim();
  const amount = Number(String(formData.get("amount") ?? "").trim());
  const dateRaw = String(formData.get("date") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!partnerId) return { error: "Please choose a partner." };
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Amount must be a positive number." };
  }
  const date = dateRaw ? new Date(dateRaw) : new Date();
  if (Number.isNaN(date.getTime())) {
    return { error: "That date doesn't look valid." };
  }

  await prisma.investment.create({
    data: { partnerId, amount, date, notes: notes || null },
  });

  revalidatePath("/dashboard/investments");
  return undefined;
}

export async function deleteInvestment(
  id: string,
  _prevState: DeleteState,
): Promise<DeleteState> {
  await verifySession();
  await prisma.investment.delete({ where: { id } });
  revalidatePath("/dashboard/investments");
  return undefined;
}

// --- Partners (there are two to start; add more if a partner joins later) ---

export type PartnerFormState = { error?: string } | undefined;

export async function createPartner(
  _prevState: PartnerFormState,
  formData: FormData,
): Promise<PartnerFormState> {
  await verifySession();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name is required." };

  try {
    await prisma.partner.create({ data: { name } });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { error: `A partner named "${name}" already exists.` };
    }
    throw error;
  }

  revalidatePath("/dashboard/investments");
  return undefined;
}

export async function deletePartner(
  id: string,
  _prevState: DeleteState,
): Promise<DeleteState> {
  await verifySession();

  try {
    await prisma.partner.delete({ where: { id } });
  } catch (error) {
    if (isForeignKeyError(error)) {
      return { error: "Can't remove this partner — they have investments on record." };
    }
    throw error;
  }

  revalidatePath("/dashboard/investments");
  return undefined;
}
