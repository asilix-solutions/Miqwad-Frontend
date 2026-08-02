/**
 * @file UsersPanel.tsx
 * @description Unified, role-aware Users list wired to the real
 * `GET /api/Users` endpoint (see `adminApi.getUsers`). Renders per-role tabs
 * from `config/roleRegistry.ts`'s `ROLE_TABS` — the live backend's
 * `FilterBy=roleId&FilterValue=<n>` only accepts a single value, so each tab
 * maps to one roleId (not a group) and filters server-side with correct
 * pagination.
 *
 * Sorting (name / created date / status) and the status filter (active /
 * inactive) are also server-side, via the verified `SortBy`/`SortDescending`
 * and `FilterBy=isActive` params (see adminApi.getUsers for the live-tested
 * contract notes). Because the backend's `FilterBy` only accepts ONE field,
 * role tab, status filter and search are mutually exclusive: picking one
 * clears the other two, so exactly one ever reaches the server as the active
 * filter. Sort is independent and can combine with whichever filter is set.
 *
 * Role, status, sort and page are reflected in the URL (`?role=&status=&
 * sortBy=&sortDir=&page=`) so the list is deep-linkable and survives
 * back-navigation.
 */

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, ChevronRight, ChevronLeft, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useUsersQuery } from "@modules/admin/hooks/useAdminQueries";
import type { UsersSortField } from "@modules/admin/api/adminApi";
import { DataTable, type DataTableColumn } from "@modules/admin/components/shared/DataTable";
import { StatusBadge } from "@modules/admin/components/shared/StatusBadge";
import { ROLE_TABS, roleLabel } from "@modules/admin/config/roleRegistry";
import type { AdminUserRow } from "@modules/admin/types";
import { formatDate } from "@shared/lib/formatDate";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";

const SEARCH_DEBOUNCE_MS = 300;
const ROLE_PARAM = "role";
const STATUS_PARAM = "status";
const SORT_BY_PARAM = "sortBy";
const SORT_DIR_PARAM = "sortDir";
const PAGE_PARAM = "page";
const PAGE_SIZE = 10;

type StatusFilterValue = "active" | "inactive";

function initialsOf(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const initials = parts.length > 1
    ? `${parts[0]?.[0] || ""}${parts[1]?.[0] || ""}`
    : `${parts[0]?.[0] || ""}${parts[0]?.[1] || ""}`;
  return initials.toUpperCase();
}

