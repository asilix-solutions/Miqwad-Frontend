/**
 * @file CategoryMultiSelectTree.tsx
 *
 * Multi-select checkbox tree for provider specialisation picking during
 * onboarding and profile editing.
 *
 * Renders a 3-level expandable tree scoped to a provider type.
 * Selection model: independent checkboxes — checking a parent node does NOT
 * auto-select or deselect its children. Each node is checked independently.
 *
 * Layout:
 *  - L1 nodes: bold section headers with collapse/expand toggle (expanded by default).
 *  - L2 nodes: indented checkboxes shown when parent is expanded (expanded by default).
 *  - L3 nodes: double-indented checkboxes, collapsed behind an expand button on the L2 row.
 *
 * Architecture: src/shared/provider-ui/ — reused across dealer, workshop, scrap onboarding.
 */

import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@shared/lib/utils";
import { getCategoryTree } from "@modules/services/lib/categoryTree";
import type { ServiceCategory, CategoryTreeNode } from "@modules/services/types";
import type { ProviderType } from "@modules/providers/types";

// ── Types ─────────────────────────────────────────────────────────────────────

/** Props for {@link CategoryMultiSelectTree}. */
export interface CategoryMultiSelectTreeProps {
  /** Flat list of all ServiceCategory records. */
  categories: ServiceCategory[];
  /** Controlled value: currently-selected category ids. */
  value: number[];
  /** Called with the new full selection when any checkbox changes. */
  onChange: (ids: number[]) => void;
  /** Restricts the tree to categories scoped to this provider type (+ global). */
  providerType?: ProviderType | null;
  /** Disables all checkboxes. */
  disabled?: boolean;
  /** Validation error message rendered below the tree. */
  error?: string;
}

// ── Main component ────────────────────────────────────────────────────────────

export function CategoryMultiSelectTree({
  categories,
  value,
  onChange,
  providerType,
  disabled = false,
  error,
}: CategoryMultiSelectTreeProps) {
  const { i18n } = useTranslation("translation");
  const lang = i18n.language;

  const selectedSet = useMemo(() => new Set(value), [value]);

  const tree = useMemo(
    () => getCategoryTree(categories, providerType ?? undefined),
    [categories, providerType],
  );

  const nameOf = (cat: ServiceCategory): string =>
    lang === "ar" ? cat.nameAr : cat.nameEn;

  const toggle = (id: number) => {
    if (disabled) return;
    if (selectedSet.has(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  if (tree.length === 0) {
    return (
      <p className="text-sm text-[var(--color-muted)] py-6 text-center">
        {lang === "ar" ? "لا توجد تصنيفات متاحة" : "No categories available"}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {tree.map((l1) => (
        <L1Section
          key={l1.id}
          node={l1}
          selectedSet={selectedSet}
          onToggle={toggle}
          nameOf={nameOf}
          disabled={disabled}
        />
      ))}
      {error && (
        <p className="text-xs text-[var(--color-danger-500)] mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// ── L1 section ────────────────────────────────────────────────────────────────

function L1Section({
  node,
  selectedSet,
  onToggle,
  nameOf,
  disabled,
}: {
  node: CategoryTreeNode;
  selectedSet: Set<number>;
  onToggle: (id: number) => void;
  nameOf: (c: ServiceCategory) => string;
  disabled: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const isChecked = selectedSet.has(node.id);

  return (
    <div
      className="rounded-[var(--radius-sm)] border border-[var(--color-divider)] overflow-hidden"
      style={{ transition: "box-shadow 150ms" }}
    >
      {/* L1 header row */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-[var(--color-surface-2)]">
        <input
          type="checkbox"
          id={`cmt-${node.id}`}
          checked={isChecked}
          onChange={() => onToggle(node.id)}
          disabled={disabled || !node.isActive}
          className="h-4 w-4 rounded-sm flex-shrink-0"
          style={{ accentColor: "var(--color-brand-orange)" }}
        />
        <label
          htmlFor={`cmt-${node.id}`}
          className={cn(
            "flex-1 text-sm font-semibold select-none",
            node.isActive
              ? "text-[var(--color-ink-body)] cursor-pointer"
              : "text-[var(--color-muted)] cursor-not-allowed",
          )}
        >
          {nameOf(node)}
        </label>
        {node.children.length > 0 && (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="flex-shrink-0 p-0.5 rounded text-[var(--color-muted)] hover:text-[var(--color-ink-body)] transition-colors"
            aria-expanded={expanded}
            aria-label={expanded ? "طي" : "توسيع"}
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-150",
                expanded ? "rotate-0" : "-rotate-90",
              )}
            />
          </button>
        )}
      </div>

      {/* L2 rows */}
      {expanded && node.children.length > 0 && (
        <div className="px-3 pb-2 pt-1 bg-[var(--color-surface)] flex flex-col gap-0.5">
          {node.children.map((l2) => (
            <L2Row
              key={l2.id}
              node={l2}
              selectedSet={selectedSet}
              onToggle={onToggle}
              nameOf={nameOf}
              disabled={disabled}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── L2 row (with optional L3 expansion) ──────────────────────────────────────

function L2Row({
  node,
  selectedSet,
  onToggle,
  nameOf,
  disabled,
}: {
  node: CategoryTreeNode;
  selectedSet: Set<number>;
  onToggle: (id: number) => void;
  nameOf: (c: ServiceCategory) => string;
  disabled: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const isChecked = selectedSet.has(node.id);

  return (
    <div>
      <div className="flex items-center gap-2 py-1.5 ps-4">
        <input
          type="checkbox"
          id={`cmt-${node.id}`}
          checked={isChecked}
          onChange={() => onToggle(node.id)}
          disabled={disabled || !node.isActive}
          className="h-4 w-4 rounded-sm flex-shrink-0"
          style={{ accentColor: "var(--color-brand-orange)" }}
        />
        <label
          htmlFor={`cmt-${node.id}`}
          className={cn(
            "flex-1 text-sm select-none",
            node.isActive
              ? "text-[var(--color-ink-body)] cursor-pointer"
              : "text-[var(--color-muted)] cursor-not-allowed",
          )}
        >
          {nameOf(node)}
        </label>
        {node.children.length > 0 && (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="flex-shrink-0 p-0.5 rounded text-[var(--color-muted)] hover:text-[var(--color-ink-body)] transition-colors"
            aria-expanded={expanded}
            aria-label={expanded ? "طي" : "توسيع"}
          >
            <ChevronRight
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-150",
                expanded ? "rotate-90" : "rotate-0",
              )}
            />
          </button>
        )}
      </div>

      {/* L3 rows */}
      {expanded && node.children.length > 0 && (
        <div className="ps-10 pb-1 flex flex-col gap-0.5">
          {node.children.map((l3) => (
            <div key={l3.id} className="flex items-center gap-2 py-1">
              <input
                type="checkbox"
                id={`cmt-${l3.id}`}
                checked={selectedSet.has(l3.id)}
                onChange={() => onToggle(l3.id)}
                disabled={disabled || !l3.isActive}
                className="h-3.5 w-3.5 rounded-sm flex-shrink-0"
                style={{ accentColor: "var(--color-brand-orange)" }}
              />
              <label
                htmlFor={`cmt-${l3.id}`}
                className={cn(
                  "text-xs select-none",
                  l3.isActive
                    ? "text-[var(--color-ink-body)] cursor-pointer"
                    : "text-[var(--color-muted)] cursor-not-allowed",
                )}
              >
                {nameOf(l3)}
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
