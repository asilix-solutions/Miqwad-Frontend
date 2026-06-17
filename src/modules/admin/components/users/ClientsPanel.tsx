import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Search, ChevronRight, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUsersQuery } from "@modules/admin/hooks/useAdminQueries";
import { DataTable, type DataTableColumn } from "@modules/admin/components/shared/DataTable";
import { StatusBadge } from "@modules/admin/components/shared/StatusBadge";
import type { AdminUserRow } from "@modules/admin/types";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";

export function ClientsPanel() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useUsersQuery({ page, pageSize });

  // Temporary client-side filtering over the returned current page
  // Scoped strictly to role === 'customer'
  const filteredRows = useMemo(() => {
    if (!data?.items) return [];
    
    // First filter by role
    let clients = data.items.filter((user) => user.role === "customer");
    
    // Then filter by search term
    if (search.trim()) {
      const lower = search.toLowerCase();
      clients = clients.filter(
        (user) =>
          user.name.toLowerCase().includes(lower) || user.phone.includes(lower)
      );
    }
    
    return clients;
  }, [data?.items, search]);

  const totalPages = data?.totalPages ?? 1;

  const columns: DataTableColumn<AdminUserRow>[] = useMemo(
    () => [
      {
        key: "name",
        header: t("superAdmin.users.columns.name"),
        render: (row) => {
          const parts = row.name.trim().split(/\s+/);
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
               <span className="font-medium text-[var(--color-ink-body)]">{row.name}</span>
            </div>
          );
        },
      },
      {
        key: "phone",
        header: t("superAdmin.users.columns.phone"),
        render: (row) => (
          <span className="tabular-nums text-[var(--color-ink-body)]">{row.phone}</span>
        ),
      },
      {
        key: "email",
        header: t("superAdmin.users.columns.email"),
        render: (row) => (
          <span className="text-[var(--color-ink-body)]">{row.email || "—"}</span>
        ),
      },
      {
        key: "status",
        header: t("superAdmin.users.columns.status"),
        render: (row) => <StatusBadge status={row.status} kind="user" />,
      },
    ],
    [t]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative w-full">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("superAdmin.users.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9"
          />
        </div>
      </div>

      <DataTable<AdminUserRow>
        columns={columns}
        rows={filteredRows}
        isLoading={isLoading}
        isError={isError}
        emptyText={t("superAdmin.users.empty")}
        errorText={t("superAdmin.users.error")}
        getRowKey={(row) => row.id}
        onRowClick={(row) => navigate(`/admin/users/${row.id}`)}
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
