import { Prisma } from "@prisma/client";

/** True for a foreign-key constraint violation (e.g. deleting a row other rows still reference). */
export function isForeignKeyError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2003" || error.code === "P2014")
  );
}

/** True for a unique constraint violation (e.g. a duplicate name/email). */
export function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}
