import type { Metadata } from "next";
import { verifySession } from "@/app/lib/dal";
import { getContactsForSelect } from "@/app/dashboard/contacts/_lib/queries";
import { getAllMaterialsForSelect } from "@/app/dashboard/inventory/_lib/queries";
import { createPurchase } from "../actions";
import PurchaseForm from "../_components/PurchaseForm";

export const metadata: Metadata = { title: "Record purchase" };

export default async function NewPurchasePage() {
  await verifySession();
  const [suppliers, materials] = await Promise.all([
    getContactsForSelect("supplier"),
    getAllMaterialsForSelect(),
  ]);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
          Record purchase
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Record a new lot bought from a supplier. Inventory updates automatically.
        </p>
      </div>

      <PurchaseForm
        action={createPurchase}
        suppliers={suppliers}
        materials={materials}
        submitLabel="Record purchase"
      />
    </div>
  );
}
