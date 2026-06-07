import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Car, Eye, Pencil, Trash2, Fuel, Gauge } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Vehicle } from "../types";

interface Props {
  vehicle: Vehicle;
  onDelete: (vehicle: Vehicle) => void;
}

/**
 * Compact card used in the Vehicles list grid.
 * Shows hero photo / brand placeholder, key facts, and action buttons.
 */
export function VehicleCard({ vehicle, onDelete }: Props) {
  const { t } = useTranslation();

  const fuelLabel = vehicle.fuelType
    ? t(`vehicles.fields.fuel${capitalize(vehicle.fuelType)}` as const)
    : "—";

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="relative h-36 bg-gradient-to-br from-brand-50 to-navy-50 flex items-center justify-center">
        {vehicle.imageUrl ? (
          <img
            src={vehicle.imageUrl}
            alt={`${vehicle.brandName} ${vehicle.modelName}`}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <Car className="h-12 w-12 text-brand-500/60" aria-hidden />
        )}
        <span className="absolute end-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-ink-900 shadow-[var(--shadow-1)]">
          {vehicle.year}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <h3 className="font-display text-base font-semibold text-ink-900 truncate">
            {vehicle.nickname || `${vehicle.brandName} ${vehicle.modelName}`}
          </h3>
          <p className="text-xs text-ink-500 truncate">
            {vehicle.brandName} {vehicle.modelName}
          </p>
        </div>

        <dl className="grid grid-cols-3 gap-2 text-xs">
          <Stat
            icon={<span className="font-mono text-[10px]">#</span>}
            label={t("vehicles.cards.plate")}
            value={vehicle.plateNumber}
          />
          <Stat
            icon={<Gauge className="h-3.5 w-3.5" />}
            label={t("vehicles.cards.mileage")}
            value={vehicle.mileage != null ? formatNumber(vehicle.mileage) : "—"}
          />
          <Stat
            icon={<Fuel className="h-3.5 w-3.5" />}
            label={t("vehicles.cards.fuel")}
            value={fuelLabel}
          />
        </dl>

        <div className="mt-auto flex flex-wrap gap-2">
          <Button asChild size="sm" variant="primary" className="flex-1">
            <Link to={`/app/vehicles/${vehicle.id}`}>
              <Eye className="h-4 w-4" />
              {t("vehicles.detailsTitle")}
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to={`/app/vehicles/${vehicle.id}/edit`} aria-label={t("common.edit")}>
              <Pencil className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onDelete(vehicle)}
            aria-label={t("common.delete")}
            className="text-danger-500 hover:bg-danger-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[var(--radius-sm)] bg-ink-50 p-2">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-ink-500">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-0.5 font-display text-xs font-semibold text-ink-900 truncate">{value}</p>
    </div>
  );
}

function capitalize<T extends string>(s: T): Capitalize<T> {
  return (s.charAt(0).toUpperCase() + s.slice(1)) as Capitalize<T>;
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat().format(n);
}
