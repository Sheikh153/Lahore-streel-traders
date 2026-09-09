"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/db";
import { createSession, deleteSession } from "@/app/lib/session";

export type LoginState = {
  error?: string;
} | undefined;

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const remember = formData.get("remember-me") === "on";

  if (!email || !password) {
    return { error: "Please enter both email and password." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  const passwordsMatch = user
    ? await bcrypt.compare(password, user.passwordHash)
    : false;

  // Compare against a dummy hash even when the user doesn't exist, so the
  // response time doesn't leak whether an email is registered.
  if (!user) {
    await bcrypt.compare(password, "$2a$10$C6UzMDM.H6dfI/f/IKcEeO");
  }

  if (!user || !passwordsMatch) {
    return { error: "Invalid email or password." };
  }

  await createSession(user.id, remember);
  redirect("/dashboard");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
