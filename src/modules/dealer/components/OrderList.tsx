/**
 * @file OrderList.tsx
 *
 * Responsive stacked list of OrderCards for the dealer orders view.
 * Handles loading (skeleton cards), error, empty, and data states so the
 * page stays lean. On data, renders staggered OrderCards at full width.
 */

import type { ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@shared/lib/utils";
import { ProviderCard, ProviderSkeleton } from "@shared/provider-ui";
import type { Order } from "../types";
import { OrderCard } from "./OrderCard";

// ── Constants ─────────────────────────────────────────────────────────────────

const STAGGER_CAP = 12;
const STAGGER_MS = 50;
const SKELETON_COUNT = 4;

// ── Types ─────────────────────────────────────────────────────────────────────

/** Props for {@link OrderList}. */
export interface OrderListProps {
  orders: Order[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  /** Rendered when `orders` is empty. Use {@link ProviderEmptyState}. */
  emptyState?: ReactNode;
  onStartPreparing: (order: Order) => void;
  onShip: (order: Order) => void;
  onMarkDelivered: (order: Order) => void;
  onCancel: (order: Order) => void;
  isStatusPending?: boolean;
}

// ── Skeleton card ─────────────────────────────────────────────────────────────

function OrderSkeletonCard() {
  return (
    <ProviderCard padded={false} className="flex flex-col overflow-hidden">
      {/* Header area */}
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4">
        <div className="flex flex-col gap-2">
          <ProviderSkeleton width={72} height={14} />
          <ProviderSkeleton width={140} height={12} />
          <ProviderSkeleton width={100} height={12} />
        </div>
        <ProviderSkeleton width={76} height={22} variant="block" />
      </div>

      {/* Body area */}
      <div className="flex items-center justify-between border-t border-[var(--color-divider)] px-5 py-3">
        <ProviderSkeleton width={80} height={12} />
        <ProviderSkeleton width={96} height={20} />
      </div>

      {/* Action area */}
      <div className="flex items-center justify-between border-t border-[var(--color-divider)] px-4 py-3">
        <ProviderSkeleton width={116} height={32} variant="block" />
        <ProviderSkeleton width={80} height={12} />
      </div>
    </ProviderCard>
  );
}

// ── Error block ───────────────────────────────────────────────────────────────

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

// ── Component ─────────────────────────────────────────────────────────────────

/** Stacked list of dealer order cards — handles all data states. */
export function OrderList({
  orders,
  isLoading,
  isError,
  onRetry,
  emptyState,
  onStartPreparing,
  onShip,
  onMarkDelivered,
  onCancel,
  isStatusPending,
}: OrderListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <OrderSkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return <ErrorBlock onRetry={onRetry} />;
  }

  if (orders.length === 0) {
    return <>{emptyState}</>;
  }

  return (
    <div className="flex flex-col gap-3">
      {orders.map((order, index) => (
        <OrderCard
          key={order.id}
          order={order}
          onStartPreparing={onStartPreparing}
          onShip={onShip}
          onMarkDelivered={onMarkDelivered}
          onCancel={onCancel}
          isStatusPending={isStatusPending}
          style={
            index < STAGGER_CAP
              ? { animationDelay: `${index * STAGGER_MS}ms` }
              : undefined
          }
        />
      ))}
    </div>
  );
}
