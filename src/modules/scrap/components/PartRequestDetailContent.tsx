/**
 * @file PartRequestDetailContent.tsx
 *
 * Shared detail view for a single salvage order (customer "part request").
 * Used by both the inline dialog (from the list page) and the full-page route.
 * Self-contained: fetches its own data, handles loading/error/403 internally.
 *
 * Escrow/warranty timeline, order-number display, and shipping actions were
 * removed here — they belonged to the old mock buy/ship/escrow lifecycle,
 * which has no real backend counterpart (see
 * docs/probe-scrap-offers-2026-08-20.md §2.4). The workflow is now:
 * browse a salvage Order, inspect it, submit an Offer against its `orderId`.
 *
 * Offer form fields (confirmed against live Swagger 2026-08-23):
 *   providerServiceId — the provider picks one of their own existing parts
 *   startDate / endDate — neutral labels only (no business semantics assumed)
 */

import { useState, useId, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  RefreshCw,
  Package,
  Info,
  MessageCircle,
  Loader2,
  Pencil,
  Trash2,
  ArrowRight,
  ChevronDown,
  Check,
} from "lucide-react";
import { Select as SelectPrimitive } from "radix-ui";
import { cn } from "@shared/lib/utils";
import {
  ProviderSkeleton,
  ProviderStatusPill,
  ProviderInput,
  ProviderEmptyState,
} from "@shared/provider-ui";
import { useToast } from "@shared/components/ui/toastContext";
import { salvageOfferSchema } from "../schemas/scrap.schemas";
import type { SalvageOfferFormValues } from "../schemas/scrap.schemas";
import { useSalvageOrderQuery } from "../hooks/useSalvageOrders";
import {
  useOffersQuery,
  useCreateOfferMutation,
  useUpdateOfferMutation,
  useDeleteOfferMutation,
} from "../hooks/useOffersQueries";
import { useScrapPartsQuery } from "../hooks/useScrapPartsQueries";
import type { Offer } from "../types";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PartRequestDetailContentProps {
  requestId: string;
}

export type { OfferFormProps };

// ── Safe image thumbnail ──────────────────────────────────────────────────────

function SafeThumb({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        aria-hidden
        className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-2)]"
      >
        <Package className="h-6 w-6 text-[var(--color-muted)]" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt=""
      onError={() => setFailed(true)}
      className="h-20 w-20 shrink-0 rounded-[var(--radius-md)] object-cover bg-[var(--color-surface-2)]"
    />
  );
}

// ── Offer form (create or edit) ─────────────────────────────────────────────

interface OfferFormProps {
  orderId: string;
  /** When set, the form edits this existing offer instead of creating a new one. */
  existingOffer?: Offer;
  onDone?: () => void;
}

/**
 * Extracts the date-only portion (YYYY-MM-DD) from an ISO-8601 date-time
 * string, for prefilling <input type="date"> when editing an existing offer.
 */
function toDateOnly(iso: string): string {
  return iso.split("T")[0] ?? iso;
}

