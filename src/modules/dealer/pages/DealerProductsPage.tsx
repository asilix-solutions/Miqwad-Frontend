/**
 * @file DealerProductsPage.tsx
 *
 * Dealer products — card grid (default) / row-list toggle view.
 * A "product" is a priced service offering (`/api/provider-services`),
 * caller-scoped by the backend — no server-side filters, so search is a
 * client-side filter over the already-fetched list.
 */

import { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { LayoutGrid, List, Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProviderPageHeader, ProviderSearchBar } from "@shared/provider-ui";
import { useDealerProductsQuery } from "../hooks/useDealerQueries";
import type { Product } from "../types";
import { ProductFormDialog } from "../components/ProductFormDialog";
import { DeleteProductDialog } from "../components/DeleteProductDialog";
import { ProductGrid } from "../components/ProductGrid";
import { ProductListView } from "../components/ProductListView";
import { ProductDetailDialog } from "../components/ProductDetailDialog";

// ── Component ─────────────────────────────────────────────────────────────────

export function DealerProductsPage() {
  const { t } = useTranslation();

  // ── Filter state ──────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(handler);
  }, [search]);

  // ── View mode — FUTURE: persist to localStorage ───────────────────────────
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // ── Server state ──────────────────────────────────────────────────────────
  const q = useDealerProductsQuery();

  const filteredProducts = useMemo(() => {
    const items = q.data?.items ?? [];
    const query = debouncedSearch.trim().toLowerCase();
    if (!query) return items;
    return items.filter((p) => p.serviceName.toLowerCase().includes(query));
  }, [q.data, debouncedSearch]);

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

  // Detail dialog actions: close detail first, then open the respective dialog.
  const handleDetailEdit = (product: Product) => {
    setDetailOpen(false);
    openEdit(product);
  };

  const handleDetailDelete = (product: Product) => {
    setDetailOpen(false);
    openDelete(product);
  };

  // ── Shared props for grid and list ────────────────────────────────────────
  const sharedViewProps = {
    products: filteredProducts,
    isLoading: q.isLoading,
    isError: q.isError,
    onRetry: () => { void q.refetch(); },
    onEdit: openEdit,
    onDelete: openDelete,
    onCardClick: openDetail,
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

      {/* Search ──────────────────────────────────────────────────────────── */}
      <div className="provider-fade-up" style={{ animationDelay: "40ms" }}>
        <ProviderSearchBar
          value={search}
          onChange={setSearch}
          onClear={() => setSearch("")}
          placeholder={t("dealer.products.search")}
          className="sm:max-w-xs"
        />
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
          onEdit={handleDetailEdit}
          onDelete={handleDetailDelete}
        />
      )}
    </div>
  );
}
