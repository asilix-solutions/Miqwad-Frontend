/**
 * @file PartRequestPreviewRow.tsx
 *
 * Compact row for the scrap dashboard recent-requests preview.
 * Shows part name + vehicle, request status pill, escrow status pill (when
 * an escrow exists), relative time, and a privacy-masked phone badge.
 *
 * Reusable: the full Part Requests page can import this row later.
 * Architecture: src/modules/scrap/components/dashboard/
 */

import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Shield, ChevronRight } from "lucide-react";
import { ProviderStatusPill } from "@shared/provider-ui";
import type { StatusPillTone } from "@shared/provider-ui";
import { useEscrowQuery } from "../../hooks/useScrapQueries";
import { partRequestStatusTone } from "../../lib/partRequestLifecycle";
import { escrowStatusTone } from "../../lib/escrowLifecycle";
import type { ToneVariant } from "../../lib/escrowLifecycle";
import type { PartRequest } from "../../types";

// ToneVariant includes "muted"; ProviderStatusPill uses "neutral" for that slot.
function toPillTone(tone: ToneVariant): StatusPillTone {
  return tone === "muted" ? "neutral" : tone;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PartRequestPreviewRowProps {
  request: PartRequest;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTimeAgo(isoString: string, lang: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (lang === "ar") {
    if (diffMins < 1) return "الآن";
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays === 1) return "أمس";
    return `منذ ${diffDays} أيام`;
  }
  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  return `${diffDays}d ago`;
}

// ── Component ─────────────────────────────────────────────────────────────────

/** Compact preview row for a part request — dashboard + full-list reuse. */
export function PartRequestPreviewRow({ request }: PartRequestPreviewRowProps) {
  const { t, i18n } = useTranslation();

  // Fetch escrow silently; disabled when there is no escrowId on the request.
  const { data: escrow } = useEscrowQuery(request.escrowId ? request.id : "");

  const brandLabel = t(`scrap.profile.specializations.brand.${request.vehicle.brand}`, {
    defaultValue: request.vehicle.brand,
  });

  const timeAgo = formatTimeAgo(request.createdAt, i18n.language);

  return (
    <Link
      to={`/provider/scrap/part-requests/${request.id}`}
      className={[
        "flex items-center gap-3 px-5 py-4",
        "hover:bg-[var(--color-surface-2)]",
        "transition-colors duration-[var(--dur-base)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset",
        "focus-visible:ring-[var(--color-brand-orange)]/40",
      ].join(" ")}
    >
      {/* Part info ──────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[var(--color-ink-body)] truncate">
          {request.partName}
        </p>
        <p className="mt-0.5 text-xs text-[var(--color-muted)] truncate">
          {brandLabel} {request.vehicle.model} {request.vehicle.year}
        </p>
      </div>

      {/* Status pills + phone meta ───────────────────────────────────── */}
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        {/* Status + escrow pills */}
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          <ProviderStatusPill
            tone={toPillTone(partRequestStatusTone(request.status))}
            label={t(`scrap.status.${request.status}`)}
          />
          {escrow && (
            <ProviderStatusPill
              tone={toPillTone(escrowStatusTone(escrow.status))}
              label={t(`scrap.escrow.status.${escrow.status}`)}
            />
          )}
        </div>

        {/* Time + privacy phone badge */}
        <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
          <span>{timeAgo}</span>
          <span
            className={[
              "inline-flex items-center gap-1",
              "rounded-full px-1.5 py-0.5 leading-none",
              "bg-[var(--color-info-50)] text-[var(--color-info-500)]",
              "text-[10px] font-medium",
            ].join(" ")}
          >
            <Shield className="h-2.5 w-2.5 shrink-0" aria-hidden />
            <span>{request.customerPhoneMasked}</span>
            <span className="opacity-60">· {t("scrap.dashboard.protectedPhone")}</span>
          </span>
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
