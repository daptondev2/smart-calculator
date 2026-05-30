const currencyFmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const percentFmt = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(value: number): string {
  return currencyFmt.format(value ?? 0);
}

/** Expects a ratio, e.g. 0.029 -> "2.90%". */
export function formatPercent(ratio: number): string {
  return percentFmt.format(ratio ?? 0);
}
