import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { verifySession } from "@/app/lib/dal";
import { getMaterialById } from "../../_lib/queries";
import { updateMaterial } from "../../actions";
import MaterialForm from "../../_components/MaterialForm";

export const metadata: Metadata = { title: "Edit material" };

export default async function EditMaterialPage({
  params,
}: PageProps<"/dashboard/inventory/[id]/edit">) {
  await verifySession();
  const { id } = await params;
  const material = await getMaterialById(id);

  if (!material) {
    notFound();
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
          Edit material
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Update {material.name}&apos;s price, threshold, or stock.
        </p>
      </div>

      <MaterialForm
        action={updateMaterial.bind(null, material.id)}
        defaultValues={material}
        submitLabel="Save changes"
        showStockField
      />
    </div>
  );
}
