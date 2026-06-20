/**
 * @file DealerProductsPage.tsx
 *
 * Dealer products list — provider design system re-skin.
 * Data layer (query, mutations, filter state, debounce, dialog wiring) is
 * functionally identical to the previous admin-flavored version.  Only the
 * presentation has changed: ProviderPageHeader, ProviderTabs, ProviderDataView,
 * ProviderStatusPill, and ProviderEmptyState replace the admin primitives.
 */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2, Power, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ProviderPageHeader,
  ProviderTabs,
  ProviderStatusPill,
  ProviderDataView,
  ProviderEmptyState,
  ProviderSearchBar,
  ProviderSelect,
} from "@shared/provider-ui";
import type { ColumnDef } from "@shared/provider-ui";
import { useDealerProductsQuery } from "../hooks/useDealerQueries";
import { useUpdateProductStatusMutation } from "../hooks/useDealerMutations";
import type { Product } from "../types";
import { ProductFormDialog } from "../components/ProductFormDialog";
import { DeleteProductDialog } from "../components/DeleteProductDialog";
import type { StatusPillTone } from "@shared/provider-ui";

// ── Constants ─────────────────────────────────────────────────────────────────

// FUTURE: wire to backend categories endpoint.
const DUMMY_CATEGORIES = [
  { id: "cat_1", labelAr: "زيوت وشحوم", labelEn: "Oils & Lubes" },
  { id: "cat_2", labelAr: "فلاتر", labelEn: "Filters" },
  { id: "cat_3", labelAr: "قطع محرك", labelEn: "Engine Parts" },
];

const STATUS_TONE: Record<string, StatusPillTone> = {
  active:       "success",
  draft:        "neutral",
  out_of_stock: "warning",
  archived:     "neutral",
};

// ── Component ─────────────────────────────────────────────────────────────────

