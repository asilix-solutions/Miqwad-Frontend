/**
 * @file PartRequestDetailContent.tsx
 *
 * Shared detail view for a single salvage order (customer "part request"),
 * used by both the list-page dialog and the full-page route. Self-contained:
 * fetches its own data and handles loading / error / not-found internally.
 *
 * Workflow (live, PHASE B): browse a salvage Order → inspect it → submit a
 * quotation against its `orderId` via `/api/request-quotations`; edit or
 * delete the quotation afterwards. "Already quoted?" is derived client-side
 * from the caller's own quotations list.
 *
 * Architecture: src/modules/scrap/components/
 */

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  RefreshCw,
  Info,
  MessageCircle,
  Pencil,
  Trash2,
  Plus,
} from "lucide-react";
import { ProviderSkeleton, ProviderStatusPill, ProviderEmptyState } from "@shared/provider-ui";
import { formatOrderDate } from "@shared/lib/formatOrderDate";
import { useSalvageOrderQuery } from "../hooks/useSalvageOrders";
import { useRequestQuotationsQuery } from "../hooks/useRequestQuotations";
import { salvageOrderStatusI18nKey } from "../lib/salvageOrderStatus";
import type { RequestQuotation } from "../types";
import { QuotationForm } from "./QuotationForm";
import { AttachmentGallery } from "./AttachmentGallery";
import { DeleteQuotationDialog } from "./DeleteQuotationDialog";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PartRequestDetailContentProps {
  requestId: string;
}

// ── Field row ─────────────────────────────────────────────────────────────────

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
        {label}
      </span>
      <p className="text-sm text-[var(--color-ink-body)]">{value}</p>
    </div>
  );
}

// ── Existing-quotation panel (edit / delete) ──────────────────────────────────

function MyQuotationPanel({ quotation }: { quotation: RequestQuotation }) {
  const { t, i18n } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (editing) {
    return (
      <QuotationForm
        orderId={quotation.orderId}
        existing={quotation}
        onDone={() => setEditing(false)}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--color-divider)] p-4">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-[var(--color-ink-body)]">{quotation.name}</p>

        {quotation.notes && (
          <p className="whitespace-pre-line text-sm text-[var(--color-muted)]">{quotation.notes}</p>
        )}

        {quotation.isCompatibleWith && (
          <p className="text-xs text-[var(--color-muted)]">
            {t("scrap.offer.isCompatibleWithLabel")}: {quotation.isCompatibleWith}
          </p>
        )}

        <AttachmentGallery attachments={quotation.attachments} />

        <p className="text-xs text-[var(--color-muted)]">
          {t("scrap.myOffers.offeredOn")} {formatOrderDate(quotation.createdAt, i18n.language)}
        </p>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className={[
            "flex-1 inline-flex items-center justify-center gap-2",
            "rounded-[var(--radius-md)] border border-[var(--color-divider)]",
            "py-2 text-sm font-medium text-[var(--color-ink-body)]",
            "transition-colors duration-[var(--dur-fast)] hover:bg-[var(--color-surface-2)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-orange)]/40",
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
            "transition-colors duration-[var(--dur-fast)] hover:bg-[var(--color-danger-50)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-danger-500)]/40",
          ].join(" ")}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
          {t("scrap.myOffers.delete")}
        </button>
      </div>

      {confirmingDelete && (
        <DeleteQuotationDialog
          quotation={quotation}
          open={confirmingDelete}
          onOpenChange={setConfirmingDelete}
        />
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

/** Shared detail view for a single salvage order. */
export function PartRequestDetailContent({ requestId }: PartRequestDetailContentProps) {
  const { t, i18n } = useTranslation();
  const [offering, setOffering] = useState(false);

  const {
    data: order,
    isLoading: orderLoading,
    isError: orderError,
    refetch: orderRefetch,
  } = useSalvageOrderQuery(requestId);

  const { data: quotationsPage, isLoading: quotationsLoading } = useRequestQuotationsQuery({
    pageSize: 100,
  });

  const myQuotation = useMemo(
    () => quotationsPage?.items.find((q) => q.orderId === requestId),
    [quotationsPage, requestId],
  );

  const isLoading = orderLoading || quotationsLoading;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-3">
          <ProviderSkeleton width="55%" height={22} />
          <ProviderSkeleton width={72} height={24} className="rounded-full" />
        </div>
        <ProviderSkeleton width="40%" height={16} />
        <ProviderSkeleton width="70%" height={14} />
        <div className="flex gap-3">
          {[0, 1, 2].map((i) => (
            <ProviderSkeleton key={i} variant="block" width={80} height={80} className="rounded-[var(--radius-md)]" />
          ))}
        </div>
        <ProviderSkeleton width="100%" height={80} className="rounded-[var(--radius-md)]" />
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
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
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-orange)]/40",
          ].join(" ")}
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          {t("common.retry")}
        </button>
      </div>
    );
  }

  // ── Not found / not authorized ─────────────────────────────────────────────
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

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 className="text-lg font-semibold leading-snug text-[var(--color-ink-body)]">
            {order.partName || t("scrap.partRequests.partName")}
          </h2>
          {order.customerName && (
            <span className="text-xs text-[var(--color-muted)]">
              {t("scrap.partRequests.customerName")}: {order.customerName}
            </span>
          )}
          <span className="text-xs text-[var(--color-muted)]">
            {formatOrderDate(order.createdAt, i18n.language)}
          </span>
        </div>
        <ProviderStatusPill tone="neutral" label={t(salvageOrderStatusI18nKey(order.statusCode))} />
      </div>

      <div className="border-t border-[var(--color-divider)]" />

      {/* Part info */}
      <div className="flex flex-col gap-3">
        {vehicleLine && <Field label={t("scrap.partRequests.vehicle")} value={vehicleLine} />}
        {order.serialNumber && (
          <Field label={t("scrap.partRequests.serialNumber")} value={order.serialNumber} />
        )}
        {order.description && (
          <Field label={t("scrap.partRequests.description")} value={order.description} />
        )}
      </div>

      {/* Order attachments */}
      {order.attachments.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
            {t("scrap.partRequests.gallery")}
          </span>
          <AttachmentGallery attachments={order.attachments} />
        </div>
      )}

      <div className="border-t border-[var(--color-divider)]" />

      {/* Quotation area */}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-[var(--color-ink-body)]">
          {myQuotation ? t("scrap.myOffers.title") : t("scrap.offer.title")}
        </p>

        {myQuotation ? (
          <MyQuotationPanel quotation={myQuotation} />
        ) : offering ? (
          <QuotationForm
            orderId={order.id}
            onDone={() => setOffering(false)}
            onCancel={() => setOffering(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setOffering(true)}
            className={[
              "inline-flex items-center justify-center gap-2",
              "w-full rounded-[var(--radius-md)] bg-[var(--color-brand-orange)]",
              "h-[var(--size-input-h)] px-5 text-sm font-semibold text-white",
              "transition-colors duration-[var(--dur-fast)] hover:bg-[var(--color-brand-orange-hover)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-orange)]/40",
            ].join(" ")}
          >
            <Plus className="h-4 w-4" aria-hidden />
            {t("scrap.offer.submit")}
          </button>
        )}
      </div>

      {/* Chat entry (deferred) */}
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
