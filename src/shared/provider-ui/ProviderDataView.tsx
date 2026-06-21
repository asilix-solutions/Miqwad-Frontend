/**
 * @file ProviderDataView.tsx
 *
 * Generic hybrid data-display component for provider dashboards.
 * Renders a polished table on desktop (≥ md breakpoint) and a card stack on
 * mobile (< md) from a single column definition and row set.  Both views are
 * always in the DOM; CSS `hidden / block` toggling controls visibility — no JS
 * resize listeners.
 *
 * Handles four states cleanly:
 *   loading  → shimmer skeleton table (desktop) + skeleton cards (mobile)
 *   error    → centred danger icon + optional retry button
 *   empty    → consumer-supplied `emptyState` or minimal icon fallback
 *   data     → staggered table / card stack (first 12 rows animate in)
 *
 * RTL: all horizontal spacing uses logical properties (ps-/pe-/ms-/me-).
 * Motion: `.provider-fade-up` (keyframe in globals.css), stagger capped at 12 rows.
 * Animation is automatically suppressed by `prefers-reduced-motion` guard.
 *
 * Architecture: src/shared/provider-ui/ — reused across dealer, workshop, scrap.
 */

import type { CSSProperties, ReactNode } from "react";
import { AlertCircle, Package, RefreshCw } from "lucide-react";
import { cn } from "@shared/lib/utils";
import { ProviderCard } from "./ProviderCard";
import { ProviderSkeleton } from "./ProviderSkeleton";

// ── Constants ─────────────────────────────────────────────────────────────────

const SKELETON_ROWS = 5;
const STAGGER_CAP = 12;
const STAGGER_MS = 40;

// Static string map — Tailwind v4 content scanner sees every class as a literal.
const ALIGN_CLASS: Record<"start" | "center" | "end", string> = {
  start:  "text-start",
  center: "text-center",
  end:    "text-end",
};

// ── Types ─────────────────────────────────────────────────────────────────────

/** Column descriptor for {@link ProviderDataView}. */
export interface ColumnDef<T> {
  /** Unique column key — used as React key; must be unique within the column set. */
  key: string;
  /** Header label — already translated by the consumer. */
  header: string;
  /** Cell renderer — receives the full row and returns any ReactNode. */
  render: (row: T) => ReactNode;
  /**
   * Text alignment (logical — RTL-safe).
   * @default "start"
   */
  align?: "start" | "center" | "end";
  /** When `true`, this column is omitted from the auto mobile card layout. */
  hideOnMobile?: boolean;
  /**
   * Marks the primary identifying field used as the card title in the auto
   * mobile layout.  At most one column should be `primary`.  Defaults to the
   * first non-hidden column when none is marked.
   */
  primary?: boolean;
}

/** Props for {@link ProviderDataView}. */
export interface ProviderDataViewProps<T> {
  /** Ordered column definitions (preserved in both table and card views). */
  columns: ColumnDef<T>[];
  /** Data rows to display. */
  rows: T[];
  /** Returns a stable string key for a given row (used as React key). */
  getRowKey: (row: T) => string;
  /** When `true`, shows shimmer skeleton placeholders. */
  isLoading?: boolean;
  /** When `true`, replaces content with a danger error block. */
  isError?: boolean;
  /** Surfaces a retry button in the error block when provided. */
  onRetry?: () => void;
  /**
   * ReactNode rendered when `rows` is empty (recommend {@link ProviderEmptyState}).
   * Falls back to a minimal icon placeholder if omitted.
   */
  emptyState?: ReactNode;
  /**
   * Optional custom mobile card renderer.  When provided it replaces the
   * auto-generated card layout.  The wrapper div for stagger animation is
   * applied by ProviderDataView; return only the card content.
   */
  renderMobileCard?: (row: T) => ReactNode;
  /**
   * Per-row action slot.  In the desktop table it becomes a pinned end column;
   * in the auto mobile card it appears at the top inline-end of the card.
   */
  rowActions?: (row: T) => ReactNode;
  /**
   * Called when the user clicks anywhere on a data row.
   * Adds `cursor-pointer` to each row when provided.
   */
  onRowClick?: (row: T) => void;
  /** Extra Tailwind / CSS classes on the root wrapper `<div>`. */
  className?: string;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function staggerStyle(index: number): CSSProperties | undefined {
  return index < STAGGER_CAP
    ? { animationDelay: `${index * STAGGER_MS}ms` }
    : undefined;
}

function ErrorBlock({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-full",
          "bg-[var(--color-danger-50)] text-[var(--color-danger-500)]",
          "shadow-[var(--shadow-provider-sm)]",
        )}
      >
        <AlertCircle className="h-7 w-7" aria-hidden />
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className={cn(
            "inline-flex items-center justify-center gap-2",
            "rounded-[var(--radius-sm)] px-4 py-2 text-sm font-medium",
            "bg-[var(--color-danger-50)] text-[var(--color-danger-500)]",
            "transition-colors hover:bg-[var(--color-danger-500)] hover:text-white",
          )}
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
        </button>
      )}
    </div>
  );
}

function DefaultEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-full",
          "bg-[var(--color-surface-2)] text-[var(--color-muted-2)]",
          "shadow-[var(--shadow-provider-sm)]",
        )}
      >
        <Package className="h-7 w-7" aria-hidden />
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Provider hybrid data view — polished table on desktop, card stack on mobile.
 *
 * Fully generic: TypeScript infers `T` from the `rows` prop so callers get
 * type-safe `render` callbacks without explicit type parameters.
 *
 * @example
 * ```tsx
 * <ProviderDataView
 *   columns={[
 *     { key: "name", header: t("name"), render: r => r.name, primary: true },
 *     { key: "status", header: t("status"), render: r => <ProviderStatusPill ... /> },
 *     { key: "price", header: t("price"), render: r => r.price, hideOnMobile: true },
 *   ]}
 *   rows={products}
 *   getRowKey={r => r.id}
 *   rowActions={r => <ActionsMenu row={r} />}
 *   isLoading={isLoading}
 *   emptyState={<ProviderEmptyState ... />}
 * />
 * ```
 */
