/**
 * @file CreateRoadDialog.tsx
 * @description Dialog for creating a directional InterCity route with predefined pricing.
 */

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  createRoadSchema,
  validateCostString,
  type CreateRoadFormValues,
} from "../../schemas/roadsSchema";
import { useCreateRoadMutation, useCitiesListQuery } from "../../hooks/useRoadsQueries";
import { ArrowRight, AlertCircle, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateRoadDialog({ open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const [serverError, setServerError] = useState<string | null>(null);

  const citiesQuery = useCitiesListQuery();
  const createMutation = useCreateRoadMutation();

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateRoadFormValues>({
    resolver: zodResolver(createRoadSchema),
    defaultValues: {
      originCityId: "",
      destinationCityId: "",
      cost: "",
    },
  });

  const selectedOrigin = useWatch({ control, name: "originCityId" });
  const selectedDest = useWatch({ control, name: "destinationCityId" });

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setServerError(null);
      reset();
    }
    onOpenChange(isOpen);
  };

  const onSubmit = async (values: CreateRoadFormValues) => {
    setServerError(null);
    const parsedCost = validateCostString(values.cost);
    if (!parsedCost) return;

    try {
      await createMutation.mutateAsync({
        originCityId: Number(values.originCityId),
        destinationCityId: Number(values.destinationCityId),
        cost: parsedCost,
      });
      toast.success(t("superAdmin.routes.createSuccess"));
      reset();
      onOpenChange(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("superAdmin.routes.createFailed");
      setServerError(message);
    }
  };

  const cities = citiesQuery.data ?? [];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-ink-900">
            {t("superAdmin.routes.addRouteTitle")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {serverError && (
            <div className="rounded-lg bg-danger-50 border border-danger-200 p-3 text-xs text-danger-700 flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Directional Route Notice */}
          <div className="rounded-lg bg-brand-50 border border-brand-blue/20 p-3 text-xs text-brand-blue leading-relaxed">
            {t("superAdmin.routes.directionalNotice")}
          </div>

          {/* Separate Cities Fetch Error Notice */}
          {citiesQuery.isError && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <AlertCircle size={14} className="shrink-0" />
                <span>{t("superAdmin.routes.citiesFetchError")}</span>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void citiesQuery.refetch()}
                disabled={citiesQuery.isFetching}
                className="h-6 text-xs px-2"
              >
                {t("common.retry")}
              </Button>
            </div>
          )}

          {/* Origin City */}
          <div className="space-y-1.5">
            <Label htmlFor="originCityId" className="text-xs font-semibold text-ink-700">
              {t("superAdmin.routes.originCity")} <span className="text-danger-500">*</span>
            </Label>
            <select
              id="originCityId"
              {...register("originCityId")}
              disabled={isSubmitting || citiesQuery.isLoading}
              className="w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange"
            >
              <option value="">{t("superAdmin.routes.selectOriginCity")}</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name || `#${c.id}`}
                </option>
              ))}
            </select>
            {errors.originCityId && (
              <p className="text-xs text-danger-600">{t(`superAdmin.routes.${errors.originCityId.message}`)}</p>
            )}
          </div>

          {/* Destination City */}
          <div className="space-y-1.5">
            <Label htmlFor="destinationCityId" className="text-xs font-semibold text-ink-700">
              {t("superAdmin.routes.destinationCity")} <span className="text-danger-500">*</span>
            </Label>
            <select
              id="destinationCityId"
              {...register("destinationCityId")}
              disabled={isSubmitting || citiesQuery.isLoading}
              className="w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange"
            >
              <option value="">{t("superAdmin.routes.selectDestinationCity")}</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name || `#${c.id}`}
                </option>
              ))}
            </select>
            {errors.destinationCityId && (
              <p className="text-xs text-danger-600">
                {t(`superAdmin.routes.${errors.destinationCityId.message}`)}
              </p>
            )}
          </div>

          {/* Route Visual preview */}
          {selectedOrigin && selectedDest && selectedOrigin !== selectedDest && (
            <div className="flex items-center justify-center gap-3 p-2.5 rounded-md bg-ink-50 text-xs font-medium text-ink-800">
              <span>{cities.find((c) => String(c.id) === selectedOrigin)?.name ?? selectedOrigin}</span>
              <ArrowRight size={14} className="text-brand-orange rtl:rotate-180" />
              <span>{cities.find((c) => String(c.id) === selectedDest)?.name ?? selectedDest}</span>
            </div>
          )}

          {/* Predefined Price */}
          <div className="space-y-1.5">
            <Label htmlFor="cost" className="text-xs font-semibold text-ink-700">
              {t("superAdmin.routes.predefinedPrice")} (SAR) <span className="text-danger-500">*</span>
            </Label>
            <div className="relative">
              <input
                id="cost"
                type="text"
                inputMode="decimal"
                dir="ltr"
                {...register("cost")}
                disabled={isSubmitting}
                placeholder={t("superAdmin.routes.pricePlaceholder")}
                className="w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange"
              />
            </div>
            <p className="text-[11px] text-ink-500">{t("superAdmin.routes.costHelp")}</p>
            {errors.cost && (
              <p className="text-xs text-danger-600">{t(`superAdmin.routes.${errors.cost.message}`)}</p>
            )}
          </div>

          <DialogFooter className="pt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => handleOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || createMutation.isPending}
              className="bg-brand-orange hover:bg-brand-orange/90 text-white font-semibold"
            >
              {isSubmitting || createMutation.isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin me-2" />
                  {t("superAdmin.routes.saving")}
                </>
              ) : (
                t("superAdmin.routes.saveRoute")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
