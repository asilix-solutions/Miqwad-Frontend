/**
 * @file CategoryNodeActions.tsx
 * @description Inline action cluster for a category tree row.
 * Revealed on hover/focus. Renders "+ فرعي" only for L1/L2 (not L3 leaf).
 */

import { useTranslation } from "react-i18next";
import { Plus, Pencil, Power, Trash2 } from "lucide-react";
import { cn } from "@shared/lib/utils";
import type { CategoryTreeNode } from "@modules/services/types";
import type { ServiceCategory } from "@modules/services/types";

interface Props {
  node: CategoryTreeNode;
  onAddChild: (parent: CategoryTreeNode) => void;
  onEdit: (cat: ServiceCategory) => void;
  onToggleActive: (cat: ServiceCategory) => void;
  onDelete: (cat: ServiceCategory) => void;
  isTogglingActive: boolean;
}

export function CategoryNodeActions({
  node,
  onAddChild,
  onEdit,
  onToggleActive,
  onDelete,
  isTogglingActive,
}: Props) {
  const { t } = useTranslation();

  return (
    <div
      className="flex items-center gap-0.5 opacity-0 group-hover/row:opacity-100 focus-within:opacity-100 transition-opacity duration-150"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Add child — L1/L2 only */}
      {node.level < 3 && (
        <button
          type="button"
          onClick={() => onAddChild(node)}
          title={t("superAdmin.categories.tree.addChild")}
          className="flex items-center gap-1 h-7 px-2 text-xs rounded-[var(--radius-sm)] text-[var(--color-brand-orange)] hover:bg-[var(--color-brand-orange)]/10 transition-colors whitespace-nowrap"
        >
          <Plus className="h-3 w-3 shrink-0" />
          {t("superAdmin.categories.tree.addChild")}
        </button>
      )}

      {/* Edit */}
      <button
        type="button"
        onClick={() => onEdit(node)}
        title={t("superAdmin.categories.edit")}
        className="h-7 w-7 flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink-body)] transition-colors"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>

      {/* Toggle active */}
      <button
        type="button"
        onClick={() => onToggleActive(node)}
        disabled={isTogglingActive}
        title={
          node.isActive
            ? t("superAdmin.categories.tree.deactivate")
            : t("superAdmin.categories.tree.activate")
        }
        className={cn(
          "h-7 w-7 flex items-center justify-center rounded-[var(--radius-sm)] transition-colors",
          node.isActive
            ? "text-[var(--color-success-500)] hover:bg-[var(--color-success-500)]/10"
            : "text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]",
          isTogglingActive && "opacity-50 cursor-not-allowed",
        )}
      >
        <Power className="h-3.5 w-3.5" />
      </button>

      {/* Delete */}
      <button
        type="button"
        onClick={() => onDelete(node)}
        title={t("superAdmin.categories.delete")}
        className="h-7 w-7 flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-danger-500)] hover:bg-[var(--color-danger-500)]/10 transition-colors"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
