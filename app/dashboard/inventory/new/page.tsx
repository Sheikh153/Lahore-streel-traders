import type { Metadata } from "next";
import { verifySession } from "@/app/lib/dal";
import { createMaterial } from "../actions";
import MaterialForm from "../_components/MaterialForm";

export const metadata: Metadata = { title: "Add material" };

export default async function NewMaterialPage() {
  await verifySession();

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
          Add material
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Add a new material type to track in inventory.
        </p>
      </div>

      <MaterialForm action={createMaterial} submitLabel="Add material" />
    </div>
  );
}
