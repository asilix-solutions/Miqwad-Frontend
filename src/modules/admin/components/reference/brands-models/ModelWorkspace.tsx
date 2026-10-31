/**
 * @file ModelWorkspace.tsx
 * @description Detail pane: Selected brand identity banner, model search,
 * model CRUD operations, empty states, and compact table layout.
 */
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2, Search, X, ChevronRight, AlertTriangle, Layers, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Can } from "@shared/auth/Can";
import type { Brand, VehicleModel } from "@modules/vehicles/types";
import { getModelDisplayName, matchesModelSearch } from "@modules/vehicles/lib/modelLocalization";
import { getBrandEnglishName } from "@modules/vehicles/lib/brandLocalization";
import { BrandLogoEmblem } from "./BrandLogoEmblem";

interface Props {
  selectedBrand: Brand | null;
  models: VehicleModel[];
  isLoading: boolean;
  isError: boolean;
  isTruncated?: boolean;
  onRetry: () => void;
  onBackToBrands: () => void;
  onAddModel: () => void;
  onEditModel: (model: VehicleModel) => void;
  onDeleteModel: (model: VehicleModel) => void;
  search: string;
  onSearchChange: (value: string) => void;
}

export function ModelWorkspace({
  selectedBrand,
  models,
  isLoading,
  isError,
  isTruncated,
  onRetry,
  onBackToBrands,
  onAddModel,
  onEditModel,
  onDeleteModel,
  search,
  onSearchChange,
}: Props) {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language.startsWith("ar");

  // ─── 1. If No Brand is Selected (Desktop Placeholder) ───
  if (!selectedBrand) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[420px] p-8 rounded-xl border border-dashed border-[var(--color-divider)] bg-[var(--color-surface-1)]/60 text-center select-none">
        <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-white border border-[var(--color-divider)] shadow-xs mb-4 text-[var(--color-brand-orange)]">
          <Layers className="h-8 w-8" />
        </div>
        <h3 className="text-base font-bold text-[var(--color-ink-body)]">
          {t("superAdmin.brands.selectBrandPrompt")}
        </h3>
        <p className="text-xs text-[var(--color-muted)] max-w-sm mt-1.5 leading-relaxed">
          {t("superAdmin.brands.selectBrandHint")}
        </p>
      </div>
    );
  }

  const brandEnglishName = getBrandEnglishName(selectedBrand.id, selectedBrand.name);
  const filteredModels = models.filter((m) => matchesModelSearch(search, m));

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-[var(--color-divider)] shadow-2xs overflow-hidden">
      {/* ─── 2. Selected Brand Header ─── */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--color-divider)] gap-3 bg-[var(--color-surface-1)]/60">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Drilldown Back Button (visible on < lg) */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onBackToBrands}
            className="lg:hidden h-8 w-8 -ms-1 text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-2)] shrink-0"
            title={t("superAdmin.brands.backToBrands")}
            aria-label={t("superAdmin.brands.backToBrands")}
          >
            <ChevronRight className="h-5 w-5 rtl:hidden" />
            <ChevronRight className="h-5 w-5 ltr:hidden rotate-180" />
          </Button>

          {/* Brand Logo & Name */}
          <BrandLogoEmblem image={selectedBrand.image} name={selectedBrand.name} size="sm" />

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[var(--color-ink-body)] truncate">
                {selectedBrand.name}
              </h2>
              {brandEnglishName && brandEnglishName.toLowerCase() !== selectedBrand.name.toLowerCase() && (
                <span className="text-xs text-[var(--color-muted)] font-mono hidden sm:inline">
                  ({brandEnglishName})
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--color-muted)] truncate">
              {t("superAdmin.models.modelsOf", { brandName: selectedBrand.name })}
            </p>
          </div>
        </div>

        {/* Add Model Button */}
        <Can permission="models.create">
          <Button
            type="button"
            onClick={onAddModel}
            size="sm"
            className="bg-[var(--color-brand-orange)] hover:bg-[var(--color-brand-orange)]/90 text-white font-medium shadow-2xs shrink-0"
          >
            <Plus className="me-1.5 h-4 w-4" />
            <span>{t("superAdmin.models.add")}</span>
          </Button>
        </Can>
      </div>

      {/* ─── 3. Model Search Bar ─── */}
      <div className="p-4 border-b border-[var(--color-divider)] bg-white flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-muted)]" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t("superAdmin.models.searchPlaceholder", { brandName: selectedBrand.name })}
            className="ps-9 pe-9 h-9 text-sm bg-[var(--color-surface-1)] border-[var(--color-divider)] focus-visible:bg-white"
            aria-label={t("superAdmin.models.searchPlaceholder", { brandName: selectedBrand.name })}
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute end-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--color-muted)] hover:text-[var(--color-ink-body)] rounded-full focus-visible:outline-none"
              title={t("superAdmin.models.clearSearch")}
              aria-label={t("superAdmin.models.clearSearch")}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Count Badge */}
        {!isLoading && !isError && (
          <Badge
            variant="outline"
            className="bg-[var(--color-surface-2)] text-[var(--color-ink-secondary)] border-[var(--color-divider)] text-xs font-semibold px-2.5 py-1 rounded-lg shrink-0"
          >
            {t("superAdmin.models.countLabel", { count: filteredModels.length })}
          </Badge>
        )}
      </div>

      {/* ─── 4. Truncation Warning (Explicit non-silent safety notice) ─── */}
      {isTruncated && (
        <div className="flex items-center gap-2 px-4 py-2 bg-warning-50 border-b border-warning-200 text-warning-800 text-xs">
          <AlertTriangle className="h-4 w-4 shrink-0 text-warning-600" />
          <span>{t("superAdmin.brands.safetyLimitWarning")}</span>
        </div>
      )}

      {/* ─── 5. Models Table Content ─── */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {isLoading ? (
          /* Skeletons */
          <div className="p-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-[var(--color-divider)]">
                <Skeleton className="h-4 w-1/3 rounded" />
                <div className="flex gap-2">
                  <Skeleton className="h-7 w-7 rounded" />
                  <Skeleton className="h-7 w-7 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          /* Error */
          <div className="flex flex-col items-center justify-center py-12 text-center text-[var(--color-muted)]">
            <AlertTriangle className="h-8 w-8 text-danger-500 mb-2" />
            <p className="text-sm font-medium text-[var(--color-ink-body)]">
              {t("superAdmin.models.error")}
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
        ) : models.length === 0 ? (
          /* Empty Catalog: Brand has 0 models */
          <div className="flex flex-col items-center justify-center py-14 px-4 text-center text-[var(--color-muted)]">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-[var(--color-surface-2)] mb-3 text-[var(--color-muted)]">
              <Layers className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-[var(--color-ink-body)]">
              {t("superAdmin.models.empty")}
            </p>
            <p className="text-xs text-[var(--color-muted)] mt-1 max-w-xs leading-relaxed">
              {t("superAdmin.models.emptyHint")}
            </p>
            <Can permission="models.create">
              <Button
                type="button"
                onClick={onAddModel}
                size="sm"
                className="mt-4 bg-[var(--color-brand-orange)] hover:bg-[var(--color-brand-orange)]/90 text-white font-medium"
              >
                <Plus className="me-1.5 h-4 w-4" />
                <span>{t("superAdmin.models.addFirst")}</span>
              </Button>
            </Can>
          </div>
        ) : filteredModels.length === 0 ? (
          /* Empty Search Filter */
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-[var(--color-muted)]">
            <Search className="h-8 w-8 mb-2 opacity-40 text-[var(--color-muted)]" />
            <p className="text-sm font-semibold text-[var(--color-ink-body)]">
              {t("superAdmin.models.noResults")}
            </p>
            <p className="text-xs text-[var(--color-muted)] mt-1">
              {t("superAdmin.models.noResultsHint")}
            </p>
            {search && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSearchChange("")}
                className="mt-3 text-xs"
              >
                {t("superAdmin.models.clearSearch")}
              </Button>
            )}
          </div>
        ) : (
          /* Models Table */
          <div className="divide-y divide-[var(--color-divider)]">
            {filteredModels.map((model) => {
              const displayName = getModelDisplayName(model, i18n.language);
              const showCanonical = isArabic && model.name && displayName !== model.name;

              return (
                <div
                  key={model.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-[var(--color-surface-1)] transition-colors group"
                >
                  <div className="flex flex-col min-w-0 pe-3">
                    <span className="text-sm font-semibold text-[var(--color-ink-body)] truncate">
                      {displayName}
                    </span>
                    {showCanonical && (
                      <span className="text-xs text-[var(--color-muted)] font-mono truncate mt-0.5">
                        {model.name}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Can permission="models.edit">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-md text-[var(--color-ink-secondary)] hover:text-[var(--color-ink-body)] hover:bg-[var(--color-surface-2)]"
                        title={t("superAdmin.models.edit")}
                        aria-label={`${t("superAdmin.models.edit")}: ${displayName}`}
                        onClick={() => onEditModel(model)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </Can>
                    <Can permission="models.delete">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-md text-[var(--color-danger-500)] hover:text-[var(--color-danger-600)] hover:bg-danger-50"
                        title={t("superAdmin.models.delete")}
                        aria-label={`${t("superAdmin.models.delete")}: ${displayName}`}
                        onClick={() => onDeleteModel(model)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </Can>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
