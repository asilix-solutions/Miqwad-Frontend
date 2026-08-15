/**
 * @file OrdersPage.tsx
 * @description Admin Orders list page — Phase 1 (functional plain
 * DataTable, no colored badges/advanced filters — that's Phase 2). Supports
 * view (GET /{id}), update (PUT), delete. No create — orders are created by
 * customers, not admins.
 */
import { useState } from "react";
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
import type { Order } from "../types";
import { orderStatusToI18nKey, orderTypeToI18nKey, paymentMethodToI18nKey } from "../lib/orderEnums";
import { formatRelativeDate } from "../lib/formatRelativeDate";
import { OrderDetailDialog } from "../components/OrderDetailDialog";
import { OrderUpdateDialog } from "../components/OrderUpdateDialog";
import { OrderDeleteDialog } from "../components/OrderDeleteDialog";

const PAGE_SIZE = 20;

export function OrdersPage() {
  const { t, i18n } = useTranslation();

  const [pageNumber, setPageNumber] = useState(1);

  const q = useOrdersList({
    pageNumber,
    pageSize: PAGE_SIZE,
    sortBy: "createdAt",
    sortDescending: true,
  });
  const items = q.data?.items ?? [];
  const totalPages = q.data?.totalPages ?? 1;

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
    { key: "type", header: t("orders.columns.type"), render: (row) => t(orderTypeToI18nKey(row.type)) },
    { key: "status", header: t("orders.columns.status"), render: (row) => t(orderStatusToI18nKey(row.status)) },
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
