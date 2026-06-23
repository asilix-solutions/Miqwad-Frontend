/**
 * @file PartRequestDetailContent.tsx
 *
 * Shared detail view for a single part request.
 * Used by both the inline dialog (from the list page) and the full-page route.
 * Self-contained: fetches its own data, handles loading/error internally.
 */

import { useState, useId } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  RefreshCw,
  Shield,
  Package,
  Check,
  Lock,
  Info,
  MessageCircle,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import {
  ProviderSkeleton,
  ProviderStatusPill,
  ProviderInput,
  ProviderTextarea,
  ProviderImageUpload,
} from "@shared/provider-ui";
import { formatCurrency } from "@shared/lib/formatCurrency";
import { useToast } from "@shared/components/ui/toastContext";
import { offerSchema } from "../schemas/scrap.schemas";
import type { OfferFormValues } from "../schemas/scrap.schemas";
import {
  usePartRequestQuery,
  useEscrowQuery,
  useSubmitOfferMutation,
  useUpdatePartRequestStatusMutation,
} from "../hooks/useScrapQueries";
import { partRequestStatusTone } from "../lib/partRequestLifecycle";
import { toPillTone } from "../lib/toPillTone";
import type { EscrowStatus } from "../types";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PartRequestDetailContentProps {
  requestId: string;
}

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

// ── Escrow timeline stepper ───────────────────────────────────────────────────

const TIMELINE_STEPS: EscrowStatus[] = ["pending", "held", "released"];

function stepIndex(status: EscrowStatus): number {
  const idx = TIMELINE_STEPS.indexOf(status);
  return idx >= 0 ? idx : 0;
}

interface EscrowTimelineProps {
  status: EscrowStatus;
  amount: number;
}

