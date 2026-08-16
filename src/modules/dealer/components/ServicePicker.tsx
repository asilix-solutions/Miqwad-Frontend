/**
 * @file ServicePicker.tsx
 *
 * Searchable, category-grouped picker for choosing which admin catalog
 * service (`GET /api/Services`) a dealer wants to offer as a product.
 * Cross-references the dealer's existing provider-services rows so
 * already-offered services render disabled with a checkmark — the backend
 * has no uniqueness guard, so this is the only thing stopping a duplicate
 * `POST /api/provider-services` for the same serviceId.
 *
 * Grouped client-side by each service's first denormalised category (no
 * extra API call — Dealer tokens get 403 on `/api/Categories`). The parent
 * service name (via `parentServiceId`) is shown as a subtle subtitle.
 */
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Package, Search } from "lucide-react";
import { ProviderDialog, ProviderEmptyState, ProviderSkeleton } from "@shared/provider-ui";
import { useServiceCatalogQuery } from "../hooks/useDealerQueries";
import type { ServiceCatalogItem } from "../types";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** serviceIds the dealer already offers — rendered disabled to prevent duplicates. */
  existingServiceIds: Set<string>;
  onSelect: (service: ServiceCatalogItem) => void;
}

interface CategoryGroup {
  key: string;
  label: string;
  items: ServiceCatalogItem[];
}

const UNCATEGORIZED_KEY = "__uncategorized";

// ── Helpers ───────────────────────────────────────────────────────────────────

function groupByCategory(items: ServiceCatalogItem[], fallbackLabel: string): CategoryGroup[] {
  const groups = new Map<string, CategoryGroup>();
  for (const item of items) {
    const category = item.categories[0];
    const key = category ? category.id : UNCATEGORIZED_KEY;
    const label = category ? category.name : fallbackLabel;
    if (!groups.has(key)) groups.set(key, { key, label, items: [] });
    groups.get(key)!.items.push(item);
  }
  return Array.from(groups.values());
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ServicePicker({ open, onOpenChange, existingServiceIds, onSelect }: Props) {
  const { t } = useTranslation();
  const catalogQuery = useServiceCatalogQuery();
  const [search, setSearch] = useState("");

  const nameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of catalogQuery.data ?? []) map.set(item.id, item.name);
    return map;
  }, [catalogQuery.data]);

  const filtered = useMemo(() => {
    const items = catalogQuery.data ?? [];
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) => item.name.toLowerCase().includes(query));
  }, [catalogQuery.data, search]);

  const groups = useMemo(
    () => groupByCategory(filtered, t("dealer.products.picker.uncategorized")),
    [filtered, t],
  );

  return (
    <ProviderDialog
      open={open}
      onOpenChange={onOpenChange}
      blurBackdrop
      title={t("dealer.products.picker.title")}
      description={t("dealer.products.picker.subtitle")}
      size="md"
    >
      <div className="flex flex-col gap-4">
        {/* Search */}
        <div className="relative flex items-center">
          <Search
            aria-hidden
            className="pointer-events-none absolute start-3 h-4 w-4 shrink-0 text-[var(--color-muted)]"
          />
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("dealer.products.picker.search")}
            className="h-[var(--size-input-h)] w-full rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)] ps-10 pe-3 text-sm text-[var(--color-ink-body)] outline-none transition-colors duration-[var(--dur-fast)] placeholder:text-[var(--color-muted)] focus-visible:border-[var(--color-brand-orange)] focus-visible:ring-2 focus-visible:ring-[var(--color-brand-orange)]/20"
          />
        </div>

        {/* Results */}
        <div className="max-h-[380px] overflow-y-auto rounded-[var(--radius-md)] border border-[var(--color-divider)]">
          {catalogQuery.isLoading && (
            <div className="space-y-2 p-3">
              {[1, 2, 3, 4].map((i) => (
                <ProviderSkeleton key={i} variant="block" height={40} />
              ))}
            </div>
          )}

          {catalogQuery.isError && !catalogQuery.isLoading && (
            <p className="p-6 text-center text-sm text-[var(--color-danger-500)]">
              {t("dealer.products.picker.error")}
            </p>
          )}

          {!catalogQuery.isLoading && !catalogQuery.isError && groups.length === 0 && (
            <div className="p-4">
              <ProviderEmptyState
                icon={<Package className="h-8 w-8" aria-hidden />}
                title={t("dealer.products.picker.emptyTitle")}
                description={t("dealer.products.picker.emptyDescription")}
              />
            </div>
          )}

          {!catalogQuery.isLoading && !catalogQuery.isError && groups.length > 0 && (
            <div role="listbox">
              {groups.map((group) => (
                <div key={group.key}>
                  <p className="sticky top-0 z-10 border-b border-[var(--color-divider)] bg-[var(--color-surface-2)] px-3 py-1.5 text-xs font-medium text-[var(--color-muted)]">
                    {group.label}
                  </p>
                  {group.items.map((item) => {
                    const isAdded = existingServiceIds.has(item.id);
                    const parentLabel = item.parentServiceId ? nameById.get(item.parentServiceId) : undefined;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="option"
                        aria-selected={false}
                        disabled={isAdded}
                        onClick={() => onSelect(item)}
                        className={[
                          "flex w-full items-center justify-between gap-2 border-b border-[var(--color-divider)] px-3 py-2.5 text-start text-sm last:border-b-0 transition-colors duration-[var(--dur-fast)]",
                          isAdded ? "cursor-not-allowed opacity-50" : "hover:bg-[var(--color-surface-2)]",
                        ].join(" ")}
                      >
                        <span className="flex min-w-0 flex-col">
                          <span className="truncate text-[var(--color-ink-body)]">{item.name}</span>
                          {parentLabel && (
                            <span className="truncate text-xs text-[var(--color-muted)]">{parentLabel}</span>
                          )}
                        </span>
                        {isAdded && (
                          <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-[var(--color-success-500)]">
                            <Check className="h-3.5 w-3.5" aria-hidden />
                            {t("dealer.products.picker.alreadyAdded")}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProviderDialog>
  );
}
