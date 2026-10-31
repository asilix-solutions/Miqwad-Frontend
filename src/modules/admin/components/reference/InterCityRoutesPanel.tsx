/**
 * @file InterCityRoutesPanel.tsx
 * @description Admin Reference Panel for managing InterCity Tow Truck Routes and Pricing.
 * Handles listing, filtering by origin/destination/status, directional route display,
 * and dialog triggers for route creation and price updates.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, RefreshCw, ArrowRight, Route, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Can } from "@shared/auth/Can";
import {
  useRoadsQuery,
  useCitiesListQuery,
} from "../../hooks/useRoadsQueries";
import type { RoadResponseDto } from "../../api/roadsApi";
import { CreateRoadDialog } from "./CreateRoadDialog";
import { UpdateRoadDialog } from "./UpdateRoadDialog";

export function InterCityRoutesPanel() {
  const { t } = useTranslation();

  const [originFilter, setOriginFilter] = useState<string>("");
  const [destinationFilter, setDestinationFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState<number>(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedRoad, setSelectedRoad] = useState<RoadResponseDto | null>(null);

  const citiesQuery = useCitiesListQuery();
  const cities = citiesQuery.data ?? [];

  const roadsQuery = useRoadsQuery({
    pageNumber: page,
    pageSize: 20,
    originCityId: originFilter ? Number(originFilter) : undefined,
    destinationCityId: destinationFilter ? Number(destinationFilter) : undefined,
    isActive: statusFilter === "active" ? true : statusFilter === "inactive" ? false : undefined,
  });

  const roadsData = roadsQuery.data;
  const items = roadsData?.items ?? [];
  const totalPages = roadsData?.totalPages ?? 1;

  const handleEdit = (road: RoadResponseDto) => {
    setSelectedRoad(road);
    setEditOpen(true);
  };

  const handleClearFilters = () => {
    setOriginFilter("");
    setDestinationFilter("");
    setStatusFilter("all");
    setPage(1);
  };

  const hasActiveFilters = originFilter !== "" || destinationFilter !== "" || statusFilter !== "all";

  return (
    <div className="space-y-5">
      {/* ── Cities Fetch Warning (if failed) ── */}
      {citiesQuery.isError && (
        <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{t("superAdmin.routes.citiesFetchError")}</span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => void citiesQuery.refetch()}
            disabled={citiesQuery.isFetching}
            className="h-6 px-2 text-xs text-amber-900 hover:bg-amber-100"
          >
            {t("common.retry")}
          </Button>
        </div>
      )}

      {/* ── Action Toolbar & Search ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Origin filter */}
          <select
            value={originFilter}
            onChange={(e) => {
              setOriginFilter(e.target.value);
              setPage(1);
            }}
            aria-label={t("superAdmin.routes.filterOrigin")}
            className="rounded-md border border-ink-200 bg-white px-3 py-1.5 text-xs text-ink-800 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange"
          >
            <option value="">{t("superAdmin.routes.allOrigins")}</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name || `#${c.id}`}
              </option>
            ))}
          </select>

          {/* Destination filter */}
          <select
            value={destinationFilter}
            onChange={(e) => {
              setDestinationFilter(e.target.value);
              setPage(1);
            }}
            aria-label={t("superAdmin.routes.filterDestination")}
            className="rounded-md border border-ink-200 bg-white px-3 py-1.5 text-xs text-ink-800 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange"
          >
            <option value="">{t("superAdmin.routes.allDestinations")}</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name || `#${c.id}`}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            aria-label={t("superAdmin.routes.filterStatus")}
            className="rounded-md border border-ink-200 bg-white px-3 py-1.5 text-xs text-ink-800 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange"
          >
            <option value="all">{t("superAdmin.routes.allStatuses")}</option>
            <option value="active">{t("superAdmin.routes.statusActive")}</option>
            <option value="inactive">{t("superAdmin.routes.statusInactive")}</option>
          </select>

          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-xs text-ink-500 hover:text-ink-800"
            >
              {t("superAdmin.routes.clearFilters")}
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void roadsQuery.refetch()}
            disabled={roadsQuery.isFetching}
            className="h-8 px-2.5 text-xs text-ink-600"
            title={t("superAdmin.routes.refresh")}
          >
            <RefreshCw size={13} className={roadsQuery.isFetching ? "animate-spin" : ""} />
          </Button>
        </div>

        {/* Create route button */}
        <Can permission="orders.manage">
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-brand-orange hover:bg-brand-orange/90 text-white font-semibold text-xs sm:text-sm shrink-0"
          >
            <Plus className="me-1.5 h-4 w-4" />
            {t("superAdmin.routes.addRoute")}
          </Button>
        </Can>
      </div>

      {/* ── Table Container with Mutually Exclusive UI States ── */}
      <div className="rounded-xl border border-ink-200 bg-white shadow-xs overflow-hidden">
        {/* 1. Loading State */}
        {roadsQuery.isLoading ? (
          <div className="py-16 text-center text-ink-400 text-sm">
            <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-brand-orange" />
            <p>{t("common.loading")}</p>
          </div>
        ) : /* 2. Error State (Never shows empty state simultaneously; retry preserves filter state) */
        roadsQuery.isError ? (
          <div className="py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-danger-50 text-danger-600 flex items-center justify-center mx-auto mb-3">
              <AlertCircle size={24} />
            </div>
            <h4 className="text-sm font-bold text-ink-800 mb-1">
              {t("superAdmin.routes.fetchError")}
            </h4>
            <p className="text-xs text-ink-500 max-w-sm mx-auto mb-4">
              {roadsQuery.error instanceof Error ? roadsQuery.error.message : t("superAdmin.routes.fetchError")}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void roadsQuery.refetch()}
              disabled={roadsQuery.isFetching}
              className="gap-2 text-xs"
            >
              <RefreshCw size={13} className={roadsQuery.isFetching ? "animate-spin" : ""} />
              {t("common.retry")}
            </Button>
          </div>
        ) : /* 3. Successful Empty Result (Distinguishes active filter vs genuinely empty route database) */
        items.length === 0 ? (
          <div className="py-16 text-center text-ink-500 px-4">
            <Route size={36} className="mx-auto mb-3 text-ink-300" />
            <h4 className="text-sm font-bold text-ink-800 mb-1">
              {hasActiveFilters
                ? t("superAdmin.routes.noRoutesFound")
                : t("superAdmin.routes.emptyRoutesTitle")}
            </h4>
            <p className="text-xs text-ink-500 max-w-sm mx-auto mb-4">
              {hasActiveFilters
                ? t("superAdmin.routes.noFilteredRoutesDesc")
                : t("superAdmin.routes.emptyRoutesHint")}
            </p>
            {hasActiveFilters ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="text-xs"
              >
                {t("superAdmin.routes.clearFilters")}
              </Button>
            ) : (
              <Can permission="orders.manage">
                <Button
                  onClick={() => setCreateOpen(true)}
                  className="bg-brand-orange hover:bg-brand-orange/90 text-white font-semibold text-xs"
                >
                  <Plus className="me-1.5 h-3.5 w-3.5" />
                  {t("superAdmin.routes.addRoute")}
                </Button>
              </Can>
            )}
          </div>
        ) : (
          /* 4. Successful Populated Table */
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs border-collapse">
              <thead>
                <tr className="border-b border-ink-200 bg-ink-50/75 text-ink-600 font-semibold select-none">
                  <th scope="col" className="py-3 px-4 text-start whitespace-nowrap min-w-[240px]">
                    {t("superAdmin.routes.colDirectionalRoute")}
                  </th>
                  <th scope="col" className="py-3 px-4 text-start whitespace-nowrap min-w-[140px]">
                    {t("superAdmin.routes.colPrice")}
                  </th>
                  <th scope="col" className="py-3 px-4 text-start whitespace-nowrap min-w-[110px]">
                    {t("superAdmin.routes.colStatus")}
                  </th>
                  <th scope="col" className="py-3 px-4 text-start whitespace-nowrap hidden sm:table-cell min-w-[130px]">
                    {t("superAdmin.routes.colCreatedAt")}
                  </th>
                  <th scope="col" className="py-3 px-4 text-end whitespace-nowrap min-w-[80px]">
                    {t("common.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {items.map((road) => (
                  <tr key={road.id} className="hover:bg-brand-50/30 transition-colors">
                    {/* Directional Route */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 font-medium text-ink-900">
                        <span className="font-semibold">{road.originCityName || `#${road.originCityId}`}</span>
                        <ArrowRight size={13} className="text-brand-orange shrink-0 rtl:rotate-180" aria-hidden="true" />
                        <span className="font-semibold">{road.destinationCityName || `#${road.destinationCityId}`}</span>
                      </div>
                    </td>

                    {/* Predefined Price */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-bold text-sm text-brand-blue" dir="ltr">
                        <span>{Number(road.cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <span className="text-xs text-ink-500 font-normal">{t("common.sar")}</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      {road.isActive ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <CheckCircle2 size={11} />
                          <span>{t("superAdmin.routes.statusActive")}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink-500 bg-ink-100 border border-ink-200 px-2 py-0.5 rounded-full">
                          <XCircle size={11} />
                          <span>{t("superAdmin.routes.statusInactive")}</span>
                        </span>
                      )}
                    </td>

                    {/* Created Date */}
                    <td className="py-3 px-4 hidden sm:table-cell text-ink-500 text-[11px]">
                      {road.createdAt ? new Date(road.createdAt).toLocaleDateString() : "—"}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-end">
                      <Can permission="orders.manage">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(road)}
                          className="h-7 w-7 p-0 text-ink-600 hover:text-brand-blue hover:bg-brand-50"
                          title={t("superAdmin.routes.editPrice")}
                        >
                          <Pencil size={13} />
                        </Button>
                      </Can>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination bar: Only shown after successful populated fetch */}
        {!roadsQuery.isLoading && !roadsQuery.isError && totalPages > 1 && (
          <div className="p-3 border-t border-ink-100 flex items-center justify-between text-xs text-ink-600">
            <span>
              {t("superAdmin.routes.pageOf", { page, total: totalPages })}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-7 text-xs px-2.5"
              >
                {t("superAdmin.routes.previous")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-7 text-xs px-2.5"
              >
                {t("superAdmin.routes.next")}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreateRoadDialog open={createOpen} onOpenChange={setCreateOpen} />
      <UpdateRoadDialog open={editOpen} onOpenChange={setEditOpen} road={selectedRoad} />
    </div>
  );
}
