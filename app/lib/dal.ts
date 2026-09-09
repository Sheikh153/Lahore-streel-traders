import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "./db";
import { getSession } from "./session";

/**
 * Verifies the current request has a valid session, redirecting to /login
 * if not. Memoized per-request so it's cheap to call from multiple places
 * (layout, page, server actions) without re-reading the cookie each time.
 */
export const verifySession = cache(async () => {
  const session = await getSession();
  if (!session?.userId) {
    redirect("/login");
  }
  return { userId: session.userId };
});

/** Same as verifySession, but returns null instead of redirecting. */
export const getOptionalSession = cache(async () => {
  const session = await getSession();
  return session?.userId ? { userId: session.userId } : null;
});

export const getCurrentUser = cache(async () => {
  const session = await getOptionalSession();
  if (!session) return null;

  return prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true },
  });
});
