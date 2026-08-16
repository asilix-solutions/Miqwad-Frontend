/**
 * @file OrdersPage.tsx
 * @description Admin Orders list page — Phase 2 visual polish + management
 * UX: colored status badges, a light stats strip, a filter + sort toolbar,
 * and pagination. Supports view (GET /{id}), update (PUT), delete. No
 * create — orders are created by customers, not admins.
 *
 * LIVE-CONFIRMED against GET /api/Orders: FilterBy only accepts
 * "trackNumber" — any other FilterBy value (status/type/userId/...) returns
 * HTTP 400, which previously made the whole query fail whenever a status or
 * type filter was active. So only search reaches the server as
 * FilterBy=trackNumber; the date range (DateFilterBy=createdAt/FromDate/
 * ToDate) is a separate, combinable pair that works standalone. Status
 * (via the stats strip) and type (via the dropdown) are applied
 * client-side on the fetched page, same as the existing stats-strip counts.
 */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Eye, Pencil, PackageOpen, RotateCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { DataTable, type DataTableColumn } from "@shared/components/DataTable";
import { Can } from "@shared/auth/Can";
import { useOrdersList } from "../hooks/useOrdersQueries";
import type { Order, OrderStatus, OrderType } from "../types";
import { paymentMethodToI18nKey } from "../lib/orderEnums";
import { formatRelativeDate } from "../lib/formatRelativeDate";
import { OrderDetailDialog } from "../components/OrderDetailDialog";
import { OrderUpdateDialog } from "../components/OrderUpdateDialog";
import { OrderDeleteDialog } from "../components/OrderDeleteDialog";
import { OrderStatusBadge } from "../components/OrderStatusBadge";
import { OrderTypeBadge } from "../components/OrderTypeBadge";
import { OrderStatsStrip } from "../components/OrderStatsStrip";
import { OrderFilters, type OrderSortBy } from "../components/OrderFilters";

const PAGE_SIZE = 20;

