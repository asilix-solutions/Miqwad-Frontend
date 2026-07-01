/**
 * @file CategoryCascader.tsx
 *
 * Three-level category cascader for provider forms.
 * Renders three sequential ProviderSelect dropdowns gated L1 → L2 → L3
 * (التصنيف الرئيسي / التصنيف الفرعي / البند).
 *
 * L2 is disabled until L1 is chosen; L3 is disabled until L2 is chosen.
 * onChange fires only when an L3 leaf is selected.
 * Inactive categories are excluded from options but retained when pre-selected (edit mode).
 * Displays a chip-style breadcrumb path once the full L1 › L2 › L3 path is resolved.
 *
 * Architecture: src/shared/provider-ui/ — reused across dealer, workshop, scrap.
 */

import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@shared/lib/utils";
import { ProviderSelect } from "./ProviderSelect";
import { getCategoryPath } from "@modules/services/lib/categoryTree";
import type { ServiceCategory } from "@modules/services/types";
import type { ProviderType } from "@modules/providers/types";

// ── Types ─────────────────────────────────────────────────────────────────────

/** Props for {@link CategoryCascader}. */
export interface CategoryCascaderProps {
  /** Flat list of all ServiceCategory records — active and inactive. */
  categories: ServiceCategory[];
  /**
   * Controlled value: the currently-selected L3 category id.
   * Pass null in create mode or to clear the field.
   */
  value: number | null;
  /**
   * Called with the selected L3 id when the user completes all three levels.
   * Never called on L1 or L2 changes alone.
   */
  onChange: (l3Id: number) => void;
  /** Restrict options to categories scoped for this provider type (plus global ones). */
  providerType?: ProviderType;
  /** Validation error message rendered below the L3 select. */
  error?: string;
  /** Disables all three selects. */
  disabled?: boolean;
}

// ── Constant ──────────────────────────────────────────────────────────────────

/** Sentinel value used when no level is selected (never matches a numeric category id). */
const NONE = "__none__";

// ── Main component ────────────────────────────────────────────────────────────

/**
 * Three-level category cascader.
 *
 * @example
 * ```tsx
 * <CategoryCascader
 *   categories={allCategories}
 *   value={field.value ?? null}
 *   onChange={(id) => field.onChange(id)}
 *   providerType="dealer"
 *   error={fieldState.error?.message}
 * />
 * ```
 */
