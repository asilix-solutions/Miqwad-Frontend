/**
 * @file BrandsModelsPanel.tsx
 * @description Master-detail admin panel for the real-backend `/api/Brands`
 * resource: brands (master, single name + optional image) on the left,
 * the selected brand's models (detail, single name) on the right.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2, ListTree, ChevronRight, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "../shared/DataTable";
import { useAdminBrandsQuery, useModelsForBrandQuery } from "../../hooks/useAdminQueries";
import type { Brand, VehicleModel } from "@modules/vehicles/types";
import { BrandFormDialog } from "./BrandFormDialog";
import { ModelFormDialog } from "./ModelFormDialog";
import { DeleteBrandDialog } from "./DeleteBrandDialog";
import { DeleteModelDialog } from "./DeleteModelDialog";
import { Can } from "@shared/auth/Can";

export function BrandsModelsPanel() {
  const { t } = useTranslation();

  // ─── Master State (Brands) ───────────────────────────────────────────────────
  const brandsQuery = useAdminBrandsQuery();
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);

  const [brandFormOpen, setBrandFormOpen] = useState(false);
  const [brandFormMode, setBrandFormMode] = useState<"create" | "edit">("create");
  const [brandToEdit, setBrandToEdit] = useState<Brand | undefined>();

  const [deleteBrandOpen, setDeleteBrandOpen] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null);

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

  // ─── Detail State (Models) ───────────────────────────────────────────────────
  const modelsQuery = useModelsForBrandQuery(selectedBrand?.id ?? null);

  const [modelFormOpen, setModelFormOpen] = useState(false);
  const [modelFormMode, setModelFormMode] = useState<"create" | "edit">("create");
  const [modelToEdit, setModelToEdit] = useState<VehicleModel | undefined>();

  const [deleteModelOpen, setDeleteModelOpen] = useState(false);
  const [modelToDelete, setModelToDelete] = useState<VehicleModel | null>(null);

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

  // ─── Layout ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* ─── Master Panel (Brands) ─── */}
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--color-ink-body)]">
            {t("superAdmin.brands.title")}
          </h2>
          <Can permission="brands.create">
            <Button
              onClick={openCreateBrand}
              className="bg-[var(--color-brand-orange)] hover:bg-[var(--color-brand-orange)]/90"
            >
              <Plus className="me-2 h-4 w-4" />
              {t("superAdmin.brands.add")}
            </Button>
          </Can>
        </div>

        <div className="rounded-md border border-[var(--color-divider)] bg-white shadow-sm">
          <DataTable<Brand>
            rows={brandsQuery.data ?? []}
            isLoading={brandsQuery.isLoading}
            isError={brandsQuery.isError}
            emptyText={t("superAdmin.brands.empty")}
            errorText={t("superAdmin.brands.error")}
            getRowKey={(brand) => brand.id.toString()}
            columns={[
              {
                key: "name",
                header: t("superAdmin.brands.columns.name"),
                render: (brand: Brand) =>
                  brand.image ? (
                    <div className="flex items-center gap-2">
                      <img
                        src={brand.image}
                        alt=""
                        className="h-8 w-8 rounded-[var(--radius-xs)] object-cover border border-[var(--color-divider)]"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      <span>{brand.name}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-xs)] bg-[var(--color-surface-2)]">
                        <ImageOff className="h-4 w-4 text-[var(--color-muted)]" />
                      </div>
                      <span>{brand.name}</span>
                    </div>
                  ),
              },
              {
                key: "actions",
                header: t("superAdmin.brands.columns.actions"),
                className: "text-end",
                render: (brand: Brand) => {
                  const isSelected = selectedBrand?.id === brand.id;
                  return (
                    <div
                      className="flex justify-end gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant={isSelected ? "secondary" : "ghost"}
                        size="icon"
                        className={[
                          "h-8 w-8 rounded-[var(--radius-md)]",
                          isSelected
                            ? "bg-[var(--color-surface-3)] text-[var(--color-brand-orange)]"
                            : "text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-2)]"
                        ].join(" ")}
                        title={t("superAdmin.brands.manageModels")}
                        onClick={() => setSelectedBrand(brand)}
                      >
                        <ListTree className="h-4 w-4" />
                      </Button>
                      <Can permission="brands.edit">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-2)] rounded-[var(--radius-md)]"
                          onClick={() => openEditBrand(brand)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Can>
                      <Can permission="brands.delete">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[var(--color-danger-500)] hover:bg-[var(--color-surface-2)] rounded-[var(--radius-md)]"
                          onClick={() => openDeleteBrand(brand)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </Can>
                    </div>
                  );
                },
              },
            ]}
          />
        </div>
      </div>

      {/* ─── Detail Panel (Models) ─── */}
      <div className="flex-1 space-y-6">
        {!selectedBrand ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] border border-dashed border-[var(--color-divider)] rounded-md bg-[var(--color-surface-1)] text-[var(--color-muted)] p-6 text-center">
            <ListTree className="h-12 w-12 mb-4 text-[var(--color-surface-4)]" />
            <p>{t("superAdmin.brands.manageModels")} </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedBrand(null)}
                  className="h-8 w-8 -ms-2"
                >
                  <ChevronRight className="h-5 w-5 rtl:hidden" />
                  <ChevronRight className="h-5 w-5 ltr:hidden rotate-180" />
                </Button>
                <h2 className="text-lg font-bold text-[var(--color-ink-body)]">
                  {t("superAdmin.models.modelsOf", { brandName: selectedBrand.name })}
                </h2>
              </div>
              <Can permission="models.create">
                <Button
                  onClick={openCreateModel}
                  className="bg-[var(--color-brand-orange)] hover:bg-[var(--color-brand-orange)]/90"
                >
                  <Plus className="me-2 h-4 w-4" />
                  {t("superAdmin.models.add")}
                </Button>
              </Can>
            </div>

            <div className="rounded-md border border-[var(--color-divider)] bg-white shadow-sm">
              <DataTable<VehicleModel>
                rows={modelsQuery.data ?? []}
                isLoading={modelsQuery.isLoading}
                isError={modelsQuery.isError}
                emptyText={t("superAdmin.models.empty")}
                errorText={t("superAdmin.models.error")}
                getRowKey={(model) => model.id.toString()}
                columns={[
                  {
                    key: "name",
                    header: t("superAdmin.models.columns.name"),
                    render: (model: VehicleModel) => model.name,
                  },
                  {
                    key: "actions",
                    header: t("superAdmin.models.columns.actions"),
                    className: "text-end",
                    render: (model: VehicleModel) => (
                      <div
                        className="flex justify-end gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Can permission="models.edit">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-2)] rounded-[var(--radius-md)]"
                            onClick={() => openEditModel(model)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Can>
                        <Can permission="models.delete">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-[var(--color-danger-500)] hover:bg-[var(--color-surface-2)] rounded-[var(--radius-md)]"
                            onClick={() => openDeleteModel(model)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </Can>
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          </>
        )}
      </div>

      {/* ─── Dialogs ─── */}
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
        />
      )}

      {modelFormOpen && selectedBrand && (
        <ModelFormDialog
          mode={modelFormMode}
          brandId={selectedBrand.id}
          model={modelToEdit}
          open={modelFormOpen}
          onOpenChange={setModelFormOpen}
        />
      )}

      {deleteModelOpen && selectedBrand && (
        <DeleteModelDialog
          brandId={selectedBrand.id}
          model={modelToDelete}
          open={deleteModelOpen}
          onOpenChange={setDeleteModelOpen}
        />
      )}
    </div>
  );
}
