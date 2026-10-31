/**
 * @file BrandBrowser.tsx
 * @description Master pane: Brand search, popularity filter, Grid/List toggle,
 * scrollable brand collection, and responsive administration.
 */
import { useTranslation } from "react-i18next";
import { Plus, Search, X, LayoutGrid, List, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Can } from "@shared/auth/Can";
import type { Brand } from "@modules/vehicles/types";
import { BrandCard } from "./BrandCard";
import { BrandRow } from "./BrandRow";
import type { ViewMode, BrandFilter } from "./types";
import { POPULAR_BRAND_IDS } from "./types";

interface Props {
  brands: Brand[];
  totalCatalogCount?: number;
  isLoading: boolean;
  isError: boolean;
  isTruncated?: boolean;
  onRetry: () => void;
  selectedBrandId: number | null;
  onSelectBrand: (brand: Brand) => void;
  onAddBrand: () => void;
  onEditBrand: (brand: Brand) => void;
  onDeleteBrand: (brand: Brand) => void;
  search: string;
  onSearchChange: (value: string) => void;
  activeFilter: BrandFilter;
  onFilterChange: (filter: BrandFilter) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  selectedBrandModelCount?: number;
}

export function BrandBrowser({
  brands,
  totalCatalogCount,
  isLoading,
  isError,
  isTruncated,
  onRetry,
  selectedBrandId,
  onSelectBrand,
  onAddBrand,
  onEditBrand,
  onDeleteBrand,
  search,
  onSearchChange,
  activeFilter,
  onFilterChange,
  viewMode,
  onViewModeChange,
  selectedBrandModelCount,
}: Props) {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language.startsWith("ar");

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-[var(--color-divider)] shadow-2xs overflow-hidden">
      {/* ─── 1. Header: Title, Count, Add Brand Action ─── */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--color-divider)] gap-3 bg-[var(--color-surface-1)]/60">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-base font-bold text-[var(--color-ink-body)] truncate">
            {t("superAdmin.brands.title")}
          </h2>
          {totalCatalogCount != null && (
            <Badge
              variant="secondary"
              className="bg-[var(--color-surface-2)] text-[var(--color-ink-secondary)] text-xs font-semibold px-2 py-0.5 rounded-full"
            >
              {brands.length}
            </Badge>
          )}
        </div>

        <Can permission="brands.create">
          <Button
            type="button"
            onClick={onAddBrand}
            size="sm"
            className="bg-[var(--color-brand-orange)] hover:bg-[var(--color-brand-orange)]/90 text-white font-medium shadow-2xs shrink-0"
          >
            <Plus className="me-1.5 h-4 w-4" />
            <span>{t("superAdmin.brands.add")}</span>
          </Button>
        </Can>
      </div>

      {/* ─── 2. Search & Controls Bar ─── */}
      <div className="p-4 border-b border-[var(--color-divider)] space-y-3 bg-white">
        {/* Search Input */}
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-muted)]" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t("superAdmin.brands.searchPlaceholder")}
            className="ps-9 pe-9 h-9 text-sm bg-[var(--color-surface-1)] border-[var(--color-divider)] focus-visible:bg-white"
            aria-label={t("superAdmin.brands.searchPlaceholder")}
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute end-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--color-muted)] hover:text-[var(--color-ink-body)] rounded-full focus-visible:outline-none"
              title={t("superAdmin.brands.clearSearch")}
              aria-label={t("superAdmin.brands.clearSearch")}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filters and View Mode Switcher */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-[var(--color-surface-2)] p-0.5 rounded-lg border border-[var(--color-divider)]/80 text-xs">
            <button
              type="button"
              onClick={() => onFilterChange("all")}
              className={[
                "px-2.5 py-1 rounded-md font-medium transition-all duration-150",
                activeFilter === "all"
                  ? "bg-white text-[var(--color-ink-body)] shadow-2xs font-semibold"
                  : "text-[var(--color-muted)] hover:text-[var(--color-ink-body)]",
              ].join(" ")}
            >
              {t("superAdmin.brands.filterAll")}
              {totalCatalogCount != null && (
                <span className="ms-1.5 text-[11px] opacity-75">
                  ({totalCatalogCount})
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => onFilterChange("popular")}
              className={[
                "px-2.5 py-1 rounded-md font-medium transition-all duration-150",
                activeFilter === "popular"
                  ? "bg-white text-[var(--color-brand-orange)] shadow-2xs font-semibold"
                  : "text-[var(--color-muted)] hover:text-[var(--color-ink-body)]",
              ].join(" ")}
            >
              {t("superAdmin.brands.filterPopular")}
              <span className="ms-1.5 text-[11px] opacity-75">
                ({POPULAR_BRAND_IDS.size})
              </span>
            </button>
          </div>

          {/* Grid / List View Toggle */}
          <div
            className="flex items-center gap-1 bg-[var(--color-surface-2)] p-0.5 rounded-lg border border-[var(--color-divider)]/80"
            role="group"
            aria-label="View mode toggle"
          >
            <button
              type="button"
              onClick={() => onViewModeChange("grid")}
              className={[
                "p-1.5 rounded-md transition-colors",
                viewMode === "grid"
                  ? "bg-white text-[var(--color-brand-orange)] shadow-2xs"
                  : "text-[var(--color-muted)] hover:text-[var(--color-ink-body)]",
              ].join(" ")}
              title={t("superAdmin.brands.gridView")}
              aria-label={t("superAdmin.brands.gridView")}
              aria-pressed={viewMode === "grid"}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("list")}
              className={[
                "p-1.5 rounded-md transition-colors",
                viewMode === "list"
                  ? "bg-white text-[var(--color-brand-orange)] shadow-2xs"
                  : "text-[var(--color-muted)] hover:text-[var(--color-ink-body)]",
              ].join(" ")}
              title={t("superAdmin.brands.listView")}
              aria-label={t("superAdmin.brands.listView")}
              aria-pressed={viewMode === "list"}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── 3. Truncation Warning (Explicit non-silent safety notice) ─── */}
      {isTruncated && (
        <div className="flex items-center gap-2 px-4 py-2 bg-warning-50 border-b border-warning-200 text-warning-800 text-xs">
          <AlertTriangle className="h-4 w-4 shrink-0 text-warning-600" />
          <span>{t("superAdmin.brands.safetyLimitWarning")}</span>
        </div>
      )}

      {/* ─── 4. Scrollable Brands Area ─── */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        {isLoading ? (
          /* Loading Skeletons */
          viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="p-3.5 rounded-xl border border-[var(--color-divider)] space-y-3">
                  <Skeleton className="h-11 w-11 rounded-lg" />
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-3 w-1/2 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-divider)]">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-4 w-1/3 rounded" />
                </div>
              ))}
            </div>
          )
        ) : isError ? (
          /* Error State */
          <div className="flex flex-col items-center justify-center py-12 text-center text-[var(--color-muted)]">
            <AlertTriangle className="h-8 w-8 text-danger-500 mb-2" />
            <p className="text-sm font-medium text-[var(--color-ink-body)]">
              {t("superAdmin.brands.error")}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="mt-3 text-xs gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>{t("common.retry")}</span>
            </Button>
          </div>
        ) : brands.length === 0 ? (
          /* Empty Search / Empty Catalog State */
          <div className="flex flex-col items-center justify-center py-12 text-center text-[var(--color-muted)]">
            <Search className="h-8 w-8 mb-2 opacity-40 text-[var(--color-muted)]" />
            <p className="text-sm font-semibold text-[var(--color-ink-body)]">
              {t("superAdmin.brands.noResults")}
            </p>
            <p className="text-xs text-[var(--color-muted)] mt-1 max-w-[240px]">
              {t("superAdmin.brands.noResultsHint")}
            </p>
            {search && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSearchChange("")}
                className="mt-3 text-xs"
              >
                {t("superAdmin.brands.clearSearch")}
              </Button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          /* Card Grid View */
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {brands.map((brand) => (
              <BrandCard
                key={brand.id}
                brand={brand}
                isSelected={brand.id === selectedBrandId}
                onSelect={onSelectBrand}
                onEdit={onEditBrand}
                onDelete={onDeleteBrand}
                isArabic={isArabic}
                modelsCount={brand.id === selectedBrandId ? selectedBrandModelCount : undefined}
              />
            ))}
          </div>
        ) : (
          /* Compact List View */
          <div className="flex flex-col gap-2">
            {brands.map((brand) => (
              <BrandRow
                key={brand.id}
                brand={brand}
                isSelected={brand.id === selectedBrandId}
                onSelect={onSelectBrand}
                onEdit={onEditBrand}
                onDelete={onDeleteBrand}
                isArabic={isArabic}
                modelsCount={brand.id === selectedBrandId ? selectedBrandModelCount : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