export function CategoryCascader({
  categories,
  value,
  onChange,
  providerType,
  error,
  disabled = false,
}: CategoryCascaderProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const [l1Id, setL1Id] = useState<number | null>(null);
  const [l2Id, setL2Id] = useState<number | null>(null);
  const [l3Id, setL3Id] = useState<number | null>(null);

  // Sync external value → local state (edit-mode pre-population and controlled reset).
  // React's useState setter is a no-op when the new value equals current state, so
  // the feedback loop (onChange → parent sets value → effect re-fires with same ids)
  // terminates after one extra no-op render.
  useEffect(() => {
    if (value === null) {
      setL1Id(null);
      setL2Id(null);
      setL3Id(null);
      return;
    }
    const { l1, l2, l3 } = getCategoryPath(categories, value);
    setL1Id(l1?.id ?? null);
    setL2Id(l2?.id ?? null);
    setL3Id(l3?.id ?? null);
  }, [value, categories]);

  // Provider-type eligible flat list
  const eligible = useMemo(
    () =>
      providerType
        ? categories.filter(
            (c) =>
              c.providerTypeScope === null ||
              c.providerTypeScope === providerType,
          )
        : categories,
    [categories, providerType],
  );

  // L1 options: active + currently pre-selected (even if inactive)
  const l1Options = useMemo(
    () =>
      eligible
        .filter((c) => c.level === 1 && (c.isActive || c.id === l1Id))
        .map((c) => ({
          value: String(c.id),
          label: lang === "ar" ? c.nameAr : c.nameEn,
          disabled: !c.isActive,
        })),
    [eligible, l1Id, lang],
  );

  // L2 options: active children of L1 + pre-selected L2
  const l2Options = useMemo(() => {
    if (l1Id === null) return [];
    return eligible
      .filter(
        (c) =>
          c.level === 2 &&
          c.parentId === l1Id &&
          (c.isActive || c.id === l2Id),
      )
      .map((c) => ({
        value: String(c.id),
        label: lang === "ar" ? c.nameAr : c.nameEn,
        disabled: !c.isActive,
      }));
  }, [eligible, l1Id, l2Id, lang]);

  // L3 options: active children of L2 + pre-selected L3
  const l3Options = useMemo(() => {
    if (l2Id === null) return [];
    return eligible
      .filter(
        (c) =>
          c.level === 3 &&
          c.parentId === l2Id &&
          (c.isActive || c.id === l3Id),
      )
      .map((c) => ({
        value: String(c.id),
        label: lang === "ar" ? c.nameAr : c.nameEn,
        disabled: !c.isActive,
      }));
  }, [eligible, l2Id, l3Id, lang]);

  // Cascade change handlers — each resets children below it
  const handleL1Change = (val: string) => {
    setL1Id(Number(val));
    setL2Id(null);
    setL3Id(null);
  };

  const handleL2Change = (val: string) => {
    setL2Id(Number(val));
    setL3Id(null);
  };

  const handleL3Change = (val: string) => {
    const id = Number(val);
    setL3Id(id);
    onChange(id);
  };

  // Resolved category objects for breadcrumb display
  const l1Cat = l1Id !== null ? categories.find((c) => c.id === l1Id) : null;
  const l2Cat = l2Id !== null ? categories.find((c) => c.id === l2Id) : null;
  const l3Cat = l3Id !== null ? categories.find((c) => c.id === l3Id) : null;
  const isComplete = l1Cat != null && l2Cat != null && l3Cat != null;

  const nameOf = (cat: ServiceCategory) =>
    lang === "ar" ? cat.nameAr : cat.nameEn;

  return (
    <div className="flex flex-col gap-3">
      {/* L1 — التصنيف الرئيسي */}
      <ProviderSelect
        id="cat-l1"
        label={t("providerUi.categoryCascader.l1Label")}
        value={l1Id !== null ? String(l1Id) : NONE}
        onValueChange={handleL1Change}
        options={l1Options}
        placeholder={t("providerUi.categoryCascader.l1Placeholder")}
        disabled={disabled}
      />

      {/* L2 — التصنيف الفرعي (gated on L1) */}
      <ProviderSelect
        id="cat-l2"
        label={t("providerUi.categoryCascader.l2Label")}
        value={l2Id !== null ? String(l2Id) : NONE}
        onValueChange={handleL2Change}
        options={l2Options}
        placeholder={
          l1Id === null
            ? t("providerUi.categoryCascader.pickL1First")
            : t("providerUi.categoryCascader.l2Placeholder")
        }
        disabled={disabled || l1Id === null}
      />

      {/* L3 — البند (gated on L2) */}
      <ProviderSelect
        id="cat-l3"
        label={t("providerUi.categoryCascader.l3Label")}
        value={l3Id !== null ? String(l3Id) : NONE}
        onValueChange={handleL3Change}
        options={l3Options}
        placeholder={
          l2Id === null
            ? t("providerUi.categoryCascader.pickL2First")
            : t("providerUi.categoryCascader.l3Placeholder")
        }
        disabled={disabled || l2Id === null}
        error={error}
      />

      {/* Breadcrumb chip-style path — appears once all three levels are chosen */}
      {isComplete && (
        <div
          role="status"
          aria-label={t("providerUi.categoryCascader.pathLabel")}
          className={cn(
            "flex flex-wrap items-center gap-1.5",
            "rounded-[var(--radius-sm)] bg-[var(--color-surface-2)]",
            "px-3 py-2",
            "animate-in fade-in",
          )}
          style={{ animationDuration: "150ms" }}
        >
          <PathChip label={nameOf(l1Cat!)} />
          <PathSep />
          <PathChip label={nameOf(l2Cat!)} />
          <PathSep />
          <PathChip label={nameOf(l3Cat!)} isLeaf />
        </div>
      )}
    </div>
  );
}

// ── Local sub-components ──────────────────────────────────────────────────────

function PathChip({
  label,
  isLeaf = false,
}: {
  label: string;
  isLeaf?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        isLeaf
          ? "bg-[var(--color-brand-orange)]/10 text-[var(--color-brand-orange)]"
          : "bg-[var(--color-surface)] text-[var(--color-ink-body)] shadow-[0_0_0_1px_var(--color-divider)]",
      )}
    >
      {label}
    </span>
  );
}

function PathSep() {
  return (
    <span
      aria-hidden
      className="select-none text-xs text-[var(--color-muted)]"
    >
      ›
    </span>
  );
}
