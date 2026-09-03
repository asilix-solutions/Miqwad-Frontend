/**
 * @file InvoicesEmptyState.tsx
 * @description The primary visible state of the Invoices list — live data is
 * empty (totalCount: 0) today, so this must read as calm and intentional, not
 * broken. A quiet receipt/document illustration + reassuring bilingual copy.
 */
import { useTranslation } from "react-i18next";
import { ReceiptText } from "lucide-react";

export function InvoicesEmptyState() {
  const { t } = useTranslation();

  return (
    <div
      className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--color-divider)] bg-[var(--color-surface)] px-6 py-16 text-center shadow-[var(--shadow-1)]"
      role="status"
    >
      {/* Layered document mark — pure CSS, no fake data */}
      <div className="relative mb-6 h-20 w-20" aria-hidden>
        <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-[var(--radius-md)] bg-[var(--color-surface-2)]" />
        <div className="absolute inset-0 flex items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)]">
          <ReceiptText className="h-9 w-9 text-[var(--color-muted)]" />
        </div>
      </div>

      <h2 className="text-base font-semibold text-[var(--color-ink-body)]">
        {t("invoices.empty.title")}
      </h2>
      <p className="mt-1.5 max-w-sm text-sm text-[var(--color-muted)]">
        {t("invoices.empty.description")}
      </p>
    </div>
  );
}
