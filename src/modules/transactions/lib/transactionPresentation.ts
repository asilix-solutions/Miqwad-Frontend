import { AppError } from "@shared/types/api";
export function transactionAmount(value: number, locale: string) {
  return new Intl.NumberFormat(locale.startsWith("ar") ? "ar-SA" : "en-US", {
    style: "currency",
    currency: "SAR",
    currencyDisplay: locale.startsWith("ar") ? "symbol" : "code",
    minimumFractionDigits: 2,
    maximumFractionDigits: 20,
  }).format(value);
}
export function transactionErrorKey(error: unknown) {
  if (error instanceof AppError) {
    if (error.code === "TRANSACTION_DEALER") return "transactions.errors.dealer";
    if (error.code === "TRANSACTION_CONTRACT") return "transactions.errors.contract";
    if (error.status === 401) return "transactions.errors.unauthorized";
    if (error.status === 403) return "transactions.errors.forbidden";
    if (error.status === 404) return "transactions.errors.notFound";
    if (error.status === 409) return "transactions.errors.conflict";
  }
  return "transactions.errors.request";
}
/** Only intended validation/conflict messages are safe to surface; never server stacks. */
export function transactionValidationMessages(error: unknown): string[] {
  if (
    !(error instanceof AppError) ||
    !(error.status === 400 || error.status === 409 || error.code === "TRANSACTION_REJECTED")
  )
    return [];
  return [
    ...new Set(
      [error.message, ...(error.errors ?? []), ...Object.values(error.fields ?? {}).flat()].filter(
        Boolean,
      ),
    ),
  ];
}
