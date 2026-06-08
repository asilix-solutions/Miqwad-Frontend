import { useTranslation } from "react-i18next";
import { Search, SlidersHorizontal, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@shared/lib/utils";
import { useAppDispatch, useAppSelector } from "@app/store";
import {
  resetFilters,
  setCategory,
  setMinRating,
  setOpenNowOnly,
  setPriceBand,
  setQuery,
  setRadius,
} from "../store/discoverySlice";
import { useServiceCategoriesQuery } from "@modules/services/hooks/useServicesQueries";
import type { PriceBand } from "../types";

/**
 * Filters component for the nearby search page.
 *
 * Responsive behaviour:
 *  - lg+ : rendered inline as a sidebar (always visible).
 *  - <lg : the parent renders a bottom drawer that wraps this component.
 *
 * State is global (Redux) so filters survive navigation into a provider
 * details page and back.
 */
export function NearbyFilters({
  onApply,
  showCloseButton,
}: {
  /** Called after any filter changes (used to close drawers on mobile). */
  onApply?: () => void;
  showCloseButton?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const dispatch = useAppDispatch();
  const f = useAppSelector((s) => s.discovery.filters);
  const categoriesQ = useServiceCategoriesQuery();

  const handleReset = () => {
    dispatch(resetFilters());
  };

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-ink-500" />
          <h3 className="font-display text-sm font-semibold text-ink-900">
            {t("discovery.filters.title")}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 text-xs text-ink-500 hover:text-brand-600"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t("discovery.filters.reset")}
          </button>
          {showCloseButton && onApply && (
            <Button variant="ghost" size="sm" onClick={onApply}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </header>

      {/* Free-text query */}
      <FilterBlock label={t("discovery.filters.query")}>
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <Input
            value={f.q}
            onChange={(e) => dispatch(setQuery(e.target.value))}
            placeholder={t("discovery.filters.queryPlaceholder")}
            className="ps-9"
          />
        </div>
      </FilterBlock>

      {/* Category */}
      <FilterBlock label={t("discovery.filters.category")}>
        <Select
          value={f.categoryId == null ? "all" : String(f.categoryId)}
          onValueChange={(val) =>
            dispatch(setCategory(val === "all" ? null : Number(val)))
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("discovery.filters.anyCategory")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("discovery.filters.anyCategory")}</SelectItem>
            {(categoriesQ.data ?? []).map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {isAr ? c.nameAr : c.nameEn}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterBlock>

      {/* Radius */}
      <FilterBlock
        label={`${t("discovery.filters.radius")} — ${t("discovery.filters.radiusValueKm", { km: f.radiusKm })}`}
      >
        <input
          type="range"
          min={1}
          max={50}
          step={1}
          value={f.radiusKm}
          onChange={(e) => dispatch(setRadius(Number(e.target.value)))}
          className="w-full accent-brand-500"
        />
        <div className="flex justify-between text-[11px] text-ink-400 mt-1">
          <span>1 km</span>
          <span>50 km</span>
        </div>
      </FilterBlock>

      {/* Rating */}
      <FilterBlock label={t("discovery.filters.minRating")}>
        <div className="grid grid-cols-4 gap-2">
          {([0, 3, 4, 4.5] as const).map((value) => (
            <ChoiceChip
              key={value}
              active={f.minRating === value}
              onClick={() => dispatch(setMinRating(value))}
            >
              {value === 0 ? t("discovery.filters.anyRating") : `${value}+`}
            </ChoiceChip>
          ))}
        </div>
      </FilterBlock>

      {/* Price band */}
      <FilterBlock label={t("discovery.filters.priceBand")}>
        <div className="grid grid-cols-2 gap-2">
          {([
            ["lte_100", "≤ 100"],
            ["100_300", "100 – 300"],
            ["300_700", "300 – 700"],
            ["gt_700", "> 700"],
          ] as Array<[PriceBand, string]>).map(([key, label]) => (
            <ChoiceChip
              key={key}
              active={f.priceBand === key}
              onClick={() =>
                dispatch(setPriceBand(f.priceBand === key ? null : key))
              }
            >
              {label}
            </ChoiceChip>
          ))}
        </div>
      </FilterBlock>

      {/* Open now */}
      <FilterBlock label={t("discovery.filters.availability")}>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={f.openNowOnly}
            onChange={(e) => dispatch(setOpenNowOnly(e.target.checked))}
            className="h-4 w-4 accent-brand-500"
          />
          <span className="text-sm text-ink-700">{t("discovery.filters.openNowOnly")}</span>
          {f.openNowOnly && (
            <Badge tone="success" size="sm" className="ms-auto">
              {t("discovery.filters.active")}
            </Badge>
          )}
        </label>
      </FilterBlock>

      {showCloseButton && onApply && (
        <Button onClick={onApply} className="w-full">
          {t("discovery.filters.applyAndClose")}
        </Button>
      )}
    </div>
  );
}

/**
 * Compact section grouper — DRY wrapper used for each filter row.
 */
function FilterBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-ink-500 uppercase tracking-wide">
        {label}
      </label>
      {children}
    </div>
  );
}

function ChoiceChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "h-9 rounded-[var(--radius-sm)] text-sm font-medium border transition-colors",
        active
          ? "bg-brand-50 border-brand-500 text-brand-600"
          : "bg-white border-ink-200 text-ink-700 hover:border-brand-300",
      )}
    >
      {children}
    </button>
  );
}

