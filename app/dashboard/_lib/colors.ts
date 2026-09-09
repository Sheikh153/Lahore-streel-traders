// Categorical slots — fixed order, validated for CVD-safety (see the dataviz
// skill). Tied to entity identity, never reassigned by rank/sort order.
export const CATEGORICAL: Record<number, { light: string; dark: string }> = {
  1: { light: "#2a78d6", dark: "#3987e5" }, // blue
  2: { light: "#eb6834", dark: "#d95926" }, // orange
  3: { light: "#1baf7a", dark: "#199e70" }, // aqua
  4: { light: "#eda100", dark: "#c98500" }, // yellow
  5: { light: "#e87ba4", dark: "#d55181" }, // magenta
  6: { light: "#008300", dark: "#008300" }, // green
};

// Sequential default hue (blue), used for the single-series trend line.
export const SEQUENTIAL_LINE = { light: "#2a78d6", dark: "#3987e5" };

// Status palette — fixed, never themed, never reused for series identity.
export const STATUS = {
  good: { light: "#0ca30c", dark: "#0ca30c" },
  warning: { light: "#fab219", dark: "#fab219" },
  serious: { light: "#ec835a", dark: "#ec835a" },
  critical: { light: "#d03b3b", dark: "#d03b3b" },
};

export const MUTED = { light: "#898781", dark: "#898781" };
export const GRIDLINE = { light: "#e1e0d9", dark: "#2c2c2a" };
