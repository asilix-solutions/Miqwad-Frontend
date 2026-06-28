/**
 * @file CategoryTree.tsx
 * @description Category hierarchy tree container.
 * Toolbar: provider-type scope filter tabs, search box, expand/collapse all, add-root button.
 * Builds the nested tree via getCategoryTree(), manages expand state, delegates CRUD to dialogs.
 */

import { useState, useMemo, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Search, ChevronsDown, ChevronsUp } from "lucide-react";
import { cn } from "@shared/lib/utils";
import { Button } from "@/components/ui/button";
import { Can } from "@shared/auth/Can";
import { useToast } from "@shared/components/ui/toastContext";
import { getCategoryTree } from "@modules/services/lib/categoryTree";
import type { CategoryTreeNode as CategoryNodeData, ServiceCategory } from "@modules/services/types";
import type { ProviderType } from "@modules/providers/types";
import {
  useAdminCategoriesQuery,
  usePatchCategoryActiveMutation,
} from "../../../hooks/useAdminQueries";
import { CategoryTreeNode } from "./CategoryTreeNode";
import { CategoryFormDialog } from "../CategoryFormDialog";
import { DeleteCategoryDialog } from "../DeleteCategoryDialog";

// ── Scope filter tab definitions ─────────────────────────────────────────────

type ScopeFilter = ProviderType | null;

interface ScopeTab {
  key: ScopeFilter;
  i18nKey: string;
  activeClass: string;
}

const SCOPE_TABS: readonly ScopeTab[] = [
  {
    key: null,
    i18nKey: "superAdmin.categories.tree.providerScope.all",
    activeClass: "bg-[var(--color-brand-orange)] text-white border-[var(--color-brand-orange)]",
  },
  {
    key: "workshop",
    i18nKey: "superAdmin.categories.tree.providerScope.workshop",
    activeClass: "bg-[#E8F5E9] text-[#2E7D32] border-[#A5D6A7]",
  },
  {
    key: "dealer",
    i18nKey: "superAdmin.categories.tree.providerScope.dealer",
    activeClass: "bg-[#FFF3E0] text-[#E65100] border-[#FFCC80]",
  },
  {
    key: "scrap",
    i18nKey: "superAdmin.categories.tree.providerScope.scrap",
    activeClass: "bg-[#F3E5F5] text-[#7B1FA2] border-[#CE93D8]",
  },
] as const;

// ── Dialog state types ────────────────────────────────────────────────────────

interface FormDialogState {
  open: boolean;
  mode: "add-root" | "add-child" | "edit";
  parentNode?: CategoryNodeData;
  category?: ServiceCategory;
}

interface DeleteDialogState {
  open: boolean;
  category: ServiceCategory | null;
}

