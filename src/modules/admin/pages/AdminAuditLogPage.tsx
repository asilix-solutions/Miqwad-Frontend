/**
 * @file AdminAuditLogPage.tsx
 * @description Admin page for viewing and exporting the system audit log.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuditLogsQuery, useExportAuditLogsMutation } from "../hooks/useAdminQueries";
import { DataTable } from "../components/shared/DataTable";
import { Can } from "@shared/auth/Can";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "../components/shared/StatusBadge";
import { formatDate } from "@shared/lib/formatDate";
import { Download, ChevronRight, ChevronLeft } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AuditLogEntry, AuditModule, AuditAction } from "@modules/audit/types";
import { AuditDetailDrawer } from "../components/audit/AuditDetailDrawer";
import { toast } from "sonner";

const AUDIT_MODULES: AuditModule[] = [
  "users", "providers", "settlements", "disputes", "services",
  "packages", "plans", "subscriptions", "notifications", "ads",
  "settings", "auth"
];

const AUDIT_ACTIONS: AuditAction[] = [
  "create", "update", "delete", "approve", "reject", "resolve",
  "suspend", "restore", "send", "settle", "cancel", "login"
];

export function AdminAuditLogPage() {
  const { t, i18n } = useTranslation();

  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const pageSize = 20;

  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);

  const { data, isLoading, error } = useAuditLogsQuery({
    page,
    pageSize,
    module: moduleFilter === "all" ? undefined : (moduleFilter as AuditModule),
    action: actionFilter === "all" ? undefined : (actionFilter as AuditAction),
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    search: search || undefined,
  });

  const exportMutation = useExportAuditLogsMutation();

  const handleExport = () => {
    exportMutation.mutate(
      {
        module: moduleFilter === "all" ? undefined : (moduleFilter as AuditModule),
        action: actionFilter === "all" ? undefined : (actionFilter as AuditAction),
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        search: search || undefined,
      },
      {
        onSuccess: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "audit-logs.csv";
          a.click();
          window.URL.revokeObjectURL(url);
          toast.success(t("superAdmin.audit.exported"));
        },
        onError: () => {
          toast.error(t("common.errorTitle"));
        },
      }
    );
  };

  const columns = [
    {
      key: "createdAt",
      header: t("superAdmin.audit.columns.time"),
      render: (row: AuditLogEntry) => (
        <span dir="ltr" className="text-sm tabular-nums whitespace-nowrap">
          {formatDate(row.createdAt, i18n.language)}
        </span>
      ),
    },
    {
      key: "actor",
      header: t("superAdmin.audit.columns.actor"),
      render: (row: AuditLogEntry) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.actorName}</span>
          <span className="text-xs text-[var(--color-muted)]">{row.actorRole}</span>
        </div>
      ),
    },
    {
      key: "action",
      header: t("superAdmin.audit.columns.action"),
      render: (row: AuditLogEntry) => (
        <StatusBadge kind="audit" status={row.action} />
      ),
    },
    {
      key: "module",
      header: t("superAdmin.audit.columns.module"),
      render: (row: AuditLogEntry) => (
        <span className="text-sm">
          {t(`superAdmin.audit.modules.${row.module}`)}
        </span>
      ),
    },
    {
      key: "summary",
      header: t("superAdmin.audit.columns.summary"),
      render: (row: AuditLogEntry) => (
        <span className="text-sm line-clamp-2 max-w-[300px]">
          {i18n.language === "ar" ? row.summaryAr : row.summaryEn}
        </span>
      ),
    },
  ];

  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-ink-body)]">
          {t("superAdmin.audit.title")}
        </h1>
        <p className="text-sm text-[var(--color-muted)]">
          {t("superAdmin.audit.subtitle")}
        </p>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap gap-3 items-center mb-4">
        <Select value={moduleFilter} onValueChange={(val) => { setModuleFilter(val); setPage(1); }} dir="rtl">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("superAdmin.audit.filters.allModules")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("superAdmin.audit.filters.allModules")}</SelectItem>
            {AUDIT_MODULES.map((m) => (
              <SelectItem key={m} value={m}>
                {t(`superAdmin.audit.modules.${m}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={actionFilter} onValueChange={(val) => { setActionFilter(val); setPage(1); }} dir="rtl">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("superAdmin.audit.filters.allActions")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("superAdmin.audit.filters.allActions")}</SelectItem>
            {AUDIT_ACTIONS.map((a) => (
              <SelectItem key={a} value={a}>
                {t(`superAdmin.audit.actions.${a}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <input
          type="date"
          dir="ltr"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
          className="h-[var(--size-input-h)] rounded-[var(--radius-md)] border border-input px-3 bg-white text-sm"
        />

        <input
          type="date"
          dir="ltr"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
          className="h-[var(--size-input-h)] rounded-[var(--radius-md)] border border-input px-3 bg-white text-sm"
        />

        <Input
          placeholder={t("superAdmin.audit.searchPlaceholder")}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full sm:w-[250px]"
        />

        <div className="ms-auto">
          <Can permission="audit.export">
            <Button
              variant="outline"
              disabled={exportMutation.isPending}
              onClick={handleExport}
              className="gap-2"
            >
              <Download size={16} />
              {t("superAdmin.audit.export")}
            </Button>
          </Can>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border border-[var(--color-divider)] bg-white shadow-sm">
        <DataTable<AuditLogEntry>
          rows={data?.items ?? []}
          columns={columns}
          isLoading={isLoading}
          isError={!!error}
          getRowKey={(row) => String(row.id)}
          emptyText={t("superAdmin.audit.empty")}
          onRowClick={(row) => setSelectedEntry(row)}
        />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            {i18n.language === "ar" ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </Button>
          <span className="text-sm font-medium">
            {t("superAdmin.audit.pageOf", { page: data?.page ?? page, total: totalPages })}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          >
            {i18n.language === "ar" ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </Button>
        </div>
      )}

      {/* Detail Drawer */}
      {selectedEntry && (
        <AuditDetailDrawer
          entry={selectedEntry}
          open={!!selectedEntry}
          onOpenChange={(open: boolean) => !open && setSelectedEntry(null)}
        />
      )}
    </div>
  );
}
