/**
 * @file AdminInvoicesPage.tsx
 * @description Admin Invoices list — READ-ONLY, wired to live GET /api/Invoices.
 *
 * The backend `InvoiceResponseDto` is a four-field scaffold (id, fullName,
 * totalPrice, createdAt) and live data is currently empty, so the polished
 * empty state is the primary visible UI. A subtle date/amount sort control is
 * wired to the live-validated SortBy / SortDescending params; changing it
 * resets to page 1. No status/order filters exist server-side.
 *
 * Financial-document identity: numeric-forward, tabular-nums amounts, right-
 * aligned money column, calm surfaces — deliberately not a clone of Orders.
 */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ArrowDownUp, ArrowDown, ArrowUp, ReceiptText, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { DataTable, type DataTableColumn } from "@shared/components/DataTable";
import { formatCurrency } from "@shared/lib/formatCurrency";
import { formatOrderDate } from "@shared/lib/formatOrderDate";
import { useInvoicesList } from "../hooks/useInvoicesQueries";
import type { Invoice } from "../types";
import { InvoicesEmptyState } from "../components/InvoicesEmptyState";

const PAGE_SIZE = 20;

type SortField = "createdAt" | "totalPrice";

export function AdminInvoicesPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [pageNumber, setPageNumber] = useState(1);
  const [sortBy, setSortBy] = useState<SortField>("createdAt");
  const [sortDescending, setSortDescending] = useState(true);

  useEffect(() => {
    setPageNumber(1);
  }, [sortBy, sortDescending]);

  const q = useInvoicesList({
    pageNumber,
    pageSize: PAGE_SIZE,
    sortBy,
    sortDescending,
  });

  const items = q.data?.items ?? [];
  const totalPages = q.data?.totalPages ?? 1;
  const isEmpty = !q.isLoading && !q.isError && items.length === 0;

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDescending((d) => !d);
    } else {
      setSortBy(field);
      setSortDescending(true);
    }
  };

  const sortIcon = (field: SortField) => {
    if (sortBy !== field) return <ArrowDownUp className="size-3.5" aria-hidden />;
    return sortDescending ? (
      <ArrowDown className="size-3.5" aria-hidden />
    ) : (
      <ArrowUp className="size-3.5" aria-hidden />
    );
  };

  const columns: DataTableColumn<Invoice>[] = [
    {
      key: "code",
      header: t("invoices.colCode"),
      render: (row) => (
        <span className="font-mono text-[13px] text-[var(--color-muted)]" dir="ltr">
          {row.code}
        </span>
      ),
    },
    {
      key: "fullName",
      header: t("invoices.colName"),
      render: (row) => row.fullName || "—",
    },
    {
      key: "totalPrice",
      header: t("invoices.colAmount"),
      className: "text-end",
      render: (row) => (
        <span className="font-semibold tabular-nums text-[var(--color-ink-body)]" dir="ltr">
          {formatCurrency(row.totalPrice, i18n.language)}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: t("invoices.colDate"),
      render: (row) => (
        <span className="tabular-nums text-[var(--color-muted)]">
          {formatOrderDate(row.createdAt, i18n.language)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-2)] text-[var(--color-brand-blue)]"
            aria-hidden
          >
            <ReceiptText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--color-ink-body)]">{t("invoices.title")}</h1>
            <p className="text-sm text-[var(--color-muted)]">{t("invoices.subtitle")}</p>
          </div>
        </div>

        {q.isError ? (
          <Button type="button" variant="outline" onClick={() => q.refetch()}>
            <RotateCw className="size-4" />
            {t("invoices.retry")}
          </Button>
        ) : (
          !isEmpty && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[var(--color-muted)]">{t("invoices.sortLabel")}</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => toggleSort("createdAt")}>
                {t("invoices.colDate")}
                {sortIcon("createdAt")}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => toggleSort("totalPrice")}>
                {t("invoices.colAmount")}
                {sortIcon("totalPrice")}
              </Button>
            </div>
          )
        )}
      </div>

      {isEmpty ? (
        <InvoicesEmptyState />
      ) : (
        <DataTable<Invoice>
          columns={columns}
          rows={items}
          isLoading={q.isLoading}
          isError={q.isError}
          errorText={t("invoices.errorTitle")}
          emptyText={t("invoices.empty.title")}
          getRowKey={(row) => row.id}
          onRowClick={(row) => navigate(`/admin/invoices/${row.id}`)}
        />
      )}

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationLink
                onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                className={
                  pageNumber === 1
                    ? "pointer-events-none opacity-50 cursor-default gap-1 px-2.5"
                    : "cursor-pointer gap-1 px-2.5"
                }
                aria-label={t("common.back")}
              >
                {t("common.back")}
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <span className="px-4 text-sm text-[var(--color-muted)]">
                {pageNumber} / {totalPages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink
                onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
                className={
                  pageNumber === totalPages
                    ? "pointer-events-none opacity-50 cursor-default gap-1 px-2.5"
                    : "cursor-pointer gap-1 px-2.5"
                }
                aria-label={t("common.next")}
              >
                {t("common.next")}
              </PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