// ── Skeleton rows ─────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <div className="divide-y divide-[var(--color-divider)]">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-3 animate-pulse">
          <span className="h-4 w-4 rounded bg-[var(--color-surface-2)]" />
          <span className="h-4 w-4 rounded bg-[var(--color-surface-2)]" />
          <div className="flex-1 space-y-1">
            <span
              className="block h-3.5 rounded bg-[var(--color-surface-2)]"
              style={{ width: `${40 + (i * 13) % 30}%` }}
            />
            <span className="block h-2.5 w-24 rounded bg-[var(--color-surface-2)]" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Empty + Error states ──────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <span className="text-4xl opacity-30">🗂️</span>
      <p className="font-semibold text-[var(--color-ink-body)]">
        {t("superAdmin.categories.tree.emptyTitle")}
      </p>
      <p className="text-sm text-[var(--color-muted)]">
        {t("superAdmin.categories.tree.emptyDescription")}
      </p>
      <Can permission="categories.create">
        <Button
          size="sm"
          onClick={onAdd}
          className="mt-2 bg-[var(--color-brand-orange)] hover:bg-[var(--color-brand-orange)]/90"
        >
          <Plus className="me-1.5 h-4 w-4" />
          {t("superAdmin.categories.tree.addRoot")}
        </Button>
      </Can>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <p className="font-semibold text-[var(--color-danger-500)]">{t("common.errorTitle")}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        {t("common.errorRetry")}
      </Button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function CategoryTree() {
  const { t } = useTranslation();
  const toast = useToast();
  const q = useAdminCategoriesQuery();
  const patchActiveMutation = usePatchCategoryActiveMutation();

  const [selectedScope, setSelectedScope] = useState<ScopeFilter>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => new Set());
  const initializedRef = useRef(false);

  const [formDialog, setFormDialog] = useState<FormDialogState>({
    open: false,
    mode: "add-root",
  });
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
    open: false,
    category: null,
  });

  // Build tree from flat list, filtered by selected scope
  const tree = useMemo(() => {
    if (!q.data) return [];
    const roots = getCategoryTree(q.data, selectedScope ?? undefined);
    return roots;
  }, [q.data, selectedScope]);

  // Initialize: expand L1 nodes on first data load
  useEffect(() => {
    if (q.data && !initializedRef.current) {
      initializedRef.current = true;
      const l1Ids = new Set(q.data.filter((c) => c.level === 1).map((c) => c.id));
      setExpandedIds(l1Ids);
    }
  }, [q.data]);

  // Search: compute set of matching node IDs (including ancestors of matches)
  const matchingIds = useMemo((): Set<number> | null => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;

    const matched = new Set<number>();

    function check(node: CategoryNodeData): boolean {
      const selfMatch =
        node.nameAr.includes(q) || node.nameEn.toLowerCase().includes(q);
      let childMatch = false;
      for (const child of node.children) {
        if (check(child)) {
          childMatch = true;
          matched.add(node.id); // include ancestor so it renders expanded
        }
      }
      if (selfMatch || childMatch) {
        matched.add(node.id);
        return true;
      }
      return false;
    }
    for (const root of tree) check(root);
    return matched;
  }, [searchQuery, tree]);

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    if (!q.data) return;
    setExpandedIds(new Set(q.data.map((c) => c.id)));
  };

  const collapseAll = () => setExpandedIds(new Set());

  // Dialog openers
  const openAddRoot = () =>
    setFormDialog({ open: true, mode: "add-root", parentNode: undefined, category: undefined });

  const openAddChild = (parent: CategoryNodeData) =>
    setFormDialog({ open: true, mode: "add-child", parentNode: parent, category: undefined });

  const openEdit = (cat: ServiceCategory) =>
    setFormDialog({ open: true, mode: "edit", parentNode: undefined, category: cat });

  const openDelete = (cat: ServiceCategory) =>
    setDeleteDialog({ open: true, category: cat });

  const handleToggleActive = async (cat: ServiceCategory) => {
    try {
      await patchActiveMutation.mutateAsync({ id: cat.id, isActive: !cat.isActive });
      toast.success(
        cat.isActive
          ? t("superAdmin.categories.success.deactivated")
          : t("superAdmin.categories.success.activated"),
      );
    } catch {
      toast.error(t("common.saveFailed"));
    }
  };

  // Determine visible tree (search-filtered)
  const visibleRoots = matchingIds
    ? tree.filter((r) => matchingIds.has(r.id))
    : tree;

  return (
    <div className="space-y-4">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Scope filter tabs */}
        <div className="flex gap-1 flex-shrink-0 flex-wrap">
          {SCOPE_TABS.map((tab) => (
            <button
              key={tab.key ?? "all"}
              type="button"
              onClick={() => setSelectedScope(tab.key)}
              className={cn(
                "text-[13px] py-1.5 px-3.5 rounded-full border transition-colors duration-150 whitespace-nowrap font-medium",
                selectedScope === tab.key
                  ? tab.activeClass
                  : "bg-transparent text-[var(--color-muted)] border-[var(--color-divider)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink-body)]",
              )}
            >
              {t(tab.i18nKey)}
            </button>
          ))}
        </div>

        {/* Search box */}
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-[var(--color-muted)] pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("superAdmin.categories.tree.search")}
            className="w-full h-9 border border-[var(--color-divider)] rounded-[var(--radius-md)] bg-white ps-9 pe-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-orange)]/30 placeholder:text-[var(--color-muted)]"
          />
        </div>

        {/* Expand / collapse all */}
        <Button
          variant="ghost"
          size="sm"
          onClick={expandAll}
          className="text-xs text-[var(--color-muted)] hover:text-[var(--color-ink-body)] gap-1"
        >
          <ChevronsDown className="h-3.5 w-3.5" />
          {t("superAdmin.categories.tree.expandAll")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={collapseAll}
          className="text-xs text-[var(--color-muted)] hover:text-[var(--color-ink-body)] gap-1"
        >
          <ChevronsUp className="h-3.5 w-3.5" />
          {t("superAdmin.categories.tree.collapseAll")}
        </Button>

        {/* Add root category */}
        <Can permission="categories.create">
          <Button
            onClick={openAddRoot}
            className="ms-auto bg-[var(--color-brand-orange)] hover:bg-[var(--color-brand-orange)]/90 gap-1"
          >
            <Plus className="h-4 w-4" />
            {t("superAdmin.categories.tree.addRoot")}
          </Button>
        </Can>
      </div>

      {/* ── Tree panel ── */}
      <div className="rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-white shadow-sm overflow-hidden">
        {q.isLoading ? (
          <SkeletonRows />
        ) : q.isError ? (
          <ErrorState onRetry={() => void q.refetch()} />
        ) : visibleRoots.length === 0 ? (
          <EmptyState onAdd={openAddRoot} />
        ) : (
          <div role="tree">
            {visibleRoots.map((root) => (
              <CategoryTreeNode
                key={root.id}
                node={root}
                expandedIds={expandedIds}
                onToggleExpand={toggleExpand}
                onAddChild={openAddChild}
                onEdit={openEdit}
                onToggleActive={handleToggleActive}
                onDelete={openDelete}
                matchingIds={matchingIds}
                isTogglingActive={patchActiveMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Dialogs ── */}
      {formDialog.open && (
        <CategoryFormDialog
          open={formDialog.open}
          onOpenChange={(v) => setFormDialog((s) => ({ ...s, open: v }))}
          mode={formDialog.mode}
          parentNode={formDialog.parentNode}
          category={formDialog.category}
        />
      )}

      {deleteDialog.open && (
        <DeleteCategoryDialog
          category={deleteDialog.category}
          open={deleteDialog.open}
          onOpenChange={(v) => setDeleteDialog((s) => ({ ...s, open: v }))}
        />
      )}
    </div>
  );
}
