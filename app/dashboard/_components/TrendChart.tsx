"use client";

import { useId, useMemo, useState } from "react";
import { formatDate, formatNumber } from "../_lib/format";
import { SEQUENTIAL_LINE } from "../_lib/colors";
import { TableIcon } from "./icons";

export type TrendPoint = { date: string; weightKg: number };

const WIDTH = 640;
const HEIGHT = 220;
const PAD_LEFT = 44;
const PAD_RIGHT = 12;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;

/** Rounds up to a "nice" 1/2/5 x 10^n number for clean axis ticks. */
function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const exp = Math.floor(Math.log10(value));
  const base = Math.pow(10, exp);
  const fraction = value / base;
  const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return niceFraction * base;
}

export default function TrendChart({
  data,
  title = "Purchases (kg)",
}: {
  data: TrendPoint[];
  title?: string;
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);
  const gradientId = useId();

  const plotWidth = WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;

  // Ticks are 4 equal steps of a "nice" size (niceCeil applied to a quarter
  // of the range), not a snap-to-nearest-10 of the max — that snap collapsed
  // every tick to 0 whenever the data (or an empty-state placeholder) was
  // small, producing duplicate React keys.
  const rawMax = Math.max(...data.map((d) => d.weightKg), 0) * 1.1;
  const tickStep = niceCeil(rawMax / 4);
  const maxValue = tickStep * 4;
  const ticks = [0, 1, 2, 3, 4].map((i) => i * tickStep);

  const points = useMemo(
    () =>
      data.map((d, i) => {
        const x = PAD_LEFT + (i / (data.length - 1)) * plotWidth;
        const y = PAD_TOP + plotHeight - (d.weightKg / maxValue) * plotHeight;
        return { x, y, ...d };
      }),
    [data, maxValue, plotWidth, plotHeight],
  );

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(1)},${(
    PAD_TOP + plotHeight
  ).toFixed(1)} L${points[0].x.toFixed(1)},${(PAD_TOP + plotHeight).toFixed(1)} Z`;

  function handlePointerMove(e: React.PointerEvent<SVGRectElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    let nearest = 0;
    let nearestDist = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - relX);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    });
    setHoverIndex(nearest);
  }

  // Show ~5 evenly spaced date labels so the axis doesn't get crowded.
  const labelStep = Math.ceil(data.length / 5);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            {title}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Last {data.length} days
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowTable((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <TableIcon className="h-4 w-4" />
          {showTable ? "View chart" : "View as table"}
        </button>
      </div>

      {showTable ? (
        <div className="mt-4 max-h-56 overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-slate-500 dark:text-slate-400">
                <th className="py-1.5 pr-3 font-medium">Date</th>
                <th className="py-1.5 font-medium">Weight</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr
                  key={d.date}
                  className="border-t border-slate-100 dark:border-slate-800"
                >
                  <td className="py-1.5 pr-3 text-slate-600 dark:text-slate-300">
                    {formatDate(d.date)}
                  </td>
                  <td className="py-1.5 tabular-nums text-slate-900 dark:text-slate-50">
                    {formatNumber(d.weightKg)} kg
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative mt-2">
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="w-full touch-none"
            role="img"
            aria-label={`${title} by day, last ${data.length} days, in kilograms`}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SEQUENTIAL_LINE.light} stopOpacity={0.14} />
                <stop offset="100%" stopColor={SEQUENTIAL_LINE.light} stopOpacity={0} />
              </linearGradient>
            </defs>

            {/* Gridlines + y-axis ticks */}
            {ticks.map((t) => {
              const y = PAD_TOP + plotHeight - (t / maxValue) * plotHeight;
              return (
                <g key={t}>
                  <line
                    x1={PAD_LEFT}
                    x2={WIDTH - PAD_RIGHT}
                    y1={y}
                    y2={y}
                    stroke="currentColor"
                    strokeWidth={1}
                    className="text-slate-100 dark:text-slate-800"
                  />
                  <text
                    x={PAD_LEFT - 8}
                    y={y}
                    textAnchor="end"
                    dominantBaseline="middle"
                    className="fill-slate-400 text-[10px] dark:fill-slate-500"
                  >
                    {formatNumber(t)}
                  </text>
                </g>
              );
            })}

            {/* X-axis date labels */}
            {points.map(
              (p, i) =>
                i % labelStep === 0 && (
                  <text
                    key={p.date}
                    x={p.x}
                    y={HEIGHT - 8}
                    textAnchor="middle"
                    className="fill-slate-400 text-[10px] dark:fill-slate-500"
                  >
                    {formatDate(p.date)}
                  </text>
                ),
            )}

            {/* Area wash */}
            <path d={areaPath} fill={`url(#${gradientId})`} />

            {/* Line */}
            <path
              d={linePath}
              fill="none"
              stroke={SEQUENTIAL_LINE.light}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="dark:hidden"
            />
            <path
              d={linePath}
              fill="none"
              stroke={SEQUENTIAL_LINE.dark}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="hidden dark:block"
            />

            {/* End marker */}
            <circle
              cx={points[points.length - 1].x}
              cy={points[points.length - 1].y}
              r={4}
              fill={SEQUENTIAL_LINE.light}
              stroke="white"
              strokeWidth={2}
              className="dark:hidden"
            />
            <circle
              cx={points[points.length - 1].x}
              cy={points[points.length - 1].y}
              r={4}
              fill={SEQUENTIAL_LINE.dark}
              stroke="#0f172a"
              strokeWidth={2}
              className="hidden dark:block"
            />

            {/* Crosshair */}
            {hoverIndex !== null && (
              <g>
                <line
                  x1={points[hoverIndex].x}
                  x2={points[hoverIndex].x}
                  y1={PAD_TOP}
                  y2={PAD_TOP + plotHeight}
                  stroke="currentColor"
                  strokeWidth={1}
                  className="text-slate-300 dark:text-slate-600"
                />
                <circle
                  cx={points[hoverIndex].x}
                  cy={points[hoverIndex].y}
                  r={5}
                  fill={SEQUENTIAL_LINE.light}
                  stroke="white"
                  strokeWidth={2}
                  className="dark:hidden"
                />
                <circle
                  cx={points[hoverIndex].x}
                  cy={points[hoverIndex].y}
                  r={5}
                  fill={SEQUENTIAL_LINE.dark}
                  stroke="#0f172a"
                  strokeWidth={2}
                  className="hidden dark:block"
                />
              </g>
            )}

            {/* Hover hit area */}
            <rect
              x={PAD_LEFT}
              y={0}
              width={plotWidth}
              height={HEIGHT}
              fill="transparent"
              onPointerMove={handlePointerMove}
              onPointerLeave={() => setHoverIndex(null)}
            />
          </svg>

          {hoverIndex !== null && (
            <div
              className="pointer-events-none absolute top-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md dark:border-slate-700 dark:bg-slate-800"
              style={{
                left: `${(points[hoverIndex].x / WIDTH) * 100}%`,
                transform:
                  points[hoverIndex].x > WIDTH * 0.75
                    ? "translateX(-100%)"
                    : "translateX(-8px)",
              }}
            >
              <p className="font-medium text-slate-500 dark:text-slate-400">
                {formatDate(points[hoverIndex].date)}
              </p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-50">
                {formatNumber(points[hoverIndex].weightKg)} kg
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
