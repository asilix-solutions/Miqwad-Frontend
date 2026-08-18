/**
 * @file ProviderAddressDialog.tsx
 *
 * Create/edit dialog for a provider's own address, built on the provider
 * design system (`ProviderDialog` + `ProviderInput`) instead of the admin
 * `Dialog`/`Input` primitives used by `AddressFormDialog`. Reuses the
 * addresses module's schema, mutations, and map picker — only the shell and
 * fields are re-skinned.
 */
import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@shared/components/ui/toastContext";
import { ProviderDialog, ProviderInput } from "@shared/provider-ui";
import { AddressMapPicker } from "@modules/addresses/components/AddressMapPicker";
import { useCreateAddress, useUpdateAddress } from "@modules/addresses/hooks/useAddressesQueries";
import { addressSchema, type AddressFormValues } from "@modules/addresses/schemas/addressSchemas";
import type { Address } from "@modules/addresses/types";

const RIYADH_CENTER = { latitude: 24.7136, longitude: 46.6753 };

interface ProviderAddressDialogProps {
  mode: "create" | "edit";
  address?: Address;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProviderAddressDialog({ mode, address, open, onOpenChange }: ProviderAddressDialogProps) {
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
  }, [mode, address, reset]);

  const onSubmit = async (data: AddressFormValues) => {
    try {
      if (mode === "create") {
        await createMutation.mutateAsync(data);
        toast.success(t("accountProfile.addresses.createSuccess"));
      } else if (mode === "edit" && address) {
        await updateMutation.mutateAsync({ id: address.id, input: data });
        toast.success(t("accountProfile.addresses.updateSuccess"));
      }
      onOpenChange(false);
    } catch {
      toast.error(t("accountProfile.addresses.saveFailed"));
    }
  };

  return (
    <ProviderDialog
      open={open}
      onOpenChange={(val) => !isPending && onOpenChange(val)}
      title={mode === "create" ? t("accountProfile.addresses.addTitle") : t("accountProfile.addresses.editTitle")}
      size="lg"
      footer={
        <>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="flex h-[var(--size-input-h)] items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)] px-4 text-sm font-medium text-[var(--color-ink-body)] transition-colors duration-[var(--dur-fast)] hover:bg-[var(--color-surface-2)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={isPending}
            className="flex h-[var(--size-input-h)] items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-brand-orange)] px-5 text-sm font-semibold text-white shadow-[var(--shadow-provider-sm)] transition-colors duration-[var(--dur-fast)] hover:bg-[var(--color-brand-orange-hover,#E3460F)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Save className="h-4 w-4" aria-hidden />
            )}
            {t("common.save")}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <ProviderInput
          id="providerAddressTitle"
          label={t("addresses.form.title")}
          error={errors.title?.message ? t(errors.title.message) : undefined}
          {...register("title")}
        />
        <ProviderInput
          id="providerAddressDescription"
          label={t("addresses.form.description")}
          error={errors.description?.message ? t(errors.description.message) : undefined}
          {...register("description")}
        />
        <ProviderInput
          id="providerAddressShortNumber"
          dir="ltr"
          label={t("addresses.form.shortNumber")}
          placeholder={t("addresses.form.shortNumberPlaceholder")}
          error={errors.shortNumber?.message ? t(errors.shortNumber.message) : undefined}
          {...register("shortNumber")}
        />

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
      </form>
    </ProviderDialog>
  );
}
