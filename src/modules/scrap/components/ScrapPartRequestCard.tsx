/**
 * @file ScrapPartRequestCard.tsx
 *
 * Premium inbox-style card for the Scrap Part Requests page.
 * Photo thumbnail at inline-start, part info + vehicle, status/escrow pills,
 * privacy-masked phone badge, relative time. Full card is a Link.
 *
 * Architecture: src/modules/scrap/components/
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Shield, Package } from "lucide-react";
import { ProviderStatusPill } from "@shared/provider-ui";
import { useEscrowQuery } from "../hooks/useScrapQueries";
import { partRequestStatusTone } from "../lib/partRequestLifecycle";
import { escrowStatusTone } from "../lib/escrowLifecycle";
import { toPillTone } from "../lib/toPillTone";
import type { PartRequest } from "../types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTimeAgo(isoString: string, lang: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

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

// ── Part thumbnail with safe fallback ────────────────────────────────────────

function PartThumb({ src }: { src: string | undefined }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        aria-hidden
        className={[
          "flex h-16 w-16 shrink-0 items-center justify-center",
          "rounded-[var(--radius-md)] bg-[var(--color-surface-2)]",
        ].join(" ")}
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
      className="h-16 w-16 shrink-0 rounded-[var(--radius-md)] object-cover bg-[var(--color-surface-2)]"
    />
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ScrapPartRequestCardProps {
  request: PartRequest;
  /** When provided, clicking the card calls this instead of navigating to the route. */
  onSelect?: (id: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

/** Premium inbox-style card for a single part request. */
export function ScrapPartRequestCard({ request, onSelect }: ScrapPartRequestCardProps) {
  const { t, i18n } = useTranslation();

  const { data: escrow } = useEscrowQuery(request.escrowId ? request.id : "");

  const brandLabel = t(`scrap.profile.specializations.brand.${request.vehicle.brand}`, {
    defaultValue: request.vehicle.brand,
  });

  const timeAgo = formatTimeAgo(request.createdAt, i18n.language);

  const sharedStyle = {
    transition: [
      "transform var(--dur-base) var(--ease-provider)",
      "box-shadow var(--dur-base) var(--ease-provider)",
    ].join(", "),
  };
  const sharedClass = [
    "flex items-start gap-4 p-4 sm:p-5",
    "bg-[var(--color-surface)] rounded-[var(--radius-lg)]",
    "shadow-[var(--shadow-provider-sm)]",
    "hover:-translate-y-0.5 hover:shadow-[var(--shadow-provider-hover)]",
    "focus-visible:outline-none focus-visible:ring-2",
    "focus-visible:ring-[var(--color-brand-orange)]/40",
    "cursor-pointer",
  ].join(" ");

  const inner = (
    <>
      {/* Part thumbnail ─────────────────────────────────────────────────── */}
      <PartThumb src={request.photos[0]} />

      {/* Main content ───────────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {/* Part name + request number */}
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <p className="truncate text-base font-semibold leading-snug text-[var(--color-ink-body)]">
            {request.partName}
          </p>
          <span className="shrink-0 font-mono text-xs text-[var(--color-muted)]">
            {t("scrap.partRequests.requestNumber")} {request.requestNumber}
          </span>
        </div>

        {/* Vehicle */}
        <p className="text-sm text-[var(--color-muted)]">
          {brandLabel} · {request.vehicle.model} · {request.vehicle.year}
        </p>

        {/* Bottom row: pills + time + phone */}
        <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          {/* Status pill + optional escrow pill */}
          <div className="flex flex-wrap items-center gap-1.5">
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

          {/* Relative time + privacy phone badge */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted)]">
            <span>{timeAgo}</span>
            <span
              className={[
                "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 leading-none",
                "bg-[var(--color-info-50)] text-[var(--color-info-500)]",
                "text-[10px] font-medium",
              ].join(" ")}
            >
              <Shield className="h-2.5 w-2.5 shrink-0" aria-hidden />
              <span>{request.customerPhoneMasked}</span>
              <span className="opacity-60">
                · {t("scrap.partRequests.protectedPhone")}
              </span>
            </span>
          </div>
        </div>
      </div>
    </>
  );

  if (onSelect) {
    return (
      <button
        type="button"
        onClick={() => onSelect(request.id)}
        style={sharedStyle}
        className={`w-full text-start ${sharedClass}`}
      >
        {inner}
      </button>
    );
  }

  return (
    <Link
      to={`/provider/scrap/part-requests/${request.id}`}
      style={sharedStyle}
      className={sharedClass}
    >
      {inner}
    </Link>
  );
}
