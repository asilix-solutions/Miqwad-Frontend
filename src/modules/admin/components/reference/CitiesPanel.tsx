/**
 * @file CitiesPanel.tsx
 * @description Cities Administration panel for Reference Data.
 * Fully wired to live GET /api/Cities, GET /api/Cities/{id}, and POST /api/Cities.
 * Arabic-first RTL design consistent with Admin Reference Data modules.
 */

import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Eye, Search, RefreshCw, AlertCircle, MapPin, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCitiesPaginatedQuery } from "../../hooks/useRoadsQueries";
import type { CityDto } from "../../api/roadsApi";
import { CreateCityDialog } from "./CreateCityDialog";
import { CityDetailDialog } from "./CityDetailDialog";
import { Can } from "@shared/auth/Can";

export function CitiesPanel() {
  const { t } = useTranslation();

  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailCityId, setDetailCityId] = useState<number | null>(null);

  const queryParams = useMemo(() => {
    return {
      pageNumber: page,
      pageSize,
      filterBy: search ? "name" : undefined,
      filterValue: search || undefined,
    };
  }, [page, pageSize, search]);

  const {
    data: paginatedData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useCitiesPaginatedQuery(queryParams);

  // Client-side search and status filter fallback for instant responsiveness
  const filteredItems = useMemo(() => {
    const rawItems = paginatedData?.items ?? [];
    return rawItems.filter((city: CityDto) => {
      if (statusFilter === "active" && !city.isActive) return false;
      if (statusFilter === "inactive" && city.isActive) return false;

      if (search.trim()) {
        const query = search.trim().toLowerCase();
        const nameMatch = (city.name ?? "").toLowerCase().includes(query);
        const codeMatch = (city.countryCode ?? "").toLowerCase().includes(query);
        const placeMatch = (city.googlePlaceId ?? "").toLowerCase().includes(query);
        return nameMatch || codeMatch || placeMatch;
      }
      return true;
    });
  }, [paginatedData?.items, search, statusFilter]);

  const totalCount = paginatedData?.total ?? filteredItems.length;
  const totalPages = paginatedData?.totalPages ?? Math.max(1, Math.ceil(totalCount / pageSize));

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString("ar-SA", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* ── Top Toolbar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[var(--color-ink-body)]">
            {t("superAdmin.cities.title")}
          </h2>
          <p className="text-xs text-[var(--color-muted)] mt-0.5">
            {t("superAdmin.cities.subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="h-9 px-3 text-xs"
          >
            <RefreshCw className={`size-3.5 me-1.5 ${isFetching ? "animate-spin" : ""}`} />
            {t("common.refresh", "تحديث")}
          </Button>

          <Can permission="cities.create">
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="h-9 bg-[var(--color-brand-orange)] hover:bg-[var(--color-brand-orange-hover,#e3460f)] text-white font-semibold px-4 text-xs shadow-sm"
            >
              <Plus className="size-4 me-1.5" />
              {t("superAdmin.cities.add")}
            </Button>
          </Can>
        </div>
      </div>

      {/* ── Search & Filter Toolbar ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-white p-3 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="size-4 text-[var(--color-muted)] absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t("superAdmin.cities.filters.searchPlaceholder")}
            className="ps-9 h-9 text-xs bg-[var(--color-surface-2)] border-0 focus-visible:ring-1 focus-visible:ring-[var(--color-brand-orange)]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as "all" | "active" | "inactive");
              setPage(1);
            }}
            className="h-9 text-xs rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-white px-3 text-[var(--color-ink-body)] focus:border-[var(--color-brand-orange)] focus:ring-1 focus:ring-[var(--color-brand-orange)]"
          >
            <option value="all">{t("superAdmin.cities.filters.allStatuses")}</option>
            <option value="active">{t("superAdmin.cities.filters.activeOnly")}</option>
            <option value="inactive">{t("superAdmin.cities.filters.inactiveOnly")}</option>
          </select>
        </div>
      </div>

      {/* ── Content States ── */}
      {isLoading ? (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-white p-12 flex flex-col items-center justify-center gap-3 shadow-xs">
          <RefreshCw className="size-6 animate-spin text-[var(--color-brand-orange)]" />
          <span className="text-xs text-[var(--color-muted)]">{t("common.loading")}</span>
        </div>
      ) : isError ? (
        <div className="rounded-[var(--radius-md)] border border-danger-200 bg-danger-50 p-6 flex flex-col items-center justify-center gap-3 text-center">
          <AlertCircle className="size-8 text-danger-500" />
          <div>
            <h4 className="text-sm font-bold text-danger-800">
              {t("superAdmin.cities.errors.fetchFailed")}
            </h4>
            <p className="text-xs text-danger-600 mt-1">
              {error instanceof Error ? error.message : ""}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="mt-1 border-danger-300 text-danger-700 hover:bg-danger-100"
          >
            <RefreshCw className="size-3.5 me-1.5" />
            {t("common.retry")}
          </Button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-white p-12 flex flex-col items-center justify-center text-center gap-3 shadow-xs">
          <div className="size-12 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-muted)]">
            <MapPin className="size-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[var(--color-ink-body)]">
              {search || statusFilter !== "all"
                ? t("superAdmin.cities.empty.noResults")
                : t("superAdmin.cities.empty.title")}
            </h4>
            <p className="text-xs text-[var(--color-muted)] mt-1 max-w-sm">
              {search || statusFilter !== "all"
                ? ""
                : t("superAdmin.cities.empty.description")}
            </p>
          </div>
          {!search && statusFilter === "all" && (
            <Can permission="cities.create">
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="mt-2 bg-[var(--color-brand-orange)] hover:bg-[var(--color-brand-orange-hover,#e3460f)] text-white text-xs"
              >
                <Plus className="size-4 me-1.5" />
                {t("superAdmin.cities.add")}
              </Button>
            </Can>
          )}
        </div>
      ) : (
        /* ── Populated Table State ── */
        <div className="rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[var(--color-surface-2)] border-b border-[var(--color-divider)] text-[var(--color-muted)] font-medium">
                <tr>
                  <th className="py-3 px-4 font-semibold w-12">
                    {t("superAdmin.cities.columns.id")}
                  </th>
                  <th className="py-3 px-4 font-semibold">
                    {t("superAdmin.cities.columns.name")}
                  </th>
                  <th className="py-3 px-4 font-semibold">
                    {t("superAdmin.cities.columns.countryCode")}
                  </th>
                  <th className="py-3 px-4 font-semibold">
                    {t("superAdmin.cities.columns.coordinates")}
                  </th>
                  <th className="py-3 px-4 font-semibold">
                    {t("superAdmin.cities.columns.googlePlaceId")}
                  </th>
                  <th className="py-3 px-4 font-semibold">
                    {t("superAdmin.cities.columns.status")}
                  </th>
                  <th className="py-3 px-4 font-semibold">
                    {t("superAdmin.cities.columns.createdAt")}
                  </th>
                  <th className="py-3 px-4 font-semibold text-center w-24">
                    {t("superAdmin.cities.columns.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-divider)]">
                {filteredItems.map((city) => (
                  <tr
                    key={city.id}
                    className="hover:bg-[var(--color-surface-2)] transition-colors duration-100 group"
                  >
                    <td className="py-3.5 px-4 font-mono text-[var(--color-muted)]">
                      #{city.id}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-[var(--color-ink-body)]">
                      {city.name || `#${city.id}`}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-mono uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-semibold border border-slate-200">
                        <Globe className="size-3 text-slate-500" />
                        {city.countryCode || "SA"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[var(--color-muted)]" dir="ltr">
                      {typeof city.latitude === "number" &&
                      typeof city.longitude === "number" &&
                      !isNaN(city.latitude) &&
                      !isNaN(city.longitude) ? (
                        <span className="inline-flex items-center gap-1 text-[11px]">
                          <MapPin className="size-3 text-[var(--color-brand-orange)]" />
                          {city.latitude.toFixed(4)}, {city.longitude.toFixed(4)}
                        </span>
                      ) : (
                        <span>—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-600 max-w-[160px] truncate" dir="ltr">
                      <span title={city.googlePlaceId || ""}>
                        {city.googlePlaceId || "—"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge
                        variant="outline"
                        className={
                          city.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px]"
                            : "bg-slate-100 text-slate-600 border-slate-200 text-[11px]"
                        }
                      >
                        {city.isActive
                          ? t("superAdmin.cities.columns.active")
                          : t("superAdmin.cities.columns.inactive")}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-[var(--color-muted)]">
                      {formatDate(city.createdAt)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDetailCityId(city.id)}
                        className="h-8 w-8 text-[var(--color-ink-secondary)] hover:text-[var(--color-brand-orange)] hover:bg-orange-50 rounded-[var(--radius-md)]"
                        title={t("superAdmin.cities.details.title")}
                      >
                        <Eye className="size-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Pagination Footer ── */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-3 border-t border-[var(--color-divider)] bg-[var(--color-surface-2)] text-xs text-[var(--color-muted)] gap-3">
            <span>
              {t("common.paginationInfo", {
                page,
                total: totalPages,
                count: totalCount,
                defaultValue: `صفحة ${page} من ${totalPages} (إجمالي ${totalCount} مدينة)`,
              })}
            </span>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="h-8 text-xs px-2.5"
              >
                {t("common.previous", "السابق")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="h-8 text-xs px-2.5"
              >
                {t("common.next", "التالي")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Dialogs ── */}
      <CreateCityDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {detailCityId !== null && (
        <CityDetailDialog
          cityId={detailCityId}
          open={detailCityId !== null}
          onOpenChange={(open) => !open && setDetailCityId(null)}
        />
      )}
    </div>
  );
}
