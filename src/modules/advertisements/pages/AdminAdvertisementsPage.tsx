/**
 * @file AdminAdvertisementsPage.tsx
 * @description Admin Advertisements — a single flat list wired to the live
 * /api/Advertisement CRUD endpoint. No tabs, no campaigns/placements split.
 * Offers a cards view (default — ads are visual) and a table view, both
 * reading the same `useAdvertisementsList` data; the choice persists in
 * localStorage. Columns/card fields: image, title, deepLink, isActive,
 * createdAt, actions.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ExternalLink, LayoutGrid, List, Megaphone, Pencil, Plus, RotateCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { DataTable, type DataTableColumn } from "@shared/components/DataTable";
import { formatOrderDate } from "@shared/lib/formatOrderDate";
import { Can } from "@shared/auth/Can";
import {
  useAdvertisementsList,
  useToggleAdvertisementActiveMutation,
} from "../hooks/useAdvertisementsQueries";
import type { Advertisement } from "../types";
import { AdvertisementFormDialog } from "../components/AdvertisementFormDialog";
import { DeleteAdvertisementDialog } from "../components/DeleteAdvertisementDialog";
import { AdvertisementsEmptyState } from "../components/AdvertisementsEmptyState";
import { AdvertisementsCardGrid } from "../components/AdvertisementsCardGrid";
import { useToast } from "@shared/components/ui/toastContext";

const PAGE_SIZE = 20;
const VIEW_MODE_STORAGE_KEY = "maqwad.adminAds.viewMode";
type ViewMode = "cards" | "table";

function readStoredViewMode(): ViewMode {
  try {
    const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    return stored === "table" ? "table" : "cards";
  } catch {
    return "cards";
  }
}

export function AdminAdvertisementsPage() {
  const { t, i18n } = useTranslation();
  const toast = useToast();

  const [pageNumber, setPageNumber] = useState(1);
  const [formTarget, setFormTarget] = useState<Advertisement | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Advertisement | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(readStoredViewMode);

  const q = useAdvertisementsList({ pageNumber, pageSize: PAGE_SIZE });
  const toggleActiveMutation = useToggleAdvertisementActiveMutation();

  const items = q.data?.items ?? [];
  const totalPages = q.data?.totalPages ?? 1;
  const isEmpty = !q.isLoading && !q.isError && items.length === 0;

  const changeViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
    } catch {
      // localStorage unavailable (private mode / disabled) — in-memory state still works.
    }
  };

  const openCreate = () => {
    setFormTarget(null);
    setIsFormOpen(true);
  };

  const openEdit = (row: Advertisement) => {
    setFormTarget(row);
    setIsFormOpen(true);
  };

  const handleToggleActive = (row: Advertisement, isActive: boolean) => {
    toggleActiveMutation.mutate(
      { ad: row, isActive },
      {
        onSuccess: () => {
          toast.success(
            isActive ? t("superAdmin.ads.toasts.activated") : t("superAdmin.ads.toasts.deactivated"),
          );
        },
        onError: () => {
          toast.error(t("superAdmin.ads.toasts.toggleFailed"));
        },
      },
    );
  };

  const columns: DataTableColumn<Advertisement>[] = [
    {
      key: "image",
      header: t("superAdmin.ads.columns.image"),
      render: (row) => (
        <div className="h-12 w-16 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-[var(--color-surface-2)]">
          {row.image ? (
            <img src={row.image} alt="" className="h-full w-full object-cover" />
          ) : null}
        </div>
      ),
    },
    {
      key: "title",
      header: t("superAdmin.ads.columns.title"),
      render: (row) => (
        <span className="font-medium text-[var(--color-ink-body)]">{row.title}</span>
      ),
    },
    {
      key: "deepLink",
      header: t("superAdmin.ads.columns.deepLink"),
      render: (row) => (
        <a
          href={row.deepLink}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          dir="ltr"
          className="inline-flex items-center gap-1 text-sm text-[var(--color-brand-blue)] hover:underline"
        >
          <span className="max-w-[220px] truncate">{row.deepLink}</span>
          <ExternalLink className="size-3.5 shrink-0" aria-hidden />
        </a>
      ),
    },
    {
      key: "isActive",
      header: t("superAdmin.ads.columns.isActive"),
      render: (row) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Can
            permission="ads.edit"
            fallback={
              <span className="text-sm text-[var(--color-muted)]">
                {row.isActive ? t("superAdmin.ads.status.active") : t("superAdmin.ads.status.inactive")}
              </span>
            }
          >
            <Switch
              size="sm"
              checked={row.isActive}
              disabled={toggleActiveMutation.isPending && toggleActiveMutation.variables?.ad.id === row.id}
              onCheckedChange={(checked) => handleToggleActive(row, checked)}
              aria-label={t("superAdmin.ads.card.quickToggleLabel")}
            />
            <span className="text-sm text-[var(--color-muted)]">
              {row.isActive ? t("superAdmin.ads.status.active") : t("superAdmin.ads.status.inactive")}
            </span>
          </Can>
        </div>
      ),
    },
    {
      key: "createdAt",
      header: t("superAdmin.ads.columns.createdAt"),
      render: (row) => (
        <span className="tabular-nums text-[var(--color-muted)]">
          {formatOrderDate(row.createdAt, i18n.language)}
        </span>
      ),
    },
    {
      key: "actions",
      header: t("superAdmin.ads.columns.actions"),
      className: "text-end",
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Can permission="ads.edit">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                openEdit(row);
              }}
              aria-label={t("common.edit")}
            >
              <Pencil className="size-4" />
            </Button>
          </Can>
          <Can permission="ads.delete">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteTarget(row);
              }}
              aria-label={t("common.delete")}
              className="text-[var(--color-danger-500)] hover:text-[var(--color-danger-500)]"
            >
              <Trash2 className="size-4" />
            </Button>
          </Can>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-2)] text-[var(--color-brand-blue)]"
            aria-hidden
          >
            <Megaphone className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--color-ink-body)]">
              {t("superAdmin.ads.title")}
            </h1>
            <p className="text-sm text-[var(--color-muted)]">{t("superAdmin.ads.subtitle")}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-[var(--radius-md)] border border-[var(--color-divider)] p-1">
            <Button
              type="button"
              variant={viewMode === "cards" ? "secondary" : "ghost"}
              size="icon-sm"
              title={t("superAdmin.ads.viewMode.cards")}
              aria-label={t("superAdmin.ads.viewMode.cards")}
              aria-pressed={viewMode === "cards"}
              onClick={() => changeViewMode("cards")}
            >
              <LayoutGrid className="size-4" />
            </Button>
            <Button
              type="button"
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="icon-sm"
              title={t("superAdmin.ads.viewMode.table")}
              aria-label={t("superAdmin.ads.viewMode.table")}
              aria-pressed={viewMode === "table"}
              onClick={() => changeViewMode("table")}
            >
              <List className="size-4" />
            </Button>
          </div>
          {q.isError && (
            <Button type="button" variant="outline" onClick={() => q.refetch()}>
              <RotateCw className="size-4" />
              {t("common.retry")}
            </Button>
          )}
          <Can permission="ads.create">
            <Button type="button" onClick={openCreate}>
              <Plus className="size-4" />
              {t("superAdmin.ads.create")}
            </Button>
          </Can>
        </div>
      </div>

      {isEmpty ? (
        <AdvertisementsEmptyState onCreate={openCreate} />
      ) : viewMode === "cards" ? (
        <AdvertisementsCardGrid
          items={items}
          isLoading={q.isLoading}
          isError={q.isError}
          onRetry={() => q.refetch()}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
          onToggleActive={handleToggleActive}
          togglingId={toggleActiveMutation.isPending ? toggleActiveMutation.variables?.ad.id ?? null : null}
        />
      ) : (
        <DataTable<Advertisement>
          columns={columns}
          rows={items}
          isLoading={q.isLoading}
          isError={q.isError}
          errorText={t("superAdmin.ads.errorTitle")}
          emptyText={t("superAdmin.ads.empty.title")}
          getRowKey={(row) => row.id}
        />
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

      {isFormOpen && (
        <AdvertisementFormDialog
          advertisement={formTarget}
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
        />
      )}

      {deleteTarget && (
        <DeleteAdvertisementDialog
          advertisement={deleteTarget}
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
