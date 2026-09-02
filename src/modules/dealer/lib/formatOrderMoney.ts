/**
 * @file formatOrderMoney.ts
 *
 * Shared SAR money formatter for dealer orders (list + detail). Always 2
 * decimals; Arabic-Indic digits + "ر.س." under `ar`, Western digits + "SAR"
 * under `en` (via `Intl.NumberFormat` currency style). Null / non-finite
 * input is treated as 0.
 */

/** Locale-aware SAR amount, fixed to 2 decimals. */
export function formatOrderMoney(
  value: number | null | undefined,
  lang: string,
): string {
  const amount = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat(lang === "ar" ? "ar-SA" : "en-US", {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
