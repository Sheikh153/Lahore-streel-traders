// Currency is Pakistani Rupees, formatted as "Rs 12,345" — PKR isn't shown
// with subunits (paisa) in everyday business use, so amounts are rounded to
// the nearest whole rupee.

export function formatCurrency(value: number): string {
  return `Rs ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(value))}`;
}

// For per-kg cost figures (landed cost, avg cost, cost at sale) — these
// feed profit math directly, and rounding each one to a whole rupee before
// display was making the same underlying figure look inconsistent between
// pages (e.g. a lot's own cost vs. a blended average) purely from where
// the rounding landed, not any real difference. Two decimal places keeps
// it readable while showing the real number.
export function formatCurrencyPerKg(value: number): string {
  return `Rs ${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
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
