import "server-only";

import { put, del } from "@vercel/blob";

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "application/pdf",
]);

export type SavedUpload = {
  url: string;
  filename: string;
  mimeType: string;
  size: number;
};

/** Saves an uploaded file to Vercel Blob storage and returns what to store
 * on the Attachment row. Blob URLs are public-by-default (there's no private
 * mode on the free tier) — fine for receipts/photos here, but don't put
 * anything more sensitive through this without revisiting that. */
export async function saveUpload(file: File): Promise<SavedUpload | { error: string }> {
  if (file.size === 0) return { error: "No file selected." };
  if (file.size > MAX_SIZE_BYTES) return { error: "File is too large (max 10MB)." };
  if (!ALLOWED_TYPES.has(file.type)) {
    return { error: "Only images and PDFs are allowed." };
  }

  const blob = await put(file.name, file, {
    access: "public",
    addRandomSuffix: true,
  });

  return {
    url: blob.url,
    filename: file.name,
    mimeType: file.type,
    size: file.size,
  };
}

export async function deleteUploadFile(url: string): Promise<void> {
  try {
    await del(url);
  } catch {
    // Best-effort — a missing/already-deleted blob shouldn't block deleting the row.
  }
}
