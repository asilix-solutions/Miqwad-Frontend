/**
 * @file ServicesTreePanel.tsx
 * @description "الخدمات" tab — self-join Service tree manager (root/child
 * via `parentServiceId`). Replaces `ServicesTabStub`. Root nodes expand to
 * children client-side via `useServicesTreeQuery`/`buildServiceTree`;
 * create/edit/delete mutations invalidate the shared `serviceEntityKeys.all`
 * query so this tab and `ServiceAssignPickerDialog` always agree on the
 * same tree.
 */

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { Can } from "@shared/auth/Can";
import { useServicesTreeQuery } from "@modules/services/hooks/useServicesAdminQueries";
import type { Service } from "@modules/services/service.types";
import { ServiceTreeRow } from "./ServiceTreeRow";
import { ServiceFormDialog } from "./ServiceFormDialog";
import { DeleteServiceDialog } from "./DeleteServiceDialog";

/** URL param carrying this tab's root-node page (distinct from `catPage`/`tab`). */
const PAGE_PARAM = "svcPage";
/** Client-side page size over TOP-LEVEL nodes only — children never paginate. */
const ROOT_PAGE_SIZE = 10;

export function ServicesTreePanel() {
  const { t } = useTranslation();
  const { data: tree, isLoading, isError, refetch } = useServicesTreeQuery();
  const [searchParams, setSearchParams] = useSearchParams();

  const roots = tree ?? [];
  const rootTotalPages = Math.max(1, Math.ceil(roots.length / ROOT_PAGE_SIZE));

  const pageParam = Number(searchParams.get(PAGE_PARAM));
  const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.min(pageParam, rootTotalPages) : 1;

  function goToPage(next: number) {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set(PAGE_PARAM, String(next));
      return params;
    });
  }

  // Normalise a stale/deep-linked page beyond the current root count.
  useEffect(() => {
    if (!isLoading && !isError && pageParam > rootTotalPages) {
      goToPage(rootTotalPages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isError, pageParam, rootTotalPages]);

  const visibleRoots = roots.slice((page - 1) * ROOT_PAGE_SIZE, page * ROOT_PAGE_SIZE);

  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editTarget, setEditTarget] = useState<Service | undefined>();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);

  const openAdd = () => {
    setFormMode("add");
    setEditTarget(undefined);
    setFormOpen(true);
  };

  const openEdit = (service: Service) => {
    setFormMode("edit");
    setEditTarget(service);
    setFormOpen(true);
  };

  const openDelete = (service: Service) => {
    setDeleteTarget(service);
    setDeleteOpen(true);
  };

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-divider)] bg-[var(--color-surface)] shadow-sm">
      <div className="flex items-center justify-between gap-3 p-4 border-b border-[var(--color-divider)]">
        <h2 className="text-sm font-semibold text-[var(--color-ink-body)]">
          {t("superAdmin.taxonomy.servicesTab.title")}
        </h2>
        <Can permission="services.create">
          <Button size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4" />
            {t("superAdmin.taxonomy.servicesTab.add")}
          </Button>
        </Can>
      </div>

      {isLoading && (
        <div className="p-4 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 w-full rounded-[var(--radius-md)]" />
          ))}
        </div>
      )}

      {isError && !isLoading && (
        <div className="p-8 text-center space-y-3">
          <p className="text-sm text-[var(--color-danger-500)]">
            {t("superAdmin.taxonomy.servicesTab.error")}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            {t("common.retry")}
          </Button>
        </div>
      )}

      {!isLoading && !isError && (tree?.length ?? 0) === 0 && (
        <div className="p-10 text-center space-y-1">
          <p className="text-sm font-medium text-[var(--color-ink-body)]">
            {t("superAdmin.taxonomy.servicesTab.empty")}
          </p>
        </div>
      )}

      {!isLoading && !isError && roots.length > 0 && (
        <>
          <div role="tree">
            {visibleRoots.map((node) => (
              <ServiceTreeRow
                key={node.id}
                node={node}
                depth={0}
                expandedIds={expandedIds}
                onToggleExpand={toggleExpand}
                onEdit={openEdit}
                onDelete={openDelete}
              />
            ))}
          </div>

          {rootTotalPages > 1 && (
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
                      {page} / {rootTotalPages}
                    </span>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink
                      onClick={() => goToPage(Math.min(rootTotalPages, page + 1))}
                      className={
                        page === rootTotalPages
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
        </>
      )}

      {formOpen && (
        <ServiceFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          mode={formMode}
          service={editTarget}
          tree={tree ?? []}
        />
      )}

      {deleteOpen && (
        <DeleteServiceDialog open={deleteOpen} onOpenChange={setDeleteOpen} service={deleteTarget} />
      )}
    </div>
  );
}
