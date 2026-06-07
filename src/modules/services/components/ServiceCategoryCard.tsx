import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Wrench } from "lucide-react";
import type { ServiceCategory } from "../types";
import { cn } from "@shared/lib/utils";

interface Props {
  category: ServiceCategory;
  onClick?: (category: ServiceCategory) => void;
  active?: boolean;
}

/**
 * Card used in the customer-facing Categories grid. Tones mirror the
 * design system so the page stays brand-aligned without bespoke imagery.
 */
export function ServiceCategoryCard({ category, onClick, active }: Props) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const Chevron = isAr ? ChevronLeft : ChevronRight;

  const toneClasses = TONES[category.colorHint ?? "navy"];

  return (
    <button
      type="button"
      onClick={() => onClick?.(category)}
      className={cn(
        "group w-full text-start rounded-[var(--radius-lg)] bg-white border p-4 sm:p-5 flex items-center gap-4 transition-all",
        "hover:shadow-[var(--shadow-2)] hover:-translate-y-0.5",
        active ? "border-brand-500 ring-2 ring-brand-500/20" : "border-ink-200",
      )}
    >
      <div
        className={cn(
          "flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-[var(--radius-md)] shrink-0",
          toneClasses,
        )}
      >
        <Wrench className="h-6 w-6" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-display text-base sm:text-lg font-semibold text-ink-900 truncate">
          {isAr ? category.nameAr : category.nameEn}
        </h3>
      </div>
      <Chevron className="h-5 w-5 text-ink-300 group-hover:text-brand-500 transition-colors shrink-0" />
    </button>
  );
}

const TONES: Record<NonNullable<ServiceCategory["colorHint"]>, string> = {
  orange: "bg-brand-50 text-brand-600",
  blue: "bg-info-50 text-info-500",
  navy: "bg-navy-50 text-navy-500",
  green: "bg-success-50 text-success-500",
  red: "bg-danger-50 text-danger-500",
  purple: "bg-ink-100 text-ink-700",
};
