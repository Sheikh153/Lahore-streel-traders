"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/app/lib/db";
import { verifySession } from "@/app/lib/dal";
import { isUniqueConstraintError } from "@/app/lib/prisma-errors";
import type { DeleteState } from "@/app/dashboard/_components/DeleteButton";

export type CompanySettingsFormState = { error?: string; success?: boolean } | undefined;

export async function updateCompanySettings(
  _prevState: CompanySettingsFormState,
  formData: FormData,
): Promise<CompanySettingsFormState> {
  await verifySession();

  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const vatRaw = String(formData.get("defaultVatPercent") ?? "").trim();
  const defaultVatPercent = vatRaw ? Number(vatRaw) : null;

  if (!name) {
    return { error: "Business name is required." };
  }
  if (defaultVatPercent !== null && (!Number.isFinite(defaultVatPercent) || defaultVatPercent < 0)) {
    return { error: "Default VAT % must be a valid, non-negative number." };
  }

  await prisma.companySettings.upsert({
    where: { id: "default" },
    update: { name, address: address || null, phone: phone || null, email: email || null, defaultVatPercent },
    create: { id: "default", name, address: address || null, phone: phone || null, email: email || null, defaultVatPercent },
  });

  revalidatePath("/dashboard/settings");
  return { success: true };
}

// --- Team members (admin-created — there's no public signup) ---

export type TeamFormState = { error?: string; success?: boolean } | undefined;

export async function createTeamMember(
  _prevState: TeamFormState,
  formData: FormData,
): Promise<TeamFormState> {
  await verifySession();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name) return { error: "Name is required." };
  if (!email) return { error: "Email is required." };
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await prisma.user.create({ data: { name, email, passwordHash } });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { error: `An account with the email "${email}" already exists.` };
    }
    throw error;
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function deleteTeamMember(
  id: string,
  _prevState: DeleteState,
): Promise<DeleteState> {
  const session = await verifySession();

  if (id === session.userId) {
    return { error: "You can't remove your own account while signed in as it." };
  }

  const totalUsers = await prisma.user.count();
  if (totalUsers <= 1) {
    return { error: "Can't remove the last remaining account." };
  }

  await prisma.user.delete({ where: { id } });
  revalidatePath("/dashboard/settings");
}
