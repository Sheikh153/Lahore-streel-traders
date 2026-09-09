"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { AttachmentActionState } from "@/app/dashboard/_lib/attachments";
import type { DeleteState } from "./DeleteButton";
import DeleteButton from "./DeleteButton";

type Attachment = {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
};

export default function AttachmentsPanel({
  attachments,
  uploadAction,
  deleteAction,
}: {
  attachments: Attachment[];
  uploadAction: (
    state: AttachmentActionState,
    formData: FormData,
  ) => Promise<AttachmentActionState>;
  deleteAction: (id: string, state: DeleteState, formData: FormData) => Promise<DeleteState>;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
        Receipts &amp; documents
      </h3>

      {attachments.length > 0 && (
        <ul className="mt-3 flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
          {attachments.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <a
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
              >
                {a.filename}
              </a>
              <DeleteButton
                action={deleteAction.bind(null, a.id)}
                confirmMessage={`Delete ${a.filename}?`}
              />
            </li>
          ))}
        </ul>
      )}

      <UploadForm action={uploadAction} />
    </div>
  );
}

function UploadForm({
  action,
}: {
  action: (
    state: AttachmentActionState,
    formData: FormData,
  ) => Promise<AttachmentActionState>;
}) {
  const [state, formAction] = useActionState<AttachmentActionState, FormData>(action, undefined);

  return (
    <form
      action={formAction}
      className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 dark:border-slate-800"
    >
      <input
        name="file"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/heic,application/pdf"
        required
        className="text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200 dark:text-slate-300 dark:file:bg-slate-800 dark:file:text-slate-200"
      />
      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="self-start rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Uploading…" : "Upload"}
    </button>
  );
}
