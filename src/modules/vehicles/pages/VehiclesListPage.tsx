import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Car, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingState } from "@shared/components/feedback/LoadingState";
import { ErrorState } from "@shared/components/feedback/ErrorState";
import { EmptyState } from "@shared/components/feedback/EmptyState";
import { useToast } from "@shared/components/ui/toastContext";
import { useAppDispatch, useAppSelector } from "@app/store";
import { useVehiclesListQuery } from "../hooks/useVehiclesQuery";
import { useDeleteVehicleMutation } from "../hooks/useVehicleMutations";
import { setListFilters } from "../store/vehiclesSlice";
import { VehicleCard } from "../components/VehicleCard";
import { DeleteVehicleDialog } from "../components/DeleteVehicleDialog";
import type { Vehicle } from "../types";

/**
 * Vehicles list page.
 *
 * Responsibilities:
 *   - Fetch the user's garage and render a responsive grid of cards.
 *   - Search by plate / nickname and filter by fuel type — both
 *     persisted in Redux so navigating to Details and back
 *     restores the user's view.
 *   - Delete flow with confirmation dialog.
 */
export function VehiclesListPage() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const filters = useAppSelector((s) => s.vehicles.listFilters);
  const toast = useToast();

  const listQuery = useVehiclesListQuery();
  const deleteMutation = useDeleteVehicleMutation();
  const [pendingDelete, setPendingDelete] = useState<Vehicle | null>(null);

  // Client-side filtering — list is small (typically <50 vehicles per user).
  // Server-side filtering can be added later by passing filters to the API.
  const filtered = useMemo(() => {
    if (!listQuery.data) return [];
    const term = filters.search.trim().toLowerCase();
    return listQuery.data.filter((v) => {
      if (filters.fuelType && v.fuelType !== filters.fuelType) return false;
      if (!term) return true;
      const haystack = [v.plateNumber, v.nickname, v.brandName, v.modelName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [listQuery.data, filters]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteMutation.mutateAsync(pendingDelete.id);
      toast.success(t("vehicles.deletedToast"));
      setPendingDelete(null);
    } catch (err) {
      toast.error(
        t("vehicles.deleteFailed"),
        err instanceof Error ? err.message : undefined,
      );
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900">
            {t("vehicles.title")}
          </h1>
          <p className="text-sm text-ink-500 mt-1">{t("vehicles.subtitle")}</p>
        </div>
        <Button asChild>
          <Link to="/app/vehicles/add">
            <Plus className="h-4 w-4" />
            {t("vehicles.addNew")}
          </Link>
        </Button>
      </header>

      <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <Input
            placeholder={t("vehicles.search")}
            value={filters.search}
            onChange={(e) => dispatch(setListFilters({ search: e.target.value }))}
            className="ps-9"
            aria-label={t("common.search")}
          />
        </div>
        <Select
          value={filters.fuelType || "all"}
          onValueChange={(val) =>
            dispatch(setListFilters({
              fuelType: (val === "all" ? "" : val) as typeof filters.fuelType,
            }))
          }
        >
          <SelectTrigger aria-label={t("vehicles.fields.fuelType")} className="w-full">
            <SelectValue placeholder={t("vehicles.filterAll")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("vehicles.filterAll")}</SelectItem>
            <SelectItem value="gasoline">{t("vehicles.fields.fuelGasoline")}</SelectItem>
            <SelectItem value="diesel">{t("vehicles.fields.fuelDiesel")}</SelectItem>
            <SelectItem value="hybrid">{t("vehicles.fields.fuelHybrid")}</SelectItem>
            <SelectItem value="electric">{t("vehicles.fields.fuelElectric")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {listQuery.isLoading && <LoadingState />}
      {listQuery.isError && <ErrorState onRetry={() => void listQuery.refetch()} />}

      {!listQuery.isLoading && !listQuery.isError && filtered.length === 0 && (
        <EmptyState
          icon={<Car className="h-6 w-6 text-ink-500" aria-hidden />}
          title={t("vehicles.empty")}
          description={t("vehicles.emptyDescription")}
          action={
            <Button asChild>
              <Link to="/app/vehicles/add">
                <Plus className="h-4 w-4" />
                {t("vehicles.addNew")}
              </Link>
            </Button>
          }
        />
      )}

      {filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((v) => (
            <VehicleCard key={v.id} vehicle={v} onDelete={setPendingDelete} />
          ))}
        </div>
      )}

      <DeleteVehicleDialog
        vehicle={pendingDelete}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
