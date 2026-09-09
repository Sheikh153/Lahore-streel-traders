import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { verifySession } from "@/app/lib/dal";
import { getContactsForSelect } from "@/app/dashboard/contacts/_lib/queries";
import { getAllMaterialsForSelect } from "@/app/dashboard/inventory/_lib/queries";
import { getPurchaseById } from "../../_lib/queries";
import { updatePurchase } from "../../actions";
import PurchaseForm from "../../_components/PurchaseForm";

export const metadata: Metadata = { title: "Edit purchase" };

export default async function EditPurchasePage({
  params,
}: PageProps<"/dashboard/purchases/[id]/edit">) {
  await verifySession();
  const { id } = await params;

  const [purchase, suppliers, materials] = await Promise.all([
    getPurchaseById(id),
    getContactsForSelect("supplier"),
    getAllMaterialsForSelect(),
  ]);

  if (!purchase) notFound();

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
          Edit {purchase.lotId}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Update this lot — inventory stock is adjusted to match.
        </p>
      </div>

      <PurchaseForm
        action={updatePurchase.bind(null, purchase.id)}
        suppliers={suppliers}
        materials={materials}
        defaultValues={{
          contactId: purchase.contactId,
          materialId: purchase.materialId,
          weightKg: purchase.weightKg,
          ratePerKg: purchase.ratePerKg,
          weighbridgeWeightKg: purchase.weighbridgeWeightKg,
          vehicleNumber: purchase.vehicleNumber,
          biltyNumber: purchase.biltyNumber,
          receiptNumber: purchase.receiptNumber,
          thicknessMm: purchase.thicknessMm,
          heightMm: purchase.heightMm,
          lengthMm: purchase.lengthMm,
          notes: purchase.notes,
        }}
        submitLabel="Save changes"
      />
    </div>
  );
}
