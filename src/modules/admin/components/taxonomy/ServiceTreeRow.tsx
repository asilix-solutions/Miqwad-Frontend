/**
 * @file ServiceTreeRow.tsx
 * @description Recursive row for the Service self-join tree (root/child via
 * `parentServiceId`). Mirrors `CategoryTreeNode`'s indentation/RTL pattern,
 * without category-only concerns (provider scope, color, active toggle) —
 * the Service entity carries none of those.
 */

import { ChevronDown, Folder, FolderOpen, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Can } from "@shared/auth/Can";
import { cn } from "@shared/lib/utils";
import type { Service } from "@modules/services/service.types";

interface Props {
  node: Service;
  depth: number;
  expandedIds: Set<number>;
  onToggleExpand: (id: number) => void;
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
}

export function ServiceTreeRow({ node, depth, expandedIds, onToggleExpand, onEdit, onDelete }: Props) {
  const hasChildren = (node.children?.length ?? 0) > 0;
  const isExpanded = expandedIds.has(node.id);

  return (
    <>
      <div
        role="treeitem"
        aria-expanded={hasChildren ? isExpanded : undefined}
        className="group/row flex items-center gap-2 py-2.5 pe-3 border-b border-[var(--color-divider)] last:border-b-0 hover:bg-[var(--color-surface-2)] transition-colors duration-100"
        style={{ paddingInlineStart: `${depth * 24 + 12}px` }}
      >
        <span
          role="button"
          tabIndex={hasChildren ? 0 : -1}
          className="w-5 flex items-center justify-center shrink-0 cursor-pointer"
          onClick={() => hasChildren && onToggleExpand(node.id)}
        >
          {hasChildren && (
            <ChevronDown
              className={cn(
                "h-4 w-4 text-[var(--color-muted)] transition-transform duration-200",
                !isExpanded && "-rotate-90",
              )}
            />
          )}
        </span>

        {isExpanded ? (
          <FolderOpen className="h-4 w-4 text-[var(--color-brand-orange)] shrink-0" />
        ) : (
          <Folder className="h-4 w-4 text-[var(--color-muted)] shrink-0" />
        )}

        <span className="flex-1 min-w-0 truncate text-sm font-medium text-[var(--color-ink-body)]">
          {node.name}
        </span>

        {hasChildren && (
          <span className="text-[10px] font-medium text-[var(--color-muted)] bg-[var(--color-surface-2)] rounded-full px-2 py-0.5 shrink-0">
            {node.children!.length}
          </span>
        )}

        <div
          className="shrink-0 flex items-center gap-1 opacity-0 group-hover/row:opacity-100 focus-within:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <Can permission="services.edit">
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink-body)] rounded-[var(--radius-md)]"
              onClick={() => onEdit(node)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </Can>
          <Can permission="services.delete">
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-[var(--color-danger-500)] hover:bg-[var(--color-danger-500)]/10 rounded-[var(--radius-md)]"
              onClick={() => onDelete(node)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </Can>
        </div>
      </div>

      {isExpanded && hasChildren && (
        <div role="group">
          {node.children!.map((child) => (
            <ServiceTreeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </>
  );
}
