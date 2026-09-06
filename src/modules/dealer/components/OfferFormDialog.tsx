/**
 * @file OfferFormDialog.tsx
 *
 * Dealer Offer create + edit dialog (one component, two modes) — Stage 3 write
 * path over the Stage-1 read layer.
 *
 * Fields: title, start/end date, and a line editor (`useFieldArray`) where each
 * row picks a provider-service and a fixed-SAR discount, with a live
 * "original → discounted" preview. On submit it builds the FULL items array,
 * sends dates bare-local (the api layer does that), and calls `useCreateOffer`
 * / `useUpdateOffer` — which own query invalidation, so the post-write refresh
 * comes from a fresh GET, never the (ghost-prone) mutation response.
 *
 * Backend 400s carry a flat array of already-localised strings with no field
 * keys → rendered as a form-level banner. Client-side zod + `computeLinePreview`
 * still gate per-field / per-line issues before submit.
 *
 * Duplicate-service guard: a service already chosen in another row is filtered
 * out of this row's options (so it cannot be picked twice).
 */

import { useEffect, useMemo, useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { AlertCircle, CalendarRange, Percent, Plus, Tag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProviderDialog, ProviderInput, ProviderSelect } from "@shared/provider-ui";
import { useToast } from "@shared/components/ui/toastContext";
import { formatCurrency } from "@shared/lib/formatCurrency";
import { useDealerProductsQuery } from "../hooks/useDealerQueries";
import { useCreateOffer, useUpdateOffer } from "../hooks/useOfferQueries";
import { extractOfferWriteErrors } from "../api/offersApi";
import { computeLinePreview } from "../lib/computeLinePreview";
import { offerFormSchema, type OfferFormValues } from "../schemas/offer.schema";
import type { Offer } from "../types";

interface Props {
  mode: "create" | "edit";
  offer?: Offer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Sentinel for an unpicked service row — never pass `value=""` to ProviderSelect. */
const NO_SERVICE = "none";

const emptyLine = (): OfferFormValues["items"][number] => ({
  providerServiceId: "",
  discountAmount: Number.NaN,
});

/** `YYYY-MM-DD` slice of a (UTC-normalised) ISO string, for date-input prefill. */
function toDateInputValue(iso: string): string {
  return iso ? iso.slice(0, 10) : "";
}

export function OfferFormDialog({ mode, offer, open, onOpenChange }: Props) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const dir = i18n.dir();
  const money = (v: number) => formatCurrency(v, i18n.language);

  const productsQuery = useDealerProductsQuery();
  const services = useMemo(() => productsQuery.data?.items ?? [], [productsQuery.data]);
  const serviceById = useMemo(
    () => new Map(services.map((s) => [s.id, s])),
    [services],
  );

  const createMutation = useCreateOffer();
  const updateMutation = useUpdateOffer();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const [serverErrors, setServerErrors] = useState<string[]>([]);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors },
  } = useForm<OfferFormValues>({
    resolver: zodResolver(offerFormSchema),
    defaultValues: { title: "", startDate: "", endDate: "", items: [emptyLine()] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchedItems = watch("items");

  useEffect(() => {
    if (!open) return;
    setServerErrors([]);
    if (mode === "edit" && offer) {
      reset({
        title: offer.title ?? "",
        startDate: toDateInputValue(offer.startDate),
        endDate: toDateInputValue(offer.endDate),
        items: offer.items.length
          ? offer.items.map((it) => ({
              providerServiceId: it.providerServiceId,
              discountAmount: it.discountAmount,
            }))
          : [emptyLine()],
      });
    } else {
      reset({ title: "", startDate: "", endDate: "", items: [emptyLine()] });
    }
  }, [open, mode, offer, reset]);

  /** Options for one row = every service NOT chosen in another row. */
  const optionsForRow = (rowIndex: number) => {
    const takenElsewhere = new Set(
      (watchedItems ?? [])
        .map((it, i) => (i === rowIndex ? "" : it?.providerServiceId ?? ""))
        .filter(Boolean),
    );
    return services
      .filter((s) => !takenElsewhere.has(s.id))
      .map((s) => ({ value: s.id, label: `${s.serviceName} · ${money(s.price)}` }));
  };

  const allServicesPicked =
    services.length > 0 && fields.length >= services.length;

  const onSubmit = async (values: OfferFormValues) => {
    setServerErrors([]);

    // Pre-submit gate: mirror the backend's >0 rule + block negative finals.
    const badLine = values.items.findIndex((line) => {
      const svc = serviceById.get(line.providerServiceId);
      if (!svc) return true;
      return computeLinePreview(svc.price, line.discountAmount).isInvalid;
    });
    if (badLine !== -1) {
      setError(`items.${badLine}.discountAmount` as `items.${number}.discountAmount`, {
        type: "manual",
        message: "dealer.offers.form.validation.discountExceedsPrice",
      });
      return;
    }

    const payload = {
      title: values.title.trim(),
      startDate: values.startDate,
      endDate: values.endDate,
      items: values.items.map((line) => ({
        providerServiceId: Number(line.providerServiceId),
        discountAmount: line.discountAmount,
      })),
    };

    try {
      if (mode === "edit" && offer) {
        await updateMutation.mutateAsync({ id: offer.id, payload });
        toast.success(t("dealer.offers.form.toasts.updated"));
      } else {
        await createMutation.mutateAsync(payload);
        toast.success(t("dealer.offers.form.toasts.created"));
      }
      onOpenChange(false);
    } catch (err) {
      const backendErrors = extractOfferWriteErrors(err);
      setServerErrors(backendErrors);
      toast.error(
        backendErrors.length > 0
          ? backendErrors.join(" • ")
          : t("dealer.offers.form.toasts.saveFailed"),
      );
    }
  };

  return (
    <ProviderDialog
      open={open}
      onOpenChange={(val) => !isPending && onOpenChange(val)}
      blurBackdrop
      size="lg"
      title={
        mode === "create"
          ? t("dealer.offers.form.createTitle")
          : t("dealer.offers.form.editTitle")
      }
      description={
        mode === "create"
          ? t("dealer.offers.form.createSubtitle")
          : t("dealer.offers.form.editSubtitle")
      }
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="offer-form" variant="primary" disabled={isPending}>
            {isPending ? t("common.loading") : t("common.save")}
          </Button>
        </>
      }
    >
      <form id="offer-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6" dir={dir}>
        {serverErrors.length > 0 && (
          <div
            role="alert"
            className="flex flex-col gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-danger-500)] bg-[var(--color-danger-50)] px-4 py-3"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-[var(--color-danger-500)]">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
              {t("dealer.offers.form.errorBannerTitle")}
            </span>
            <ul className="ms-6 list-disc space-y-0.5 text-xs text-[var(--color-danger-500)]">
              {serverErrors.map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Title */}
        <ProviderInput
          id="offer-title"
          label={`${t("dealer.offers.form.titleLabel")} *`}
          placeholder={t("dealer.offers.form.titlePlaceholder")}
          leadingIcon={<Tag className="h-4 w-4" aria-hidden />}
          error={errors.title ? t(errors.title.message!) : undefined}
          disabled={isPending}
          {...register("title")}
        />

        {/* Date window */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="offer-start"
              className="text-sm font-medium text-[var(--color-ink-body)]"
            >
              {`${t("dealer.offers.form.startDateLabel")} *`}
            </label>
            <input
              id="offer-start"
              type="date"
              dir="ltr"
              disabled={isPending}
              className="h-[var(--size-input-h)] rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-ink-body)] outline-none focus-visible:border-[var(--color-brand-orange)] focus-visible:ring-2 focus-visible:ring-[var(--color-brand-orange)]/20 disabled:opacity-50"
              {...register("startDate")}
            />
            {errors.startDate && (
              <p role="alert" className="text-xs text-[var(--color-danger-500)]">
                {t(errors.startDate.message!)}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="offer-end"
              className="text-sm font-medium text-[var(--color-ink-body)]"
            >
              {`${t("dealer.offers.form.endDateLabel")} *`}
            </label>
            <input
              id="offer-end"
              type="date"
              dir="ltr"
              disabled={isPending}
              className="h-[var(--size-input-h)] rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-ink-body)] outline-none focus-visible:border-[var(--color-brand-orange)] focus-visible:ring-2 focus-visible:ring-[var(--color-brand-orange)]/20 disabled:opacity-50"
              {...register("endDate")}
            />
            {errors.endDate && (
              <p role="alert" className="text-xs text-[var(--color-danger-500)]">
                {t(errors.endDate.message!)}
              </p>
            )}
          </div>
        </div>

        {/* Line editor */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-[var(--color-ink-body)]">
              {t("dealer.offers.form.lineEditor.heading")}
            </h3>
            <span className="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
              <CalendarRange className="h-3.5 w-3.5" aria-hidden />
              {t("dealer.offers.form.lineEditor.hint")}
            </span>
          </div>

          {typeof errors.items?.message === "string" && (
            <p role="alert" className="text-xs text-[var(--color-danger-500)]">
              {t(errors.items.message)}
            </p>
          )}

          {productsQuery.isError && (
            <p role="alert" className="text-xs text-[var(--color-danger-500)]">
              {t("dealer.offers.form.lineEditor.servicesLoadError")}
            </p>
          )}

          {fields.map((field, index) => {
            const current = watchedItems?.[index];
            const svc = current ? serviceById.get(current.providerServiceId) : undefined;
            const preview = svc
              ? computeLinePreview(svc.price, current?.discountAmount ?? Number.NaN)
              : undefined;
            const lineError = errors.items?.[index];

            return (
              <div
                key={field.id}
                className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface-2)] p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <Controller
                      control={control}
                      name={`items.${index}.providerServiceId` as const}
                      render={({ field: f }) => (
                        <ProviderSelect
                          id={`offer-line-service-${index}`}
                          label={t("dealer.offers.form.lineEditor.serviceLabel")}
                          value={f.value ? f.value : NO_SERVICE}
                          onValueChange={f.onChange}
                          options={optionsForRow(index)}
                          placeholder={t("dealer.offers.form.lineEditor.servicePlaceholder")}
                          disabled={isPending || productsQuery.isLoading}
                          error={
                            lineError?.providerServiceId
                              ? t(lineError.providerServiceId.message!)
                              : undefined
                          }
                        />
                      )}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => remove(index)}
                    disabled={isPending || fields.length <= 1}
                    aria-label={t("dealer.offers.form.lineEditor.removeLine")}
                    className="mt-7 flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-danger-50)] hover:text-[var(--color-danger-500)] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>

                <Controller
                  control={control}
                  name={`items.${index}.discountAmount` as const}
                  render={({ field: f }) => (
                    <ProviderInput
                      id={`offer-line-discount-${index}`}
                      type="number"
                      inputMode="decimal"
                      step="any"
                      min={0}
                      dir="ltr"
                      className="text-left"
                      label={`${t("dealer.offers.form.lineEditor.discountLabel")} *`}
                      leadingIcon={<Percent className="h-4 w-4" aria-hidden />}
                      disabled={isPending}
                      name={f.name}
                      ref={f.ref}
                      onBlur={f.onBlur}
                      value={Number.isFinite(f.value) ? f.value : ""}
                      onChange={(e) =>
                        f.onChange(e.target.value === "" ? Number.NaN : Number(e.target.value))
                      }
                      error={
                        lineError?.discountAmount
                          ? t(lineError.discountAmount.message!)
                          : undefined
                      }
                    />
                  )}
                />

                {/* Live preview */}
                {svc && preview && (
                  <div
                    className={[
                      "flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-xs",
                      preview.isInvalid
                        ? "bg-[var(--color-danger-50)] text-[var(--color-danger-500)]"
                        : "bg-[var(--color-surface)] text-[var(--color-muted)]",
                    ].join(" ")}
                  >
                    {preview.isInvalid ? (
                      <>
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        <span>{t("dealer.offers.form.preview.invalid")}</span>
                      </>
                    ) : (
                      <span dir="ltr">
                        {t("dealer.offers.form.preview.label", {
                          original: money(svc.price),
                          discounted: money(preview.discountedPrice),
                        })}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append(emptyLine())}
            disabled={isPending || allServicesPicked || services.length === 0}
          >
            <Plus className="h-4 w-4" aria-hidden />
            {t("dealer.offers.form.lineEditor.addLine")}
          </Button>
        </div>
      </form>
    </ProviderDialog>
  );
}