export function UsersPanel() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const roleParam = searchParams.get(ROLE_PARAM);
  const parsedRoleId = roleParam !== null ? Number(roleParam) : undefined;
  const activeRoleId = ROLE_TABS.some((tab) => tab.roleId === parsedRoleId) ? parsedRoleId : undefined;

  const statusParam = searchParams.get(STATUS_PARAM);
  const activeStatus: StatusFilterValue | undefined =
    statusParam === "active" || statusParam === "inactive" ? statusParam : undefined;

  const sortByParam = searchParams.get(SORT_BY_PARAM);
  const activeSortBy: UsersSortField | undefined =
    sortByParam === "fullName" || sortByParam === "createdAt" || sortByParam === "isActive"
      ? sortByParam
      : undefined;
  const sortDescending = searchParams.get(SORT_DIR_PARAM) === "desc";

  const pageParam = Number(searchParams.get(PAGE_PARAM));
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  function goToPage(next: number) {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set(PAGE_PARAM, String(next));
      return params;
    });
  }

  function resetToPageOne() {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.delete(PAGE_PARAM);
      return params;
    });
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      resetToPageOne();
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  function handleSearchInputChange(value: string) {
    setSearchInput(value);
    // The backend's FilterBy is single-field: typing a search term must
    // give up the role tab / status filter slot immediately.
    if (value.trim() !== "" && (activeRoleId !== undefined || activeStatus !== undefined)) {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        params.delete(ROLE_PARAM);
        params.delete(STATUS_PARAM);
        params.delete(PAGE_PARAM);
        return params;
      });
    }
  }

  function handleTabSelect(roleId?: number) {
    setSearchInput("");
    setSearch("");
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      if (roleId === undefined) {
        params.delete(ROLE_PARAM);
      } else {
        params.set(ROLE_PARAM, String(roleId));
      }
      params.delete(STATUS_PARAM);
      params.delete(PAGE_PARAM);
      return params;
    });
  }

  function handleStatusSelect(status?: StatusFilterValue) {
    setSearchInput("");
    setSearch("");
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      if (status === undefined) {
        params.delete(STATUS_PARAM);
      } else {
        params.set(STATUS_PARAM, status);
      }
      params.delete(ROLE_PARAM);
      params.delete(PAGE_PARAM);
      return params;
    });
  }

  function handleSort(field: UsersSortField) {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      const isSameField = activeSortBy === field;
      params.set(SORT_BY_PARAM, field);
      params.set(SORT_DIR_PARAM, isSameField && !sortDescending ? "desc" : "asc");
      params.delete(PAGE_PARAM);
      return params;
    });
  }

  const { data, isLoading, isError } = useUsersQuery({
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    roleId: activeRoleId,
    isActive: activeStatus === undefined ? undefined : activeStatus === "active",
    sortBy: activeSortBy,
    sortDescending,
  });

  const rows = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  function sortIcon(field: UsersSortField) {
    if (activeSortBy !== field) return <ArrowUpDown className="h-3.5 w-3.5 text-[var(--color-muted)]" />;
    return sortDescending
      ? <ArrowDown className="h-3.5 w-3.5 text-[var(--color-brand-orange)]" />
      : <ArrowUp className="h-3.5 w-3.5 text-[var(--color-brand-orange)]" />;
  }

  function sortableHeader(field: UsersSortField, label: string) {
    return (
      <button
        type="button"
        onClick={() => handleSort(field)}
        className="flex items-center gap-1.5 cursor-pointer hover:text-[var(--color-ink-body)] transition-colors duration-150"
        title={t("superAdmin.users.sort.sortBy", { field: label })}
      >
        <span>{label}</span>
        {sortIcon(field)}
      </button>
    );
  }

  const columns: DataTableColumn<AdminUserRow>[] = useMemo(
    () => [
      {
        key: "fullName",
        header: sortableHeader("fullName", t("superAdmin.users.columns.name")),
        render: (row) => (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-[var(--color-surface-2)] text-[var(--color-ink-secondary)] text-xs font-medium">
                {initialsOf(row.fullName)}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-[var(--color-ink-body)]">{row.fullName}</span>
          </div>
        ),
      },
      {
        key: "phoneNumber",
        header: t("superAdmin.users.columns.phone"),
        render: (row) => (
          <span className="tabular-nums text-[var(--color-ink-body)]">{row.phoneNumber}</span>
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
        key: "role",
        header: t("superAdmin.users.columns.role"),
        render: (row) => (
          <span className="text-[var(--color-ink-body)]">{roleLabel(row.role, t)}</span>
        ),
      },
      {
        key: "createdAt",
        header: sortableHeader("createdAt", t("superAdmin.users.columns.createdAt")),
        render: (row) => (
          <span className="text-[var(--color-ink-body)] tabular-nums">
            {formatDate(row.createdAt, i18n.language)}
          </span>
        ),
      },
      {
        key: "status",
        header: sortableHeader("isActive", t("superAdmin.users.columns.status")),
        render: (row) => (
          <StatusBadge status={row.isActive ? "active" : "suspended"} kind="user" />
        ),
      },
    ],
    [t, i18n.language, activeSortBy, sortDescending]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-2 w-full sm:w-auto">
          <div className="flex gap-2 bg-transparent overflow-x-auto w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleTabSelect(undefined)}
              className={`
                text-[14px] py-2 px-4 rounded-full border border-transparent cursor-pointer transition-colors duration-150 whitespace-nowrap
                ${activeRoleId === undefined
                  ? "bg-[var(--color-brand-orange)] text-white font-semibold"
                  : "bg-transparent text-[var(--color-muted)] font-medium hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink-body)]"
                }
              `}
            >
              {t("superAdmin.users.roleTabs.all")}
            </button>
            {ROLE_TABS.map((tab) => {
              const isActive = activeRoleId === tab.roleId;
              return (
                <button
                  key={tab.roleId}
                  type="button"
                  onClick={() => handleTabSelect(tab.roleId)}
                  className={`
                    text-[14px] py-2 px-4 rounded-full border border-transparent cursor-pointer transition-colors duration-150 whitespace-nowrap
                    ${isActive
                      ? "bg-[var(--color-brand-orange)] text-white font-semibold"
                      : "bg-transparent text-[var(--color-muted)] font-medium hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink-body)]"
                    }
                  `}
                >
                  {t(tab.labelI18nKey)}
                </button>
              );
            })}
          </div>

          <div className="flex gap-1.5 bg-[var(--color-surface-2)] rounded-full p-1 w-fit">
            {([undefined, "active", "inactive"] as const).map((value) => {
              const isSelected = activeStatus === value;
              const label = value === undefined
                ? t("superAdmin.users.statusFilter.all")
                : value === "active"
                  ? t("superAdmin.users.statusFilter.active")
                  : t("superAdmin.users.statusFilter.inactive");
              return (
                <button
                  key={value ?? "all"}
                  type="button"
                  onClick={() => handleStatusSelect(value)}
                  className={`
                    text-[13px] py-1.5 px-3 rounded-full cursor-pointer transition-colors duration-150 whitespace-nowrap
                    ${isSelected
                      ? "bg-[var(--color-surface)] text-[var(--color-ink-body)] font-semibold shadow-sm"
                      : "text-[var(--color-muted)] font-medium hover:text-[var(--color-ink-body)]"
                    }
                  `}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("superAdmin.users.searchPlaceholder")}
            value={searchInput}
            onChange={(e) => handleSearchInputChange(e.target.value)}
            className="ps-9"
          />
        </div>
      </div>

      <DataTable<AdminUserRow>
        columns={columns}
        rows={rows}
        isLoading={isLoading}
        isError={isError}
        emptyText={
          activeRoleId !== undefined
            ? t("superAdmin.users.emptyFiltered", { role: roleLabel(activeRoleId, t) })
            : t("superAdmin.users.empty")
        }
        errorText={t("superAdmin.users.error")}
        getRowKey={(row) => row.id}
        onRowClick={(row) => navigate(`/admin/users/${row.id}`)}
      />

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationLink
                onClick={() => goToPage(Math.max(1, page - 1))}
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
                onClick={() => goToPage(Math.min(totalPages, page + 1))}
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
