"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import type { SaleFormState } from "../actions";
import { formatCurrency, formatNumber } from "@/app/dashboard/_lib/format";

type Contact = { id: string; name: string };
type Material = {
  id: string;
  name: string;
  unit: string;
  pricePerKg: number;
  stockKg: number;
  avgCostPerKg: number;
};

type SaleFormProps = {
  action: (state: SaleFormState, formData: FormData) => Promise<SaleFormState>;
  buyers: Contact[];
  materials: Material[];
  defaultVatPercent?: number;
  defaultValues?: {
    contactId: string;
    materialId: string;
    date: string; // "YYYY-MM-DD"
    weightKg: number;
    ratePerKg: number;
    vatPercent: number;
    weighbridgeWeightKg: number | null;
    vehicleNumber: string | null;
    biltyNumber: string | null;
    receiptNumber: string | null;
    thicknessMm: number | null;
    heightMm: number | null;
    lengthMm: number | null;
    notes: string | null;
  };
  submitLabel: string;
};

export default function SaleForm({
  action,
  buyers,
  materials,
  defaultVatPercent = 0,
  defaultValues,
  submitLabel,
}: SaleFormProps) {
  const [state, formAction] = useActionState<SaleFormState, FormData>(action, undefined);

  const today = new Date().toISOString().slice(0, 10);
  const [materialId, setMaterialId] = useState(
    defaultValues?.materialId ?? materials[0]?.id ?? "",
  );
  const [weightKg, setWeightKg] = useState(defaultValues?.weightKg?.toString() ?? "");
  const [ratePerKg, setRatePerKg] = useState(
    defaultValues?.ratePerKg?.toString() ?? materials[0]?.pricePerKg?.toString() ?? "",
  );
  const [vatPercent, setVatPercent] = useState(
    (defaultValues?.vatPercent ?? defaultVatPercent).toString(),
  );
  const [weighbridgeWeightKg, setWeighbridgeWeightKg] = useState(
    defaultValues?.weighbridgeWeightKg?.toString() ?? "",
  );

  const selectedMaterial = materials.find((m) => m.id === materialId);

  const preview = useMemo(() => {
    const w = Number(weightKg);
    const r = Number(ratePerKg);
    const vat = Number(vatPercent) || 0;
    if (!selectedMaterial || !Number.isFinite(w) || !Number.isFinite(r) || w <= 0) return null;
    const total = w * r;
    const vatAmount = total * (vat / 100);
    const grandTotal = total + vatAmount;
    const cost = w * selectedMaterial.avgCostPerKg;
    const profit = total - cost;
    const margin = total > 0 ? (profit / total) * 100 : 0;
    const remaining = selectedMaterial.stockKg - w;
    return {
      total,
      vatAmount,
      grandTotal,
      profit,
      margin,
      remaining,
      profitPerKg: w > 0 ? profit / w : 0,
    };
  }, [weightKg, ratePerKg, vatPercent, selectedMaterial]);

  const weightDifference = useMemo(() => {
    const w = Number(weightKg);
    const wb = Number(weighbridgeWeightKg);
    if (!weighbridgeWeightKg || !Number.isFinite(w) || !Number.isFinite(wb)) return null;
    return wb - w;
  }, [weightKg, weighbridgeWeightKg]);

  function handleMaterialChange(id: string) {
    setMaterialId(id);
    const material = materials.find((m) => m.id === id);
    if (material) setRatePerKg(material.pricePerKg.toString());
  }

  if (buyers.length === 0 || materials.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
        {buyers.length === 0 && (
          <p>
            You need at least one buyer contact first —{" "}
            <Link href="/dashboard/contacts/new" className="font-medium text-blue-600 dark:text-blue-400">
              add a contact
            </Link>
            .
          </p>
        )}
        {materials.length === 0 && (
          <p>
            You need at least one material with stock first —{" "}
            <Link href="/dashboard/inventory/new" className="font-medium text-blue-600 dark:text-blue-400">
              add a material
            </Link>
            .
          </p>
        )}
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-5 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <SelectField
          label="Buyer"
          name="contactId"
          required
          defaultValue={defaultValues?.contactId}
          options={buyers.map((c) => ({ value: c.id, label: c.name }))}
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="materialId" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Material <span className="text-red-500">*</span>
          </label>
          <select
            id="materialId"
            name="materialId"
            required
            value={materialId}
            onChange={(e) => handleMaterialChange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            {materials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({formatNumber(m.stockKg)} {m.unit} in stock)
              </option>
            ))}
          </select>
        </div>
        <Field
          label="Date"
          name="date"
          type="date"
          required
          defaultValue={defaultValues?.date ?? today}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Field
          label={`Weight (${selectedMaterial?.unit ?? "kg"})`}
          name="weightKg"
          type="number"
          step="0.01"
          min="0.01"
          required
          value={weightKg}
          onChange={setWeightKg}
        />
        <Field
          label={`Rate per ${selectedMaterial?.unit ?? "kg"} (Rs)`}
          name="ratePerKg"
          type="number"
          step="0.01"
          min="0"
          required
          value={ratePerKg}
          onChange={setRatePerKg}
        />
        <Field
          label="VAT (%)"
          name="vatPercent"
          type="number"
          step="0.01"
          min="0"
          value={vatPercent}
          onChange={setVatPercent}
        />
      </div>

      {preview && (
        <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3.5 text-sm sm:grid-cols-4 dark:bg-slate-950">
          <PreviewStat label="Sale value" value={formatCurrency(preview.total)} />
          <PreviewStat label="VAT" value={formatCurrency(preview.vatAmount)} />
          <PreviewStat label="Grand total" value={formatCurrency(preview.grandTotal)} />
          <PreviewStat
            label="Profit"
            value={formatCurrency(preview.profit)}
            emphasize={preview.profit < 0 ? "bad" : "good"}
          />
          <PreviewStat label="Profit/kg" value={formatCurrency(preview.profitPerKg)} />
          <PreviewStat label="Margin" value={`${preview.margin.toFixed(1)}%`} />
          <PreviewStat
            label="Remaining stock"
            value={`${formatNumber(preview.remaining)} ${selectedMaterial?.unit ?? "kg"}`}
            emphasize={preview.remaining < 0 ? "bad" : undefined}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Field
          label="Weighbridge weight (optional)"
          name="weighbridgeWeightKg"
          type="number"
          step="0.01"
          value={weighbridgeWeightKg}
          onChange={setWeighbridgeWeightKg}
          hint={weightDifference !== null ? `Difference: ${weightDifference.toFixed(2)} kg` : undefined}
        />
        <Field label="Vehicle / container #" name="vehicleNumber" defaultValue={defaultValues?.vehicleNumber ?? ""} />
        <Field label="Bilty #" name="biltyNumber" defaultValue={defaultValues?.biltyNumber ?? ""} />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <Field label="Receipt # (buyer)" name="receiptNumber" defaultValue={defaultValues?.receiptNumber ?? ""} />
        <Field
          label="Thickness (mm)"
          name="thicknessMm"
          type="number"
          step="0.01"
          defaultValue={defaultValues?.thicknessMm?.toString() ?? ""}
        />
        <Field
          label="Height (mm)"
          name="heightMm"
          type="number"
          step="0.01"
          defaultValue={defaultValues?.heightMm?.toString() ?? ""}
        />
        <Field
          label="Length (mm)"
          name="lengthMm"
          type="number"
          step="0.01"
          defaultValue={defaultValues?.lengthMm?.toString() ?? ""}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          defaultValue={defaultValues?.notes ?? ""}
          className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
      </div>

      {state?.error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <SubmitButton label={submitLabel} />
        <Link
          href="/dashboard/sales"
          className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

function PreviewStat({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: "good" | "bad";
}) {
  return (
    <div>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p
        className={`font-semibold tabular-nums ${
          emphasize === "bad"
            ? "text-[#d03b3b]"
            : emphasize === "good"
              ? "text-[#006300] dark:text-[#0ca30c]"
              : "text-slate-900 dark:text-slate-50"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  step,
  min,
  value,
  defaultValue,
  onChange,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  step?: string;
  min?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        step={step}
        min={min}
        required={required}
        value={onChange ? value : undefined}
        defaultValue={onChange ? undefined : defaultValue}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
      />
      {hint && <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  );
}

function SelectField({
  label,
  name,
  required,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  required?: boolean;
  defaultValue?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <select
        id={name}
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}
