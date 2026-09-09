import type { Metadata } from "next";
import { verifySession } from "@/app/lib/dal";
import { getContactsForSelect } from "@/app/dashboard/contacts/_lib/queries";
import { getMaterialsForSaleSelect } from "@/app/dashboard/inventory/_lib/queries";
import { getCompanySettings } from "@/app/dashboard/settings/_lib/queries";
import { createSale } from "../actions";
import SaleForm from "../_components/SaleForm";

export const metadata: Metadata = { title: "Record sale" };

export default async function NewSalePage() {
  await verifySession();
  const [buyers, materials, company] = await Promise.all([
    getContactsForSelect("buyer"),
    getMaterialsForSaleSelect(),
    getCompanySettings(),
  ]);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
          Record sale
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Sell material to a buyer. Profit and inventory update automatically.
        </p>
      </div>

      <SaleForm
        action={createSale}
        buyers={buyers}
        materials={materials}
        defaultVatPercent={company.defaultVatPercent ?? 0}
        submitLabel="Record sale"
      />
    </div>
  );
}
