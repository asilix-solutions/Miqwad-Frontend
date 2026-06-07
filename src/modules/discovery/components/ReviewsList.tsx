import { useTranslation } from "react-i18next";
import { Star, MessageSquareQuote } from "lucide-react";
import type { ProviderReviewsResponse } from "../types";
import { Badge } from "@/components/ui/badge";

/**
 * Read-only reviews list used in the public provider details page.
 *
 * Review writing is intentionally out of scope for Sprint 4 — the MVP
 * plan keeps that capability for the dedicated reviews sprint (Sprint 9).
 * This component just renders {average, total, items}.
 */
export function ReviewsList({ data }: { data: ProviderReviewsResponse | null | undefined }) {
  const { t } = useTranslation();

  if (!data || data.total === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-md)] border border-dashed border-ink-200 bg-white p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-100">
          <MessageSquareQuote className="h-5 w-5 text-ink-500" aria-hidden />
        </div>
        <p className="font-display text-sm font-semibold text-ink-900">
          {t("discovery.reviews.empty.title")}
        </p>
        <p className="text-xs text-ink-500 max-w-sm">
          {t("discovery.reviews.empty.description")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-4 rounded-[var(--radius-md)] border border-ink-200 bg-white p-4">
        <div className="text-center">
          <div className="font-display text-3xl font-bold text-ink-900">
            {data.averageRating.toFixed(1)}
          </div>
          <div className="flex items-center justify-center gap-0.5 text-warning-500 mt-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className={
                  i <= Math.round(data.averageRating)
                    ? "h-3.5 w-3.5 fill-current"
                    : "h-3.5 w-3.5 text-ink-200"
                }
              />
            ))}
          </div>
          <div className="text-[11px] text-ink-500 mt-1">
            {t("discovery.reviews.totalCount", { count: data.total })}
          </div>
        </div>
        <div className="flex-1 hidden sm:block">
          <p className="text-sm text-ink-700">
            {t("discovery.reviews.summary")}
          </p>
        </div>
      </div>

      {/* Items */}
      <ul className="space-y-3">
        {data.items.map((r) => (
          <li
            key={r.id}
            className="rounded-[var(--radius-md)] border border-ink-200 bg-white p-4"
          >
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-full bg-ink-100 text-ink-700 font-semibold flex items-center justify-center">
                  {r.authorName.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink-900">{r.authorName}</p>
                  <p className="text-[11px] text-ink-400">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Badge tone="warning" size="sm">
                <Star className="h-3 w-3 fill-current" />
                {r.rating.toFixed(1)}
              </Badge>
            </div>
            {r.comment && (
              <p className="mt-3 text-sm text-ink-700 leading-relaxed">{r.comment}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
