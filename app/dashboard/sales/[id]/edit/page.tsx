import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { verifySession } from "@/app/lib/dal";
import { getContactsForSelect } from "@/app/dashboard/contacts/_lib/queries";
import { getMaterialsForSaleSelect } from "@/app/dashboard/inventory/_lib/queries";
import { getSaleById } from "../../_lib/queries";
import { updateSale } from "../../actions";
import SaleForm from "../../_components/SaleForm";

export const metadata: Metadata = { title: "Edit sale" };

export default async function EditSalePage({
  params,
}: PageProps<"/dashboard/sales/[id]/edit">) {
  await verifySession();
  const { id } = await params;

  const [sale, buyers, materials] = await Promise.all([
    getSaleById(id),
    getContactsForSelect("buyer"),
    getMaterialsForSaleSelect(),
  ]);

  if (!sale) notFound();

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
          Edit {sale.saleRef}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Update this sale — inventory and profit are recalculated to match.
        </p>
      </div>

      <SaleForm
        action={updateSale.bind(null, sale.id)}
        buyers={buyers}
        materials={materials}
        defaultValues={{
          contactId: sale.contactId,
          materialId: sale.materialId,
          date: sale.date.toISOString().slice(0, 10),
          weightKg: sale.weightKg,
          ratePerKg: sale.ratePerKg,
          vatPercent: sale.vatPercent,
          weighbridgeWeightKg: sale.weighbridgeWeightKg,
          vehicleNumber: sale.vehicleNumber,
          biltyNumber: sale.biltyNumber,
          receiptNumber: sale.receiptNumber,
          thicknessMm: sale.thicknessMm,
          heightFt: sale.heightFt,
          lengthFt: sale.lengthFt,
          notes: sale.notes,
        }}
        submitLabel="Save changes"
      />
    </div>
  );
}
