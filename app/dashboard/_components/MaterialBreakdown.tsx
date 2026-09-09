"use client";

import { useState } from "react";
import { formatCurrency, formatNumber } from "../_lib/format";
import { CATEGORICAL } from "../_lib/colors";

export type MaterialSlice = {
  material: string;
  weightKg: number;
  valueAmount: number;
  /** Fixed categorical slot (1-based) — tied to the entity, not its rank. */
  colorSlot: 1 | 2 | 3 | 4 | 5 | 6;
};

export default function MaterialBreakdown({
  data,
  title = "Stock by material",
  subtitle = "Current weight on hand",
}: {
  data: MaterialSlice[];
  title?: string;
  subtitle?: string;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const sorted = [...data].sort((a, b) => b.weightKg - a.weightKg);
  const maxWeight = Math.max(...sorted.map((d) => d.weightKg), 1);
  const totalWeight = sorted.reduce((sum, d) => sum + d.weightKg, 0) || 1;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>

      {sorted.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">No data yet.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {sorted.map((slice) => {
            const color = CATEGORICAL[slice.colorSlot];
            const widthPct = (slice.weightKg / maxWeight) * 100;
            const sharePct = (slice.weightKg / totalWeight) * 100;
            const isHovered = hovered === slice.material;

            return (
              <li key={slice.material}>
                <div className="mb-1 flex items-baseline justify-between text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {slice.material}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {formatNumber(slice.weightKg)} kg
                    <span className="text-slate-400 dark:text-slate-500"> ({sharePct.toFixed(0)}%)</span>
                  </span>
                </div>
                <div
                  className="group relative h-6 w-full rounded-md bg-slate-100 dark:bg-slate-800"
                  onPointerEnter={() => setHovered(slice.material)}
                  onPointerLeave={() => setHovered(null)}
                >
                  <div
                    className="absolute inset-y-0 left-0 rounded-md transition-[width] dark:hidden"
                    style={{ width: `${widthPct}%`, backgroundColor: color.light }}
                  />
                  <div
                    className="absolute inset-y-0 left-0 hidden rounded-md transition-[width] dark:block"
                    style={{ width: `${widthPct}%`, backgroundColor: color.dark }}
                  />

                  {isHovered && (
                    <div className="pointer-events-none absolute -top-11 left-0 z-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md dark:border-slate-700 dark:bg-slate-800">
                      <p className="font-semibold text-slate-900 dark:text-slate-50">
                        {formatCurrency(slice.valueAmount)}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400">
                        {formatNumber(slice.weightKg)} kg · {sharePct.toFixed(0)}%
                      </p>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
