// Currency is Pakistani Rupees, formatted as "Rs 12,345" — PKR isn't shown
// with subunits (paisa) in everyday business use, so amounts are rounded to
// the nearest whole rupee.

export function formatCurrency(value: number): string {
  return `Rs ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(value))}`;
}

export function formatCurrencyCompact(value: number): string {
  return `Rs ${new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)}`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatNumberCompact(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatWeight(kg: number): string {
  return `${formatNumber(kg)} kg`;
}

export function formatDelta(percent: number): string {
  const sign = percent > 0 ? "+" : "";
  return `${sign}${percent.toFixed(1)}%`;
}

export function formatDate(iso: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

export function formatDateLong(iso: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}
