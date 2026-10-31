/**
 * @file BrandsModelsPanel.tsx
 * @description Adaptive master-detail administrative workspace for vehicle Brands & Models.
 * Provides responsive Master-Detail (Desktop) and Drilldown (Mobile/Tablet) layouts,
 * Grid/List brand browsing with localStorage preference persistence, bilingual search,
 * curated popular brand filtering, and complete model administration.
 */
import { useState, useMemo, useCallback } from "react";
import { useAdminBrandsQuery, useModelsForBrandQuery } from "../../hooks/useAdminQueries";
import type { Brand, VehicleModel } from "@modules/vehicles/types";
import { matchesBrandSearch } from "@modules/vehicles/lib/brandLocalization";
import { isCatalogTruncated } from "@modules/vehicles/api/brandsApi";
import { BrandFormDialog } from "./BrandFormDialog";
import { ModelFormDialog } from "./ModelFormDialog";
import { DeleteBrandDialog } from "./DeleteBrandDialog";
import { DeleteModelDialog } from "./DeleteModelDialog";
import { BrandBrowser } from "./brands-models/BrandBrowser";
import { ModelWorkspace } from "./brands-models/ModelWorkspace";
import type { ViewMode, BrandFilter } from "./brands-models/types";
import { POPULAR_BRAND_IDS } from "./brands-models/types";

const VIEW_MODE_STORAGE_KEY = "miqwad:admin:brands:view-mode";

function getInitialViewMode(): ViewMode {
  try {
    const saved = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    if (saved === "grid" || saved === "list") return saved;
  } catch {
    // Graceful fallback when localStorage is unavailable
  }
  return "grid";
}

function persistViewMode(mode: ViewMode): void {
  try {
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
  } catch {
    // Ignore storage quota / privacy mode exceptions
  }
}

