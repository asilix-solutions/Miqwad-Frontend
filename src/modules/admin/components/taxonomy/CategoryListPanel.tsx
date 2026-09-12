/**
 * @file CategoryListPanel.tsx
 * @description Master list (flat, not a tree — categories are flat here) of
 * the real level-1 categories (`/api/Categories`). Drives the detail panel
 * via `onSelect`. Create/edit/delete reuse the existing real-backend dialog
 * variants from PR #25/#27 (`CategoryFormDialog`/`DeleteCategoryDialog` with
 * `isRealParent`), so no new form logic is introduced here.
 */

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { Can } from "@shared/auth/Can";
import { cn } from "@shared/lib/utils";
import { useParentCategoriesQuery } from "../../hooks/useAdminQueries";
import { useCategoryServiceCounts } from "@modules/services/hooks/useServicesAdminQueries";
import type { ServiceCategory } from "@modules/services/types";
import { CategoryFormDialog } from "../reference/CategoryFormDialog";
import { DeleteCategoryDialog } from "../reference/DeleteCategoryDialog";

interface Props {
  selectedId: number | null;
  onSelect: (category: ServiceCategory) => void;
}

/** URL param carrying this tab's page (kept distinct from `svcPage`/`tab`). */
const PAGE_PARAM = "catPage";
/** Matches the sibling admin lists (e.g. `UsersPanel`). */
const PAGE_SIZE = 10;

export function CategoryListPanel({ selectedId, onSelect }: Props) {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const pageParam = Number(searchParams.get(PAGE_PARAM));
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  function goToPage(next: number) {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set(PAGE_PARAM, String(next));
      return params;
    });
  }

  // Server-side pagination: the backend slices the 56 rows, we render the page.
  const { data, isLoading, isError } = useParentCategoriesQuery({
    pageNumber: page,
    pageSize: PAGE_SIZE,
  });
  const categories = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  // Recover from a stale/deep-linked page beyond the current range.
  useEffect(() => {
    if (!isLoading && !isError && page > totalPages) {
      goToPage(totalPages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isError, page, totalPages]);
  const counts = useCategoryServiceCounts(categories.map((c) => c.id));

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add-root" | "edit">("add-root");
  const [editTarget, setEditTarget] = useState<ServiceCategory | undefined>();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ServiceCategory | null>(null);

  const openAdd = () => {
    setFormMode("add-root");
    setEditTarget(undefined);
    setFormOpen(true);
  };

  const openEdit = (category: ServiceCategory) => {
    setFormMode("edit");
    setEditTarget(category);
    setFormOpen(true);
  };

  const openDelete = (category: ServiceCategory) => {
    setDeleteTarget(category);
    setDeleteOpen(true);
  };

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-divider)] bg-[var(--color-surface)] shadow-sm">
      <div className="flex items-center justify-between gap-3 p-4 border-b border-[var(--color-divider)]">
        <h2 className="text-sm font-semibold text-[var(--color-ink-body)]">
          {t("superAdmin.taxonomy.categories.title")}
        </h2>
        <Can permission="categories.create">
          <Button size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4" />
            {t("superAdmin.taxonomy.categories.add")}
          </Button>
        </Can>
      </div>

      {isLoading && (
        <div className="p-4 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-[var(--radius-md)]" />
          ))}
        </div>
      )}

      {isError && !isLoading && (
        <div className="p-6 text-center text-sm text-[var(--color-danger-500)]">
          {t("superAdmin.taxonomy.categories.error")}
        </div>
      )}

      {!isLoading && !isError && categories.length === 0 && (
        <div className="p-8 text-center space-y-1">
          <p className="text-sm font-medium text-[var(--color-ink-body)]">
            {t("superAdmin.taxonomy.categories.empty.title")}
          </p>
          <p className="text-xs text-[var(--color-muted)]">
            {t("superAdmin.taxonomy.categories.empty.description")}
          </p>
        </div>
      )}

      {!isLoading && !isError && categories.length > 0 && (
        <ul role="list" className="divide-y divide-[var(--color-divider)]">
          {categories.map((category) => {
            const isSelected = category.id === selectedId;
            const count = counts[category.id];
            return (
              <li key={category.id}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(category)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(category);
                    }
                  }}
                  className={cn(
                    "group/row flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors duration-150",
                    isSelected
                      ? "bg-[var(--color-brand-orange)]/10"
                      : "hover:bg-[var(--color-surface-2)]",
                  )}
                >
                  <span
                    className={cn(
                      "flex-1 min-w-0 truncate text-sm",
                      isSelected
                        ? "font-semibold text-[var(--color-brand-orange)]"
                        : "font-medium text-[var(--color-ink-body)]",
                    )}
                  >
                    {category.nameAr}
                  </span>

                  <span className="shrink-0 text-[11px] font-medium text-[var(--color-muted)] bg-[var(--color-surface-2)] rounded-full px-2 py-0.5">
                    {count === undefined
                      ? "…"
                      : t("superAdmin.taxonomy.categories.servicesCount", { count })}
                  </span>

                  <div
                    className="shrink-0 flex items-center gap-1 opacity-0 group-hover/row:opacity-100 focus-within:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Can permission="categories.edit">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink-body)] rounded-[var(--radius-md)]"
                        onClick={() => openEdit(category)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </Can>
                    <Can permission="categories.delete">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-[var(--color-danger-500)] hover:bg-[var(--color-danger-500)]/10 rounded-[var(--radius-md)]"
                        onClick={() => openDelete(category)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </Can>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {!isLoading && !isError && totalPages > 1 && (
        <div className="p-3 border-t border-[var(--color-divider)]">
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
                <span className="text-sm text-[var(--color-muted)] px-4">
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
        </div>
      )}

      {formOpen && (
        <CategoryFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          mode={formMode}
          category={editTarget}
          isRealParent
        />
      )}

      {deleteOpen && (
        <DeleteCategoryDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          category={deleteTarget}
          isRealParent
        />
      )}
    </div>
  );
}
