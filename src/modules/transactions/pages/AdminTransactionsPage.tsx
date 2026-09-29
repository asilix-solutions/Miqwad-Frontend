import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Wallet, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@shared/components/DataTable";
import { EmptyState } from "@shared/components/feedback/EmptyState";
import { formatDate } from "@shared/lib/formatDate";
import { useTransactionsList } from "../hooks/useTransactionsQueries";
import { transactionAmount } from "../lib/transactionPresentation";
import { TransactionDialog, type TransactionDialogState } from "../components/TransactionDialog";
import { TransactionStatus } from "../components/TransactionStatus";
import { TransactionFeedback } from "../components/TransactionFeedback";
import { TransactionPagination } from "../components/TransactionPagination";
import type { Transaction } from "../types";

export function AdminTransactionsPage() {
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dialog, setDialog] = useState<TransactionDialogState | null>(null);
  const q = useTransactionsList({ page, pageSize });
  const trigger = useRef<HTMLButtonElement | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const open = (state: TransactionDialogState, target: HTMLButtonElement) => {
    trigger.current = target;
    setDialog(state);
  };
  const columns: DataTableColumn<Transaction>[] = [
    {
      key: "dealerName",
      header: t("transactions.dealer"),
      className: "max-w-60 whitespace-normal",
      render: (row) => (
        <bdi className="font-medium break-words">
          {row.dealerName ?? t("transactions.userId", { id: row.dealerId })}
        </bdi>
      ),
    },
    {
      key: "balance",
      header: t("transactions.balance"),
      render: (row) => (
        <bdi className="font-semibold tabular-nums">
          {transactionAmount(row.balance, i18n.language)}
        </bdi>
      ),
    },
    {
      key: "isActive",
      header: t("common.status"),
      render: (row) => <TransactionStatus active={row.isActive} />,
    },
    {
      key: "createdAt",
      header: t("transactions.createdAt"),
      render: (row) => formatDate(row.createdAt, i18n.language),
    },
    {
      key: "updatedAt",
      header: t("transactions.updatedAt"),
      render: (row) =>
        row.updatedAt === null
          ? t("transactions.notUpdated")
          : formatDate(row.updatedAt, i18n.language),
    },
    {
      key: "actions",
      header: t("common.actions"),
      render: (row) => (
        <div className="flex gap-1">
          {(["detail", "edit", "delete"] as const).map((action) => (
            <Button
              key={action}
              variant="ghost"
              size="sm"
              disabled={q.isFetching}
              onClick={(event) => open({ action, id: row.id }, event.currentTarget)}
              aria-label={t(`transactions.${action}Record`, {
                name: row.dealerName ?? row.dealerId,
              })}
            >
              {t(action === "detail" ? "transactions.details" : `common.${action}`)}
            </Button>
          ))}
        </div>
      ),
    },
  ];
  return (
    <div dir={i18n.dir()} className="min-w-0 space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Wallet aria-hidden className="mt-1 size-6 shrink-0 text-[var(--color-brand-blue)]" />
          <div>
            <h1 ref={heading} tabIndex={-1} className="text-xl font-bold">
              {t("transactions.title")}
            </h1>
            <p className="mt-1 text-sm text-[var(--color-muted)]">{t("transactions.subtitle")}</p>
          </div>
        </div>
        <Button onClick={(event) => open({ action: "create" }, event.currentTarget)}>
          <Plus aria-hidden className="size-4" />
          {t("transactions.create")}
        </Button>
      </header>
      <p role="status" className="min-h-5 text-sm text-[var(--color-muted)]">
        {q.isFetching
          ? t("common.loading")
          : q.isError
            ? ""
            : t("transactions.results", { count: q.data?.total ?? 0 })}
      </p>
      {q.isError ? (
        <TransactionFeedback error={q.error} retry={() => void q.refetch()} />
      ) : q.data?.total === 0 ? (
        <EmptyState title={t("transactions.empty")} description={t("transactions.emptyHint")} />
      ) : (
        <section
          aria-label={t("transactions.title")}
          tabIndex={0}
          className="min-w-0 overflow-x-auto focus-visible:outline-2"
          aria-busy={q.isFetching}
        >
          <DataTable
            columns={columns}
            rows={q.data?.items ?? []}
            getRowKey={(row) => String(row.id)}
            isLoading={q.isPending}
            emptyText={t("transactions.emptyPage")}
          />
        </section>
      )}
      {!q.isError && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm">
            {t("transactions.pageSize")}
            <select
              value={pageSize}
              disabled={q.isFetching}
              className="rounded-md border border-[var(--color-divider)] bg-[var(--color-surface)] p-2"
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size.toLocaleString(i18n.language)}
                </option>
              ))}
            </select>
          </label>
          <TransactionPagination
            page={q.data?.page ?? page}
            totalPages={q.data?.totalPages ?? 0}
            busy={q.isFetching}
            onPage={setPage}
          />
        </div>
      )}
      {dialog && (
        <TransactionDialog
          key={dialog.action === "create" ? "create" : `${dialog.action}-${dialog.id}`}
          state={dialog}
          loadedRecords={q.data?.items ?? []}
          onClose={() => setDialog(null)}
          onEditExisting={(id) => setDialog({ action: "edit", id })}
          restoreFocus={() => {
            if (trigger.current?.isConnected) trigger.current.focus();
            else heading.current?.focus();
          }}
        />
      )}
    </div>
  );
}
