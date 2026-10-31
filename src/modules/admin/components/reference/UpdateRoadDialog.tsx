/**
 * @file UpdateRoadDialog.tsx
 * @description Dialog for editing route reference price and active status.
 * Informs administrators of reference tariff updates without promising unverified historical-price behavior.
 */

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  updateRoadSchema,
  validateCostString,
  type UpdateRoadFormValues,
} from "../../schemas/roadsSchema";
import { useUpdateRoadMutation } from "../../hooks/useRoadsQueries";
import type { RoadResponseDto } from "../../api/roadsApi";
import { ArrowRight, AlertCircle, Loader2, Info } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  road: RoadResponseDto | null;
}

export function UpdateRoadDialog({ open, onOpenChange, road }: Props) {
  const { t } = useTranslation();
  const [serverError, setServerError] = useState<string | null>(null);

  const updateMutation = useUpdateRoadMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateRoadFormValues>({
    resolver: zodResolver(updateRoadSchema),
    defaultValues: {
      cost: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (road && open) {
      reset({
        cost: String(road.cost),
        isActive: road.isActive,
      });
    }
  }, [road, open, reset]);

  if (!road) return null;

  const handleDialogChange = (isOpen: boolean) => {
    setServerError(null);
    onOpenChange(isOpen);
  };

  const onSubmit = async (values: UpdateRoadFormValues) => {
    setServerError(null);
    const parsedCost = validateCostString(values.cost);
    if (!parsedCost) return;

    try {
      await updateMutation.mutateAsync({
        id: road.id,
        payload: {
          cost: parsedCost,
          isActive: values.isActive,
        },
      });
      toast.success(t("superAdmin.routes.updateSuccess"));
      onOpenChange(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("superAdmin.routes.updateFailed");
      setServerError(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-ink-900">
            {t("superAdmin.routes.editRouteTitle")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {serverError && (
            <div className="rounded-lg bg-danger-50 border border-danger-200 p-3 text-xs text-danger-700 flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Directional Route Details (Read-only) */}
          <div className="rounded-lg bg-ink-50 border border-ink-200 p-3 space-y-1">
            <span className="text-[11px] font-semibold text-ink-500 uppercase tracking-wider block">
              {t("superAdmin.routes.directionalRoute")}
            </span>
            <div className="flex items-center gap-2 text-sm font-bold text-ink-900">
              <span>{road.originCityName || `#${road.originCityId}`}</span>
              <ArrowRight size={14} className="text-brand-orange rtl:rotate-180" />
              <span>{road.destinationCityName || `#${road.destinationCityId}`}</span>
            </div>
          </div>

          {/* Reference Route Tariff Banner */}
          <div className="rounded-lg bg-info-50 border border-info-200 p-3 text-xs text-info-800 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-info-900">
              <Info size={14} />
              <span>{t("superAdmin.routes.pricePreservationTitle")}</span>
            </div>
            <p className="leading-relaxed">
              {t("superAdmin.routes.pricePreservationDesc")}
            </p>
          </div>

          {/* Price Input */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-cost" className="text-xs font-semibold text-ink-700">
              {t("superAdmin.routes.predefinedPrice")} (SAR) <span className="text-danger-500">*</span>
            </Label>
            <input
              id="edit-cost"
              type="text"
              inputMode="decimal"
              dir="ltr"
              {...register("cost")}
              disabled={isSubmitting}
              className="w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange"
            />
            {errors.cost && (
              <p className="text-xs text-danger-600">{t(`superAdmin.routes.${errors.cost.message}`)}</p>
            )}
          </div>

          {/* Active Status Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-ink-200 bg-white p-3">
            <div>
              <Label htmlFor="edit-isActive" className="text-xs font-semibold text-ink-900 cursor-pointer">
                {t("superAdmin.routes.routeStatus")}
              </Label>
              <p className="text-[11px] text-ink-500 mt-0.5">
                {t("superAdmin.routes.routeStatusHelp")}
              </p>
            </div>
            <input
              id="edit-isActive"
              type="checkbox"
              {...register("isActive")}
              disabled={isSubmitting}
              className="h-4 w-4 rounded border-ink-300 text-brand-orange focus:ring-brand-orange cursor-pointer"
            />
          </div>

          <DialogFooter className="pt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || updateMutation.isPending}
              className="bg-brand-orange hover:bg-brand-orange/90 text-white font-semibold"
            >
              {isSubmitting || updateMutation.isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin me-2" />
                  {t("superAdmin.routes.saving")}
                </>
              ) : (
                t("superAdmin.routes.saveChanges")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
