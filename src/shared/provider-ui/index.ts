/**
 * @file index.ts
 *
 * Barrel export for the provider design-system primitive layer.
 *
 * Usage (from any provider module):
 *   import { ProviderCard, ProviderStatCard } from "@shared/provider-ui";
 *
 * Architecture: src/shared/provider-ui/ — reused across dealer, workshop, scrap.
 */

export { ProviderCard } from "./ProviderCard";
export type { ProviderCardProps } from "./ProviderCard";

export { ProviderPageHeader } from "./ProviderPageHeader";
export type { ProviderPageHeaderProps } from "./ProviderPageHeader";

export { ProviderSkeleton } from "./ProviderSkeleton";
export type { ProviderSkeletonProps, SkeletonVariant } from "./ProviderSkeleton";

export { ProviderStatCard } from "./ProviderStatCard";
export type { ProviderStatCardProps, StatCardTone } from "./ProviderStatCard";

export { ProviderEmptyState } from "./ProviderEmptyState";
export type { ProviderEmptyStateProps } from "./ProviderEmptyState";

export { ProviderTabs } from "./ProviderTabs";
export type { ProviderTabsProps, ProviderTabItem } from "./ProviderTabs";

export { ProviderStatusPill } from "./ProviderStatusPill";
export type { ProviderStatusPillProps, StatusPillTone } from "./ProviderStatusPill";

export { ProviderDataView } from "./ProviderDataView";
export type { ProviderDataViewProps, ColumnDef } from "./ProviderDataView";