function EscrowTimeline({ status, amount }: EscrowTimelineProps) {
  const { t, i18n } = useTranslation();
  const current = stepIndex(status);
  const isSpecial = status === "disputed" || status === "refunded";

  const stepLabels: Record<EscrowStatus, string> = {
    pending: t("scrap.escrow.status.pending"),
    held: t("scrap.escrow.status.held"),
    released: t("scrap.escrow.status.released"),
    disputed: t("scrap.escrow.status.disputed"),
    refunded: t("scrap.escrow.status.refunded"),
  };

  const toneColors: Record<EscrowStatus, string> = {
    pending: "var(--color-muted)",
    held: "var(--color-info-500)",
    released: "var(--color-success-500)",
    disputed: "var(--color-warning-500)",
    refunded: "var(--color-danger-500)",
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-1">
        <span className="text-sm font-medium text-[var(--color-ink-body)]">
          {t("scrap.partRequests.escrowTimelineTitle")}
        </span>
        <span className="text-sm font-semibold text-[var(--color-ink-body)]">
          {formatCurrency(amount, i18n.language)}
        </span>
      </div>

      {/* Steps row */}
      <div className="flex items-center gap-0">
        {TIMELINE_STEPS.map((step, idx) => {
          const isDone = idx < current || (status === "released" && idx === 2);
          const isCurrent =
            !isSpecial && idx === current;
          const tone = isCurrent
            ? toneColors[status]
            : isDone
              ? "var(--color-success-500)"
              : "var(--color-divider)";

          return (
            <div key={step} className="flex flex-1 flex-col items-center gap-1.5">
              {/* Connector line before (except first) */}
              <div className="flex w-full items-center">
                {idx > 0 && (
                  <div
                    className="h-0.5 flex-1 transition-colors duration-[var(--dur-base)]"
                    style={{
                      backgroundColor:
                        idx <= current ? "var(--color-success-500)" : "var(--color-divider)",
                    }}
                  />
                )}

                {/* Step circle */}
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-[var(--dur-base)]"
                  style={{
                    borderColor: tone,
                    backgroundColor: isDone || isCurrent ? tone : "var(--color-surface)",
                  }}
                >
                  {isDone ? (
                    <Check className="h-4 w-4 text-white" aria-hidden />
                  ) : isCurrent ? (
                    <Lock className="h-3.5 w-3.5 text-white" aria-hidden />
                  ) : (
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: "var(--color-divider)" }}
                    />
                  )}
                </div>

                {idx < TIMELINE_STEPS.length - 1 && (
                  <div
                    className="h-0.5 flex-1 transition-colors duration-[var(--dur-base)]"
                    style={{
                      backgroundColor:
                        idx < current ? "var(--color-success-500)" : "var(--color-divider)",
                    }}
                  />
                )}
              </div>

              <span
                className="text-center text-xs font-medium leading-tight"
                style={{ color: isCurrent || isDone ? tone : "var(--color-muted)" }}
              >
                {stepLabels[step]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Special state badge */}
      {isSpecial && (
        <div
          className="flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2"
          style={{
            backgroundColor:
              status === "disputed"
                ? "var(--color-warning-50)"
                : "var(--color-danger-50)",
            color: toneColors[status],
          }}
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
          <span className="text-sm font-medium">{stepLabels[status]}</span>
        </div>
      )}
    </div>
  );
}

// ── Offer form ────────────────────────────────────────────────────────────────

interface OfferFormProps {
  requestId: string;
}

function OfferForm({ requestId }: OfferFormProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const formId = useId();

  const submitOfferMutation = useSubmitOfferMutation();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OfferFormValues>({
    resolver: zodResolver(offerSchema),
    defaultValues: { note: "", photos: [] },
  });

  const photos = watch("photos") ?? [];

  function onSubmit(values: OfferFormValues) {
    submitOfferMutation.mutate(
      { id: requestId, payload: values },
      {
        onSuccess: () => {
          toast.success(t("scrap.offer.success"));
        },
        onError: () => {
          toast.error(t("common.saveFailed"));
        },
      },
    );
  }

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {/* Price */}
      <ProviderInput
        id={`${formId}-price`}
        type="number"
        min={1}
        step="any"
        label={t("scrap.offer.price")}
        hint={t("scrap.offer.priceHint")}
        trailingIcon={
          <span className="text-xs font-medium text-[var(--color-muted)]">ر.س</span>
        }
        error={errors.price?.message ? t(errors.price.message) : undefined}
        {...register("price", { valueAsNumber: true })}
      />

      {/* Note */}
      <ProviderTextarea
        id={`${formId}-note`}
        label={t("scrap.offer.note")}
        placeholder={t("common.optional")}
        rows={3}
        maxLength={500}
        error={errors.note?.message ? t(errors.note.message) : undefined}
        {...register("note")}
      />

      {/* Photos */}
      <ProviderImageUpload
        label={t("scrap.offer.photos")}
        dropLabel={t("dealer.products.form.dropImage")}
        value={photos}
        onChange={(v) => setValue("photos", v as string[])}
        multiple
        maxSizeMB={8}
      />

      {/* Submit button */}
      <button
        type="submit"
        disabled={submitOfferMutation.isPending}
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
        {submitOfferMutation.isPending && (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        )}
        {t("scrap.offer.submit")}
      </button>
    </form>
  );
}

// ── Confirm-ship button ───────────────────────────────────────────────────────

interface MarkShippedButtonProps {
  requestId: string;
}

function MarkShippedButton({ requestId }: MarkShippedButtonProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);

  const mutation = useUpdatePartRequestStatusMutation();

  function handleConfirm() {
    mutation.mutate(
      { id: requestId, status: "shipped" },
      {
        onSuccess: () => {
          toast.success(t("scrap.partRequests.markShipped"));
          setConfirming(false);
        },
        onError: () => {
          toast.error(t("common.saveFailed"));
          setConfirming(false);
        },
      },
    );
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className={[
          "inline-flex items-center justify-center gap-2",
          "w-full rounded-[var(--radius-md)] bg-[var(--color-brand-orange)]",
          "h-[var(--size-input-h)] px-5 text-sm font-semibold text-white",
          "transition-colors duration-[var(--dur-fast)]",
          "hover:bg-[var(--color-brand-orange-hover)]",
          "focus-visible:outline-none focus-visible:ring-2",
          "focus-visible:ring-[var(--color-brand-orange)]/40",
        ].join(" ")}
      >
        {t("scrap.partRequests.markShipped")}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--color-divider)] p-4">
      <p className="text-sm text-[var(--color-ink-body)]">
        {t("scrap.partRequests.markShippedConfirm")}
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={mutation.isPending}
          className={[
            "flex-1 rounded-[var(--radius-md)] border border-[var(--color-divider)]",
            "py-2 text-sm font-medium text-[var(--color-ink-body)]",
            "transition-colors duration-[var(--dur-fast)]",
            "hover:bg-[var(--color-surface-2)]",
            "focus-visible:outline-none focus-visible:ring-2",
            "focus-visible:ring-[var(--color-brand-orange)]/40",
            "disabled:opacity-50",
          ].join(" ")}
        >
          {t("common.cancel")}
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={mutation.isPending}
          className={[
            "flex-1 inline-flex items-center justify-center gap-2",
            "rounded-[var(--radius-md)] bg-[var(--color-brand-orange)]",
            "py-2 text-sm font-semibold text-white",
            "transition-colors duration-[var(--dur-fast)]",
            "hover:bg-[var(--color-brand-orange-hover)]",
            "focus-visible:outline-none focus-visible:ring-2",
            "focus-visible:ring-[var(--color-brand-orange)]/40",
            "disabled:opacity-60 disabled:cursor-not-allowed",
          ].join(" ")}
        >
          {mutation.isPending && (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          )}
          {t("common.confirm")}
        </button>
      </div>
    </div>
  );
}

// ── Info panel ────────────────────────────────────────────────────────────────

interface InfoPanelProps {
  icon: React.ReactNode;
  message: string;
  tone?: "info" | "success" | "muted" | "danger";
}