/** Exported for reuse by ScrapMyOffersPage's edit dialog. */
export function OfferForm({ orderId, existingOffer, onDone }: OfferFormProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const formId = useId();

  const createMutation = useCreateOfferMutation();
  const updateMutation = useUpdateOfferMutation();
  const isPending = createMutation.isPending || updateMutation.isPending;

  // Load the provider's own parts (provider-services) for the selector
  const { data: partsPage, isLoading: partsLoading } = useScrapPartsQuery();
  const parts = partsPage?.items ?? [];

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SalvageOfferFormValues>({
    resolver: zodResolver(salvageOfferSchema),
    defaultValues: {
      providerServiceId: existingOffer?.providerServiceId ?? "",
      startDate: existingOffer ? toDateOnly(existingOffer.startDate) : "",
      endDate: existingOffer ? toDateOnly(existingOffer.endDate) : "",
    },
  });

  function onSubmit(values: SalvageOfferFormValues) {
    if (existingOffer) {
      updateMutation.mutate(
        {
          id: existingOffer.id,
          payload: {
            providerServiceId: values.providerServiceId,
            startDate: values.startDate,
            endDate: values.endDate,
          },
        },
        {
          onSuccess: () => {
            toast.success(t("scrap.offer.updateSuccess"));
            onDone?.();
          },
          onError: () => toast.error(t("common.saveFailed")),
        },
      );
      return;
    }

    createMutation.mutate(
      {
        orderId,
        providerServiceId: values.providerServiceId,
        startDate: values.startDate,
        endDate: values.endDate,
      },
      {
        onSuccess: () => {
          toast.success(t("scrap.offer.success"));
          onDone?.();
        },
        onError: () => toast.error(t("common.saveFailed")),
      },
    );
  }

  // ── Loading parts ──────────────────────────────────────────────────────────
  if (partsLoading) {
    return (
      <div className="flex flex-col gap-3">
        <ProviderSkeleton width="60%" height={16} />
        <ProviderSkeleton width="100%" height={48} className="rounded-[var(--radius-md)]" />
      </div>
    );
  }

  // ── Empty parts state ──────────────────────────────────────────────────────
  if (parts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-divider)] p-5 text-center">
        <Package className="h-8 w-8 text-[var(--color-muted)]" aria-hidden />
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-[var(--color-ink-body)]">
            {t("scrap.offer.noPartsTitle")}
          </p>
          <p className="text-xs text-[var(--color-muted)]">
            {t("scrap.offer.noPartsDescription")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/provider/scrap/parts")}
          className={[
            "inline-flex items-center gap-2 rounded-[var(--radius-md)]",
            "bg-[var(--color-brand-orange)] px-4 py-2 text-sm font-semibold text-white",
            "transition-colors hover:bg-[var(--color-brand-orange-hover)]",
            "focus-visible:outline-none focus-visible:ring-2",
            "focus-visible:ring-[var(--color-brand-orange)]/40",
          ].join(" ")}
        >
          {t("scrap.offer.goToParts")}
          <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
        </button>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {/* ── Provider part selector ───────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={`${formId}-providerServiceId`}
          className="text-sm font-medium text-[var(--color-ink-body)]"
        >
          {t("scrap.offer.providerServiceLabel")}
        </label>
        <Controller
          name="providerServiceId"
          control={control}
          render={({ field }) => (
            <SelectPrimitive.Root value={field.value || ""} onValueChange={field.onChange}>
              <SelectPrimitive.Trigger
                id={`${formId}-providerServiceId`}
                aria-invalid={errors.providerServiceId ? true : undefined}
                className={cn(
                  "inline-flex h-[var(--size-input-h)] w-full items-center justify-between gap-2",
                  "rounded-[var(--radius-md)] border bg-[var(--color-surface)]",
                  "ps-3 pe-3 text-sm text-[var(--color-ink-body)] outline-none",
                  "data-[placeholder]:text-[var(--color-muted)]",
                  "focus-visible:ring-2 transition-colors duration-[var(--dur-fast)]",
                  "[&>span]:flex [&>span]:flex-1 [&>span]:min-w-0 [&>span]:items-center",
                  errors.providerServiceId
                    ? "border-[var(--color-danger-500)] focus-visible:border-[var(--color-danger-500)] focus-visible:ring-[var(--color-danger-500)]/20"
                    : "border-[var(--color-divider)] focus-visible:border-[var(--color-brand-orange)] focus-visible:ring-[var(--color-brand-orange)]/20"
                )}
              >
                <SelectPrimitive.Value placeholder={t("scrap.offer.providerServicePlaceholder")}>
                  {(() => {
                    const selectedPart = parts.find((p) => p.id === field.value);
                    if (!selectedPart) return undefined;
                    return (
                      <div className="flex w-full min-w-0 items-center justify-between gap-3 pe-1">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <Package className="h-4 w-4 shrink-0 text-[var(--color-muted)]" aria-hidden />
                          <span className="truncate font-medium">{selectedPart.serviceName ?? selectedPart.id}</span>
                        </div>
                        {selectedPart.price !== undefined && selectedPart.price > 0 && (
                          <span className="shrink-0 text-xs font-normal text-[var(--color-muted)]">
                            {selectedPart.price} ر.س
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </SelectPrimitive.Value>

                <SelectPrimitive.Icon asChild>
                  <ChevronDown className="h-4 w-4 shrink-0 text-[var(--color-muted)]" aria-hidden />
                </SelectPrimitive.Icon>
              </SelectPrimitive.Trigger>

              <SelectPrimitive.Portal>
                <SelectPrimitive.Content
                  position="popper"
                  sideOffset={6}
                  className={cn(
                    "z-50 w-[var(--radix-select-trigger-width)]",
                    "overflow-hidden rounded-[var(--radius-md)]",
                    "border border-[var(--color-divider)] bg-[var(--color-surface)]",
                    "shadow-[var(--shadow-provider-md)]",
                    "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
                    "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
                    "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
                  )}
                  style={{ animationDuration: "var(--dur-fast)" }}
                >
                  <SelectPrimitive.Viewport className="p-1.5">
                    {parts.map((part) => (
                      <SelectPrimitive.Item
                        key={part.id}
                        value={part.id}
                        className={cn(
                          "relative flex cursor-default select-none items-center justify-between",
                          "rounded-[var(--radius-sm)] ps-3 pe-8 py-2.5 text-sm",
                          "text-[var(--color-ink-body)] outline-none",
                          "transition-colors duration-[var(--dur-fast)]",
                          "data-[highlighted]:bg-[var(--color-surface-2)]",
                          "data-[state=checked]:font-medium"
                        )}
                      >
                        <div className="flex w-full min-w-0 items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <Package className="h-4 w-4 shrink-0 text-[var(--color-muted)]" aria-hidden />
                            <SelectPrimitive.ItemText>
                              <span className="truncate">{part.serviceName ?? part.id}</span>
                            </SelectPrimitive.ItemText>
                          </div>
                          {part.price !== undefined && part.price > 0 && (
                            <span className="shrink-0 text-xs font-normal text-[var(--color-muted)]">
                              {part.price} ر.س
                            </span>
                          )}
                        </div>
                        <span className="absolute end-2 flex h-4 w-4 items-center justify-center">
                          <SelectPrimitive.ItemIndicator>
                            <Check className="h-4 w-4 text-[var(--color-brand-orange)]" aria-hidden />
                          </SelectPrimitive.ItemIndicator>
                        </span>
                      </SelectPrimitive.Item>
                    ))}
                  </SelectPrimitive.Viewport>
                </SelectPrimitive.Content>
              </SelectPrimitive.Portal>
            </SelectPrimitive.Root>
          )}
        />
        {errors.providerServiceId?.message && (
          <p className="text-xs text-[var(--color-danger-500)]">
            {t(errors.providerServiceId.message)}
          </p>
        )}
      </div>

      {/* ── Start date ───────────────────────────────────────────────────── */}
      <ProviderInput
        id={`${formId}-startDate`}
        type="date"
        label={t("scrap.offer.startDateLabel")}
        error={errors.startDate?.message ? t(errors.startDate.message) : undefined}
        {...register("startDate")}
      />

      {/* ── End date ─────────────────────────────────────────────────────── */}
      <ProviderInput
        id={`${formId}-endDate`}
        type="date"
        label={t("scrap.offer.endDateLabel")}
        error={errors.endDate?.message ? t(errors.endDate.message) : undefined}
        {...register("endDate")}
      />

      <button
        type="submit"
        disabled={isPending}
        className={[
          "inline-flex items-center justify-center gap-2",
          "w-full rounded-[var(--radius-md)] bg-[var(--color-brand-orange)]",
          "h-[var(--size-input-h)] px-5 text-sm font-semibold text-white",
          "transition-colors duration-[var(--dur-fast)]",
          "hover:bg-[var(--color-brand-orange-hover)]",
          "focus-visible:outline-none focus-visible:ring-2",
          "focus-visible:ring-[var(--color-brand-orange)]/40",
          "disabled:cursor-not-allowed disabled:opacity-60",
        ].join(" ")}
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {existingOffer ? t("scrap.offer.editTitle") : t("scrap.offer.submit")}
      </button>
    </form>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string, lang: string): string {
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

// ── Existing-offer summary (with edit/delete) ───────────────────────────────

interface MyOfferPanelProps {
  offer: Offer;
}

function MyOfferPanel({ offer }: MyOfferPanelProps) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const deleteMutation = useDeleteOfferMutation();

  function handleDelete() {
    deleteMutation.mutate(offer.id, {
      onSuccess: () => {
        toast.success(t("scrap.offer.deleteSuccess"));
        setConfirmingDelete(false);
      },
      onError: () => {
        toast.error(t("common.saveFailed"));
        setConfirmingDelete(false);
      },
    });
  }

  if (editing) {
    return (
      <OfferForm orderId={offer.orderId} existingOffer={offer} onDone={() => setEditing(false)} />
    );
  }

  const serviceName = offer.providerService?.serviceName ?? "—";
  const price = offer.providerService?.price;
  const lang = i18n.language;

  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--color-divider)] p-4">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-[var(--color-ink-body)]">{serviceName}</p>
        {price !== undefined && price > 0 && (
          <p className="text-sm text-[var(--color-muted)]">{price} ر.س</p>
        )}
        <p className="text-xs text-[var(--color-muted)]">
          {t("scrap.offer.startDateLabel")}: {formatDate(offer.startDate, lang)}
        </p>
        <p className="text-xs text-[var(--color-muted)]">
          {t("scrap.offer.endDateLabel")}: {formatDate(offer.endDate, lang)}
        </p>
      </div>

      {!confirmingDelete && (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className={[
              "flex-1 inline-flex items-center justify-center gap-2",
              "rounded-[var(--radius-md)] border border-[var(--color-divider)]",
              "py-2 text-sm font-medium text-[var(--color-ink-body)]",
              "transition-colors duration-[var(--dur-fast)]",
              "hover:bg-[var(--color-surface-2)]",
              "focus-visible:outline-none focus-visible:ring-2",
              "focus-visible:ring-[var(--color-brand-orange)]/40",
            ].join(" ")}
          >
            <Pencil className="h-4 w-4" aria-hidden />
            {t("scrap.myOffers.edit")}
          </button>
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className={[
              "flex-1 inline-flex items-center justify-center gap-2",
              "rounded-[var(--radius-md)] border border-[var(--color-danger-500)]/30",
              "py-2 text-sm font-medium text-[var(--color-danger-500)]",
              "transition-colors duration-[var(--dur-fast)]",
              "hover:bg-[var(--color-danger-50)]",
              "focus-visible:outline-none focus-visible:ring-2",
              "focus-visible:ring-[var(--color-danger-500)]/40",
            ].join(" ")}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            {t("scrap.myOffers.delete")}
          </button>
        </div>
      )}

      {confirmingDelete && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-[var(--color-ink-body)]">{t("scrap.offer.deleteConfirmBody")}</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              disabled={deleteMutation.isPending}
              className={[
                "flex-1 rounded-[var(--radius-md)] border border-[var(--color-divider)]",
                "py-2 text-sm font-medium text-[var(--color-ink-body)]",
                "hover:bg-[var(--color-surface-2)]",
                "disabled:opacity-50",
              ].join(" ")}
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className={[
                "flex-1 inline-flex items-center justify-center gap-2",
                "rounded-[var(--radius-md)] bg-[var(--color-danger-500)]",
                "py-2 text-sm font-semibold text-white",
                "hover:opacity-90",
                "disabled:opacity-60 disabled:cursor-not-allowed",
              ].join(" ")}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {t("common.confirm")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

/** Shared detail view for a single salvage order. */
export function PartRequestDetailContent({ requestId }: PartRequestDetailContentProps) {
  const { t } = useTranslation();

  const {
    data: order,
    isLoading: orderLoading,
    isError: orderError,
    refetch: orderRefetch,
  } = useSalvageOrderQuery(requestId);

  const { data: myOffers, isLoading: offersLoading } = useOffersQuery({ pageSize: 100 });

  const myOfferForThisOrder = useMemo(
    () => myOffers?.items.find((o) => o.orderId === requestId),
    [myOffers, requestId],
  );

  const isLoading = orderLoading || offersLoading;

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-3">
          <ProviderSkeleton width="55%" height={22} />
          <ProviderSkeleton width={72} height={24} className="rounded-full" />
        </div>
        <div className="flex flex-col gap-2.5">
          <ProviderSkeleton width="40%" height={16} />
          <ProviderSkeleton width="70%" height={14} />
        </div>
        <div className="flex gap-3">
          {[0, 1, 2].map((i) => (
            <ProviderSkeleton key={i} variant="block" width={80} height={80} className="rounded-[var(--radius-md)]" />
          ))}
        </div>
        <ProviderSkeleton width="100%" height={80} className="rounded-[var(--radius-md)]" />
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (orderError) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <AlertCircle className="h-8 w-8 text-[var(--color-danger-500)]" aria-hidden />
        <p className="text-sm text-[var(--color-muted)]">{t("common.errorTitle")}</p>
        <button
          type="button"
          onClick={() => void orderRefetch()}
          className={[
            "inline-flex items-center gap-2 rounded-[var(--radius-md)]",
            "bg-[var(--color-brand-orange)] px-4 py-2 text-sm font-semibold text-white",
            "transition-colors hover:bg-[var(--color-brand-orange-hover)]",
            "focus-visible:outline-none focus-visible:ring-2",
            "focus-visible:ring-[var(--color-brand-orange)]/40",
          ].join(" ")}
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          {t("common.retry")}
        </button>
      </div>
    );
  }

  // ── Friendly 403 / not-found state ──────────────────────────────────────────
  if (!order) {
    return (
      <ProviderEmptyState
        icon={<Info className="h-8 w-8" />}
        title={t("scrap.partRequests.browsingUnavailableTitle")}
        description={t("scrap.partRequests.browsingUnavailableDescription")}
      />
    );
  }

  const vehicleLine = [order.brand, order.model, order.year].filter(Boolean).join(" · ");

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5">

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 className="text-lg font-semibold leading-snug text-[var(--color-ink-body)]">
            {order.partName}
          </h2>
          {order.customerName && (
            <span className="text-xs text-[var(--color-muted)]">
              {t("scrap.partRequests.customerName")}: {order.customerName}
            </span>
          )}
        </div>
        <ProviderStatusPill tone="neutral" label={order.status} />
      </div>

      <div className="border-t border-[var(--color-divider)]" />

      {/* ── Part info ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
            {t("scrap.partRequests.vehicle")}
          </span>
          <p className="text-sm text-[var(--color-ink-body)]">{vehicleLine}</p>
        </div>

        {order.serialNumber && (
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
              {t("scrap.partRequests.serialNumber")}
            </span>
            <p className="text-sm text-[var(--color-ink-body)]">{order.serialNumber}</p>
          </div>
        )}

        {order.description && (
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
              {t("scrap.partRequests.description")}
            </span>
            <p className="text-sm text-[var(--color-ink-body)]">{order.description}</p>
          </div>
        )}
      </div>

      {/* ── Photo gallery ─────────────────────────────────────────────────────── */}
      {order.photos.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
            {t("scrap.partRequests.gallery")}
          </span>
          <div className="flex flex-wrap gap-3">
            {order.photos.map((src, i) => (
              <SafeThumb key={i} src={src} />
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-[var(--color-divider)]" />

      {/* ── Offer area ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-[var(--color-ink-body)]">
          {myOfferForThisOrder ? t("scrap.myOffers.title") : t("scrap.offer.title")}
        </p>
        {myOfferForThisOrder ? (
          <MyOfferPanel offer={myOfferForThisOrder} />
        ) : (
          <OfferForm orderId={order.id} />
        )}
      </div>

      {/* ── Chat entry (deferred) ────────────────────────────────────────────── */}
      <div className="border-t border-[var(--color-divider)]" />
      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled
          title={t("scrap.partRequests.chatComingSoon")}
          className={[
            "inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)]",
            "border border-[var(--color-divider)] bg-[var(--color-surface-2)]",
            "h-[var(--size-input-h)] px-5 text-sm font-medium text-[var(--color-muted)]",
            "cursor-not-allowed opacity-60",
          ].join(" ")}
        >
          <MessageCircle className="h-4 w-4" aria-hidden />
          {t("scrap.partRequests.startChat")}
        </button>
        <p className="text-center text-xs text-[var(--color-muted)]">
          {t("scrap.partRequests.chatComingSoon")}
        </p>
      </div>
    </div>
  );
}