export function OrdersPage() {
  const { t, i18n } = useTranslation();

  const [pageNumber, setPageNumber] = useState(1);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [type, setType] = useState<OrderType | "all">("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortBy, setSortBy] = useState<OrderSortBy>("createdAt");
  const [sortDescending, setSortDescending] = useState(true);

  useEffect(() => {
    setPageNumber(1);
  }, [search, status, type, fromDate, toDate, sortBy, sortDescending]);

  // Only "trackNumber" is a valid FilterBy value server-side; status/type
  // are filtered client-side below (see file header).
  const trimmedSearch = search.trim();
  const filterBy = trimmedSearch ? "trackNumber" : undefined;
  const filterValue = trimmedSearch || undefined;

  const q = useOrdersList({
    pageNumber,
    pageSize: PAGE_SIZE,
    sortBy,
    sortDescending,
    filterBy,
    filterValue,
    dateFilterBy: fromDate || toDate ? "createdAt" : undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  });
  const fetchedItems = q.data?.items ?? [];
  const totalPages = q.data?.totalPages ?? 1;

  const typeFilteredItems = type === "all" ? fetchedItems : fetchedItems.filter((o) => o.type === type);
  const items = status === "all" ? typeFilteredItems : typeFilteredItems.filter((o) => o.status === status);

  const hasActiveFilters = Boolean(trimmedSearch || status !== "all" || type !== "all" || fromDate || toDate);

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setType("all");
    setFromDate("");
    setToDate("");
  };

  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const [deleteOrder, setDeleteOrder] = useState<Order | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const openDetail = (order: Order) => {
    setDetailOrderId(order.id);
    setDetailOpen(true);
  };

  const openEdit = (order: Order) => {
    setEditOrder(order);
    setEditOpen(true);
  };

  const openDelete = (order: Order) => {
    setDeleteOrder(order);
    setDeleteOpen(true);
  };

  const columns: DataTableColumn<Order>[] = [
    { key: "trackNumber", header: t("orders.columns.trackNumber"), render: (row) => row.trackNumber || "—" },
    { key: "userFullName", header: t("orders.columns.userFullName") },
    { key: "type", header: t("orders.columns.type"), render: (row) => <OrderTypeBadge type={row.type} /> },
    { key: "status", header: t("orders.columns.status"), render: (row) => <OrderStatusBadge status={row.status} /> },
    {
      key: "paymentMethod",
      header: t("orders.columns.paymentMethod"),
      render: (row) => t(paymentMethodToI18nKey(row.paymentMethod)),
    },
    {
      key: "createdAt",
      header: t("orders.columns.createdAt"),
      render: (row) => (row.createdAt ? formatRelativeDate(row.createdAt, i18n.language) : "—"),
    },
    {
      key: "actions",
      header: t("orders.columns.actions"),
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title={t("orders.actions.view")}
            onClick={() => openDetail(row)}
          >
            <Eye className="size-4" />
          </Button>
          <Can permission="orders.manage">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              title={t("orders.actions.edit")}
              onClick={() => openEdit(row)}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              title={t("orders.actions.delete")}
              onClick={() => openDelete(row)}
            >
              <Trash2 className="size-4 text-danger-500" />
            </Button>
          </Can>
        </div>
      ),
      className: "text-end",
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-ink-body)]">{t("orders.title")}</h1>
          <p className="text-sm text-[var(--color-muted)]">{t("orders.subtitle")}</p>
        </div>
        {q.isError && (
          <Button type="button" variant="outline" onClick={() => q.refetch()}>
            <RotateCw className="size-4" />
            {t("common.retry")}
          </Button>
        )}
      </div>

      <OrderStatsStrip
        items={typeFilteredItems}
        activeStatus={status}
        onStatusClick={(s) => setStatus(s)}
      />

      <OrderFilters
        search={search}
        onSearchChange={setSearch}
        type={type}
        onTypeChange={setType}
        fromDate={fromDate}
        onFromDateChange={setFromDate}
        toDate={toDate}
        onToDateChange={setToDate}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortDescending={sortDescending}
        onSortDescendingChange={setSortDescending}
        onClear={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      <DataTable<Order>
        columns={columns}
        rows={items}
        isLoading={q.isLoading}
        isError={q.isError}
        errorText={t("orders.error")}
        emptyText={t("orders.emptyDescription")}
        getRowKey={(row) => row.id}
      />

      {!q.isLoading && !q.isError && items.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <PackageOpen className="size-8 text-[var(--color-muted)]" />
          <p className="text-sm font-medium text-[var(--color-ink-body)]">{t("orders.emptyTitle")}</p>
        </div>
      )}

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationLink
                onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                className={
                  pageNumber === 1
                    ? "pointer-events-none opacity-50 cursor-default gap-1 px-2.5"
                    : "cursor-pointer gap-1 px-2.5"
                }
                aria-label={t("common.back")}
              >
                {t("common.back")}
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <span className="px-4 text-sm text-[var(--color-muted)]">
                {pageNumber} / {totalPages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink
                onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
                className={
                  pageNumber === totalPages
                    ? "pointer-events-none opacity-50 cursor-default gap-1 px-2.5"
                    : "cursor-pointer gap-1 px-2.5"
                }
                aria-label={t("common.next")}
              >
                {t("common.next")}
              </PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {detailOpen && (
        <OrderDetailDialog orderId={detailOrderId} open={detailOpen} onOpenChange={setDetailOpen} />
      )}

      {editOpen && editOrder && (
        <OrderUpdateDialog order={editOrder} open={editOpen} onOpenChange={setEditOpen} />
      )}

      {deleteOpen && (
        <OrderDeleteDialog order={deleteOrder} open={deleteOpen} onOpenChange={setDeleteOpen} />
      )}
    </div>
  );
}
