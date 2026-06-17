import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@app/store";
import { setAdminStatus } from "@modules/providers/store/providersSlice";
import { useAdminProvidersQuery } from "../hooks/useAdminQueries";
import type { AdminProvider, AdminProviderStatus } from "../types";
import type { ProviderType } from "@modules/providers/types";
import { DataTable, type DataTableColumn } from "@modules/admin/components/shared/DataTable";
import { StatusBadge } from "@modules/admin/components/shared/StatusBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDate } from "@shared/lib/formatDate";


const TABS: ReadonlyArray<{ key: AdminProviderStatus; label: string }> = [
  { key: "pending", label: "superAdmin.providers.tabs.pending" },
  { key: "approved", label: "superAdmin.providers.tabs.approved" },
  { key: "rejected", label: "superAdmin.providers.tabs.rejected" },
  { key: "all", label: "superAdmin.providers.tabs.all" },
];

export function AdminProvidersPage() {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [typeFilter, setTypeFilter] = useState<ProviderType | "all">("all");
  const status = useAppSelector((s) => s.providers.adminStatus);
  const q = useAdminProvidersQuery(status, typeFilter === "all" ? undefined : typeFilter);

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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t("superAdmin.providers.title")}
        </h1>
        <p className="text-muted-foreground">
          {t("superAdmin.providers.subtitle")}
        </p>
      </div>

      <div className="flex flex-col gap-4 mb-[20px]">
        {/* Status Tabs */}
        <div className="flex gap-2 bg-transparent overflow-x-auto">
          {TABS.map((tab) => {
            const isActive = status === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => dispatch(setAdminStatus(tab.key))}
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

        {/* Type Filter Tabs */}
        <div className="flex gap-2 bg-transparent overflow-x-auto">
          {(["all", "dealer", "workshop", "scrap"] as const).map((type) => {
            const isActive = typeFilter === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setTypeFilter(type)}
                className={`
                  text-[13px] py-1.5 px-3 rounded-full border cursor-pointer transition-colors duration-150 whitespace-nowrap
                  ${isActive 
                    ? "bg-white text-[var(--color-brand-blue)] border-white shadow-sm font-semibold" 
                    : "bg-[var(--color-surface-2)] text-[var(--color-muted)] border-transparent font-medium hover:text-[var(--color-ink-body)]"
                  }
                `}
              >
                {t(`superAdmin.providers.types.${type}`)}
              </button>
            );
          })}
        </div>
      </div>

      <DataTable<AdminProvider>
        columns={columns}
        rows={q.data || []}
        isLoading={q.isLoading}
        isError={q.isError}
        emptyText={t(`superAdmin.providers.empty.${status}`)}
        errorText={t("superAdmin.providers.error")}
        getRowKey={(row) => row.id.toString()}
        onRowClick={(row) => navigate(`/admin/providers/${row.id}`)}
      />
    </div>
  );
}


