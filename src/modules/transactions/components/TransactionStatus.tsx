import { useTranslation } from "react-i18next";
export function TransactionStatus({ active }: { active: boolean }) {
  const { t } = useTranslation();
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${active ? "bg-[var(--color-surface-2)] text-[var(--color-brand-blue)]" : "bg-[var(--color-surface-2)] text-[var(--color-muted)]"}`}
    >
      {t(active ? "transactions.active" : "transactions.inactive")}
    </span>
  );
}
