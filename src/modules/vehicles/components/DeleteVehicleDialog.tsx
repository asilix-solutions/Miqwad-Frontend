import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Vehicle } from "../types";
import { getBrandDisplayName } from "../lib/brandLocalization";
import { getVehicleModelDisplayName } from "../lib/modelLocalization";

interface Props {
  vehicle: Vehicle | null;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

/**
 * Confirmation dialog for vehicle deletion.
 * Stateless — the parent owns the "selected vehicle" state and toggles
 * the dialog visibility by setting/unsetting `vehicle`.
 */
export function DeleteVehicleDialog({ vehicle, onCancel, onConfirm, loading }: Props) {
  const { t, i18n } = useTranslation();
  const open = vehicle != null;
  const brandDisplay = vehicle
    ? getBrandDisplayName({ id: vehicle.brandId, name: vehicle.brandName }, i18n.language)
    : "";
  const modelDisplay = getVehicleModelDisplayName(vehicle, i18n.language);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent size="sm">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger-50 text-danger-500">
              <AlertTriangle className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <DialogTitle>{t("vehicles.deleteTitle")}</DialogTitle>
              <DialogDescription>{t("vehicles.deleteConfirm")}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        {vehicle && (
          <DialogBody>
            <div className="rounded-[var(--radius-sm)] bg-ink-50 p-3 text-sm">
              <p className="font-medium text-ink-900">
                {vehicle.nickname || `${brandDisplay} ${modelDisplay}`}
              </p>
              <p className="text-xs text-ink-500 mt-0.5">
                {brandDisplay} {modelDisplay} · {vehicle.year} · {vehicle.plateNumber}
              </p>
            </div>
          </DialogBody>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            {t("common.cancel")}
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? t("common.loading") : t("common.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
