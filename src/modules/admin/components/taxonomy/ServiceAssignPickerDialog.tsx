/**
 * @file ServiceAssignPickerDialog.tsx
 * @description Picker dialog for assigning a service (self-join Service tree,
 * mock-flagged `useServicesTreeQuery`) to the selected category. Assignment
 * itself hits the real `POST /Categories/{id}/services/{serviceId}` endpoint
 * — because the tree source is still mock, a mock serviceId may be rejected
 * by the real backend until `/api/Services` ships; that failure is handled
 * as a normal toast error, never blocking the rest of the UI.
 */

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, Folder, FolderOpen, Info, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@shared/lib/utils";
import {
  useAssignServiceMutation,
  useServicesTreeQuery,
} from "@modules/services/hooks/useServicesAdminQueries";
import { SERVICES_SOURCE } from "@modules/services/api/serviceApi";
import type { Service } from "@modules/services/service.types";
import type { ServiceCategory } from "@modules/services/types";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  category: ServiceCategory;
  assignedIds: Set<number>;
}

/** ids of nodes matching the search text, plus all of their ancestors (so the branch stays reachable). */
function collectMatches(nodes: Service[], query: string, ancestors: number[] = []): Set<number> {
  const result = new Set<number>();
  const lower = query.trim().toLowerCase();
  for (const node of nodes) {
    const path = [...ancestors, node.id];
    const selfMatches = lower === "" || node.name.toLowerCase().includes(lower);
    const childMatches = node.children ? collectMatches(node.children, query, path) : new Set<number>();
    if (selfMatches || childMatches.size > 0) {
      path.forEach((id) => result.add(id));
      childMatches.forEach((id) => result.add(id));
    }
  }
  return result;
}

export function ServiceAssignPickerDialog({ open, onOpenChange, category, assignedIds }: Props) {
  const { t } = useTranslation();
  const { data: tree, isLoading, isError } = useServicesTreeQuery();
  const assignMutation = useAssignServiceMutation();

  const [search, setSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const matchingIds = useMemo(
    () => (search.trim() ? collectMatches(tree ?? [], search) : null),
    [tree, search],
  );

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAssign = (serviceId: number) => {
    assignMutation.mutate({ categoryId: category.id, serviceId });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>{t("superAdmin.taxonomy.picker.title")}</DialogTitle>
        </DialogHeader>

        {SERVICES_SOURCE === "mock" && (
          <div className="flex items-start gap-2 rounded-[var(--radius-md)] bg-[var(--color-info-50,#EFF6FF)] px-3 py-2 text-xs text-[var(--color-info-700,#1D4ED8)]">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>{t("superAdmin.taxonomy.picker.mockNotice")}</span>
          </div>
        )}

        <div className="relative">
          <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-[var(--color-muted)]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("superAdmin.taxonomy.picker.search")}
            className="ps-9"
          />
        </div>

        <div className="max-h-[320px] overflow-y-auto rounded-[var(--radius-md)] border border-[var(--color-divider)]">
          {isLoading && (
            <div className="p-3 space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-8 w-full rounded-[var(--radius-sm)]" />
              ))}
            </div>
          )}

          {isError && !isLoading && (
            <p className="p-6 text-center text-sm text-[var(--color-danger-500)]">
              {t("superAdmin.taxonomy.picker.error")}
            </p>
          )}

          {!isLoading && !isError && (tree?.length ?? 0) === 0 && (
            <p className="p-6 text-center text-sm text-[var(--color-muted)]">
              {t("superAdmin.taxonomy.picker.empty")}
            </p>
          )}

          {!isLoading && !isError && tree && tree.length > 0 && (
            <div role="tree">
              {tree.map((node) =>
                matchingIds === null || matchingIds.has(node.id) ? (
                  <ServiceTreeRow
                    key={node.id}
                    node={node}
                    depth={0}
                    expandedIds={expandedIds}
                    onToggleExpand={toggleExpand}
                    matchingIds={matchingIds}
                    assignedIds={assignedIds}
                    onAssign={handleAssign}
                    isAssigning={assignMutation.isPending}
                  />
                ) : null,
              )}
            </div>
          )}
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("superAdmin.taxonomy.picker.done")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface RowProps {
  node: Service;
  depth: number;
  expandedIds: Set<number>;
  onToggleExpand: (id: number) => void;
  matchingIds: Set<number> | null;
  assignedIds: Set<number>;
  onAssign: (serviceId: number) => void;
  isAssigning: boolean;
}

function ServiceTreeRow({
  node,
  depth,
  expandedIds,
  onToggleExpand,
  matchingIds,
  assignedIds,
  onAssign,
  isAssigning,
}: RowProps) {
  const { t } = useTranslation();
  const hasChildren = (node.children?.length ?? 0) > 0;
  const isExpanded = matchingIds ? matchingIds.has(node.id) : expandedIds.has(node.id);
  const isAssigned = assignedIds.has(node.id);

  return (
    <>
      <div
        className="flex items-center gap-2 py-2 pe-3 border-b border-[var(--color-divider)] last:border-b-0 hover:bg-[var(--color-surface-2)] transition-colors"
        style={{ paddingInlineStart: `${depth * 20 + 12}px` }}
      >
        <span
          role="button"
          tabIndex={hasChildren ? 0 : -1}
          className="w-5 flex items-center justify-center shrink-0 cursor-pointer"
          onClick={() => hasChildren && onToggleExpand(node.id)}
        >
          {hasChildren && (
            <ChevronDown
              className={cn("h-4 w-4 text-[var(--color-muted)] transition-transform", !isExpanded && "-rotate-90")}
            />
          )}
        </span>

        {isExpanded ? (
          <FolderOpen className="h-4 w-4 text-[var(--color-brand-orange)] shrink-0" />
        ) : (
          <Folder className="h-4 w-4 text-[var(--color-muted)] shrink-0" />
        )}

        <label className="flex-1 min-w-0 flex items-center gap-2 cursor-pointer text-sm text-[var(--color-ink-body)]">
          <input
            type="checkbox"
            checked={isAssigned}
            disabled={isAssigned || isAssigning}
            onChange={() => onAssign(node.id)}
            className="h-4 w-4 accent-[var(--color-brand-orange)] shrink-0"
          />
          <span className="truncate">{node.name}</span>
        </label>

        {isAssigned && (
          <span className="shrink-0 text-[10px] font-medium text-[var(--color-success-500)] bg-[var(--color-success-500)]/10 rounded-full px-2 py-0.5">
            {t("superAdmin.taxonomy.picker.alreadyAssigned")}
          </span>
        )}
      </div>

      {isExpanded && hasChildren && (
        <div role="group">
          {node.children!.map((child) =>
            matchingIds === null || matchingIds.has(child.id) ? (
              <ServiceTreeRow
                key={child.id}
                node={child}
                depth={depth + 1}
                expandedIds={expandedIds}
                onToggleExpand={onToggleExpand}
                matchingIds={matchingIds}
                assignedIds={assignedIds}
                onAssign={onAssign}
                isAssigning={isAssigning}
              />
            ) : null,
          )}
        </div>
      )}
    </>
  );
}
