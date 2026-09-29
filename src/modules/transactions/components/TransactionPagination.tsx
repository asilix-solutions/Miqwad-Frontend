import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
export function TransactionPagination({
  page,
  totalPages,
  busy,
  onPage,
}: {
  page: number;
  totalPages: number;
  busy: boolean;
  onPage: (page: number) => void;
}) {
  const { t, i18n } = useTranslation();
  return (
    <nav aria-label={t("transactions.pagination")} className="flex flex-wrap items-center gap-3">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={busy || page <= 1}
        onClick={() => onPage(page - 1)}
      >
        {t("common.back")}
      </Button>
      <span className="text-sm">
        {t("transactions.pageOf", {
          page: page.toLocaleString(i18n.language),
          total: Math.max(1, totalPages).toLocaleString(i18n.language),
        })}
      </span>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={busy || page >= totalPages}
        onClick={() => onPage(page + 1)}
      >
        {t("common.next")}
      </Button>
    </nav>
  );
}
