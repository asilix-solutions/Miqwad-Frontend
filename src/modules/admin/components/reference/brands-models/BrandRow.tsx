/**
 * @file BrandRow.tsx
 * @description Compact accessible table/list row for vehicle brands in List view.
 * Delivers high information density and rapid scanning.
 */
import { useTranslation } from "react-i18next";
import { Pencil, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Can } from "@shared/auth/Can";
import { getBrandEnglishName } from "@modules/vehicles/lib/brandLocalization";
import { BrandLogoEmblem } from "./BrandLogoEmblem";
import type { BrandRowProps } from "./types";

export function BrandRow({
  brand,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  isArabic,
  modelsCount,
}: BrandRowProps) {
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
        "group relative flex items-center justify-between px-3 py-2.5 rounded-lg border text-start cursor-pointer",
        "transition-all duration-150 motion-reduce:transition-none select-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-orange)]",
        isSelected
          ? "border-[var(--color-brand-orange)] bg-[var(--color-brand-orange)]/[0.04] shadow-2xs ring-1 ring-[var(--color-brand-orange)]/20"
          : "border-[var(--color-divider)] bg-white hover:border-[var(--color-brand-orange)]/40 hover:bg-[var(--color-surface-1)]",
      ].join(" ")}
    >
      {/* Start: Logo + Names */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <BrandLogoEmblem image={brand.image} name={brand.name} size="sm" />

        <div className="flex items-center gap-2 min-w-0">
          <span
            className="text-sm font-semibold text-[var(--color-ink-body)] truncate group-hover:text-[var(--color-brand-orange)] transition-colors"
            title={brand.name}
          >
            {brand.name}
          </span>
          {showEnglish && (
            <span
              className="text-xs text-[var(--color-muted)] font-mono truncate"
              title={englishName}
            >
              ({englishName})
            </span>
          )}
        </div>
      </div>

      {/* End: Selection indicator + Models count + Actions */}
      <div
        className="flex items-center gap-2 shrink-0 ms-2"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {modelsCount != null && (
          <span className="text-xs text-[var(--color-muted)] bg-[var(--color-surface-2)] px-2 py-0.5 rounded-full font-medium">
            {modelsCount}
          </span>
        )}

        {isSelected && (
          <span
            className="flex items-center justify-center h-6 w-6 rounded-full bg-[var(--color-brand-orange)]/15 text-[var(--color-brand-orange)]"
            title={t("superAdmin.brands.selectedBadge")}
          >
            <Check className="h-3.5 w-3.5 stroke-[2.5]" />
          </span>
        )}

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
