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

import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import {
  MapPin,
  Clock,
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
import { useAppSelector } from "@app/store";
import { useAccountProfileQuery } from "@modules/profile/hooks/useProfileQueries";
import { useSalvageOrdersQuery } from "../hooks/useSalvageOrders";
import { PartRequestPreviewRow } from "../components/dashboard/PartRequestPreviewRow";

// ── Component ─────────────────────────────────────────────────────────────────

/** Scrap provider dashboard — operations hub for part requests and escrow. */
export function ScrapDashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const user = useAppSelector((s) => s.auth.user);
  const accountProfileQuery = useAccountProfileQuery();
  const requestsQuery = useSalvageOrdersQuery({ pageSize: 4 });

  const accountProfile = accountProfileQuery.data;
  const requests = requestsQuery.data?.items ?? [];

  const displayName = accountProfile?.fullName || user?.fullName || "";
  const workingHoursLabel = [accountProfile?.workingDays, accountProfile?.workingHours]
    .filter(Boolean)
    .join(" · ");

  // Total requests: live server total from /api/Orders?OrderType=2.
  // Labeled accurately as Total Requests (not Open Requests) since the endpoint filters by type,
  // not by order status.
  const totalRequestsCount = requestsQuery.data?.total;
  const totalRequestsLoading = requestsQuery.isLoading;
  const totalRequestsValue = totalRequestsLoading
    ? ""
    : typeof totalRequestsCount === "number"
      ? String(totalRequestsCount)
      : "—";

  // Escrow held & completed deals: unsupported without /scrap/stats (legacy endpoint returns 404).
  // Render truthful unavailable indicator ("—") without calling unsupported endpoint.
  const escrowHeldValue = "—";
  const completedDealsValue = "—";

  return (
    <div className="space-y-6">
      {/* ── 1. Hero strip ───────────────────────────────────────────────── */}
      <div className="provider-fade-up">
        <div
          className="relative w-full overflow-hidden rounded-[var(--radius-lg)]"
          style={{ height: "clamp(140px, 16vw, 180px)", backgroundColor: "#043168" }}
        >
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
          {accountProfileQuery.isLoading && (
            <div className="absolute inset-0 flex items-end p-5">
              <div className="flex-1 space-y-2">
                <ProviderSkeleton variant="line" width="44%" height={18} className="opacity-40" />
                <ProviderSkeleton variant="line" width="28%" height={12} className="opacity-30" />
              </div>
            </div>
          )}

          {/* Identity content */}
          {!accountProfileQuery.isLoading && (
            <div className="absolute inset-0 flex items-end p-5">
              <div className="min-w-0 flex-1 space-y-1.5">
                {/* Greeting + provider type pill */}
                <div className="flex flex-wrap items-center gap-2">
                  <h1
                    className="truncate text-lg leading-tight font-[var(--font-display)] font-bold text-white"
                    style={{ textShadow: "0 1px 6px rgba(0,0,0,0.4)" }}
                  >
                    {displayName
                      ? t("scrap.dashboard.greeting", { name: displayName })
                      : t("scrap.dashboard.title")}
                  </h1>
                  <span
                    className={[
                      "inline-flex items-center gap-1",
                      "rounded-full px-2 py-0.5 text-[10px] leading-none font-semibold",
                      "border border-white/20 bg-white/15 text-white/90",
                    ].join(" ")}
                  >
                    {t("superAdmin.providers.types.scrap")}
                  </span>
                </div>

                {/* Subtitle */}
                <p className="text-[11px] leading-snug text-white/65">
                  {t("scrap.dashboard.subtitle")}
                </p>

                {/* Meta row: city · working hours (only when supported data is present) */}
                {(accountProfile?.city || workingHoursLabel) && (
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-white/70">
                    {accountProfile?.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                        {accountProfile.city}
                      </span>
                    )}
                    {workingHoursLabel && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 shrink-0" aria-hidden />
                        {workingHoursLabel}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 2. KPI row ──────────────────────────────────────────────────── */}
      <div
        className="provider-fade-up grid grid-cols-1 gap-4 sm:grid-cols-3"
        style={{ animationDelay: "60ms" }}
      >
        {/* Total requests — clickable → part-requests page */}
        <button
          type="button"
          className="block w-full rounded-[var(--radius-lg)] text-start focus-visible:ring-2 focus-visible:ring-[var(--color-brand-orange)]/40 focus-visible:outline-none"
          onClick={() => {
            void navigate("/provider/scrap/part-requests");
          }}
        >
          <ProviderStatCard
            label={t("scrap.dashboard.kpiTotalRequests")}
            value={totalRequestsValue}
            icon={<ClipboardList className="h-5 w-5" aria-hidden />}
            tone="info"
            loading={totalRequestsLoading}
          />
        </button>

        {/* Escrow held — signature metric (unavailable without live backend stats endpoint) */}
        <ProviderStatCard
          label={t("scrap.dashboard.kpiEscrowHeld")}
          value={escrowHeldValue}
          icon={<ShieldCheck className="h-5 w-5" aria-hidden />}
          tone="warning"
        />

        {/* Completed deals — unavailable without live backend stats endpoint */}
        <ProviderStatCard
          label={t("scrap.dashboard.kpiCompletedDeals")}
          value={completedDealsValue}
          icon={<CheckCircle2 className="h-5 w-5" aria-hidden />}
          tone="success"
        />
      </div>

      {/* ── 3. Recent part requests ─────────────────────────────────────── */}
      <div className="provider-fade-up" style={{ animationDelay: "100ms" }}>
        <ProviderCard padded={false}>
          {/* Section header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h2
              className={[
                "text-base font-[var(--font-display)] font-semibold",
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
                "focus-visible:underline focus-visible:outline-none",
              ].join(" ")}
            >
              {t("scrap.dashboard.viewAll")}
            </Link>
          </div>

          {/* Loading skeleton */}
          {requestsQuery.isLoading && (
            <div className="space-y-4 px-5 pb-5">
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
                {t("scrap.partRequests.errorTitle")}
              </p>
              <button
                type="button"
                disabled={requestsQuery.isFetching}
                onClick={() => {
                  void requestsQuery.refetch();
                }}
                className={[
                  "rounded-[var(--radius-sm)] px-4 py-2 text-sm font-medium",
                  "bg-[var(--color-brand-50)] text-[var(--color-brand-orange)]",
                  "hover:bg-[var(--color-brand-100,#fde8df)]",
                  "disabled:opacity-50",
                  "transition-colors duration-[var(--dur-base)]",
                ].join(" ")}
              >
                {requestsQuery.isFetching ? t("common.loading") : t("common.retry")}
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
        className="provider-fade-up grid grid-cols-1 gap-4 sm:grid-cols-2"
        style={{ animationDelay: "140ms" }}
      >
        {/* Part requests */}
        <ProviderCard padded={false} interactive>
          <Link
            to="/provider/scrap/part-requests"
            className={[
              "flex items-center gap-4 p-5",
              "rounded-[var(--radius-lg)]",
              "focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset",
              "focus-visible:ring-[var(--color-brand-orange)]/40",
            ].join(" ")}
          >
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-brand-50)] text-[var(--color-brand-orange)]"
              aria-hidden
            >
              <ClipboardList className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[var(--color-ink-body)]">
                {t("scrap.dashboard.quickPartRequests")}
              </p>
              <p className="truncate text-xs text-[var(--color-muted)]">
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
              "focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset",
              "focus-visible:ring-[var(--color-brand-orange)]/40",
            ].join(" ")}
          >
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-2)] text-[var(--color-ink-body)]"
              aria-hidden
            >
              <MessageSquare className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[var(--color-ink-body)]">
                {t("scrap.dashboard.quickConversations")}
              </p>
              <p className="truncate text-xs text-[var(--color-muted)]">
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
