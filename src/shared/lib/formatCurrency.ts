export function formatCurrency(value: number | undefined, language: string): string {
  const amount = value ?? 0;
  return new Intl.NumberFormat(language === "ar" ? "ar-SA" : "en-US", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(amount);
}
