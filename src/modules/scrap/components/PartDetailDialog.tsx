/**
 * @file PartDetailDialog.tsx
 *
 * Part detail dialog with blurred backdrop. Displays the offered service,
 * price, quantity, notes and image gallery, and exposes Edit / Delete
 * actions.
 *
 * Built on ProviderDialog with blurBackdrop={true}.
 * Scrap-specific — lives in modules/scrap/components/.
 */

import { useTranslation } from "react-i18next";
import { Pencil, Trash2, Wrench } from "lucide-react";
import { ProviderDialog } from "@shared/provider-ui";
import { Button } from "@/components/ui/button";
import { cn } from "@shared/lib/utils";
import type { ProviderService } from "@shared/provider-services";

// ── Types ─────────────────────────────────────────────────────────────────────

/** Props for {@link PartDetailDialog}. */
export interface PartDetailDialogProps {
  part: ProviderService;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (part: ProviderService) => void;
  onDelete: (part: ProviderService) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

/** Full part detail dialog with blurred backdrop. */
export function PartDetailDialog({ part, open, onOpenChange, onEdit, onDelete }: PartDetailDialogProps) {
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
      title={t("scrap.parts.detail.title")}
      size="md"
      blurBackdrop
      footer={
        <div className="flex w-full items-center gap-2">
          {/* Danger action on the start side */}
          <Button
            variant="ghost"
            size="sm"
            className="text-[var(--color-danger-500)] hover:bg-[var(--color-danger-50)] hover:text-[var(--color-danger-500)]"
            onClick={() => onDelete(part)}
          >
            <Trash2 className="me-1.5 h-4 w-4" aria-hidden />
            {t("common.delete")}
          </Button>

          <div className="flex-1" aria-hidden />

          {/* Primary action on the end side */}
          <Button size="sm" onClick={() => onEdit(part)}>
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
            className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-surface-2)]"
            aria-hidden
          >
            {part.images[0] ? (
              <img src={part.images[0]} alt="" className="h-full w-full object-cover" />
            ) : (
              <Wrench className="h-6 w-6 text-[var(--color-muted)]" />
            )}
          </div>
          <h2 className="text-lg font-semibold leading-snug text-[var(--color-ink-body)]">
            {part.serviceName}
          </h2>
        </div>

        {/* Image gallery — read-only, no removal path (backend limitation) */}
        {part.images.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {part.images.map((url) => (
              <div
                key={url}
                className="h-16 w-16 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-[var(--color-surface-2)]"
              >
                <img src={url} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        )}

        {/* Vehicle compatibility */}
        {part.isCompatibleWith && (
          <p className="text-sm text-[var(--color-muted)]">
            <span className="font-medium text-[var(--color-ink-body)]">
              {t("scrap.parts.form.isCompatibleWith")}:{" "}
            </span>
            {part.isCompatibleWith}
          </p>
        )}

        {/* Price — prominent */}
        <span className="tabular-nums text-2xl font-bold text-[var(--color-brand-orange)]">
          {formatCurrency(part.price)}
        </span>

        {/* Meta grid */}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div>
            <dt className="text-[var(--color-muted)]">{t("scrap.parts.colQuantity")}</dt>
            <dd
              className={cn(
                "mt-0.5 font-medium",
                part.quantity === 0 ? "text-[var(--color-warning-500)]" : "text-[var(--color-ink-body)]",
              )}
            >
              {part.quantity === 0 ? t("scrap.parts.outOfStock") : part.quantity}
            </dd>
          </div>
        </dl>

        {/* Divider */}
        <div className="border-t border-[var(--color-divider)]" />

        {/* Notes */}
        <div>
          <p className="mb-1 text-xs font-medium text-[var(--color-muted)]">
            {t("scrap.parts.form.notes")}
          </p>
          {part.notes ? (
            <p className="text-sm leading-relaxed text-[var(--color-ink-body)]">{part.notes}</p>
          ) : (
            <p className="text-sm italic text-[var(--color-muted)]">{t("scrap.parts.detail.noNotes")}</p>
          )}
        </div>
      </div>
    </ProviderDialog>
  );
}
