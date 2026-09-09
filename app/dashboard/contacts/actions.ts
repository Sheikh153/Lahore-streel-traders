"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/db";
import { verifySession } from "@/app/lib/dal";
import { isForeignKeyError } from "@/app/lib/prisma-errors";
import type { DeleteState } from "@/app/dashboard/_components/DeleteButton";

export type ContactFormState = { error?: string } | undefined;
export type ContactType = "supplier" | "buyer" | "both";

function isContactType(value: string): value is ContactType {
  return value === "supplier" || value === "buyer" || value === "both";
}

function readContactFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const typeRaw = String(formData.get("type") ?? "supplier").trim();
  const cnic = String(formData.get("cnic") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  return {
    name,
    type: isContactType(typeRaw) ? typeRaw : "supplier",
    cnic: cnic || null,
    phone: phone || null,
    email: email || null,
    address: address || null,
    notes: notes || null,
  };
}

export async function createContact(
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  await verifySession();

  const data = readContactFields(formData);
  if (!data.name) {
    return { error: "Contact name is required." };
  }

  await prisma.contact.create({ data });
  revalidatePath("/dashboard/contacts");
  redirect("/dashboard/contacts");
}

export async function updateContact(
  id: string,
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  await verifySession();

  const data = readContactFields(formData);
  if (!data.name) {
    return { error: "Contact name is required." };
  }

  await prisma.contact.update({ where: { id }, data });
  revalidatePath("/dashboard/contacts");
  redirect("/dashboard/contacts");
}

export async function deleteContact(
  id: string,
  _prevState: DeleteState,
): Promise<DeleteState> {
  await verifySession();

  try {
    await prisma.contact.delete({ where: { id } });
  } catch (error) {
    if (isForeignKeyError(error)) {
      return {
        error:
          "Can't delete this contact — they have purchases, sales, or payments on record.",
      };
    }
    throw error;
  }

  revalidatePath("/dashboard/contacts");
}
