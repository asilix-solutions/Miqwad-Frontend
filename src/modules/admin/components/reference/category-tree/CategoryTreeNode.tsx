/**
 * @file CategoryTreeNode.tsx
 * @description Recursive tree-row component for the category hierarchy.
 * Renders a single row (indented by level) + its expanded children recursively.
 * RTL-safe: indentation uses padding-inline-start. Chevron uses rotate(-90deg)
 * for collapsed state (points left ← in RTL = toward child branch).
 */

import { useTranslation } from "react-i18next";
import { ChevronDown, Folder, FolderOpen } from "lucide-react";
import { cn } from "@shared/lib/utils";
import type { CategoryTreeNode as CategoryNodeData, ServiceCategory } from "@modules/services/types";
import { CategoryNodeActions } from "./CategoryNodeActions";

const COLOR_MAP: Record<string, string> = {
  blue: "var(--color-brand-blue)",
  green: "var(--color-success-500)",
  orange: "var(--color-brand-orange)",
  purple: "var(--color-surface-4)",
  red: "var(--color-danger-500)",
  navy: "var(--color-ink-900)",
};

const SCOPE_CHIP: Record<string, { bg: string; text: string }> = {
  dealer: { bg: "bg-[#FFF3E0]", text: "text-[#E65100]" },
  workshop: { bg: "bg-[#E8F5E9]", text: "text-[#2E7D32]" },
  scrap: { bg: "bg-[#F3E5F5]", text: "text-[#7B1FA2]" },
};

interface Props {
  node: CategoryNodeData;
  expandedIds: Set<number>;
  onToggleExpand: (id: number) => void;
  onAddChild: (parent: CategoryNodeData) => void;
  onEdit: (cat: ServiceCategory) => void;
  onToggleActive: (cat: ServiceCategory) => void;
  onDelete: (cat: ServiceCategory) => void;
  matchingIds: Set<number> | null;
  isTogglingActive: boolean;
}

export function CategoryTreeNode({
  node,
  expandedIds,
  onToggleExpand,
  onAddChild,
  onEdit,
  onToggleActive,
  onDelete,
  matchingIds,
  isTogglingActive,
}: Props) {
  const { t } = useTranslation();

  const hasChildren = node.children.length > 0;
  const isExpanded = matchingIds ? matchingIds.has(node.id) : expandedIds.has(node.id);
  const isSearchMode = matchingIds !== null;
  const indentPx = (node.level - 1) * 24;

  // Row height / font weight by level
  const rowClass = cn(
    "group/row flex items-center gap-2 py-2.5 pe-3 cursor-pointer select-none",
    "border-b border-[var(--color-divider)] last:border-b-0",
    "hover:bg-[var(--color-surface-2)] transition-colors duration-100",
    !node.isActive && "opacity-60",
  );

  const nameClass = cn(
    node.level === 1
      ? "font-semibold text-[var(--color-ink-body)] text-sm"
      : node.level === 2
        ? "font-medium text-[var(--color-ink-body)] text-sm"
        : "font-normal text-[var(--color-ink-secondary)] text-xs",
  );

  const scopeChip = node.level === 1 && node.providerTypeScope
    ? SCOPE_CHIP[node.providerTypeScope]
    : null;

  return (
    <>
      {/* Row */}
      <div
        role="treeitem"
        aria-expanded={hasChildren ? isExpanded : undefined}
        tabIndex={0}
        className={rowClass}
        style={{ paddingInlineStart: `${indentPx + 12}px` }}
        onClick={() => hasChildren && onToggleExpand(node.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (hasChildren) onToggleExpand(node.id);
          }
        }}
      >
        {/* Expand chevron */}
        <span className="w-5 flex items-center justify-center shrink-0">
          {hasChildren ? (
            <ChevronDown
              className={cn(
                "h-4 w-4 text-[var(--color-muted)] shrink-0",
                "@media (prefers-reduced-motion: no-preference) { transition-transform duration-200 }",
                !isExpanded && "-rotate-90",
                isSearchMode && "opacity-50",
              )}
            />
          ) : null}
        </span>

        {/* Node icon */}
        {node.level === 3 ? (
          <span
            className="h-2 w-2 rounded-full shrink-0 opacity-50"
            style={{ backgroundColor: "var(--color-muted)" }}
          />
        ) : node.level === 1 && node.colorHint ? (
          <span
            className="h-4 w-4 rounded-[3px] shrink-0"
            style={{ backgroundColor: COLOR_MAP[node.colorHint] ?? "var(--color-muted)" }}
          />
        ) : isExpanded ? (
          <FolderOpen className="h-4 w-4 text-[var(--color-brand-orange)] shrink-0" />
        ) : (
          <Folder className="h-4 w-4 text-[var(--color-muted)] shrink-0" />
        )}

        {/* Names */}
        <div className="flex-1 min-w-0 flex flex-col">
          <span className={nameClass}>
            {node.nameAr}
            {!node.isActive && (
              <span className="ms-2 text-[10px] font-normal text-[var(--color-muted)] bg-[var(--color-surface-2)] px-1.5 py-0.5 rounded-full">
                {t("superAdmin.categories.tree.inactive")}
              </span>
            )}
          </span>
          <span className="text-[11px] text-[var(--color-muted)]" dir="ltr">
            {node.nameEn}
          </span>
        </div>

        {/* Child count badge (L1/L2 only) */}
        {hasChildren && node.level < 3 && (
          <span className="text-[10px] font-medium text-[var(--color-muted)] bg-[var(--color-surface-2)] rounded-full px-2 py-0.5 shrink-0">
            {t("superAdmin.categories.tree.childrenCount", { count: node.children.length })}
          </span>
        )}

        {/* Provider scope chip (L1 only) */}
        {scopeChip && (
          <span
            className={cn(
              "text-[10px] font-semibold rounded-full px-2 py-0.5 shrink-0",
              scopeChip.bg,
              scopeChip.text,
            )}
          >
            {t(`superAdmin.categories.tree.providerScope.${node.providerTypeScope!}`)}
          </span>
        )}

        {/* Inline actions (revealed on hover) */}
        <CategoryNodeActions
          node={node}
          onAddChild={onAddChild}
          onEdit={onEdit}
          onToggleActive={onToggleActive}
          onDelete={onDelete}
          isTogglingActive={isTogglingActive}
        />
      </div>

      {/* Children (recursive) */}
      {isExpanded && hasChildren && (
        <div role="group">
          {node.children.map((child) =>
            matchingIds === null || matchingIds.has(child.id) ? (
              <CategoryTreeNode
                key={child.id}
                node={child}
                expandedIds={expandedIds}
                onToggleExpand={onToggleExpand}
                onAddChild={onAddChild}
                onEdit={onEdit}
                onToggleActive={onToggleActive}
                onDelete={onDelete}
                matchingIds={matchingIds}
                isTogglingActive={isTogglingActive}
              />
            ) : null,
          )}
        </div>
      )}
    </>
  );
}
