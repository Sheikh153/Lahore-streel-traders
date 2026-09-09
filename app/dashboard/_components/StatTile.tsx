import { formatDelta } from "../_lib/format";
import { ChevronDownIcon, ChevronUpIcon } from "./icons";

export type Kpi = {
  label: string;
  value: string;
  /** Omit when there's no meaningful prior-period comparison (e.g. a snapshot like stock value). */
  deltaPercent?: number;
  /** Whether an increase in this metric is a good thing. */
  upIsGood: boolean;
  sparkline?: number[];
};

export default function StatTile({ kpi }: { kpi: Kpi }) {
  const isUp = (kpi.deltaPercent ?? 0) >= 0;
  const isGood = isUp === kpi.upIsGood;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        {kpi.label}
      </p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
          {kpi.value}
        </p>
        {kpi.sparkline && <Sparkline values={kpi.sparkline} />}
      </div>
      {kpi.deltaPercent !== undefined && (
        <div
          className={`mt-3 flex items-center gap-1 text-sm font-medium ${
            isGood ? "text-[#006300] dark:text-[#0ca30c]" : "text-[#d03b3b]"
          }`}
        >
          {isUp ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
          <span>{formatDelta(kpi.deltaPercent)}</span>
          <span className="font-normal text-slate-400 dark:text-slate-500">vs last month</span>
        </div>
      )}
    </div>
  );
}

function Sparkline({ values }: { values: number[] }) {
  const width = 96;
  const height = 32;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return [x, y] as const;
  });

  const path = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");

  const [lastX, lastY] = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className="shrink-0 overflow-visible"
      aria-hidden="true"
    >
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-slate-300 dark:text-slate-700"
      />
      <circle
        cx={lastX}
        cy={lastY}
        r={2.5}
        className="fill-blue-500"
        stroke="white"
        strokeWidth={1.5}
      />
    </svg>
  );
}
