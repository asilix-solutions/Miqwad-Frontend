/**
 * @file BrandCard.tsx
 * @description Accessible interactive card for vehicle brands in Grid view.
 * Complies with strict interactive element hierarchy (no button nesting)
 * and keyboard selection rules.
 */
import { useTranslation } from "react-i18next";
import { Pencil, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Can } from "@shared/auth/Can";
import { getBrandEnglishName } from "@modules/vehicles/lib/brandLocalization";
import { BrandLogoEmblem } from "./BrandLogoEmblem";
import type { BrandCardProps } from "./types";

export function BrandCard({
  brand,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  isArabic,
  modelsCount,
}: BrandCardProps) {
  const { t } = useTranslation();
  const englishName = getBrandEnglishName(brand.id, brand.name);
  const showEnglish = isArabic && englishName && englishName.toLowerCase() !== brand.name.toLowerCase();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(brand);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-selected={isSelected}
      aria-label={`${brand.name}${showEnglish ? ` (${englishName})` : ""}`}
      onClick={() => onSelect(brand)}
      onKeyDown={handleKeyDown}
      className={[
        "group relative flex flex-col justify-between p-3.5 rounded-xl border text-start cursor-pointer",
        "transition-all duration-150 motion-reduce:transition-none select-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-orange)] focus-visible:ring-offset-2",
        isSelected
          ? "border-[var(--color-brand-orange)] bg-[var(--color-brand-orange)]/[0.04] shadow-sm ring-1 ring-[var(--color-brand-orange)]/30"
          : "border-[var(--color-divider)] bg-white hover:border-[var(--color-brand-orange)]/40 hover:shadow-xs hover:bg-[var(--color-surface-1)]",
      ].join(" ")}
    >
      {/* Top row: Logo emblem + selection indicator */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <BrandLogoEmblem image={brand.image} name={brand.name} size="md" />

        <div className="flex items-center gap-1">
          {isSelected && (
            <Badge
              variant="outline"
              className="bg-[var(--color-brand-orange)]/10 text-[var(--color-brand-orange)] border-[var(--color-brand-orange)]/30 text-[11px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1"
            >
              <CheckCircle2 className="h-3 w-3" />
              <span>{t("superAdmin.brands.selectedBadge")}</span>
            </Badge>
          )}
          {modelsCount != null && (
            <span
              className="text-[11px] font-medium text-[var(--color-muted)] bg-[var(--color-surface-2)] px-2 py-0.5 rounded-full"
              title={t("superAdmin.models.countLabel", { count: modelsCount })}
            >
              {modelsCount}
            </span>
          )}
        </div>
      </div>

      {/* Brand Identity */}
      <div className="flex-1 min-w-0 mb-3">
        <h3
          className="text-sm font-bold text-[var(--color-ink-body)] truncate leading-snug group-hover:text-[var(--color-brand-orange)] transition-colors"
          title={brand.name}
        >
          {brand.name}
        </h3>
        {showEnglish ? (
          <p
            className="text-xs text-[var(--color-muted)] font-mono truncate mt-0.5"
            title={englishName}
          >
            {englishName}
          </p>
        ) : (
          <p className="text-xs text-transparent select-none mt-0.5 leading-none">
            &nbsp;
          </p>
        )}
      </div>

      {/* Card Actions Footer: stopPropagation ensures selection is not triggered */}
      <div
        className="flex items-center justify-end gap-1 pt-2 border-t border-[var(--color-divider)]/60"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <Can permission="brands.edit">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-md text-[var(--color-ink-secondary)] hover:text-[var(--color-ink-body)] hover:bg-[var(--color-surface-2)]"
            title={t("superAdmin.brands.edit")}
            aria-label={`${t("superAdmin.brands.edit")}: ${brand.name}`}
            onClick={() => onEdit(brand)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </Can>
        <Can permission="brands.delete">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-md text-[var(--color-danger-500)] hover:text-[var(--color-danger-600)] hover:bg-danger-50"
            title={t("superAdmin.brands.delete")}
            aria-label={`${t("superAdmin.brands.delete")}: ${brand.name}`}
            onClick={() => onDelete(brand)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </Can>
      </div>
    </div>
  );
}
