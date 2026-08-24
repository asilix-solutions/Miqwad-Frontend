/**
 * @file ScrapPartRequestCard.tsx
 *
 * Premium inbox-style card for a browseable salvage order.
 * Photo thumbnail at inline-start, part info + vehicle, status pill,
 * "already offered" badge, relative time. Full card is a Link/button.
 *
 * Architecture: src/modules/scrap/components/
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Package } from "lucide-react";
import { ProviderStatusPill } from "@shared/provider-ui";
import type { SalvageOrder } from "../types";

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
  request: SalvageOrder;
  onSelect: (id: string) => void;
  /** Whether this scrap provider has already submitted an offer on this order. */
  alreadyOffered?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

/** Premium inbox-style card for a single browseable salvage order. */
export function ScrapPartRequestCard({ request, onSelect, alreadyOffered }: ScrapPartRequestCardProps) {
  const { t, i18n } = useTranslation();

  const vehicleLine = [request.brand, request.model, request.year].filter(Boolean).join(" · ");
  const timeAgo = formatTimeAgo(request.createdAt, i18n.language);

  return (
    <button
      type="button"
      onClick={() => onSelect(request.id)}
      style={{
        transition: [
          "transform var(--dur-base) var(--ease-provider)",
          "box-shadow var(--dur-base) var(--ease-provider)",
        ].join(", "),
      }}
      className={[
        "flex w-full items-start gap-4 p-4 sm:p-5 text-start",
        "bg-[var(--color-surface)] rounded-[var(--radius-lg)]",
        "shadow-[var(--shadow-provider-sm)]",
        "hover:-translate-y-0.5 hover:shadow-[var(--shadow-provider-hover)]",
        "focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-[var(--color-brand-orange)]/40",
        "cursor-pointer",
      ].join(" ")}
    >
      {/* Part thumbnail ─────────────────────────────────────────────────── */}
      <PartThumb src={request.photos[0]} />

      {/* Main content ───────────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className="truncate text-base font-semibold leading-snug text-[var(--color-ink-body)]">
          {request.partName}
        </p>

        <p className="text-sm text-[var(--color-muted)]">{vehicleLine}</p>

        <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <ProviderStatusPill tone="neutral" label={request.status} />
            {alreadyOffered && (
              <ProviderStatusPill tone="success" label={t("scrap.partRequests.alreadyOfferedBadge")} />
            )}
          </div>

          <span className="text-xs text-[var(--color-muted)]">{timeAgo}</span>
        </div>
      </div>
    </button>
  );
}
