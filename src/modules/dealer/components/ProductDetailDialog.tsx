/**
 * @file ProductDetailDialog.tsx
 *
 * Large product detail dialog with blurred backdrop.
 * Displays full bilingual product info (gallery, price, stock, condition,
 * descriptions) and exposes Edit / Toggle-Status / Delete actions.
 *
 * Built on ProviderDialog with blurBackdrop={true}.
 * Dealer-specific — lives in modules/dealer/components/.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Package, Pencil, Power, Trash2 } from "lucide-react";
import { ProviderDialog, ProviderStatusPill } from "@shared/provider-ui";
import type { StatusPillTone } from "@shared/provider-ui";
import { Button } from "@/components/ui/button";
import { cn } from "@shared/lib/utils";
import type { Product } from "../types";

// ── Types ─────────────────────────────────────────────────────────────────────

/** Props for {@link ProductDetailDialog}. */
export interface ProductDetailDialogProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryLabel: string;
  onEdit: (product: Product) => void;
  onToggleStatus: (product: Product) => void;
  onDelete: (product: Product) => void;
  isTogglePending?: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_TONE: Record<string, StatusPillTone> = {
  active:       "success",
  draft:        "neutral",
  out_of_stock: "warning",
  archived:     "neutral",
};

// ── Component ─────────────────────────────────────────────────────────────────

/** Full product detail dialog with blurred backdrop and image gallery. */
export function ProductDetailDialog({
  product,
  open,
  onOpenChange,
  categoryLabel,
  onEdit,
  onToggleStatus,
  onDelete,
  isTogglePending,
}: ProductDetailDialogProps) {
  const { t, i18n } = useTranslation();
  const [selectedImg, setSelectedImg] = useState(0);

  const images = product.images ?? [];
  const primaryName = i18n.language === "ar" ? product.nameAr : product.nameEn;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat(i18n.language === "ar" ? "ar-SA" : "en-US", {
      style: "currency",
      currency: "SAR",
    }).format(amount);

  return (
    <ProviderDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("dealer.products.detail.title")}
      size="lg"
      blurBackdrop
      footer={
        <div className="flex w-full items-center gap-2">
          {/* Danger action on the start side */}
          <Button
            variant="ghost"
            size="sm"
            className="text-[var(--color-danger-500)] hover:bg-[var(--color-danger-50)] hover:text-[var(--color-danger-500)]"
            onClick={() => onDelete(product)}
          >
            <Trash2 className="me-1.5 h-4 w-4" aria-hidden />
            {t("common.delete")}
          </Button>

          <div className="flex-1" aria-hidden />

          {/* Primary actions on the end side */}
          <Button
            variant="outline"
            size="sm"
            disabled={isTogglePending}
            onClick={() => onToggleStatus(product)}
          >
            <Power className="me-1.5 h-4 w-4" aria-hidden />
            {t("dealer.products.toggleStatusBtn")}
          </Button>
          <Button size="sm" onClick={() => onEdit(product)}>
            <Pencil className="me-1.5 h-4 w-4" aria-hidden />
            {t("common.edit")}
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 sm:grid-cols-2">
        {/* ── Left: Image gallery ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          {/* Main image */}
          {images.length > 0 ? (
            <div className="aspect-[4/3] overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-surface-2)]">
              <img
                src={images[selectedImg]}
                alt={primaryName}
                className="h-full w-full object-cover transition-opacity duration-[var(--dur-fast)]"
              />
            </div>
          ) : (
            <div
              className="flex aspect-[4/3] items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-2)]"
              aria-hidden
            >
              <Package className="h-16 w-16 text-[var(--color-muted)]" />
            </div>
          )}

          {/* Thumbnail strip — only shown when there are multiple images */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((src, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImg(idx)}
                  className={cn(
                    "h-14 w-14 shrink-0 overflow-hidden rounded-[var(--radius-sm)] border-2 transition-colors duration-[var(--dur-fast)]",
                    idx === selectedImg
                      ? "border-[var(--color-brand-orange)]"
                      : "border-transparent hover:border-[var(--color-divider)]",
                  )}
                >
                  <img
                    src={src}
                    alt=""
                    aria-hidden
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: Product details ──────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          {/* Bilingual names */}
          <div>
            <h2 className="text-lg font-semibold leading-snug text-[var(--color-ink-body)]">
              {product.nameAr}
            </h2>
            <p className="mt-0.5 text-sm text-[var(--color-muted)]" dir="ltr">
              {product.nameEn}
            </p>
          </div>

          {/* Price — prominent */}
          <span className="tabular-nums text-2xl font-bold text-[var(--color-brand-orange)]">
            {formatCurrency(product.price)}
          </span>

          {/* Meta grid */}
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <dt className="text-[var(--color-muted)]">{t("dealer.products.colSku")}</dt>
              <dd
                className="mt-0.5 font-medium text-[var(--color-ink-body)]"
                dir="ltr"
              >
                {product.sku}
              </dd>
            </div>

            <div>
              <dt className="text-[var(--color-muted)]">{t("dealer.products.colCategory")}</dt>
              <dd className="mt-0.5 font-medium text-[var(--color-ink-body)]">
                {categoryLabel}
              </dd>
            </div>

            <div>
              <dt className="text-[var(--color-muted)]">{t("dealer.products.colStatus")}</dt>
              <dd className="mt-0.5">
                <ProviderStatusPill
                  label={t(`dealer.status.product.${product.status}`)}
                  tone={STATUS_TONE[product.status] ?? "neutral"}
                />
              </dd>
            </div>

            <div>
              <dt className="text-[var(--color-muted)]">{t("dealer.products.colStock")}</dt>
              <dd
                className={cn(
                  "mt-0.5 font-medium",
                  product.stockQty === 0
                    ? "text-[var(--color-warning-500)]"
                    : "text-[var(--color-ink-body)]",
                )}
              >
                {product.stockQty === 0
                  ? t("dealer.products.outOfStock")
                  : product.stockQty}
              </dd>
            </div>

            <div>
              <dt className="text-[var(--color-muted)]">{t("dealer.products.detail.condition")}</dt>
              <dd className="mt-0.5 font-medium text-[var(--color-ink-body)]">
                {t("dealer.products.detail.conditionNew")}
              </dd>
            </div>
          </dl>

          {/* Divider */}
          <div className="border-t border-[var(--color-divider)]" />

          {/* Descriptions */}
          <div className="flex flex-col gap-4">
            <div>
              <p className="mb-1 text-xs font-medium text-[var(--color-muted)]">
                {t("dealer.products.form.descriptionAr")}
              </p>
              {product.descriptionAr ? (
                <p
                  className="text-sm leading-relaxed text-[var(--color-ink-body)]"
                  dir="rtl"
                >
                  {product.descriptionAr}
                </p>
              ) : (
                <p className="text-sm italic text-[var(--color-muted)]">
                  {t("dealer.products.detail.noDescription")}
                </p>
              )}
            </div>

            <div>
              <p className="mb-1 text-xs font-medium text-[var(--color-muted)]">
                {t("dealer.products.form.descriptionEn")}
              </p>
              {product.descriptionEn ? (
                <p
                  className="text-sm leading-relaxed text-[var(--color-ink-body)]"
                  dir="ltr"
                >
                  {product.descriptionEn}
                </p>
              ) : (
                <p className="text-sm italic text-[var(--color-muted)]">
                  {t("dealer.products.detail.noDescription")}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProviderDialog>
  );
}
