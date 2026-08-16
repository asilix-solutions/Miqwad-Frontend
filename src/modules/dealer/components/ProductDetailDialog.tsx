/**
 * @file ProductDetailDialog.tsx
 *
 * Product detail dialog with blurred backdrop. Displays the offered
 * service, price, quantity and notes, and exposes Edit / Delete actions.
 *
 * Built on ProviderDialog with blurBackdrop={true}.
 * Dealer-specific — lives in modules/dealer/components/.
 */

import { useTranslation } from "react-i18next";
import { Pencil, Trash2, Wrench } from "lucide-react";
import { ProviderDialog } from "@shared/provider-ui";
import { Button } from "@/components/ui/button";
import { cn } from "@shared/lib/utils";
import type { Product } from "../types";

// ── Types ─────────────────────────────────────────────────────────────────────

/** Props for {@link ProductDetailDialog}. */
export interface ProductDetailDialogProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

/** Full product detail dialog with blurred backdrop. */
export function ProductDetailDialog({
  product,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: ProductDetailDialogProps) {
  const { t, i18n } = useTranslation();

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
      size="md"
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

          {/* Primary action on the end side */}
          <Button size="sm" onClick={() => onEdit(product)}>
            <Pencil className="me-1.5 h-4 w-4" aria-hidden />
            {t("common.edit")}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Icon + service name */}
        <div className="flex items-center gap-3">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-2)]"
            aria-hidden
          >
            <Wrench className="h-6 w-6 text-[var(--color-muted)]" />
          </div>
          <h2 className="text-lg font-semibold leading-snug text-[var(--color-ink-body)]">
            {product.serviceName}
          </h2>
        </div>

        {/* Price — prominent */}
        <span className="tabular-nums text-2xl font-bold text-[var(--color-brand-orange)]">
          {formatCurrency(product.price)}
        </span>

        {/* Meta grid */}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div>
            <dt className="text-[var(--color-muted)]">{t("dealer.products.colQuantity")}</dt>
            <dd
              className={cn(
                "mt-0.5 font-medium",
                product.quantity === 0
                  ? "text-[var(--color-warning-500)]"
                  : "text-[var(--color-ink-body)]",
              )}
            >
              {product.quantity === 0 ? t("dealer.products.outOfStock") : product.quantity}
            </dd>
          </div>
        </dl>

        {/* Divider */}
        <div className="border-t border-[var(--color-divider)]" />

        {/* Notes */}
        <div>
          <p className="mb-1 text-xs font-medium text-[var(--color-muted)]">
            {t("dealer.products.form.notes")}
          </p>
          {product.notes ? (
            <p className="text-sm leading-relaxed text-[var(--color-ink-body)]">{product.notes}</p>
          ) : (
            <p className="text-sm italic text-[var(--color-muted)]">
              {t("dealer.products.detail.noNotes")}
            </p>
          )}
        </div>
      </div>
    </ProviderDialog>
  );
}