export function ProviderDataView<T extends object>({
  columns,
  rows,
  getRowKey,
  isLoading,
  isError,
  onRetry,
  emptyState,
  renderMobileCard,
  rowActions,
  onRowClick,
  className,
}: ProviderDataViewProps<T>) {
  const hasActions = Boolean(rowActions);

  // Columns visible in the auto mobile card
  const mobileCols = columns.filter((col) => !col.hideOnMobile);
  const primaryCol = mobileCols.find((col) => col.primary) ?? mobileCols[0];
  const secondaryCols = mobileCols.filter((col) => col !== primaryCol);

  // ── Desktop: skeleton table ─────────────────────────────────────────────────
  const desktopSkeleton = (
    <ProviderCard padded={false} className="overflow-hidden">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-[var(--color-divider)]">
            {columns.map((col) => (
              <th key={col.key} className="px-6 py-3">
                <ProviderSkeleton width="60%" height="12px" />
              </th>
            ))}
            {hasActions && <th className="w-14" />}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: SKELETON_ROWS }).map((_, ri) => (
            <tr
              key={ri}
              className="border-b border-[var(--color-divider)] last:border-0"
            >
              {columns.map((col, ci) => (
                <td key={col.key} className="px-6 py-4">
                  <ProviderSkeleton
                    width={`${50 + ((ri * 3 + ci * 7) % 35)}%`}
                  />
                </td>
              ))}
              {hasActions && (
                <td className="pe-4 py-4 text-end">
                  <ProviderSkeleton variant="circle" width={28} height={28} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </ProviderCard>
  );

  // ── Desktop: data table ─────────────────────────────────────────────────────
  const desktopTable = (
    <ProviderCard padded={false} className="overflow-hidden">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-[var(--color-divider)]">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-6 py-3 text-xs font-medium uppercase tracking-wide",
                  "text-[var(--color-muted)]",
                  ALIGN_CLASS[col.align ?? "start"],
                )}
              >
                {col.header}
              </th>
            ))}
            {hasActions && (
              <th className="w-14" aria-label="actions" />
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={getRowKey(row)}
              className={cn(
                "border-b border-[var(--color-divider)] last:border-0",
                "transition-colors hover:bg-[var(--color-surface-2)]",
                index < STAGGER_CAP && "provider-fade-up",
                onRowClick && "cursor-pointer",
              )}
              style={staggerStyle(index)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    "px-6 py-4 text-sm text-[var(--color-ink-body)]",
                    ALIGN_CLASS[col.align ?? "start"],
                  )}
                >
                  {col.render(row)}
                </td>
              ))}
              {hasActions && (
                <td className="pe-4 py-4 text-end">
                  {rowActions?.(row)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </ProviderCard>
  );

  // ── Mobile: skeleton cards ──────────────────────────────────────────────────
  const mobileSkeleton = (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <ProviderCard key={i} className="flex flex-col gap-3">
          <ProviderSkeleton width="65%" />
          <ProviderSkeleton width="45%" />
          <ProviderSkeleton width="30%" />
        </ProviderCard>
      ))}
    </div>
  );

  // ── Mobile: data cards ──────────────────────────────────────────────────────
  const mobileCards = (
    <div className="flex flex-col gap-3">
      {rows.map((row, index) => {
        const delay = staggerStyle(index);
        const fadeClass = index < STAGGER_CAP ? "provider-fade-up" : undefined;

        if (renderMobileCard) {
          return (
            <div
              key={getRowKey(row)}
              className={cn(fadeClass)}
              style={delay}
            >
              {renderMobileCard(row)}
            </div>
          );
        }

        return (
          <ProviderCard
            key={getRowKey(row)}
            interactive
            className={cn(fadeClass, onRowClick && "cursor-pointer")}
            style={delay}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
          >
            <div className="flex items-start justify-between gap-4">
              {/* Primary + secondary fields ─────────────────────── */}
              <div className="flex min-w-0 flex-col gap-2">
                {primaryCol && (
                  <div className="truncate text-sm font-medium text-[var(--color-ink-body)]">
                    {primaryCol.render(row)}
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  {secondaryCols.map((col) => (
                    <div
                      key={col.key}
                      className="flex flex-wrap items-center gap-x-2 gap-y-1"
                    >
                      <span className="shrink-0 text-xs text-[var(--color-muted)]">
                        {col.header}:
                      </span>
                      <span className="text-xs text-[var(--color-ink-body)]">
                        {col.render(row)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Row actions ─────────────────────────────────────── */}
              {hasActions && (
                <div className="shrink-0">{rowActions?.(row)}</div>
              )}
            </div>
          </ProviderCard>
        );
      })}
    </div>
  );

  // ── State routing ───────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className={className}>
        <div className="hidden md:block">{desktopSkeleton}</div>
        <div className="md:hidden">{mobileSkeleton}</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={className}>
        <ErrorBlock onRetry={onRetry} />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className={className}>
        {emptyState ?? <DefaultEmpty />}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="hidden md:block">{desktopTable}</div>
      <div className="md:hidden">{mobileCards}</div>
    </div>
  );
}