function InfoPanel({ icon, message, tone = "info" }: InfoPanelProps) {
  const bg: Record<string, string> = {
    info: "var(--color-info-50)",
    success: "var(--color-success-50)",
    muted: "var(--color-surface-2)",
    danger: "var(--color-danger-50)",
  };
  const fg: Record<string, string> = {
    info: "var(--color-info-500)",
    success: "var(--color-success-500)",
    muted: "var(--color-muted)",
    danger: "var(--color-danger-500)",
  };

  return (
    <div
      className="flex items-start gap-3 rounded-[var(--radius-md)] px-4 py-3"
      style={{ backgroundColor: bg[tone] }}
    >
      <span className="mt-0.5 shrink-0" style={{ color: fg[tone] }}>
        {icon}
      </span>
      <p className="text-sm font-medium leading-snug" style={{ color: fg[tone] }}>
        {message}
      </p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

/** Shared detail view for a single part request. */
export function PartRequestDetailContent({ requestId }: PartRequestDetailContentProps) {
  const { t } = useTranslation();

  const {
    data: request,
    isLoading: reqLoading,
    isError: reqError,
    refetch: reqRefetch,
  } = usePartRequestQuery(requestId);

  const { data: escrow, isLoading: escrowLoading } = useEscrowQuery(
    request?.escrowId ? requestId : "",
  );

  const isLoading = reqLoading || escrowLoading;

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
          <ProviderSkeleton width={140} height={20} className="rounded-full" />
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
  if (reqError || !request) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <AlertCircle className="h-8 w-8 text-[var(--color-danger-500)]" aria-hidden />
        <p className="text-sm text-[var(--color-muted)]">{t("common.errorTitle")}</p>
        <button
          type="button"
          onClick={() => void reqRefetch()}
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

  const brandLabel = t(`scrap.profile.specializations.brand.${request.vehicle.brand}`, {
    defaultValue: request.vehicle.brand,
  });

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5">

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 className="text-lg font-semibold leading-snug text-[var(--color-ink-body)]">
            {request.partName}
          </h2>
          <span className="font-mono text-xs text-[var(--color-muted)]">
            {t("scrap.partRequests.requestNumber")} {request.requestNumber}
          </span>
        </div>
        <ProviderStatusPill
          tone={toPillTone(partRequestStatusTone(request.status))}
          label={t(`scrap.status.${request.status}`)}
        />
      </div>

      <div className="border-t border-[var(--color-divider)]" />

      {/* ── Part info ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        {/* Vehicle */}
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
            {t("scrap.partRequests.vehicle")}
          </span>
          <p className="text-sm text-[var(--color-ink-body)]">
            {brandLabel} · {request.vehicle.model} · {request.vehicle.year}
          </p>
        </div>

        {/* Description */}
        {request.description && (
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
              {t("scrap.partRequests.description")}
            </span>
            <p className="text-sm text-[var(--color-ink-body)]">{request.description}</p>
          </div>
        )}

        {/* Masked phone badge */}
        <div className="flex items-center gap-2">
          <span
            className={[
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 leading-none",
              "bg-[var(--color-info-50)] text-[var(--color-info-500)]",
              "text-xs font-medium",
            ].join(" ")}
          >
            <Shield className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>{request.customerPhoneMasked}</span>
            <span className="opacity-60">· {t("scrap.partRequests.protectedPhone")}</span>
          </span>
        </div>
      </div>

      {/* ── Photo gallery ─────────────────────────────────────────────────────── */}
      {request.photos.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
            {t("scrap.partRequests.gallery")}
          </span>
          <div className="flex flex-wrap gap-3">
            {request.photos.map((src, i) => (
              <SafeThumb key={i} src={src} />
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-[var(--color-divider)]" />

      {/* ── Escrow timeline ───────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        {escrow ? (
          <EscrowTimeline status={escrow.status} amount={escrow.amount} />
        ) : (
          <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
            <Lock className="h-4 w-4 shrink-0" aria-hidden />
            <span>{t("scrap.partRequests.escrowNotStarted")}</span>
          </div>
        )}
      </div>

      <div className="border-t border-[var(--color-divider)]" />

      {/* ── State-driven action area ──────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        {request.status === "new" && (
          <>
            <p className="text-sm font-semibold text-[var(--color-ink-body)]">
              {t("scrap.offer.title")}
            </p>
            <OfferForm requestId={requestId} />
          </>
        )}

        {request.status === "accepted" && (
          <MarkShippedButton requestId={requestId} />
        )}

        {request.status === "quoted" && (
          <InfoPanel
            icon={<Info className="h-4 w-4" />}
            message={t("scrap.partRequests.awaitingBuyerAccept")}
            tone="info"
          />
        )}

        {request.status === "shipped" && (
          <InfoPanel
            icon={<Lock className="h-4 w-4" />}
            message={t("scrap.partRequests.awaitingDeliveryConfirm")}
            tone="info"
          />
        )}

        {request.status === "completed" && (
          <InfoPanel
            icon={<CheckCircle2 className="h-4 w-4" />}
            message={t("scrap.partRequests.completedReleased")}
            tone="success"
          />
        )}

        {request.status === "cancelled" && (
          <InfoPanel
            icon={<XCircle className="h-4 w-4" />}
            message={t("scrap.partRequests.cancelledNotice")}
            tone="muted"
          />
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