export function DealerProductsPage() {
  const { t, i18n } = useTranslation();

  // ── Filter state (identical behaviour to previous version) ───────────────
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(handler);
  }, [search]);

  // ── Server state ──────────────────────────────────────────────────────────
  const q = useDealerProductsQuery({
    search: debouncedSearch || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    categoryId: categoryFilter !== "all" ? categoryFilter : undefined,
  });

  const updateStatusMutation = useUpdateProductStatusMutation();

  // ── Dialog state ──────────────────────────────────────────────────────────
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

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

  const toggleStatus = (product: Product) => {
    const newStatus = product.status === "active" ? "out_of_stock" : "active";
    void updateStatusMutation.mutateAsync({ id: product.id, status: newStatus });
  };

  // ── Formatters ────────────────────────────────────────────────────────────
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat(i18n.language === "ar" ? "ar-SA" : "en-US", {
      style: "currency",
      currency: "SAR",
    }).format(amount);

  const getCategoryLabel = (id: string) => {
    const cat = DUMMY_CATEGORIES.find((c) => c.id === id);
    if (!cat) return id;
    return i18n.language === "ar" ? cat.labelAr : cat.labelEn;
  };

  const isDimmed = (p: Product) =>
    p.status === "archived" || p.status === "draft";

  // ── Status tabs ───────────────────────────────────────────────────────────
  const statusTabs = [
    { value: "all",          label: t("dealer.products.filterAll") },
    { value: "active",       label: t("dealer.status.product.active") },
    { value: "draft",        label: t("dealer.status.product.draft") },
    { value: "out_of_stock", label: t("dealer.status.product.out_of_stock") },
    { value: "archived",     label: t("dealer.status.product.archived") },
  ];

  // ── Column definitions ────────────────────────────────────────────────────
  const columns: ColumnDef<Product>[] = [
    {
      key: "name",
      header: t("dealer.products.colName"),
      primary: true,
      render: (p) => (
        <div
          className={`flex items-center gap-3 ${isDimmed(p) ? "opacity-60" : ""}`}
        >
          {p.images?.[0] ? (
            <img
              src={p.images[0]}
              alt={p.nameAr}
              className="h-10 w-10 shrink-0 rounded-[var(--radius-sm)] object-cover border border-[var(--color-divider)]"
            />
          ) : (
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-surface-2)] text-[var(--color-muted)]"
              aria-hidden
            >
              <Package className="h-4 w-4" />
            </div>
          )}
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-[var(--color-ink-body)]">
              {i18n.language === "ar" ? p.nameAr : p.nameEn}
            </span>
            <span className="text-xs text-[var(--color-muted)]" dir="ltr">
              {p.sku}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: t("dealer.products.colCategory"),
      hideOnMobile: true,
      render: (p) => (
        <span className={`text-sm ${isDimmed(p) ? "opacity-60" : ""}`}>
          {getCategoryLabel(p.categoryId)}
        </span>
      ),
    },
    {
      key: "price",
      header: t("dealer.products.colPrice"),
      align: "end",
      hideOnMobile: true,
      render: (p) => (
        <span
          className={`tabular-nums text-sm ${isDimmed(p) ? "opacity-60" : ""}`}
        >
          {formatCurrency(p.price)}
        </span>
      ),
    },
    {
      key: "stockQty",
      header: t("dealer.products.colStock"),
      align: "end",
      hideOnMobile: true,
      render: (p) => (
        <span
          className={`tabular-nums text-sm ${
            p.stockQty === 0
              ? "font-medium text-[var(--color-warning-500)]"
              : ""
          } ${isDimmed(p) ? "opacity-60" : ""}`}
        >
          {p.stockQty === 0 ? t("dealer.products.outOfStock") : p.stockQty}
        </span>
      ),
    },
    {
      key: "status",
      header: t("dealer.products.colStatus"),
      render: (p) => (
        <ProviderStatusPill
          label={t(`dealer.status.product.${p.status}`)}
          tone={STATUS_TONE[p.status] ?? "neutral"}
        />
      ),
    },
  ];

  // ── Row actions ───────────────────────────────────────────────────────────
  const rowActions = (p: Product) => (
    <div
      className="flex items-center justify-end gap-0.5"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        title={t("dealer.products.toggleStatusBtn")}
        className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink-body)] disabled:opacity-40"
        onClick={() => toggleStatus(p)}
        disabled={updateStatusMutation.isPending}
      >
        <Power className="h-4 w-4" aria-hidden />
      </button>
      <button
        type="button"
        title={t("common.edit")}
        className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink-body)]"
        onClick={() => openEdit(p)}
      >
        <Pencil className="h-4 w-4" aria-hidden />
      </button>
      <button
        type="button"
        title={t("common.delete")}
        className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-danger-500)] transition-colors hover:bg-[var(--color-danger-50)]"
        onClick={() => openDelete(p)}
      >
        <Trash2 className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );

  // ── Empty state ───────────────────────────────────────────────────────────
  const emptyState = (
    <ProviderEmptyState
      icon={<Package className="h-8 w-8" aria-hidden />}
      title={t("dealer.products.emptyTitle")}
      description={t("dealer.products.emptyDescription")}
      action={
        <Button
          onClick={openCreate}
          className="bg-[var(--color-brand-orange)] text-white hover:bg-[var(--color-brand-orange-hover)]"
        >
          <Plus className="me-2 h-4 w-4" aria-hidden />
          {t("dealer.products.addBtn")}
        </Button>
      }
    />
  );

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
            <Button
              onClick={openCreate}
              className="bg-[var(--color-brand-orange)] text-white hover:bg-[var(--color-brand-orange-hover)]"
            >
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

      {/* Data view ────────────────────────────────────────────────────────── */}
      <div
        className="provider-fade-up"
        style={{ animationDelay: "80ms" }}
      >
        <ProviderDataView<Product>
          columns={columns}
          rows={q.data?.items ?? []}
          getRowKey={(p) => p.id}
          isLoading={q.isLoading}
          isError={q.isError}
          onRetry={() => { void q.refetch(); }}
          emptyState={emptyState}
          rowActions={rowActions}
        />
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
    </div>
  );
}
