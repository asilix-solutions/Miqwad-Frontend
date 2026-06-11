/**
 * @file AdminReferenceDataPage.tsx
 * @description Container page for Reference Data management.
 *
 * Consolidates Categories and Cities (and future Brands) under ONE sidebar
 * item. Tab state is URL-synced via the `?tab=` query parameter so that
 * refresh and deep-linking work correctly.
 *
 * Tab pill style matches AdminProvidersPage / AdminDisputesPage:
 *   active  → bg var(--color-brand-orange) text-white
 *   inactive → transparent / muted with hover highlight
 */

import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CategoriesPanel } from "../components/reference/CategoriesPanel";
import { CitiesPanel } from "../components/reference/CitiesPanel";
import { BrandsModelsPanel } from "../components/reference/BrandsModelsPanel";

// ─── Tab definitions ──────────────────────────────────────────────────────────

type TabKey = "categories" | "cities" | "brands";

interface TabDef {
  key: TabKey;
  labelI18n: string;
}

const TABS: readonly TabDef[] = [
  { key: "categories", labelI18n: "superAdmin.reference.tabs.categories" },
  { key: "cities",     labelI18n: "superAdmin.reference.tabs.cities" },
  { key: "brands",     labelI18n: "superAdmin.reference.tabs.brands" },
] as const;

const DEFAULT_TAB: TabKey = "categories";

function isValidTab(value: string | null): value is TabKey {
  return value === "categories" || value === "cities" || value === "brands";
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminReferenceDataPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const rawTab = searchParams.get("tab");
  const activeTab: TabKey = isValidTab(rawTab) ? rawTab : DEFAULT_TAB;

  const switchTab = (key: TabKey) => {
    setSearchParams({ tab: key }, { replace: true });
  };

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <header>
        <h1 className="text-[22px] font-bold text-[var(--color-ink-body)]">
          {t("superAdmin.reference.title")}
        </h1>
        <p className="text-[14px] text-[var(--color-muted)] mt-1">
          {t("superAdmin.reference.subtitle")}
        </p>
      </header>

      {/* ── Pill tabs (same style as AdminProvidersPage / AdminDisputesPage) ── */}
      <div className="flex gap-2 bg-transparent overflow-x-auto">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              id={`ref-tab-${tab.key}`}
              onClick={() => switchTab(tab.key)}
              className={[
                "text-[14px] py-2 px-4 rounded-full border border-transparent",
                "cursor-pointer transition-colors duration-150 whitespace-nowrap",
                isActive
                  ? "bg-[var(--color-brand-orange)] text-white font-semibold"
                  : "bg-transparent text-[var(--color-muted)] font-medium hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink-body)]",
              ].join(" ")}
            >
              {t(tab.labelI18n)}
            </button>
          );
        })}
      </div>

      {/* ── Active panel (deferred mount — only mounts when tab is active) ── */}
      {activeTab === "categories" && <CategoriesPanel />}
      {activeTab === "cities" && <CitiesPanel />}
      {activeTab === "brands" && <BrandsModelsPanel />}
    </div>
  );
}
