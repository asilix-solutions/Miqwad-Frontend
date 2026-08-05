/**
 * @file ServicesTreePanel.tsx
 * @description "الخدمات" tab — self-join Service tree manager (root/child
 * via `parentServiceId`). Replaces `ServicesTabStub`. Root nodes expand to
 * children client-side via `useServicesTreeQuery`/`buildServiceTree`;
 * create/edit/delete mutations invalidate the shared `serviceEntityKeys.all`
 * query so this tab and `ServiceAssignPickerDialog` always agree on the
 * same tree.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Can } from "@shared/auth/Can";
import { useServicesTreeQuery } from "@modules/services/hooks/useServicesAdminQueries";
import type { Service } from "@modules/services/service.types";
import { ServiceTreeRow } from "./ServiceTreeRow";
import { ServiceFormDialog } from "./ServiceFormDialog";
import { DeleteServiceDialog } from "./DeleteServiceDialog";

export function ServicesTreePanel() {
  const { t } = useTranslation();
  const { data: tree, isLoading, isError, refetch } = useServicesTreeQuery();

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

      {!isLoading && !isError && tree && tree.length > 0 && (
        <div role="tree">
          {tree.map((node) => (
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
