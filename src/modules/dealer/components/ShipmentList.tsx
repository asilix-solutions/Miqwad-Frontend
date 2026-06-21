/**
 * @file ShipmentList.tsx
 *
 * Responsive list of ShipmentCards for the dealer shipments view.
 * Handles loading (skeleton tracking cards), error (retry), empty, and data states
 * so DealerShipmentsPage stays focused on data/filter logic.
 * Renders a 2-column grid on large screens; stacks to single column on mobile.
 */

import type { ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@shared/lib/utils";
import { ProviderCard, ProviderSkeleton } from "@shared/provider-ui";
import type { Shipment, ShipmentStatus } from "../types";
import { ShipmentCard } from "./ShipmentCard";

// ── Constants ─────────────────────────────────────────────────────────────────

const STAGGER_CAP = 10;
const STAGGER_MS = 50;
const SKELETON_COUNT = 3;

// ── Types ─────────────────────────────────────────────────────────────────────

/** Props for {@link ShipmentList}. */
export interface ShipmentListProps {
  shipments: Shipment[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  /** Rendered when `shipments` is empty. Use {@link ProviderEmptyState}. */
  emptyState?: ReactNode;
  onStatusChange: (shipment: Shipment, status: ShipmentStatus) => void;
  onCardClick: (shipment: Shipment) => void;
  isStatusPending?: boolean;
}

// ── Skeleton card ─────────────────────────────────────────────────────────────

function ShipmentSkeletonCard() {
  return (
    <ProviderCard padded={false} className="flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4">
        <div className="flex items-start gap-3">
          <ProviderSkeleton variant="circle" width={36} height={36} />
          <div className="flex flex-col gap-2">
            <ProviderSkeleton width={72} height={14} />
            <ProviderSkeleton width={96} height={12} />
          </div>
        </div>
        <ProviderSkeleton width={76} height={22} variant="block" />
      </div>

      {/* Progress area */}
      <div className="flex flex-col gap-2 border-t border-[var(--color-divider)] px-5 py-4">
        <ProviderSkeleton width="100%" height={10} variant="block" />
        <div className="flex justify-between">
          <ProviderSkeleton width={52} height={10} />
          <ProviderSkeleton width={52} height={10} />
          <ProviderSkeleton width={52} height={10} />
        </div>
      </div>

      {/* Tracking area */}
      <div className="flex justify-between border-t border-[var(--color-divider)] px-5 py-3">
        <div className="flex flex-col gap-1.5">
          <ProviderSkeleton width={60} height={12} />
          <ProviderSkeleton width={100} height={12} />
        </div>
        <ProviderSkeleton width={80} height={12} />
      </div>

      {/* Action area */}
      <div className="border-t border-[var(--color-divider)] px-4 py-3">
        <ProviderSkeleton width={110} height={32} variant="block" />
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

/** Responsive grid of dealer shipment cards — handles all data states. */
export function ShipmentList({
  shipments,
  isLoading,
  isError,
  onRetry,
  emptyState,
  onStatusChange,
  onCardClick,
  isStatusPending,
}: ShipmentListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <ShipmentSkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return <ErrorBlock onRetry={onRetry} />;
  }

  if (shipments.length === 0) {
    return <>{emptyState}</>;
  }

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {shipments.map((shipment, index) => (
        <ShipmentCard
          key={shipment.id}
          shipment={shipment}
          onStatusChange={onStatusChange}
          onCardClick={onCardClick}
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
