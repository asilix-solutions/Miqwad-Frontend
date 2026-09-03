/**
 * @file invoiceCode.ts
 * @description Derives a human-facing invoice code from the numeric id.
 *
 * The backend `InvoiceResponseDto` exposes no invoice number today, so the
 * display code is simply `#${id}`. The bilingual label (e.g. "فاتورة #42")
 * is produced in the UI via i18n `invoices.codeLabel`.
 * TODO: use invoice.invoiceNumber when the backend adds it
 */

/** `42` → `#42`. */
export function invoiceCode(id: number | string): string {
  return `#${id}`;
}
