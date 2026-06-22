/**
 * @file ScrapDashboardPage.tsx
 *
 * Scrap provider operations hub — distinct from workshop (profile showcase)
 * and dealer (commercial tables). Layout top → bottom:
 *   1. Compact hero strip  — brand-blue backdrop, identity + meta chips
 *   2. KPI row (3 cards)   — open requests · escrow held · completed deals
 *   3. Recent part requests — 4-row preview with status + escrow pills
 *   4. Quick actions        — part-requests entry + conversations entry
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import {
  Star,
  MapPin,
  ShieldCheck,
  ClipboardList,
  CheckCircle2,
  MessageSquare,
  ChevronRight,
} from "lucide-react";
import {
  ProviderCard,
  ProviderStatCard,
  ProviderSkeleton,
  ProviderEmptyState,
} from "@shared/provider-ui";
import {
  useScrapProfileQuery,
  useScrapStatsQuery,
  usePartRequestsQuery,
} from "../hooks/useScrapQueries";
import { formatCurrency } from "@shared/lib/formatCurrency";
import { PartRequestPreviewRow } from "../components/dashboard/PartRequestPreviewRow";

// ── Component ─────────────────────────────────────────────────────────────────

/** Scrap provider dashboard — operations hub for part requests and escrow. */
export function ScrapDashboardPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [bannerError, setBannerError] = useState(false);

  const profileQuery  = useScrapProfileQuery();
  const statsQuery    = useScrapStatsQuery();
  const requestsQuery = usePartRequestsQuery({ pageSize: 4 });

  const profile  = profileQuery.data;
  const stats    = statsQuery.data;
  const requests = requestsQuery.data?.items ?? [];

  return (
    <div className="space-y-6">

      {/* ── 1. Hero strip ───────────────────────────────────────────────── */}
      <div className="provider-fade-up">
        <div
          className="relative w-full overflow-hidden rounded-[var(--radius-lg)]"
          style={{ height: "clamp(140px, 16vw, 180px)", backgroundColor: "#043168" }}
        >
          {/* Banner image — silent onError fallback to brand-blue */}
          {!bannerError && profile?.bannerUrl && (
            <img
              src={profile.bannerUrl}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover"
              onError={() => { setBannerError(true); }}
            />
          )}

          {/* Gradient overlay */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(4,49,104,0) 0%, rgba(4,49,104,0.82) 100%)",
            }}
          />

          {/* Loading skeleton */}
          {profileQuery.isLoading && (
            <div className="absolute inset-0 flex items-end p-5">
              <div className="flex-1 space-y-2">
                <ProviderSkeleton variant="line" width="44%" height={18} className="opacity-40" />
                <ProviderSkeleton variant="line" width="28%" height={12} className="opacity-30" />
              </div>
            </div>
          )}

          {/* Identity content */}
          {!profileQuery.isLoading && profile && (
            <div className="absolute inset-0 flex items-end p-5">
              <div className="flex-1 min-w-0 space-y-1.5">

                {/* Greeting + verified pill */}
                <div className="flex items-center gap-2 flex-wrap">
                  <h1
                    className="font-[var(--font-display)] text-lg font-bold leading-tight text-white"
                    style={{ textShadow: "0 1px 6px rgba(0,0,0,0.4)" }}
                  >
                    {t("scrap.dashboard.greeting", { name: profile.companyName })}
                  </h1>
                  {profile.isVerified && (
                    <span
                      className={[
                        "inline-flex items-center gap-1",
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none",
                        "bg-[var(--color-success-500)]/20 text-[var(--color-success-300,#6ee7b7)]",
                        "border border-[var(--color-success-500)]/30",
                      ].join(" ")}
                    >
                      {t("providers.profile.verified")}
                    </span>
                  )}
                </div>

                {/* Subtitle */}
                <p className="text-[11px] text-white/65 leading-snug">
                  {t("scrap.dashboard.subtitle")}
                </p>

                {/* Meta row: rating · city · brand chips */}
                <div className="flex items-center gap-3 flex-wrap text-white/70 text-[11px]">
                  {/* Rating */}
                  <span className="flex items-center gap-1">
                    <Star
                      className="h-3 w-3 shrink-0 fill-[var(--color-warning-500)] text-[var(--color-warning-500)]"
                      aria-hidden
                    />
                    <span className="font-semibold text-white">{profile.rating.toFixed(1)}</span>
                    {profile.totalRatings > 0 && (
                      <span>
                        ({t("scrap.profile.totalRatings", { count: profile.totalRatings })})
                      </span>
                    )}
                  </span>

                  {/* City */}
                  {profile.location?.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                      {profile.location.city}
                    </span>
                  )}

                  {/* Brand chips (max 4) */}
                  {profile.specializations.vehicleBrands.slice(0, 4).map((brand) => (
                    <span
                      key={brand}
                      className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium text-white/90 leading-none"
                    >
                      {t(`scrap.profile.specializations.brand.${brand}`, { defaultValue: brand })}
                    </span>
                  ))}
                </div>

              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 2. KPI row ──────────────────────────────────────────────────── */}
      <div
        className="provider-fade-up grid grid-cols-1 sm:grid-cols-3 gap-4"
        style={{ animationDelay: "60ms" }}
      >
        {/* Open requests — clickable → part-requests page */}
        <button
          type="button"
          className="block w-full text-start rounded-[var(--radius-lg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-orange)]/40"
          onClick={() => { void navigate("/provider/scrap/part-requests"); }}
        >
          <ProviderStatCard
            label={t("scrap.dashboard.kpiOpenRequests")}
            value={statsQuery.isLoading ? "" : String(stats?.openRequestsCount ?? 0)}
            icon={<ClipboardList className="h-5 w-5" aria-hidden />}
            tone="info"
            loading={statsQuery.isLoading}
          />
        </button>

        {/* Escrow held — signature metric (protected vault feel) */}
        <ProviderStatCard
          label={t("scrap.dashboard.kpiEscrowHeld")}
          value={
            statsQuery.isLoading
              ? ""
              : formatCurrency(stats?.escrowHeldAmount ?? 0, i18n.language)
          }
          icon={<ShieldCheck className="h-5 w-5" aria-hidden />}
          tone="warning"
          trend={t("scrap.dashboard.kpiEscrowHeldSub")}
          loading={statsQuery.isLoading}
        />

        {/* Completed deals */}
        <ProviderStatCard
          label={t("scrap.dashboard.kpiCompletedDeals")}
          value={statsQuery.isLoading ? "" : String(stats?.completedDealsCount ?? 0)}
          icon={<CheckCircle2 className="h-5 w-5" aria-hidden />}
          tone="success"
          loading={statsQuery.isLoading}
        />
      </div>

      {/* ── 3. Recent part requests ─────────────────────────────────────── */}
      <div
        className="provider-fade-up"
        style={{ animationDelay: "100ms" }}
      >
        <ProviderCard padded={false}>

          {/* Section header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h2
              className={[
                "font-[var(--font-display)] text-base font-semibold",
                "text-[var(--color-ink-body)]",
              ].join(" ")}
            >
              {t("scrap.dashboard.recentRequests")}
            </h2>
            <Link
              to="/provider/scrap/part-requests"
              className={[
                "text-sm font-medium",
                "text-[var(--color-brand-orange)]",
                "hover:text-[#E3460F]",
                "transition-colors duration-[var(--dur-base)]",
                "focus-visible:outline-none focus-visible:underline",
              ].join(" ")}
            >
              {t("scrap.dashboard.viewAll")}
            </Link>
          </div>

          {/* Loading skeleton */}
          {requestsQuery.isLoading && (
            <div className="px-5 pb-5 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex-1 space-y-2">
                    <ProviderSkeleton variant="line" width="55%" height={14} />
                    <ProviderSkeleton variant="line" width="38%" height={12} />
                  </div>
                  <ProviderSkeleton variant="line" width={90} height={22} />
                </div>
              ))}
            </div>
          )}

          {/* Error state */}
          {requestsQuery.isError && !requestsQuery.isLoading && (
            <div className="flex flex-col items-center gap-3 px-5 py-10">
              <p className="text-sm text-[var(--color-muted)]">
                {t("common.saveFailed")}
              </p>
              <button
                type="button"
                onClick={() => { void requestsQuery.refetch(); }}
                className={[
                  "rounded-[var(--radius-sm)] px-4 py-2 text-sm font-medium",
                  "bg-[var(--color-brand-50)] text-[var(--color-brand-orange)]",
                  "hover:bg-[var(--color-brand-100,#fde8df)]",
                  "transition-colors duration-[var(--dur-base)]",
                ].join(" ")}
              >
                {t("common.retry")}
              </button>
            </div>
          )}

          {/* Empty state */}
          {!requestsQuery.isLoading && !requestsQuery.isError && requests.length === 0 && (
            <div className="px-5 pb-5">
              <ProviderEmptyState
                icon={<ClipboardList className="h-8 w-8" />}
                title={t("scrap.dashboard.emptyRequests")}
                description={t("scrap.dashboard.emptyRequestsHint")}
              />
            </div>
          )}

          {/* Request rows */}
          {!requestsQuery.isLoading && !requestsQuery.isError && requests.length > 0 && (
            <div className="divide-y divide-[var(--color-divider)] pb-2">
              {requests.map((request) => (
                <PartRequestPreviewRow key={request.id} request={request} />
              ))}
            </div>
          )}

        </ProviderCard>
      </div>

      {/* ── 4. Quick actions ────────────────────────────────────────────── */}
      <div
        className="provider-fade-up grid grid-cols-1 sm:grid-cols-2 gap-4"
        style={{ animationDelay: "140ms" }}
      >
        {/* Part requests */}
        <ProviderCard padded={false} interactive>
          <Link
            to="/provider/scrap/part-requests"
            className={[
              "flex items-center gap-4 p-5",
              "rounded-[var(--radius-lg)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset",
              "focus-visible:ring-[var(--color-brand-orange)]/40",
            ].join(" ")}
          >
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-brand-50)] text-[var(--color-brand-orange)]"
              aria-hidden
            >
              <ClipboardList className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--color-ink-body)]">
                {t("scrap.dashboard.quickPartRequests")}
              </p>
              <p className="text-xs text-[var(--color-muted)] truncate">
                {t("scrap.dashboard.quickPartRequestsHint")}
              </p>
            </div>
            <ChevronRight
              className="h-4 w-4 shrink-0 text-[var(--color-muted)] rtl:rotate-180"
              aria-hidden
            />
          </Link>
        </ProviderCard>

        {/* Conversations (deferred chat wire-in) */}
        <ProviderCard padded={false} interactive>
          <Link
            to="/provider/scrap/conversations"
            className={[
              "flex items-center gap-4 p-5",
              "rounded-[var(--radius-lg)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset",
              "focus-visible:ring-[var(--color-brand-orange)]/40",
            ].join(" ")}
          >
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-2)] text-[var(--color-ink-body)]"
              aria-hidden
            >
              <MessageSquare className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--color-ink-body)]">
                {t("scrap.dashboard.quickConversations")}
              </p>
              <p className="text-xs text-[var(--color-muted)] truncate">
                {t("scrap.dashboard.quickConversationsHint")}
              </p>
            </div>
            <ChevronRight
              className="h-4 w-4 shrink-0 text-[var(--color-muted)] rtl:rotate-180"
              aria-hidden
            />
          </Link>
        </ProviderCard>
      </div>

    </div>
  );
}
