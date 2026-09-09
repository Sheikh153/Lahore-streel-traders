import "server-only";

import { prisma } from "@/app/lib/db";
import { saveUpload, deleteUploadFile } from "@/app/lib/uploads";

export type AttachmentActionState = { error?: string } | undefined;

export async function saveAttachmentFor(
  target: { purchaseId?: string; saleId?: string },
  formData: FormData,
): Promise<AttachmentActionState> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { error: "Please choose a file." };
  }

  const saved = await saveUpload(file);
  if ("error" in saved) return saved;

  await prisma.attachment.create({
    data: {
      url: saved.url,
      filename: saved.filename,
      mimeType: saved.mimeType,
      size: saved.size,
      purchaseId: target.purchaseId,
      saleId: target.saleId,
    },
  });
}

export async function removeAttachmentById(id: string): Promise<AttachmentActionState> {
  const attachment = await prisma.attachment.findUnique({ where: { id } });
  if (!attachment) return { error: "That attachment no longer exists." };

  await prisma.attachment.delete({ where: { id } });
  await deleteUploadFile(attachment.url);
}
