/**
 * @file TowTruckQueueSearchFilter.tsx
 * @description Search and filtering bar for Tow Truck Operations.
 * - Server-side search by trackNumber / orderNumber.
 * - In-page local filter tabs with transparent page-local counts.
 * - Prominent, truthful disclosure stating local tabs apply only to the loaded page batch.
 */
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Search, X, Filter, Info, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export type TowTruckLocalFilterKey = "all" | "unassigned" | "assigned" | "paid" | "attention";

export interface TowTruckLocalCounts {
  all: number;
  unassigned: number;
  assigned: number;
  paid: number;
  attention: number;
}

interface Props {
  trackSearchValue: string;
  onTrackSearchSubmit: (value: string) => void;
  onTrackSearchClear: () => void;
  isSearching: boolean;
  activeLocalFilter: TowTruckLocalFilterKey;
  onLocalFilterChange: (filter: TowTruckLocalFilterKey) => void;
  localCounts: TowTruckLocalCounts;
  className?: string;
}

export function TowTruckQueueSearchFilter({
  trackSearchValue,
  onTrackSearchSubmit,
  onTrackSearchClear,
  isSearching,
  activeLocalFilter,
  onLocalFilterChange,
  localCounts,
  className = "",
}: Props) {
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState(trackSearchValue);

  // Sync internal input when parent query changes (e.g. cleared via URL or reset)
  const isSearchActive = Boolean(trackSearchValue.trim());

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onTrackSearchSubmit(searchInput.trim());
  };

  const handleClear = () => {
    setSearchInput("");
    onTrackSearchClear();
  };

  const filterTabs: { key: TowTruckLocalFilterKey; labelKey: string; count: number }[] = [
    { key: "all", labelKey: "towTruck.filterAll", count: localCounts.all },
    { key: "unassigned", labelKey: "towTruck.filterUnassigned", count: localCounts.unassigned },
    { key: "assigned", labelKey: "towTruck.filterAssigned", count: localCounts.assigned },
    { key: "paid", labelKey: "towTruck.filterPaid", count: localCounts.paid },
    { key: "attention", labelKey: "towTruck.filterAttention", count: localCounts.attention },
  ];

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Server-side Search Row */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
        role="search"
        aria-label={t("towTruck.searchTrackPlaceholder")}
      >
        <div className="relative flex-1 min-w-0">
          <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none text-ink-400">
            <Search size={16} aria-hidden="true" />
          </div>
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t("towTruck.searchTrackPlaceholder")}
            aria-label={t("towTruck.searchTrackPlaceholder")}
            className="w-full h-10 ps-9 pe-8 rounded-lg border border-ink-200 bg-white text-sm text-ink-900 placeholder:text-ink-400 focus-visible:outline-2 focus-visible:outline-brand-blue"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              className="absolute inset-y-0 end-0 flex items-center pe-2.5 text-ink-400 hover:text-ink-600 focus-visible:outline-none"
              aria-label={t("towTruck.clearSearch")}
            >
              <X size={15} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="submit"
            variant="default"
            size="sm"
            disabled={isSearching || searchInput.trim() === trackSearchValue.trim()}
            className="h-10 px-4 min-w-[75px]"
          >
            {isSearching ? t("towTruck.searching") : t("towTruck.searchButton")}
          </Button>
          {isSearchActive && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="h-10 px-3 text-ink-600 gap-1"
            >
              <RotateCcw size={14} aria-hidden="true" />
              <span>{t("towTruck.clearSearch")}</span>
            </Button>
          )}
        </div>
      </form>

      {/* Active Search Notification */}
      {isSearchActive && (
        <div
          className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-md bg-brand-50 border border-brand-200 text-xs text-brand-800"
          role="status"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <Filter size={13} className="shrink-0 text-brand-600" aria-hidden="true" />
            <span>{t("towTruck.searchActiveNotice")}</span>
            <strong className="font-semibold truncate">
              <bdi>{trackSearchValue}</bdi>
            </strong>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="shrink-0 text-brand-600 hover:text-brand-800 font-medium underline"
          >
            {t("towTruck.clearSearch")}
          </button>
        </div>
      )}

      {/* Local Filter Tabs Row */}
      <div className="border-b border-ink-100">
        <div
          className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none"
          role="tablist"
          aria-label={t("towTruck.queue")}
        >
          {filterTabs.map((tab) => {
            const isActive = activeLocalFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onLocalFilterChange(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-brand-blue ${
                  isActive
                    ? "bg-brand-blue text-white shadow-xs"
                    : "bg-ink-50 hover:bg-ink-100 text-ink-700"
                }`}
              >
                <span>{t(tab.labelKey)}</span>
                <span
                  className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[11px] font-semibold tabular-nums ${
                    isActive ? "bg-white/20 text-white" : "bg-ink-200/80 text-ink-800"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Transparent local batch scope notice */}
        <p className="flex items-center gap-1.5 py-1 text-[11px] text-ink-500 leading-normal">
          <Info size={12} className="shrink-0 text-ink-400" aria-hidden="true" />
          <span>{t("towTruck.localFilterScope", { count: localCounts.all })}</span>
        </p>
      </div>
    </div>
  );
}
