/**
 * @file formatInvoiceAmount.ts
 * @description Retain halalas without changing other modules' formatting.
 * SAR follows Maqwad's established convention; the API has no currency field.
 */
export function formatInvoiceAmount(value: number, language: string): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(language.startsWith("ar") ? "ar-SA" : "en-US", {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
export function formatInvoiceRate(value: number, language: string): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(language.startsWith("ar") ? "ar-SA" : "en-US", {
    style: "percent",
    maximumFractionDigits: 4,
  }).format(value);
}
