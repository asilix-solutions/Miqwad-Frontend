import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { useSettlementsQuery } from "../hooks/useAdminQueries";
import type { SettlementStatus, SettlementRecord } from "../types";
import { DataTable, type DataTableColumn } from "@modules/admin/components/shared/DataTable";
import { StatusBadge } from "@modules/admin/components/shared/StatusBadge";
import { formatCurrency } from "@shared/lib/formatCurrency";
import { formatDate } from "@shared/lib/formatDate";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { Can } from "@shared/auth/Can";
import { SettlementApproveDialog } from "../components/settlements/SettlementApproveDialog";
import { SettlementRejectDialog } from "../components/settlements/SettlementRejectDialog";

const TABS: ReadonlyArray<{ key: SettlementStatus | "all"; label: string }> = [
  { key: "pending", label: "superAdmin.finance.settlements.tabs.pending" },
  { key: "approved", label: "superAdmin.finance.settlements.tabs.approved" },
  { key: "rejected", label: "superAdmin.finance.settlements.tabs.rejected" },
  { key: "all", label: "superAdmin.finance.settlements.tabs.all" },
];

export function AdminSettlementsPage() {
  const { t, i18n } = useTranslation();

  const [statusFilter, setStatusFilter] = useState<SettlementStatus | "all">("pending");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const [approveDialogData, setApproveDialogData] = useState<{ open: boolean; settlement: SettlementRecord | null }>({
    open: false,
    settlement: null,
  });
  
  const [rejectDialogData, setRejectDialogData] = useState<{ open: boolean; settlement: SettlementRecord | null }>({
    open: false,
    settlement: null,
  });

  const { data, isLoading, isError } = useSettlementsQuery({
    page,
    pageSize,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const totalPages = data?.totalPages ?? 1;

  const columns: DataTableColumn<SettlementRecord>[] = useMemo(
    () => [
      {
        key: "providerName",
        header: t("superAdmin.finance.settlements.columns.providerName"),
        render: (row) => {
          const parts = row.providerName.trim().split(/\s+/);
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
              <span className="font-medium text-[var(--color-ink-body)]">{row.providerName}</span>
            </div>
          );
        },
      },
      {
        key: "amount",
        header: t("superAdmin.finance.settlements.columns.amount"),
        render: (row) => (
          <span className="tabular-nums font-medium text-[var(--color-ink-body)]">
            {formatCurrency(row.amount, i18n.language)}
          </span>
        ),
      },
      {
        key: "status",
        header: t("superAdmin.finance.settlements.columns.status"),
        render: (row) => <StatusBadge status={row.status} kind="settlement" />,
      },
      {
        key: "requestedAt",
        header: t("superAdmin.finance.settlements.columns.requestedAt"),
        render: (row) => (
          <span className="text-[var(--color-ink-body)]">
            {formatDate(row.requestedAt, i18n.language, { year: "numeric", month: "short", day: "numeric" })}
          </span>
        ),
      },
      {
        key: "actions",
        header: "",
        render: (row) => {
          if (row.status !== "pending") return <span className="text-muted-foreground">—</span>;
          return (
            <Can permission="finance.settle">
              <div className="flex gap-2 justify-end items-center">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setApproveDialogData({ open: true, settlement: row })}
                >
                  {t("superAdmin.finance.settlements.approve")}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setRejectDialogData({ open: true, settlement: row })}
                >
                  {t("superAdmin.finance.settlements.reject")}
                </Button>
              </div>
            </Can>
          );
        },
      },
    ],
    [t, i18n.language]
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[22px] font-bold text-[var(--color-ink-body)]">
          {t("superAdmin.finance.settlements.title")}
        </h1>
        <p className="text-[14px] text-[var(--color-muted)] mt-[4px]">
          {t("superAdmin.finance.settlements.subtitle")}
        </p>
      </div>

      <div className="flex gap-2 mb-[20px] bg-transparent overflow-x-auto">
        {TABS.map((tab) => {
          const isActive = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setStatusFilter(tab.key);
                setPage(1);
              }}
              className={`
                text-[14px] py-2 px-4 rounded-[var(--radius-md)] border border-transparent cursor-pointer transition-colors duration-150 whitespace-nowrap
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

      <DataTable<SettlementRecord>
        columns={columns}
        rows={data?.items || []}
        isLoading={isLoading}
        isError={isError}
        emptyText={t(`superAdmin.finance.settlements.empty.${statusFilter}`)}
        errorText={t("superAdmin.finance.settlements.error")}
        getRowKey={(row) => row.id}
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

      {approveDialogData.open && (
        <SettlementApproveDialog
          open={approveDialogData.open}
          settlement={approveDialogData.settlement}
          onOpenChange={(open) => setApproveDialogData((prev) => ({ ...prev, open }))}
        />
      )}

      {rejectDialogData.open && (
        <SettlementRejectDialog
          open={rejectDialogData.open}
          settlement={rejectDialogData.settlement}
          onOpenChange={(open) => setRejectDialogData((prev) => ({ ...prev, open }))}
        />
      )}
    </div>
  );
}
