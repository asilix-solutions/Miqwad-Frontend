import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@app/store";
import { setAdminStatus } from "@modules/providers/store/providersSlice";
import { useAdminProvidersQuery } from "../hooks/useAdminQueries";
import type { AdminProvider, AdminProviderStatus } from "../types";
import { DataTable, type DataTableColumn } from "@modules/admin/components/shared/DataTable";
import { StatusBadge } from "@modules/admin/components/shared/StatusBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

  const status = useAppSelector((s) => s.providers.adminStatus);
  const q = useAdminProvidersQuery(status);

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
              <span className="font-medium text-[var(--color-ink-body)]">{row.companyName}</span>
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
        <h1 className="text-3xl font-bold tracking-tight">
          {t("superAdmin.providers.title")}
        </h1>
        <p className="text-muted-foreground">
          {t("superAdmin.providers.subtitle")}
        </p>
      </div>

      <Tabs
        value={status}
        onValueChange={(v) => dispatch(setAdminStatus(v as AdminProviderStatus))}
        className="w-full"
      >
        <TabsList className="w-full sm:w-auto flex justify-start overflow-x-auto">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.key} value={tab.key} className="min-w-fit">
              {t(tab.label)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

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


