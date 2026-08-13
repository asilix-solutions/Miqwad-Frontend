/**
 * @file AddressFormDialog.tsx
 * @description Create/edit dialog for an address: title, description,
 * shortNumber + a basic map picker for longitude/latitude. Mirrors
 * src/modules/admin/components/reference/CityFormDialog.tsx.
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
import { Textarea } from "@/components/ui/textarea";
import { useCreateAddress, useUpdateAddress } from "../hooks/useAddressesQueries";
import { addressSchema, type AddressFormValues } from "../schemas/addressSchemas";
import type { Address } from "../types";
import { useToast } from "@shared/components/ui/toastContext";
import { AddressMapPicker } from "./AddressMapPicker";

const RIYADH_CENTER = { latitude: 24.7136, longitude: 46.6753 };

interface Props {
  mode: "create" | "edit";
  address?: Address;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddressFormDialog({ mode, address, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const toast = useToast();

  const createMutation = useCreateAddress();
  const updateMutation = useUpdateAddress();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      title: "",
      description: "",
      shortNumber: "",
      latitude: RIYADH_CENTER.latitude,
      longitude: RIYADH_CENTER.longitude,
    },
  });

  useEffect(() => {
    if (open) {
      if (mode === "edit" && address) {
        reset({
          title: address.title,
          description: address.description,
          shortNumber: address.shortNumber,
          latitude: address.latitude,
          longitude: address.longitude,
        });
      } else {
        reset({
          title: "",
          description: "",
          shortNumber: "",
          latitude: RIYADH_CENTER.latitude,
          longitude: RIYADH_CENTER.longitude,
        });
      }
    }
  }, [open, mode, address, reset]);

  const onSubmit = async (data: AddressFormValues) => {
    try {
      if (mode === "create") {
        await createMutation.mutateAsync(data);
        toast.success(t("addresses.success.created"));
      } else if (mode === "edit" && address) {
        await updateMutation.mutateAsync({ id: address.id, input: data });
        toast.success(t("addresses.success.updated"));
      }
      onOpenChange(false);
    } catch {
      toast.error(t("common.saveFailed"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !isPending && onOpenChange(val)}>
      <DialogContent className="sm:max-w-[640px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? t("addresses.add") : t("addresses.edit")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="title">
              {t("addresses.form.title")} <span className="text-danger-500">*</span>
            </Label>
            <Input id="title" {...register("title")} disabled={isPending} />
            {errors.title && (
              <p className="text-sm text-danger-500">{t(errors.title.message as string)}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              {t("addresses.form.description")} <span className="text-danger-500">*</span>
            </Label>
            <Textarea id="description" {...register("description")} disabled={isPending} />
            {errors.description && (
              <p className="text-sm text-danger-500">{t(errors.description.message as string)}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="shortNumber">
              {t("addresses.form.shortNumber")} <span className="text-danger-500">*</span>
            </Label>
            <Input
              id="shortNumber"
              placeholder={t("addresses.form.shortNumberPlaceholder")}
              dir="ltr"
              className="text-left"
              {...register("shortNumber")}
              disabled={isPending}
            />
            {errors.shortNumber && (
              <p className="text-sm text-danger-500">{t(errors.shortNumber.message as string)}</p>
            )}
          </div>

          <Controller
            control={control}
            name="latitude"
            render={({ field: latField }) => (
              <Controller
                control={control}
                name="longitude"
                render={({ field: lngField }) => (
                  <AddressMapPicker
                    latitude={latField.value}
                    longitude={lngField.value}
                    onChange={(lat, lng) => {
                      latField.onChange(lat);
                      lngField.onChange(lng);
                    }}
                  />
                )}
              />
            )}
          />

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? t("common.loading") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
