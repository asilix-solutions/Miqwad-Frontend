import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@shared/components/DataTable";
import { StatusBadge } from "@shared/components/StatusBadge";
import { useDealerProductsQuery } from "../hooks/useDealerQueries";
import { useUpdateProductStatusMutation } from "../hooks/useDealerMutations";
import type { Product } from "../types";
import { ProductFormDialog } from "../components/ProductFormDialog";
import { DeleteProductDialog } from "../components/DeleteProductDialog";
import { useEffect } from "react";

// FUTURE: wire to backend categories. Using a small enum for now.
const DUMMY_CATEGORIES = [
  { id: "cat_1", labelAr: "زيوت وشحوم", labelEn: "Oils & Lubes" },
  { id: "cat_2", labelAr: "فلاتر", labelEn: "Filters" },
  { id: "cat_3", labelAr: "قطع محرك", labelEn: "Engine Parts" },
];

export function DealerProductsPage() {
  const { t, i18n } = useTranslation();
  
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const q = useDealerProductsQuery({
    search: debouncedSearch || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    categoryId: categoryFilter !== "all" ? categoryFilter : undefined,
  });

  const updateStatusMutation = useUpdateProductStatusMutation();

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

  const toggleStatus = async (product: Product) => {
    const newStatus = product.status === "active" ? "out_of_stock" : "active";
    await updateStatusMutation.mutateAsync({ id: product.id, status: newStatus });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(i18n.language === "ar" ? "ar-SA" : "en-US", {
      style: "currency",
      currency: "SAR",
    }).format(amount);
  };

  const getCategoryLabel = (id: string) => {
    const cat = DUMMY_CATEGORIES.find((c) => c.id === id);
    if (!cat) return id;
    return i18n.language === "ar" ? cat.labelAr : cat.labelEn;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-ink-900)]">
            {t("dealer.products.title")}
          </h1>
          <p className="text-sm text-[var(--color-ink-secondary)]">
            {t("dealer.products.subtitle")}
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-[var(--color-brand-orange)] hover:bg-[var(--color-brand-orange)]/90"
        >
          <Plus className="me-2 h-4 w-4" />
          {t("dealer.products.addBtn")}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder={t("dealer.products.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("dealer.products.filterStatus")} />
          </SelectTrigger>
          <SelectContent dir={i18n.dir()}>
            <SelectItem value="all">{t("dealer.products.filterAll")}</SelectItem>
            <SelectItem value="active">{t("dealer.status.product.active")}</SelectItem>
            <SelectItem value="draft">{t("dealer.status.product.draft")}</SelectItem>
            <SelectItem value="out_of_stock">{t("dealer.status.product.out_of_stock")}</SelectItem>
            <SelectItem value="archived">{t("dealer.status.product.archived")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("dealer.products.filterCategory")} />
          </SelectTrigger>
          <SelectContent dir={i18n.dir()}>
            <SelectItem value="all">{t("dealer.products.filterAll")}</SelectItem>
            {DUMMY_CATEGORIES.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {i18n.language === "ar" ? c.labelAr : c.labelEn}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border border-[var(--color-divider)] bg-white shadow-sm">
        <DataTable<Product>
          rows={q.data?.items ?? []}
          isLoading={q.isLoading}
          isError={q.isError}
          getRowKey={(p) => p.id}
          columns={[
            {
              key: "name",
              header: t("dealer.products.colName"),
              render: (p) => (
                <div className={`flex items-center gap-3 ${p.status === "archived" || p.status === "draft" ? "opacity-60 grayscale-[0.5]" : ""}`}>
                  {p.images?.[0] ? (
                    <img
                      src={p.images[0]}
                      alt={p.nameAr}
                      className="h-10 w-10 rounded object-cover border border-[var(--color-divider)]"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded bg-[var(--color-surface-2)] flex items-center justify-center text-xs text-[var(--color-muted)]">
                      N/A
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="font-medium text-[var(--color-ink-900)]">
                      {i18n.language === "ar" ? p.nameAr : p.nameEn}
                    </span>
                    <span className="text-xs text-[var(--color-ink-secondary)]" dir="ltr">
                      {p.sku}
                    </span>
                  </div>
                </div>
              ),
            },
            {
              key: "category",
              header: t("dealer.products.colCategory"),
              render: (p) => <span className={p.status === "archived" || p.status === "draft" ? "opacity-60" : ""}>{getCategoryLabel(p.categoryId)}</span>,
            },
            {
              key: "price",
              header: t("dealer.products.colPrice"),
              render: (p) => <span className={`tabular-nums ${p.status === "archived" || p.status === "draft" ? "opacity-60" : ""}`}>{formatCurrency(p.price)}</span>,
            },
            {
              key: "stockQty",
              header: t("dealer.products.colStock"),
              render: (p) => (
                <span className={`${p.stockQty === 0 ? "text-danger-500 font-medium" : ""} ${p.status === "archived" || p.status === "draft" ? "opacity-60" : ""}`}>
                  {p.stockQty} {p.stockQty === 0 && `(${t("dealer.products.outOfStock")})`}
                </span>
              ),
            },
            {
              key: "status",
              header: t("dealer.products.colStatus"),
              render: (p) => <StatusBadge status={p.status} kind="productStatus" />,
            },
            {
              key: "actions",
              header: t("common.actions"),
              className: "text-end",
              render: (p) => (
                <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    title={t("dealer.products.toggleStatusBtn", { defaultValue: "Toggle" })}
                    className="h-8 w-8 text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-2)] rounded-[var(--radius-md)]"
                    onClick={() => toggleStatus(p)}
                    disabled={updateStatusMutation.isPending}
                  >
                    <Power className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title={t("common.edit")}
                    className="h-8 w-8 text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-2)] rounded-[var(--radius-md)]"
                    onClick={() => openEdit(p)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title={t("common.delete")}
                    className="h-8 w-8 text-[var(--color-danger-500)] hover:bg-[var(--color-surface-2)] rounded-[var(--radius-md)]"
                    onClick={() => openDelete(p)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </div>

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
