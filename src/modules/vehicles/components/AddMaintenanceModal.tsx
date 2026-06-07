import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { Textarea } from "@shared/components/ui/textarea";
import { Button } from "@shared/components/ui/button";
import { useToast } from "@shared/components/ui/toastContext";
import {
  maintenanceRecordSchema,
  type MaintenanceRecordFormValues,
} from "../schemas/vehicles.schemas";
import { useAddMaintenanceRecordMutation } from "../hooks/useVehicleMutations";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  vehicleId: number;
}

/**
 * Modal form for adding a maintenance record.
 * Keeps the parent (Details page) clean — it only renders the modal
 * and toggles the `open` flag.
 */
export function AddMaintenanceModal({ open, onOpenChange, vehicleId }: Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const mutation = useAddMaintenanceRecordMutation(vehicleId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MaintenanceRecordFormValues>({
    resolver: zodResolver(maintenanceRecordSchema),
    defaultValues: {
      serviceName: "",
      providerName: "",
      date: new Date().toISOString().slice(0, 10),
      mileage: undefined,
      cost: undefined,
      notes: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await mutation.mutateAsync({
        serviceName: values.serviceName,
        providerName: values.providerName || undefined,
        date: values.date,
        mileage: values.mileage,
        cost: values.cost,
        notes: values.notes || undefined,
      });
      toast.success(t("maintenance.addedToast"));
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(
        t("maintenance.addFailed"),
        err instanceof Error ? err.message : undefined,
      );
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{t("maintenance.addRecordTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate>
          <DialogBody className="space-y-4">
            <div>
              <Label htmlFor="serviceName">{t("maintenance.fields.service")}</Label>
              <Input
                id="serviceName"
                placeholder={t("maintenance.fields.servicePlaceholder")}
                invalid={!!errors.serviceName}
                {...register("serviceName")}
              />
              {errors.serviceName && (
                <p className="mt-1 text-xs text-danger-500">
                  {t(errors.serviceName.message ?? "common.requiredField")}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="providerName">{t("maintenance.fields.provider")}</Label>
              <Input
                id="providerName"
                placeholder={t("maintenance.fields.providerPlaceholder")}
                {...register("providerName")}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="date">{t("maintenance.fields.date")}</Label>
                <Input
                  id="date"
                  type="date"
                  invalid={!!errors.date}
                  {...register("date")}
                />
                {errors.date && (
                  <p className="mt-1 text-xs text-danger-500">
                    {t(errors.date.message ?? "common.requiredField")}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="mileage">{t("maintenance.fields.mileage")}</Label>
                <Input
                  id="mileage"
                  inputMode="numeric"
                  {...register("mileage", {
                    setValueAs: (v: unknown) => {
                      if (v === "" || v === null || v === undefined) return undefined;
                      const n = Number(v);
                      return Number.isFinite(n) ? n : undefined;
                    },
                  })}
                />
              </div>
              <div>
                <Label htmlFor="cost">{t("maintenance.fields.cost")}</Label>
                <Input
                  id="cost"
                  inputMode="decimal"
                  {...register("cost", {
                    setValueAs: (v: unknown) => {
                      if (v === "" || v === null || v === undefined) return undefined;
                      const n = Number(v);
                      return Number.isFinite(n) ? n : undefined;
                    },
                  })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">{t("maintenance.fields.notes")}</Label>
              <Textarea
                id="notes"
                placeholder={t("maintenance.fields.notesPlaceholder")}
                {...register("notes")}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? t("common.loading") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
