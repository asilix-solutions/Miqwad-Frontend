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

// ── Input / control layer ──────────────────────────────────────────────────────

export { ProviderInput } from "./ProviderInput";
export type { ProviderInputProps } from "./ProviderInput";

export { ProviderTextarea } from "./ProviderTextarea";
export type { ProviderTextareaProps } from "./ProviderTextarea";

export { ProviderSelect } from "./ProviderSelect";
export type { ProviderSelectProps, ProviderSelectOption } from "./ProviderSelect";

export { ProviderSearchBar } from "./ProviderSearchBar";
export type { ProviderSearchBarProps } from "./ProviderSearchBar";

export { ProviderImageUpload } from "./ProviderImageUpload";
export type { ProviderImageUploadProps } from "./ProviderImageUpload";

export { ProviderDialog } from "./ProviderDialog";
export type { ProviderDialogProps } from "./ProviderDialog";

export { CategoryMultiSelectTree } from "./CategoryMultiSelectTree";
export type { CategoryMultiSelectTreeProps } from "./CategoryMultiSelectTree";

// ── Notifications ───────────────────────────────────────────────────────────

export { NotificationBell } from "./NotificationBell";
export type { NotificationBellProps } from "./NotificationBell";

export { NotificationToastHost } from "./NotificationToastHost";
export type { NotificationToastHostProps } from "./NotificationToastHost";
