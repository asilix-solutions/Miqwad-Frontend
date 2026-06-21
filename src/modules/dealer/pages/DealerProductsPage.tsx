/**
 * @file DealerProductsPage.tsx
 *
 * Dealer products — card grid (default) / row-list toggle view.
 * Data layer (query, mutations, filter state, debounce, dialog wiring) is
 * functionally identical to the previous version. The presentation is now
 * ProductGrid / ProductListView (dealer-specific components) with a view toggle,
 * replacing the shared ProviderDataView table.
 */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { LayoutGrid, List, Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ProviderPageHeader,
  ProviderTabs,
  ProviderSearchBar,
  ProviderSelect,
} from "@shared/provider-ui";
import { useDealerProductsQuery } from "../hooks/useDealerQueries";
import { useUpdateProductStatusMutation } from "../hooks/useDealerMutations";
import type { Product } from "../types";
import { ProductFormDialog } from "../components/ProductFormDialog";
import { DeleteProductDialog } from "../components/DeleteProductDialog";
import { ProductGrid } from "../components/ProductGrid";
import { ProductListView } from "../components/ProductListView";
import { ProductDetailDialog } from "../components/ProductDetailDialog";

// ── Constants ─────────────────────────────────────────────────────────────────

// FUTURE: wire to backend categories endpoint.
const DUMMY_CATEGORIES = [
  { id: "cat_1", labelAr: "زيوت وشحوم", labelEn: "Oils & Lubes" },
  { id: "cat_2", labelAr: "فلاتر", labelEn: "Filters" },
  { id: "cat_3", labelAr: "قطع محرك", labelEn: "Engine Parts" },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function DealerProductsPage() {
  const { t, i18n } = useTranslation();

  // ── Filter state ──────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(handler);
  }, [search]);

  // ── View mode — FUTURE: persist to localStorage ───────────────────────────
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // ── Server state ──────────────────────────────────────────────────────────
  const q = useDealerProductsQuery({
    search: debouncedSearch || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    categoryId: categoryFilter !== "all" ? categoryFilter : undefined,
  });

  const updateStatusMutation = useUpdateProductStatusMutation();

  // ── Dialog state: create/edit form ────────────────────────────────────────
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>();

  // ── Dialog state: delete confirmation ────────────────────────────────────
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // ── Dialog state: product detail ──────────────────────────────────────────
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const openCreate = () => {
    setFormMode("create");
    setSelectedProduct(undefined);
    setFormOpen(true);
  };

  const openEdit = (product: Product) => {
    setFormMode("edit");
    setSelectedProduct(product);
    setFormOpen(true);
  };

  const openDelete = (product: Product) => {
    setProductToDelete(product);
    setDeleteOpen(true);
  };

  const openDetail = (product: Product) => {
    setDetailProduct(product);
    setDetailOpen(true);
  };

  const toggleStatus = (product: Product) => {
    const newStatus = product.status === "active" ? "out_of_stock" : "active";
    void updateStatusMutation.mutateAsync({ id: product.id, status: newStatus });
  };

  // Detail dialog actions: close detail first, then open the respective dialog.
  const handleDetailEdit = (product: Product) => {
    setDetailOpen(false);
    openEdit(product);
  };

  const handleDetailDelete = (product: Product) => {
    setDetailOpen(false);
    openDelete(product);
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getCategoryLabel = (id: string) => {
    const cat = DUMMY_CATEGORIES.find((c) => c.id === id);
    if (!cat) return id;
    return i18n.language === "ar" ? cat.labelAr : cat.labelEn;
  };

  // ── Status tabs ───────────────────────────────────────────────────────────
  const statusTabs = [
    { value: "all",          label: t("dealer.products.filterAll") },
    { value: "active",       label: t("dealer.status.product.active") },
    { value: "draft",        label: t("dealer.status.product.draft") },
    { value: "out_of_stock", label: t("dealer.status.product.out_of_stock") },
    { value: "archived",     label: t("dealer.status.product.archived") },
  ];

  // ── Shared props for grid and list ────────────────────────────────────────
  const sharedViewProps = {
    products: q.data?.items ?? [],
    isLoading: q.isLoading,
    isError: q.isError,
    onRetry: () => { void q.refetch(); },
    getCategoryLabel,
    onEdit: openEdit,
    onToggleStatus: toggleStatus,
    onDelete: openDelete,
    onCardClick: openDetail,
    isTogglePending: updateStatusMutation.isPending,
    onAddProduct: openCreate,
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page header ──────────────────────────────────────────────────────── */}
      <div className="provider-fade-up">
        <ProviderPageHeader
          icon={<Package className="h-5 w-5" aria-hidden />}
          title={t("dealer.products.title")}
          subtitle={t("dealer.products.subtitle")}
          actions={
            <Button onClick={openCreate}>
              <Plus className="me-2 h-4 w-4" aria-hidden />
              {t("dealer.products.addBtn")}
            </Button>
          }
        />
      </div>

      {/* Filters ──────────────────────────────────────────────────────────── */}
      <div
        className="provider-fade-up flex flex-col gap-3"
        style={{ animationDelay: "40ms" }}
      >
        {/* Status pill tabs */}
        <ProviderTabs
          tabs={statusTabs}
          value={statusFilter}
          onChange={setStatusFilter}
        />

        {/* Search + category */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <ProviderSearchBar
            value={search}
            onChange={setSearch}
            onClear={() => setSearch("")}
            placeholder={t("dealer.products.search")}
            className="flex-1 sm:max-w-xs"
          />
          <div className="w-full sm:w-[200px]">
            <ProviderSelect
              value={categoryFilter}
              onValueChange={setCategoryFilter}
              options={[
                { value: "all", label: t("dealer.products.filterAll") },
                ...DUMMY_CATEGORIES.map((c) => ({
                  value: c.id,
                  label: i18n.language === "ar" ? c.labelAr : c.labelEn,
                })),
              ]}
              placeholder={t("dealer.products.filterCategory")}
            />
          </div>
        </div>
      </div>

      {/* View toggle + data ────────────────────────────────────────────────── */}
      <div
        className="provider-fade-up space-y-4"
        style={{ animationDelay: "80ms" }}
      >
        {/* Toggle buttons — inline-end */}
        <div className="flex justify-end gap-1">
          <button
            type="button"
            title={t("dealer.products.view.grid")}
            onClick={() => setViewMode("grid")}
            className={[
              "inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)]",
              "transition-colors duration-[var(--dur-fast)]",
              viewMode === "grid"
                ? "bg-[var(--color-brand-orange)] text-white"
                : "text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink-body)]",
            ].join(" ")}
          >
            <LayoutGrid className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            title={t("dealer.products.view.list")}
            onClick={() => setViewMode("list")}
            className={[
              "inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)]",
              "transition-colors duration-[var(--dur-fast)]",
              viewMode === "list"
                ? "bg-[var(--color-brand-orange)] text-white"
                : "text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink-body)]",
            ].join(" ")}
          >
            <List className="h-4 w-4" aria-hidden />
          </button>
        </div>

        {/* Product data */}
        {viewMode === "grid" ? (
          <ProductGrid {...sharedViewProps} />
        ) : (
          <ProductListView {...sharedViewProps} />
        )}
      </div>

      {/* Deferred-mount dialogs ───────────────────────────────────────────── */}
      {formOpen && (
        <ProductFormDialog
          mode={formMode}
          product={selectedProduct}
          open={formOpen}
          onOpenChange={setFormOpen}
          categories={DUMMY_CATEGORIES}
        />
      )}

      {deleteOpen && (
        <DeleteProductDialog
          product={productToDelete}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
        />
      )}

      {detailOpen && detailProduct && (
        <ProductDetailDialog
          product={detailProduct}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          categoryLabel={getCategoryLabel(detailProduct.categoryId)}
          onEdit={handleDetailEdit}
          onToggleStatus={toggleStatus}
          onDelete={handleDetailDelete}
          isTogglePending={updateStatusMutation.isPending}
        />
      )}
    </div>
  );
}
