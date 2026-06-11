import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useDisputesQuery } from "@modules/admin/hooks/useAdminQueries";
import type { DisputeRecord, DisputeStatus } from "@modules/admin/types";
import { DataTable, type DataTableColumn } from "@modules/admin/components/shared/DataTable";
import { StatusBadge } from "@modules/admin/components/shared/StatusBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatCurrency } from "@shared/lib/formatCurrency";
import { ChevronRight, ChevronLeft } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";

const TABS: ReadonlyArray<{ key: DisputeStatus | "all"; label: string }> = [
  { key: "open", label: "superAdmin.escrow.tabs.open" },
  { key: "under_review", label: "superAdmin.escrow.tabs.under_review" },
  { key: "resolved", label: "superAdmin.escrow.tabs.resolved" },
  { key: "all", label: "superAdmin.escrow.tabs.all" },
];

export function AdminDisputesPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [status, setStatus] = useState<DisputeStatus | "all">("open");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const { data, isLoading, isError } = useDisputesQuery({ page, pageSize, status });

  const totalPages = data?.totalPages ?? 1;

  const columns: DataTableColumn<DisputeRecord>[] = useMemo(
    () => [
      {
        key: "orderId",
        header: t("superAdmin.escrow.columns.orderId"),
        render: (row) => (
          <span className="tabular-nums text-[var(--color-ink-body)]">{row.orderId}</span>
        ),
      },
      {
        key: "openedByName",
        header: t("superAdmin.escrow.columns.openedByName"),
        render: (row) => {
          const parts = row.openedByName.trim().split(/\s+/);
          const initials = parts.length > 1
            ? `${parts[0]?.[0] || ""}${parts[1]?.[0] || ""}`
            : `${parts[0]?.[0] || ""}${parts[0]?.[1] || ""}`;

          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-[var(--color-surface-2)] text-[var(--color-ink-secondary)] text-xs font-medium">
                  {initials.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-medium text-[var(--color-ink-body)]">{row.openedByName}</span>
                <span className="text-xs text-[var(--color-muted)]">
                  {t(`superAdmin.escrow.roles.${row.openedByRole}`)}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        key: "amount",
        header: t("superAdmin.escrow.columns.amount"),
        render: (row) => (
          <span className="tabular-nums font-medium text-[var(--color-ink-body)]">
            {formatCurrency(row.amount, i18n.language)}
          </span>
        ),
      },
      {
        key: "status",
        header: t("superAdmin.escrow.columns.status"),
        render: (row) => <StatusBadge status={row.status} kind="dispute" />,
      },
      {
        key: "createdAt",
        header: t("superAdmin.escrow.columns.createdAt"),
        render: (row) => (
          <span className="text-[var(--color-ink-body)]">
            {new Intl.DateTimeFormat(i18n.language, {
              year: "numeric",
              month: "short",
              day: "numeric",
            }).format(new Date(row.createdAt))}
          </span>
        ),
      },
    ],
    [t, i18n.language]
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[22px] font-bold text-[var(--color-ink-body)] tracking-tight">
          {t("superAdmin.escrow.title")}
        </h1>
        <p className="text-[14px] text-[var(--color-muted)]">
          {t("superAdmin.escrow.subtitle")}
        </p>
      </div>

      <div className="flex gap-2 mb-[20px] bg-transparent overflow-x-auto">
        {TABS.map((tab) => {
          const isActive = status === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setStatus(tab.key);
                setPage(1);
              }}
              className={`
                text-[14px] py-2 px-4 rounded-full border border-transparent cursor-pointer transition-colors duration-150 whitespace-nowrap
                ${isActive 
                  ? "bg-[var(--color-brand-orange)] text-white font-semibold" 
                  : "bg-transparent text-[var(--color-muted)] font-medium hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink-body)]"
                }
              `}
            >
              {t(tab.label)}
            </button>
          );
        })}
      </div>

      <DataTable<DisputeRecord>
        columns={columns}
        rows={data?.items || []}
        isLoading={isLoading}
        isError={isError}
        emptyText={t(`superAdmin.escrow.empty.${status}`)}
        errorText={t("superAdmin.escrow.error")}
        getRowKey={(row) => row.id}
        onRowClick={(row) => navigate(`/admin/escrow/${row.id}`)}
      />

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationLink
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={
                  page === 1
                    ? "pointer-events-none opacity-50 cursor-default gap-1 px-2.5"
                    : "cursor-pointer gap-1 px-2.5"
                }
                aria-label={t("common.back")}
              >
                <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
                <span className="hidden sm:block">{t("common.back")}</span>
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <span className="text-sm text-muted-foreground px-4">
                {page} / {totalPages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className={
                  page === totalPages
                    ? "pointer-events-none opacity-50 cursor-default gap-1 px-2.5"
                    : "cursor-pointer gap-1 px-2.5"
                }
                aria-label={t("common.next")}
              >
                <span className="hidden sm:block">{t("common.next")}</span>
                <ChevronRight className="h-4 w-4 rtl:rotate-180" />
              </PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
