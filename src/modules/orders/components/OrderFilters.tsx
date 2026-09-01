/**
 * @file OrderFilters.tsx
 * @description Filter + sort toolbar above the orders table. LIVE-CONFIRMED
 * against GET /api/Orders: FilterBy only accepts "trackNumber" — any other
 * FilterBy value (status/userId/userFullName/...) returns HTTP 400
 * ("بيانات غير صالحة"), which previously broke the whole list query. So
 * search is the only server-side FilterBy/FilterValue use; the created-at
 * date range (DateFilterBy=createdAt/FromDate/ToDate) is a separate,
 * combinable pair of params that works standalone. The type <Select> here
 * now drives SERVER-SIDE filtering via the OrderType numeric-enum param
 * (its value/onChange feed the query path in OrdersPage.tsx). Status has no
 * dropdown here — it's filtered via the stats strip (OrderStatsStrip),
 * still client-side on the fetched batch.
 */
import { useTranslation } from "react-i18next";
import { ArrowDownAZ, ArrowUpAZ, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ORDER_TYPE_OPTIONS,
  orderTypeToI18nKey,
} from "../lib/orderEnums";
import type { OrderType } from "../types";

export type OrderSortBy = "createdAt" | "status";

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  type: OrderType | "all";
  onTypeChange: (value: OrderType | "all") => void;
  fromDate: string;
  onFromDateChange: (value: string) => void;
  toDate: string;
  onToDateChange: (value: string) => void;
  sortBy: OrderSortBy;
  onSortByChange: (value: OrderSortBy) => void;
  sortDescending: boolean;
  onSortDescendingChange: (value: boolean) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}

export function OrderFilters({
  search,
  onSearchChange,
  type,
  onTypeChange,
  fromDate,
  onFromDateChange,
  toDate,
  onToDateChange,
  sortBy,
  onSortByChange,
  sortDescending,
  onSortDescendingChange,
  onClear,
  hasActiveFilters,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={t("orders.filters.searchPlaceholder")}
        className="w-full sm:w-[220px]"
      />

      <Select value={type} onValueChange={(v) => onTypeChange(v as OrderType | "all")}>
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder={t("orders.filters.allTypes")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("orders.filters.allTypes")}</SelectItem>
          {ORDER_TYPE_OPTIONS.map((tp) => (
            <SelectItem key={tp} value={tp}>
              {t(orderTypeToI18nKey(tp))}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-1">
        <input
          type="date"
          dir="ltr"
          value={fromDate}
          onChange={(e) => onFromDateChange(e.target.value)}
          className="h-[var(--size-input-h)] rounded-[var(--radius-md)] border border-input bg-transparent px-3 text-sm text-[var(--color-ink-body)]"
          aria-label={t("orders.filters.fromDate")}
        />
        <span className="text-sm text-[var(--color-muted)]">{t("orders.filters.dateTo")}</span>
        <input
          type="date"
          dir="ltr"
          value={toDate}
          onChange={(e) => onToDateChange(e.target.value)}
          className="h-[var(--size-input-h)] rounded-[var(--radius-md)] border border-input bg-transparent px-3 text-sm text-[var(--color-ink-body)]"
          aria-label={t("orders.filters.toDate")}
        />
      </div>

      <Select value={sortBy} onValueChange={(v) => onSortByChange(v as OrderSortBy)}>
        <SelectTrigger className="w-full sm:w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="createdAt">{t("orders.filters.sortByCreatedAt")}</SelectItem>
          <SelectItem value="status">{t("orders.filters.sortByStatus")}</SelectItem>
        </SelectContent>
      </Select>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onSortDescendingChange(!sortDescending)}
      >
        {sortDescending ? <ArrowDownAZ className="size-4" /> : <ArrowUpAZ className="size-4" />}
        {sortDescending ? t("orders.filters.sort.desc") : t("orders.filters.sort.asc")}
      </Button>

      {hasActiveFilters && (
        <Button type="button" variant="ghost" size="sm" onClick={onClear}>
          <X className="size-4" />
          {t("orders.filters.clear")}
        </Button>
      )}
    </div>
  );
}