/**
 * Mobile drawer that wraps `<NearbyFilters />`. Slides up from the bottom
 * on small screens; rendered inline on `lg+`.
 *
 * Uses a portal-free implementation (z-index layer) since we don't have
 * complex stacking contexts on this page.
 */
export function NearbyFiltersDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="close filters"
          onClick={onClose}
          className="fixed inset-0 bg-ink-900/40 z-40 lg:hidden"
        />
      )}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl lg:hidden transition-transform max-h-[85vh] overflow-y-auto",
          open ? "translate-y-0" : "translate-y-full",
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className="h-1 w-12 bg-ink-200 rounded-full mx-auto mt-3" />
        <div className="p-4 sm:p-6">
          <NearbyFilters onApply={onClose} showCloseButton />
        </div>
      </div>
    </>
  );
}

/**
 * Small floating button shown on the search page (mobile only) that opens
 * the filters drawer. Visible offset from the bottom to dodge bottom nav.
 */
export function MobileFiltersButton({ onOpen }: { onOpen: () => void }) {
  const { t } = useTranslation();
  const f = useAppSelector((s) => s.discovery.filters);
  const activeCount = countActiveFilters(f);
  return (
    <Button
      variant="outline"
      onClick={onOpen}
      className="lg:hidden w-full sm:w-auto"
    >
      <SlidersHorizontal className="h-4 w-4" />
      {t("discovery.filters.title")}
      {activeCount > 0 && (
        <Badge tone="brand" size="sm">
          {activeCount}
        </Badge>
      )}
    </Button>
  );
}

function countActiveFilters(f: {
  q: string;
  categoryId: number | null;
  minRating: number;
  priceBand: string | null;
  openNowOnly: boolean;
}): number {
  let n = 0;
  if (f.q?.trim()) n++;
  if (f.categoryId != null) n++;
  if (f.minRating > 0) n++;
  if (f.priceBand != null) n++;
  if (f.openNowOnly) n++;
  return n;
}

/**
 * Standalone helper component that exposes a button used by the page
 * header to switch between map and list views.
 */
export function ViewModeToggle() {
  // Intentionally a stateless re-render: parent owns the value.
  // Implemented inline in the page itself.
  return null;
}

/**
 * Active filter chips strip — small visual showing which filters are
 * applied. Rendered above the result list so users can clear a single
 * filter without opening the drawer.
 */
export function ActiveFiltersStrip() {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const f = useAppSelector((s) => s.discovery.filters);
  const categoriesQ = useServiceCategoriesQuery();

  // Compose the list of active chips with their handlers in one structure.
  type Chip = { key: string; label: string; clear: () => void };
  const chips: Chip[] = [];
  if (f.q.trim()) {
    chips.push({
      key: "q",
      label: `"${f.q}"`,
      clear: () => dispatch(setQuery("")),
    });
  }
  if (f.categoryId != null) {
    const c = (categoriesQ.data ?? []).find((x) => x.id === f.categoryId);
    if (c) {
      chips.push({
        key: "cat",
        label: i18n.language === "ar" ? c.nameAr : c.nameEn,
        clear: () => dispatch(setCategory(null)),
      });
    }
  }
  if (f.minRating > 0) {
    chips.push({
      key: "rating",
      label: `${f.minRating}+`,
      clear: () => dispatch(setMinRating(0)),
    });
  }
  if (f.priceBand) {
    const labels: Record<string, string> = {
      lte_100: "≤ 100",
      "100_300": "100 – 300",
      "300_700": "300 – 700",
      gt_700: "> 700",
    };
    chips.push({
      key: "price",
      label: labels[f.priceBand] ?? f.priceBand,
      clear: () => dispatch(setPriceBand(null)),
    });
  }
  if (f.openNowOnly) {
    chips.push({
      key: "open",
      label: t("discovery.filters.openNowOnly"),
      clear: () => dispatch(setOpenNowOnly(false)),
    });
  }
  if (f.radiusKm !== 10) {
    chips.push({
      key: "radius",
      label: t("discovery.filters.radiusValueKm", { km: f.radiusKm }),
      clear: () => dispatch(setRadius(10)),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-ink-500">{t("discovery.filters.activeLabel")}:</span>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.clear}
          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full text-xs font-medium bg-brand-50 text-brand-600 hover:bg-brand-100"
        >
          {chip.label}
          <X className="h-3 w-3" />
        </button>
      ))}
    </div>
  );
}
