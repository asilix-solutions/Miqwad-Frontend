/**
 * @file AdminInvoicesPage.tsx
 * @description Read-only invoice register using real document references.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@shared/components/DataTable";
import { formatOrderDate } from "@shared/lib/formatOrderDate";
import { useInvoicesList } from "../hooks/useInvoicesQueries";
import { formatInvoiceAmount } from "../lib/formatInvoiceAmount";
import type { Invoice } from "../types";
import { InvoicesEmptyState } from "../components/InvoicesEmptyState";

export function AdminInvoicesPage() {
  const { t, i18n } = useTranslation();
  const [pageNumber, setPageNumber] = useState(1);
  const [sort, setSort] = useState("default");
  const q = useInvoicesList({
    pageNumber,
    pageSize: 20,
    ...(sort === "default"
      ? {}
      : { sortBy: "totalPrice" as const, sortDescending: sort === "desc" }),
  });
  const columns: DataTableColumn<Invoice>[] = [
    {
      key: "invoiceNumber",
      header: t("invoices.colCode"),
      render: (row) => (
        <Link
          className="font-semibold text-[var(--color-brand-blue)] underline-offset-4 hover:underline focus-visible:outline-2"
          to={`/admin/invoices/${row.id}`}
        >
          <bdi>{row.invoiceNumber}</bdi>
        </Link>
      ),
    },
    {
      key: "customerName",
      header: t("invoices.colName"),
      className: "min-w-40 max-w-72 whitespace-normal break-words",
      render: (row) => <bdi>{row.customerName || t("invoices.unavailable")}</bdi>,
    },
    {
      key: "orderNumber",
      header: t("invoices.orderReference"),
      render: (row) => <bdi>{row.orderNumber ?? t("invoices.noOrder")}</bdi>,
    },
    {
      key: "issueDate",
      header: t("invoices.colDate"),
      render: (row) => formatOrderDate(row.issueDate, i18n.language),
    },
    {
      key: "itemCount",
      header: t("invoices.totalQuantity"),
      render: (row) => row.itemCount.toLocaleString(i18n.language),
    },
    {
      key: "totalPrice",
      header: t("invoices.colAmount"),
      className: "text-end font-semibold tabular-nums",
      render: (row) => <bdi>{formatInvoiceAmount(row.totalPrice, i18n.language)}</bdi>,
    },
  ];
  const totalPages = q.data?.totalPages ?? 0;
  return (
    <div className="min-w-0 space-y-5 p-4 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <ReceiptText
            className="mt-1 size-6 shrink-0 text-[var(--color-brand-blue)]"
            aria-hidden
          />
          <div>
            <h1 className="text-xl font-bold">{t("invoices.title")}</h1>
            <p className="mt-1 text-sm text-[var(--color-muted)]">{t("invoices.subtitle")}</p>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          {t("invoices.sortLabel")}
          <select
            className="rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)] p-2"
            value={sort}
            onChange={(event) => {
              setSort(event.target.value);
              setPageNumber(1);
            }}
          >
            <option value="default">{t("invoices.sortDefault")}</option>
            <option value="desc">{t("invoices.sortHighest")}</option>
            <option value="asc">{t("invoices.sortLowest")}</option>
          </select>
        </label>
      </header>
      <div role="status" className="min-h-5 text-sm text-[var(--color-muted)]">
        {q.isFetching
          ? t("invoices.loading")
          : q.isError
            ? ""
            : t("invoices.recordCount", { count: q.data?.total ?? 0 })}
      </div>
      {q.isError && (
        <Button variant="outline" onClick={() => void q.refetch()}>
          {t("invoices.retry")}
        </Button>
      )}
      {!q.isLoading && !q.isError && q.data?.items.length === 0 ? (
        <InvoicesEmptyState />
      ) : (
        <div aria-busy={q.isFetching}>
          <DataTable
            columns={columns}
            rows={q.data?.items ?? []}
            isLoading={q.isLoading}
            isError={q.isError}
            errorText={t("invoices.errorTitle")}
            emptyText={t("invoices.empty.title")}
            getRowKey={(row) => String(row.id)}
          />
        </div>
      )}
      {!q.isError && (totalPages > 1 || pageNumber > 1) && (
        <nav
          aria-label={t("invoices.pagination")}
          className="flex flex-wrap items-center justify-between gap-3"
        >
          <Button
            variant="outline"
            size="sm"
            disabled={pageNumber <= 1 || q.isFetching}
            onClick={() => setPageNumber((p) => p - 1)}
          >
            {t("common.back")}
          </Button>
          <span className="text-sm tabular-nums">
            {t("invoices.pageOf", {
              page: q.data?.page ?? pageNumber,
              total: Math.max(totalPages, 1),
            })}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pageNumber >= totalPages || q.isFetching}
            onClick={() => setPageNumber((p) => p + 1)}
          >
            {t("common.next")}
          </Button>
        </nav>
      )}
    </div>
  );
}
