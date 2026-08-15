/**
 * @file OrderUpdateDialog.tsx
 * @description Update dialog for an order (PUT /api/Orders/{id}) — status,
 * type, paymentMethod dropdowns sourced from the enum maps, plus trackNumber.
 * Mirrors src/modules/addresses/components/AddressFormDialog.tsx.
 */
import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateOrder } from "../hooks/useOrdersQueries";
import { orderUpdateSchema, type OrderUpdateFormValues } from "../schemas/orderSchemas";
import {
  ORDER_STATUS_OPTIONS,
  ORDER_TYPE_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  orderStatusToI18nKey,
  orderTypeToI18nKey,
  paymentMethodToI18nKey,
} from "../lib/orderEnums";
import type { Order } from "../types";
import { useToast } from "@shared/components/ui/toastContext";

interface Props {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderUpdateDialog({ order, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const updateMutation = useUpdateOrder();

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OrderUpdateFormValues>({
    resolver: zodResolver(orderUpdateSchema),
    defaultValues: {
      status: order.status,
      type: order.type,
      paymentMethod: order.paymentMethod,
      trackNumber: order.trackNumber,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        status: order.status,
        type: order.type,
        paymentMethod: order.paymentMethod,
        trackNumber: order.trackNumber,
      });
    }
  }, [open, order, reset]);

  const onSubmit = async (data: OrderUpdateFormValues) => {
    try {
      await updateMutation.mutateAsync({
        id: order.id,
        input: { ...data, trackNumber: data.trackNumber ?? "" },
      });
      toast.success(t("orders.success.updated"));
      onOpenChange(false);
    } catch {
      toast.error(t("common.saveFailed"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !updateMutation.isPending && onOpenChange(val)}>
      <DialogContent className="sm:max-w-[480px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>{t("orders.edit")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>
              {t("orders.form.status")} <span className="text-danger-500">*</span>
            </Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={updateMutation.isPending}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {t(orderStatusToI18nKey(status))}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.status && <p className="text-sm text-danger-500">{t(errors.status.message as string)}</p>}
          </div>

          <div className="space-y-2">
            <Label>
              {t("orders.form.type")} <span className="text-danger-500">*</span>
            </Label>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={updateMutation.isPending}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_TYPE_OPTIONS.map((type) => (
                      <SelectItem key={type} value={type}>
                        {t(orderTypeToI18nKey(type))}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.type && <p className="text-sm text-danger-500">{t(errors.type.message as string)}</p>}
          </div>

          <div className="space-y-2">
            <Label>
              {t("orders.form.paymentMethod")} <span className="text-danger-500">*</span>
            </Label>
            <Controller
              control={control}
              name="paymentMethod"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={updateMutation.isPending}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHOD_OPTIONS.map((method) => (
                      <SelectItem key={method} value={method}>
                        {t(paymentMethodToI18nKey(method))}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.paymentMethod && (
              <p className="text-sm text-danger-500">{t(errors.paymentMethod.message as string)}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="trackNumber">{t("orders.form.trackNumber")}</Label>
            <Input
              id="trackNumber"
              dir="ltr"
              className="text-left"
              {...register("trackNumber")}
              disabled={updateMutation.isPending}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={updateMutation.isPending}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? t("common.loading") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