export function BrandsModelsPanel() {
  // ─── 1. View & Filter Preferences ──────────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>(getInitialViewMode);
  const [brandFilter, setBrandFilter] = useState<BrandFilter>("all");

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    persistViewMode(mode);
  }, []);

  // ─── 2. Search States ──────────────────────────────────────────────────────
  const [brandSearch, setBrandSearch] = useState("");
  const [modelSearch, setModelSearch] = useState("");

  // ─── 3. Master Query & ID-based Selection ──────────────────────────────────
  const brandsQuery = useAdminBrandsQuery();
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);

  // Derived selected brand: stays synchronized with fresh query data (handles renames/deletions)
  const selectedBrand = useMemo(() => {
    if (selectedBrandId == null) return null;
    return brandsQuery.data?.find((b) => b.id === selectedBrandId) ?? null;
  }, [brandsQuery.data, selectedBrandId]);

  const effectiveBrandId = selectedBrand?.id ?? null;

  // Filtered and searched brands collection
  const filteredBrands = useMemo(() => {
    const catalog = brandsQuery.data ?? [];
    return catalog.filter((brand) => {
      // 1. Popularity filter
      if (brandFilter === "popular" && !POPULAR_BRAND_IDS.has(brand.id)) {
        return false;
      }
      // 2. Resilient bilingual search (Arabic + English + aliases + normalized)
      return matchesBrandSearch(brandSearch, brand);
    });
  }, [brandsQuery.data, brandFilter, brandSearch]);

  // ─── 4. Detail Query (Models for selected brand) ───────────────────────────
  const modelsQuery = useModelsForBrandQuery(effectiveBrandId);

  // ─── 5. Dialog States ──────────────────────────────────────────────────────
  // Brand Create/Edit Dialog
  const [brandFormOpen, setBrandFormOpen] = useState(false);
  const [brandFormMode, setBrandFormMode] = useState<"create" | "edit">("create");
  const [brandToEdit, setBrandToEdit] = useState<Brand | undefined>();

  // Brand Delete Dialog
  const [deleteBrandOpen, setDeleteBrandOpen] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null);

  // Model Create/Edit Dialog
  const [modelFormOpen, setModelFormOpen] = useState(false);
  const [modelFormMode, setModelFormMode] = useState<"create" | "edit">("create");
  const [modelToEdit, setModelToEdit] = useState<VehicleModel | undefined>();

  // Model Delete Dialog
  const [deleteModelOpen, setDeleteModelOpen] = useState(false);
  const [modelToDelete, setModelToDelete] = useState<VehicleModel | null>(null);

  // ─── 6. Action Handlers ────────────────────────────────────────────────────
  const openCreateBrand = () => {
    setBrandFormMode("create");
    setBrandToEdit(undefined);
    setBrandFormOpen(true);
  };

  const openEditBrand = (brand: Brand) => {
    setBrandFormMode("edit");
    setBrandToEdit(brand);
    setBrandFormOpen(true);
  };

  const openDeleteBrand = (brand: Brand) => {
    setBrandToDelete(brand);
    setDeleteBrandOpen(true);
  };

  const handleSelectBrand = (brand: Brand) => {
    setSelectedBrandId(brand.id);
    setModelSearch("");
  };

  const handleBackToBrands = () => {
    setSelectedBrandId(null);
    setModelSearch("");
  };

  const openCreateModel = () => {
    setModelFormMode("create");
    setModelToEdit(undefined);
    setModelFormOpen(true);
  };

  const openEditModel = (model: VehicleModel) => {
    setModelFormMode("edit");
    setModelToEdit(model);
    setModelFormOpen(true);
  };

  const openDeleteModel = (model: VehicleModel) => {
    setModelToDelete(model);
    setDeleteModelOpen(true);
  };

  // ─── 7. Responsive Layout ──────────────────────────────────────────────────
  return (
    <>
      <div className="h-[750px] max-h-[calc(100vh-13rem)] min-h-[520px] flex flex-col lg:flex-row gap-5 min-h-0">
        {/* ─── Master Pane: Brand Browser ─── */}
        <div
          className={[
            "flex-1 min-w-0 h-full",
            // On mobile/tablet (< lg), hide Master when a brand is selected (drilldown level 2)
            effectiveBrandId != null ? "hidden lg:block" : "block",
          ].join(" ")}
        >
          <BrandBrowser
            brands={filteredBrands}
            totalCatalogCount={brandsQuery.data?.length}
            isLoading={brandsQuery.isLoading}
            isError={brandsQuery.isError}
            isTruncated={isCatalogTruncated(brandsQuery.data)}
            onRetry={() => void brandsQuery.refetch()}
            selectedBrandId={effectiveBrandId}
            onSelectBrand={handleSelectBrand}
            onAddBrand={openCreateBrand}
            onEditBrand={openEditBrand}
            onDeleteBrand={openDeleteBrand}
            search={brandSearch}
            onSearchChange={setBrandSearch}
            activeFilter={brandFilter}
            onFilterChange={setBrandFilter}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            selectedBrandModelCount={modelsQuery.data?.length}
          />
        </div>

        {/* ─── Detail Pane: Model Workspace ─── */}
        <div
          className={[
            "flex-1 min-w-0 h-full",
            // On mobile/tablet (< lg), hide Detail when no brand is selected (drilldown level 1)
            effectiveBrandId == null ? "hidden lg:block" : "block",
          ].join(" ")}
        >
          <ModelWorkspace
            selectedBrand={selectedBrand}
            models={modelsQuery.data ?? []}
            isLoading={modelsQuery.isLoading}
            isError={modelsQuery.isError}
            isTruncated={isCatalogTruncated(modelsQuery.data)}
            onRetry={() => void modelsQuery.refetch()}
            onBackToBrands={handleBackToBrands}
            onAddModel={openCreateModel}
            onEditModel={openEditModel}
            onDeleteModel={openDeleteModel}
            search={modelSearch}
            onSearchChange={setModelSearch}
          />
        </div>
      </div>

      {/* ─── Dialogs (Preserved Contracts) ─── */}
      {brandFormOpen && (
        <BrandFormDialog
          mode={brandFormMode}
          brand={brandToEdit}
          open={brandFormOpen}
          onOpenChange={setBrandFormOpen}
        />
      )}

      {deleteBrandOpen && (
        <DeleteBrandDialog
          brand={brandToDelete}
          open={deleteBrandOpen}
          onOpenChange={setDeleteBrandOpen}
          onDeleted={(deletedId) => {
            if (deletedId === selectedBrandId) {
              setSelectedBrandId(null);
              setModelSearch("");
            }
          }}
        />
      )}

      {modelFormOpen && effectiveBrandId != null && (
        <ModelFormDialog
          mode={modelFormMode}
          brandId={effectiveBrandId}
          model={modelToEdit}
          open={modelFormOpen}
          onOpenChange={setModelFormOpen}
        />
      )}

      {deleteModelOpen && effectiveBrandId != null && (
        <DeleteModelDialog
          brandId={effectiveBrandId}
          model={modelToDelete}
          open={deleteModelOpen}
          onOpenChange={setDeleteModelOpen}
        />
      )}
    </>
  );
}
