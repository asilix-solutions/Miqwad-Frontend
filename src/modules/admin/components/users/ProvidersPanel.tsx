import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { useAdminProvidersQuery } from "@modules/admin/hooks/useAdminQueries";
import type { AdminProvider } from "@modules/admin/types";
import type { ProviderType } from "@modules/providers/types";
import { DataTable, type DataTableColumn } from "@modules/admin/components/shared/DataTable";
import { StatusBadge } from "@modules/admin/components/shared/StatusBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { formatDate } from "@shared/lib/formatDate";

const TYPE_TABS: { key: ProviderType | "all"; labelI18n: string }[] = [
  { key: "all", labelI18n: "superAdmin.providers.types.all" },
  { key: "dealer", labelI18n: "superAdmin.providers.types.dealer" },
  { key: "workshop", labelI18n: "superAdmin.providers.types.workshop" },
  { key: "scrap", labelI18n: "superAdmin.providers.types.scrap" },
];

export function ProvidersPanel() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [typeFilter, setTypeFilter] = useState<ProviderType | "all">("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Passing undefined for status returns all statuses
  const q = useAdminProvidersQuery(undefined, typeFilter === "all" ? undefined : typeFilter);

  const columns: DataTableColumn<AdminProvider>[] = useMemo(
    () => [
      {
        key: "companyName",
        header: t("superAdmin.providers.columns.companyName"),
        render: (row) => {
          const parts = row.companyName.trim().split(/\s+/);
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
              <div className="flex items-center gap-2">
                <span className="font-medium text-[var(--color-ink-body)]">{row.companyName}</span>
                <span className="px-2 py-0.5 rounded-full bg-[var(--color-surface-2)] text-[var(--color-ink-secondary)] text-[10px] font-medium whitespace-nowrap border border-[var(--color-divider)]">
                  {t(`superAdmin.providers.types.${row.type}`)}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        key: "phone",
        header: t("superAdmin.providers.columns.phone"),
        render: (row) => (
          <span className="tabular-nums text-[var(--color-ink-body)]">{row.phone}</span>
        ),
      },
      {
        key: "city",
        header: t("superAdmin.providers.columns.city"),
        render: (row) => (
          <span className="text-[var(--color-ink-body)]">{row.city || "—"}</span>
        ),
      },
      {
        key: "status",
        header: t("superAdmin.providers.columns.status"),
        render: (row) => <StatusBadge status={row.status} kind="provider" />,
      },
      {
        key: "createdAt",
        header: t("superAdmin.providers.columns.createdAt"),
        render: (row) => (
          <span className="text-[var(--color-ink-body)]">
            {formatDate(row.createdAt, i18n.language, { year: "numeric", month: "short", day: "numeric" })}
          </span>
        ),
      },
    ],
    [t, i18n.language]
  );

  const filteredRows = q.data || [];
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const paginatedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 bg-transparent overflow-x-auto">
        {TYPE_TABS.map((tab) => {
          const isActive = typeFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setTypeFilter(tab.key);
                setPage(1);
              }}
              className={[
                "text-[14px] py-2 px-4 rounded-full border border-transparent",
                "cursor-pointer transition-colors duration-150 whitespace-nowrap",
                isActive
                  ? "bg-[var(--color-brand-orange)] text-white font-semibold"
                  : "bg-transparent text-[var(--color-muted)] font-medium hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink-body)]",
              ].join(" ")}
            >
              {t(tab.labelI18n)}
            </button>
          );
        })}
      </div>

      <DataTable<AdminProvider>
        columns={columns}
        rows={paginatedRows}
        isLoading={q.isLoading}
        isError={q.isError}
        emptyText={t("superAdmin.providers.empty.all")}
        errorText={t("superAdmin.providers.error")}
        getRowKey={(row) => row.id.toString()}
        onRowClick={(row) => navigate(`/admin/providers/${row.id}`)}
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
