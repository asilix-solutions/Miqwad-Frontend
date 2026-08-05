/**
 * @file CategoriesServicesPage.tsx
 * @description Container page for the "التصنيفات والخدمات" (Categories &
 * Services) admin section. Master–detail layout for flat categories and
 * their assigned services (m2m). Services-tree management is a stub here —
 * built in a later phase.
 *
 * Tab state is URL-synced via `?tab=`, matching AdminReferenceDataPage's
 * convention so refresh/deep-linking work correctly.
 */

import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CategoryListPanel } from "../components/taxonomy/CategoryListPanel";
import { CategoryServicesPanel } from "../components/taxonomy/CategoryServicesPanel";
import { ServicesTabStub } from "../components/taxonomy/ServicesTabStub";
import type { ServiceCategory } from "@modules/services/types";

type TabKey = "categories" | "services";

const DEFAULT_TAB: TabKey = "categories";

function isValidTab(value: string | null): value is TabKey {
  return value === "categories" || value === "services";
}

export function CategoriesServicesPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  const rawTab = searchParams.get("tab");
  const activeTab: TabKey = isValidTab(rawTab) ? rawTab : DEFAULT_TAB;

  const switchTab = (key: TabKey) => {
    setSearchParams({ tab: key }, { replace: true });
  };

  const handleSelectCategory = (category: ServiceCategory) => {
    setSelectedCategory(category);
    setMobileSheetOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <header>
        <h1 className="text-[22px] font-bold text-[var(--color-ink-body)]">
          {t("superAdmin.taxonomy.title")}
        </h1>
        <p className="text-[14px] text-[var(--color-muted)] mt-1">
          {t("superAdmin.taxonomy.subtitle")}
        </p>
      </header>

      {/* ── Pill tabs (same style as AdminReferenceDataPage) ── */}
      <div className="flex gap-2 bg-transparent overflow-x-auto">
        {(["categories", "services"] as const).map((key) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              type="button"
              id={`taxonomy-tab-${key}`}
              onClick={() => switchTab(key)}
              className={[
                "text-[14px] py-2 px-4 rounded-full border border-transparent",
                "cursor-pointer transition-colors duration-150 whitespace-nowrap",
                isActive
                  ? "bg-[var(--color-brand-orange)] text-white font-semibold"
                  : "bg-transparent text-[var(--color-muted)] font-medium hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink-body)]",
              ].join(" ")}
            >
              {t(`superAdmin.taxonomy.tabs.${key}`)}
            </button>
          );
        })}
      </div>

      {/* ── Active panel ── */}
      {activeTab === "categories" && (
        <div className="grid gap-6 lg:grid-cols-[380px_1fr] items-start">
          <CategoryListPanel
            selectedId={selectedCategory?.id ?? null}
            onSelect={handleSelectCategory}
          />

          {/* Desktop: persistent side-by-side detail panel */}
          <div className="hidden lg:block">
            <CategoryServicesPanel category={selectedCategory} variant="panel" />
          </div>

          {/* Narrow/mobile: bottom sheet, opens on row tap */}
          <div className="lg:hidden">
            <CategoryServicesPanel
              category={selectedCategory}
              variant="sheet"
              open={mobileSheetOpen}
              onOpenChange={setMobileSheetOpen}
            />
          </div>
        </div>
      )}

      {activeTab === "services" && <ServicesTabStub />}
    </div>
  );
}
