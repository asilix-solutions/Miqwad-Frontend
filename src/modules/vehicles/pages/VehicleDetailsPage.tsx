import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Pencil, Plus, Trash2, Car } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@shared/components/ui/button";
import { LoadingState } from "@shared/components/feedback/LoadingState";
import { ErrorState } from "@shared/components/feedback/ErrorState";
import { useToast } from "@shared/components/ui/toastContext";
import {
  useMaintenanceHistoryQuery,
  useUpcomingServicesQuery,
  useVehicleQuery,
} from "../hooks/useVehiclesQuery";
import { useDeleteVehicleMutation } from "../hooks/useVehicleMutations";
import { MaintenanceHistoryTable } from "../components/MaintenanceHistoryTable";
import { AddMaintenanceModal } from "../components/AddMaintenanceModal";
import { UpcomingServicesList } from "../components/UpcomingServicesList";
import { DeleteVehicleDialog } from "../components/DeleteVehicleDialog";

/**
 * Vehicle Details page.
 * Composes the hero header, attribute grid, maintenance history,
 * and upcoming services for a single vehicle.
 */
export function VehicleDetailsPage() {
  const { t } = useTranslation();
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const id = Number(params.id);
  const validId = Number.isFinite(id) && id > 0;

  const vehicleQuery = useVehicleQuery(validId ? id : null);
  const historyQuery = useMaintenanceHistoryQuery(validId ? id : null);
  const upcomingQuery = useUpcomingServicesQuery(validId ? id : null);
  const deleteMutation = useDeleteVehicleMutation();

  const [showAddRecord, setShowAddRecord] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (vehicleQuery.isLoading) return <LoadingState />;
  if (vehicleQuery.isError || !vehicleQuery.data) {
    return <ErrorState onRetry={() => void vehicleQuery.refetch()} />;
  }

  const v = vehicleQuery.data;

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success(t("vehicles.deletedToast"));
      navigate("/app/vehicles");
    } catch (err) {
      toast.error(
        t("vehicles.deleteFailed"),
        err instanceof Error ? err.message : undefined,
      );
    }
  };

  return (
    <div className="space-y-6">
      <Link
        to="/app/vehicles"
        className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900"
      >
        <ArrowRight className="h-4 w-4 rtl:rotate-180" />
        {t("vehicles.backToList")}
      </Link>

      {/* Hero */}
      <Card className="overflow-hidden">
        <div className="relative h-44 bg-gradient-to-br from-brand-50 via-white to-navy-50 flex items-center justify-center">
          {v.imageUrl ? (
            <img
              src={v.imageUrl}
              alt={`${v.brandName} ${v.modelName}`}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <Car className="h-16 w-16 text-brand-500/60" aria-hidden />
          )}
        </div>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="font-display text-2xl font-semibold text-ink-900">
                {v.nickname || `${v.brandName} ${v.modelName}`}
              </h1>
              <p className="text-sm text-ink-500 mt-1">
                {v.brandName} {v.modelName} · {v.year} · {v.plateNumber}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link to={`/app/vehicles/${v.id}/edit`}>
                  <Pencil className="h-4 w-4" />
                  {t("common.edit")}
                </Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConfirmDelete(true)}
                className="text-danger-500 hover:bg-danger-50"
              >
                <Trash2 className="h-4 w-4" />
                {t("common.delete")}
              </Button>
            </div>
          </div>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Fact label={t("vehicles.fields.brand")} value={v.brandName} />
            <Fact label={t("vehicles.fields.model")} value={v.modelName} />
            <Fact label={t("vehicles.fields.year")} value={String(v.year)} />
            <Fact label={t("vehicles.fields.plate")} value={v.plateNumber} />
            <Fact label={t("vehicles.fields.color")} value={v.color ?? "—"} />
            <Fact
              label={t("vehicles.fields.mileage")}
              value={v.mileage != null ? `${new Intl.NumberFormat().format(v.mileage)} km` : "—"}
            />
            <Fact
              label={t("vehicles.fields.fuelType")}
              value={v.fuelType ? t(`vehicles.fields.fuel${capitalize(v.fuelType)}` as const) : "—"}
            />
            <Fact label={t("vehicles.fields.vin")} value={v.vin ?? "—"} />
            <Fact
              label={t("vehicles.fields.registrationDate")}
              value={v.registrationDate ?? "—"}
            />
            <Fact
              label={t("vehicles.cards.addedOn")}
              value={formatDate(v.createdAt)}
            />
          </dl>
        </CardContent>
      </Card>

      {/* Maintenance history */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink-900">
            {t("maintenance.title")}
          </h2>
          <Button type="button" size="sm" onClick={() => setShowAddRecord(true)}>
            <Plus className="h-4 w-4" />
            {t("maintenance.addRecord")}
          </Button>
        </div>
        <MaintenanceHistoryTable
          records={historyQuery.data}
          isLoading={historyQuery.isLoading}
          isError={historyQuery.isError}
          onRetry={() => void historyQuery.refetch()}
        />
      </section>

      {/* Upcoming services */}
      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-ink-900">
          {t("upcoming.title")}
        </h2>
        <UpcomingServicesList
          services={upcomingQuery.data}
          isLoading={upcomingQuery.isLoading}
          isError={upcomingQuery.isError}
          onRetry={() => void upcomingQuery.refetch()}
        />
      </section>

      <AddMaintenanceModal
        open={showAddRecord}
        onOpenChange={setShowAddRecord}
        vehicleId={id}
      />

      <DeleteVehicleDialog
        vehicle={confirmDelete ? v : null}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-sm)] bg-ink-50 p-3">
      <dt className="text-xs text-ink-500">{label}</dt>
      <dd className="mt-1 font-display text-sm font-semibold text-ink-900 truncate">{value}</dd>
    </div>
  );
}

function capitalize<T extends string>(s: T): Capitalize<T> {
  return (s.charAt(0).toUpperCase() + s.slice(1)) as Capitalize<T>;
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
