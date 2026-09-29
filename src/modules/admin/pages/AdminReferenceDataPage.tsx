/**
 * @file AdminReferenceDataPage.tsx
 * @description Container page for Reference Data management.
 *
 * Consolidates Categories and Cities (and future Brands) under ONE sidebar
 * item. Tab state is URL-synced via the `?tab=` query parameter so that
 * refresh and deep-linking work correctly.
 *
 * Tab pill style matches AdminProvidersPage:
 *   active  → bg var(--color-brand-orange) text-white
 *   inactive → transparent / muted with hover highlight
 */

import { isAdminFeatureAvailable, type AdminFeature } from "../config/featureCapabilities";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CategoriesPanel } from "../components/reference/CategoriesPanel";
import { CitiesPanel } from "../components/reference/CitiesPanel";
import { BrandsModelsPanel } from "../components/reference/BrandsModelsPanel";
import { ServicesPanel } from "../components/reference/ServicesPanel";

// ─── Tab definitions ──────────────────────────────────────────────────────────

type TabKey = "categories" | "cities" | "brands" | "services";

interface TabDef {
  key: TabKey;
  labelI18n: string;
}

const TABS: readonly TabDef[] = [
  { key: "categories", labelI18n: "superAdmin.reference.tabs.categories" },
  { key: "cities", labelI18n: "superAdmin.reference.tabs.cities" },
  { key: "brands", labelI18n: "superAdmin.reference.tabs.brands" },
  { key: "services", labelI18n: "superAdmin.reference.tabs.services" },
] as const;

const TAB_FEATURES = {
  categories: "referenceCategories",
  cities: "referenceCities",
  brands: "referenceBrands",
  services: "referenceServices",
} as const satisfies Record<TabKey, AdminFeature>;
const visibleTabs = TABS.filter((tab) => isAdminFeatureAvailable(TAB_FEATURES[tab.key]));

const DEFAULT_TAB: TabKey = "categories";

function isValidTab(value: string | null): value is TabKey {
  return value === "categories" || value === "cities" || value === "brands" || value === "services";
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminReferenceDataPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const rawTab = searchParams.get("tab");
  const activeTab: TabKey =
    isValidTab(rawTab) && isAdminFeatureAvailable(TAB_FEATURES[rawTab]) ? rawTab : DEFAULT_TAB;

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
        <p className="mt-1 text-[14px] text-[var(--color-muted)]">
          {t("superAdmin.reference.subtitle")}
        </p>
      </header>

      {/* ── Pill tabs (same style as AdminProvidersPage) ── */}
      <div className="flex gap-2 overflow-x-auto bg-transparent">
        {visibleTabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              id={`ref-tab-${tab.key}`}
              onClick={() => switchTab(tab.key)}
              className={[
                "rounded-full border border-transparent px-4 py-2 text-[14px]",
                "cursor-pointer whitespace-nowrap transition-colors duration-150",
                isActive
                  ? "bg-[var(--color-brand-orange)] font-semibold text-white"
                  : "bg-transparent font-medium text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink-body)]",
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
      {activeTab === "services" && <ServicesPanel />}
    </div>
  );
}
