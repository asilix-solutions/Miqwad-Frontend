import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LayoutGrid } from "lucide-react";
import { LoadingState } from "@shared/components/feedback/LoadingState";
import { ErrorState } from "@shared/components/feedback/ErrorState";
import { EmptyState } from "@shared/components/feedback/EmptyState";
import {
  useServiceCategoriesQuery,
  useServiceSubcategoriesQuery,
} from "../hooks/useServicesQueries";
import { ServiceCategoryCard } from "../components/ServiceCategoryCard";
import type { ServiceCategory } from "../types";

/**
 * /app/services — customer-facing grid of all service categories.
 *
 * Clicking a card surfaces a side / inline panel with subcategories
 * and indicative price. This is the Sprint 3 read-only catalog;
 * booking / nearby-providers will be added in Sprint 4.
 *
 * Responsive layout:
 *  - xs: 1-column list of cards, subcategory panel stacks below.
 *  - md: 2-column card grid, panel beneath.
 *  - lg+: 3-column card grid + sticky details panel on the side.
 */
export function CategoriesPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const [active, setActive] = useState<ServiceCategory | null>(null);
  const categoriesQ = useServiceCategoriesQuery();
  const subcategoriesQ = useServiceSubcategoriesQuery(active?.id ?? null);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink-900">
          {t("servicesCatalog.title")}
        </h1>
        <p className="text-sm text-ink-500 mt-1">{t("servicesCatalog.subtitle")}</p>
      </header>

      {categoriesQ.isLoading ? (
        <LoadingState />
      ) : categoriesQ.isError ? (
        <ErrorState onRetry={() => categoriesQ.refetch()} />
      ) : (categoriesQ.data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={<LayoutGrid className="h-6 w-6" />}
          title={t("servicesCatalog.empty")}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-12 items-start">
          <div className="lg:col-span-8 grid gap-3 sm:grid-cols-2">
            {categoriesQ.data?.map((c) => (
              <ServiceCategoryCard
                key={c.id}
                category={c}
                active={active?.id === c.id}
                onClick={setActive}
              />
            ))}
          </div>

          {/* Side panel (desktop) / stacked panel (mobile) */}
          <aside className="lg:col-span-4 lg:sticky lg:top-4 rounded-[var(--radius-lg)] bg-white border border-ink-200 p-4 sm:p-5 space-y-3">
            {!active ? (
              <p className="text-sm text-ink-500 text-center py-8">
                {t("servicesCatalog.subcategoriesTitle")}
              </p>
            ) : (
              <>
                <header className="space-y-1">
                  <h3 className="font-display text-lg font-semibold text-ink-900">
                    {isAr ? active.nameAr : active.nameEn}
                  </h3>
                  <p className="text-xs text-ink-500">{t("servicesCatalog.subcategoriesTitle")}</p>
                </header>
                {subcategoriesQ.isLoading ? (
                  <LoadingState />
                ) : subcategoriesQ.isError ? (
                  <ErrorState onRetry={() => subcategoriesQ.refetch()} />
                ) : (subcategoriesQ.data?.length ?? 0) === 0 ? (
                  <p className="text-sm text-ink-500 text-center py-6">
                    {t("empty.noData")}
                  </p>
                ) : (
                  <ul className="divide-y divide-ink-100">
                    {subcategoriesQ.data?.map((s) => (
                      <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                        <span className="text-sm text-ink-700 truncate">
                          {isAr ? s.nameAr : s.nameEn}
                        </span>
                        {s.averagePrice != null && (
                          <span className="text-xs font-medium text-brand-600 shrink-0">
                            {t("servicesCatalog.averagePrice")}: {s.averagePrice} SAR
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

export default CategoriesPage;
