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

import { isAdminFeatureAvailable } from "../../../config/featureCapabilities";
import { usePermissions } from "@shared/auth/usePermissions";

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
  const { can } = usePermissions();
  const legacyActions = isAdminFeatureAvailable("legacyCategoryTree");

  return (
    <div
      className="flex items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover/row:opacity-100 focus-within:opacity-100"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Add child — L1/L2 only */}
      {legacyActions && can("categories.create") && node.level < 3 && (
        <button
          type="button"
          onClick={() => onAddChild(node)}
          title={t("superAdmin.categories.tree.addChild")}
          className="flex h-7 items-center gap-1 rounded-[var(--radius-sm)] px-2 text-xs whitespace-nowrap text-[var(--color-brand-orange)] transition-colors hover:bg-[var(--color-brand-orange)]/10"
        >
          <Plus className="h-3 w-3 shrink-0" />
          {t("superAdmin.categories.tree.addChild")}
        </button>
      )}

      {/* Edit */}
      {can("categories.edit") && (
        <button
          type="button"
          onClick={() => onEdit(node)}
          title={t("superAdmin.categories.edit")}
          className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-ink-secondary)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink-body)]"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Toggle active */}
      {legacyActions && can("categories.edit") && (
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
            "flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] transition-colors",
            node.isActive
              ? "text-[var(--color-success-500)] hover:bg-[var(--color-success-500)]/10"
              : "text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]",
            isTogglingActive && "cursor-not-allowed opacity-50",
          )}
        >
          <Power className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Delete */}
      {can("categories.delete") && (
        <button
          type="button"
          onClick={() => onDelete(node)}
          title={t("superAdmin.categories.delete")}
          className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-danger-500)] transition-colors hover:bg-[var(--color-danger-500)]/10"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
