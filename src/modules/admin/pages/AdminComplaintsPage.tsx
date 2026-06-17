/**
 * @file AdminComplaintsPage.tsx
 * @description Admin page for viewing customer complaints.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useComplaintsQuery } from "../hooks/useAdminQueries";
import { DataTable } from "../components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "../components/shared/StatusBadge";
import { formatDate } from "@shared/lib/formatDate";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Complaint, ComplaintStatus } from "@modules/complaints/types";
import { ComplaintDetailDialog } from "../components/complaints/ComplaintDetailDialog";

export function AdminComplaintsPage() {
  const { t, i18n } = useTranslation();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const pageSize = 20;

  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  const { data, isLoading, error } = useComplaintsQuery({
    page,
    pageSize,
    status: statusFilter === "all" ? undefined : (statusFilter as ComplaintStatus),
    search: search || undefined,
  });

  const columns = [
    {
      key: "createdAt",
      header: t("superAdmin.complaints.columns.date"),
      render: (row: Complaint) => (
        <span dir="ltr" className="text-sm tabular-nums whitespace-nowrap">
          {formatDate(row.createdAt, i18n.language)}
        </span>
      ),
    },
    {
      key: "customerName",
      header: t("superAdmin.complaints.columns.customer"),
      render: (row: Complaint) => (
        <span className="font-medium">{row.customerName}</span>
      ),
    },
    {
      key: "title",
      header: t("superAdmin.complaints.columns.title"),
      render: (row: Complaint) => (
        <span className="text-sm line-clamp-1 max-w-[250px]">
          {row.title}
        </span>
      ),
    },
    {
      key: "status",
      header: t("superAdmin.complaints.columns.status"),
      render: (row: Complaint) => (
        <StatusBadge kind="complaint" status={row.status} />
      ),
    },
  ];

  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-ink-body)]">
          {t("superAdmin.complaints.title")}
        </h1>
        <p className="text-sm text-[var(--color-muted)]">
          {t("superAdmin.complaints.subtitle")}
        </p>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap gap-3 items-center mb-4">
        <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1); }} dir="rtl">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("superAdmin.complaints.filters.status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("superAdmin.complaints.filters.all")}</SelectItem>
            <SelectItem value="new">{t("superAdmin.complaints.status.new")}</SelectItem>
            <SelectItem value="under_review">{t("superAdmin.complaints.status.under_review")}</SelectItem>
            <SelectItem value="resolved">{t("superAdmin.complaints.status.resolved")}</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder={t("superAdmin.complaints.filters.search")}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full sm:w-[250px]"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border border-[var(--color-divider)] bg-white shadow-sm">
        <DataTable<Complaint>
          rows={data?.items ?? []}
          columns={columns}
          isLoading={isLoading}
          isError={!!error}
          getRowKey={(row) => String(row.id)}
          emptyText={t("superAdmin.complaints.empty")}
          onRowClick={(row) => setSelectedComplaint(row)}
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

      {/* Detail Dialog */}
      {selectedComplaint && (
        <ComplaintDetailDialog
          complaint={selectedComplaint}
          open={!!selectedComplaint}
          onOpenChange={(open: boolean) => !open && setSelectedComplaint(null)}
        />
      )}
    </div>
  );
}
