/**
 * @file PartRequestPreviewRow.tsx
 *
 * Compact row for the scrap dashboard recent-requests preview.
 * Displays live SalvageOrder details: part name, vehicle brand/model/year,
 * customer name (when returned), verified status mapping, and relative creation time.
 * Navigates to the live part-requests detail route (/provider/scrap/part-requests/:id).
 *
 * Architecture: src/modules/scrap/components/dashboard/
 */

import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { ProviderStatusPill } from "@shared/provider-ui";
import { formatRelativeTime } from "@shared/lib/formatRelativeTime";
import { salvageOrderStatusI18nKey } from "../../lib/salvageOrderStatus";
import type { SalvageOrder } from "../../types";
import { getModelArabicNameByBrand } from "@modules/vehicles/lib/modelLocalization";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PartRequestPreviewRowProps {
  request: SalvageOrder;
}

// ── Component ─────────────────────────────────────────────────────────────────

/** Compact preview row for a live salvage order on the scrap dashboard. */
export function PartRequestPreviewRow({ request }: PartRequestPreviewRowProps) {
  const { t, i18n } = useTranslation();

  const brandLabel = request.brand
    ? t(`scrap.profile.specializations.brand.${request.brand}`, {
        defaultValue: request.brand,
      })
    : "";

  const isAr = i18n.language.startsWith("ar");
  const modelDisplay = (isAr ? getModelArabicNameByBrand(request.brand, request.model) : undefined) ?? request.model;
  const vehicleLine = [brandLabel, modelDisplay, request.year].filter(Boolean).join(" · ");

  const timeAgo = request.createdAt
    ? formatRelativeTime(request.createdAt, i18n.language === "ar" ? "ar-SA" : "en-US")
    : "";

  return (
    <Link
      to={`/provider/scrap/part-requests/${request.id}`}
      className={[
        "flex items-center gap-3 px-5 py-4",
        "hover:bg-[var(--color-surface-2)]",
        "transition-colors duration-[var(--dur-base)]",
        "focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset",
        "focus-visible:ring-[var(--color-brand-orange)]/40",
      ].join(" ")}
    >
      {/* Part info ──────────────────────────────────────────────────────── */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--color-ink-body)]">
          {request.partName}
        </p>
        {vehicleLine && (
          <p className="mt-0.5 truncate text-xs text-[var(--color-muted)]">{vehicleLine}</p>
        )}
      </div>

      {/* Status pills + customer / time meta ───────────────────────────── */}
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <ProviderStatusPill
            tone="neutral"
            label={t(salvageOrderStatusI18nKey(request.statusCode))}
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
          {timeAgo && <span>{timeAgo}</span>}
          {request.customerName && (
            <span className="max-w-[120px] truncate sm:max-w-[160px]">{request.customerName}</span>
          )}
        </div>
      </div>

      {/* Chevron ─────────────────────────────────────────────────────── */}
      <ChevronRight
        className="h-4 w-4 shrink-0 text-[var(--color-muted)] rtl:rotate-180"
        aria-hidden
      />
    </Link>
  );
}
