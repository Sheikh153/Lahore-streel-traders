"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/app/lib/db";
import { verifySession } from "@/app/lib/dal";
import type { DeleteState } from "@/app/dashboard/_components/DeleteButton";
import { isCompanyExpenseCategory } from "./_lib/categories";

export type CompanyExpenseFormState = { error?: string } | undefined;

export async function createCompanyExpense(
  _prevState: CompanyExpenseFormState,
  formData: FormData,
): Promise<CompanyExpenseFormState> {
  await verifySession();

  const category = String(formData.get("category") ?? "").trim();
  const amount = Number(String(formData.get("amount") ?? "").trim());
  const dateRaw = String(formData.get("date") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!isCompanyExpenseCategory(category)) {
    return { error: "Please choose a category." };
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Amount must be a positive number." };
  }
  const date = dateRaw ? new Date(dateRaw) : new Date();
  if (Number.isNaN(date.getTime())) {
    return { error: "That date doesn't look valid." };
  }

  await prisma.companyExpense.create({
    data: { category, amount, date, notes: notes || null },
  });

  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard");
}

export async function deleteCompanyExpense(
  id: string,
  _prevState: DeleteState,
): Promise<DeleteState> {
  await verifySession();
  await prisma.companyExpense.delete({ where: { id } });
  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard");
  return undefined;
}
