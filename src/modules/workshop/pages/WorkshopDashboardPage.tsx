/**
 * @file WorkshopDashboardPage.tsx
 *
 * Workshop provider overview — hero-first layout, intentionally distinct from
 * the Dealer dashboard. Sections (top → bottom):
 *   1. Hero banner          — brand-blue backdrop + gradient, workshop identity
 *   2. KPI strip (3 cards)  — subscription · rating · profile completeness
 *   3. Quick-action cards   — conversations entry + edit profile
 */

import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import {
  Star,
  MapPin,
  Clock,
  Wrench,
  MessageSquare,
  CalendarClock,
  ChevronRight,
  UserCheck,
  UserCircle,
} from "lucide-react";
import {
  ProviderCard,
  ProviderStatCard,
  ProviderSkeleton,
  ProviderStatusPill,
} from "@shared/provider-ui";
import type { StatusPillTone } from "@shared/provider-ui";
import {
  useWorkshopProfileQuery,
  useWorkshopSubscriptionQuery,
} from "../hooks/useWorkshopQueries";
import { computeProfileCompleteness } from "../lib/profileCompleteness";

// ── Component ─────────────────────────────────────────────────────────────────

export function WorkshopDashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const profileQuery      = useWorkshopProfileQuery();
  const subscriptionQuery = useWorkshopSubscriptionQuery();

  const profile = profileQuery.data;
  const sub     = subscriptionQuery.data;

  const daysLeft = sub
    ? Math.ceil((new Date(sub.endDate).getTime() - Date.now()) / 86_400_000)
    : null;

  const subValue =
    subscriptionQuery.isLoading ? "" : daysLeft === null ? "—" : String(Math.max(0, daysLeft));

  const subTrend =
    !subscriptionQuery.isLoading && daysLeft !== null
      ? daysLeft <= 0
        ? t("workshop.dashboard.subscriptionExpired")
        : t("workshop.dashboard.subscriptionDaysLeft", { count: daysLeft })
      : undefined;

  const subTone: StatusPillTone =
    sub?.status === "expired" || (daysLeft !== null && daysLeft <= 0)
      ? "danger"
      : daysLeft !== null && daysLeft > 0 && daysLeft <= 7
      ? "warning"
      : daysLeft !== null && daysLeft > 7
      ? "success"
      : "info";

  const pct = computeProfileCompleteness(profile);
  const pctTone: StatusPillTone = pct < 50 ? "danger" : pct < 80 ? "warning" : "success";

  return (
    <div className="space-y-6">

      {/* ── 1. Hero banner ──────────────────────────────────────────────── */}
      <div className="provider-fade-up">
        <div
          className="relative w-full overflow-hidden rounded-[var(--radius-lg)]"
          style={{ height: "clamp(150px, 20vw, 200px)", backgroundColor: "#043168" }}
        >
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(4,49,104,0) 0%, rgba(4,49,104,0.72) 100%)",
            }}
          />

          {profileQuery.isLoading && (
            <div className="absolute inset-0 flex items-end p-6">
              <div className="flex-1 space-y-2">
                <ProviderSkeleton variant="line" width="48%" height={22} className="opacity-40" />
                <ProviderSkeleton variant="line" width="30%" height={14} className="opacity-30" />
              </div>
            </div>
          )}

          {!profileQuery.isLoading && profile && (
            <div className="absolute inset-0 flex items-end p-6">
              <div className="flex-1 min-w-0 space-y-1.5">

                <div className="flex items-center gap-2 flex-wrap">
                  <h1
                    className="font-[var(--font-display)] text-xl font-bold leading-tight text-white"
                    style={{ textShadow: "0 1px 6px rgba(0,0,0,0.35)" }}
                  >
                    {profile.companyName}
                  </h1>
                  {profile.isVerified && (
                    <ProviderStatusPill
                      tone="success"
                      label={t("providers.profile.verified")}
                      className="shrink-0"
                    />
                  )}
                </div>

                <div className="flex items-center gap-4 flex-wrap text-white/80 text-sm">
                  {profile.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      {profile.city}
                    </span>
                  )}
                  {profile.specializationLabel && (
                    <span className="flex items-center gap-1">
                      <Wrench className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      {profile.specializationLabel}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 flex-wrap text-white/70 text-xs">
                  <span className="flex items-center gap-1">
                    <Star
                      className="h-3.5 w-3.5 shrink-0 fill-[var(--color-warning-500)] text-[var(--color-warning-500)]"
                      aria-hidden
                    />
                    <span className="font-semibold text-white">{profile.rating.toFixed(1)}</span>
                    {profile.totalRatings > 0 && (
                      <span>
                        ({t("workshop.dashboard.totalRatings", { count: profile.totalRatings })})
                      </span>
                    )}
                  </span>
                  {profile.workingHoursLabel && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      {profile.workingHoursLabel}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 2. KPI cards (3) ────────────────────────────────────────────── */}
      <div
        className="provider-fade-up grid grid-cols-1 sm:grid-cols-3 gap-4"
        style={{ animationDelay: "60ms" }}
      >
        {/* 1. Subscription + days remaining — clickable */}
        <button
          type="button"
          className="block w-full text-start rounded-[var(--radius-lg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-orange)]/40"
          onClick={() => void navigate("/provider/workshop/subscription")}
        >
          <ProviderStatCard
            label={t("workshop.dashboard.kpiSubscription")}
            value={subValue}
            icon={<CalendarClock className="h-5 w-5" aria-hidden />}
            tone={subTone}
            trend={subTrend}
            loading={subscriptionQuery.isLoading}
          />
        </button>

        {/* 2. Rating + reviews count */}
        <ProviderStatCard
          label={t("workshop.dashboard.kpiRating")}
          value={profileQuery.isLoading ? "" : profile ? profile.rating.toFixed(1) : "—"}
          icon={<Star className="h-5 w-5" aria-hidden />}
          tone="warning"
          trend={
            profile?.totalRatings
              ? t("workshop.dashboard.totalRatings", { count: profile.totalRatings })
              : undefined
          }
          loading={profileQuery.isLoading}
        />

        {/* 3. Profile completeness — clickable */}
        <button
          type="button"
          className="block w-full text-start rounded-[var(--radius-lg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-orange)]/40"
          onClick={() => void navigate("/provider/workshop/profile")}
        >
          <ProviderStatCard
            label={t("workshop.dashboard.kpiCompleteness")}
            value={profileQuery.isLoading ? "" : `${pct}%`}
            icon={<UserCheck className="h-5 w-5" aria-hidden />}
            tone={pctTone}
            trend={t("workshop.dashboard.completenessHint")}
            loading={profileQuery.isLoading}
          />
        </button>
      </div>

      {/* ── 3. Quick-action cards ────────────────────────────────────────── */}
      <div
        className="provider-fade-up grid grid-cols-1 sm:grid-cols-2 gap-4"
        style={{ animationDelay: "100ms" }}
      >
        {/* Conversations entry point (deferred chat wire-in) */}
        <ProviderCard padded={false} interactive>
          <Link
            to="/provider/workshop/conversations"
            className={[
              "flex items-center gap-4 p-5",
              "rounded-[var(--radius-lg)]",
              "focus-visible:outline-none",
              "focus-visible:ring-2 focus-visible:ring-inset",
              "focus-visible:ring-[var(--color-brand-orange)]/40",
            ].join(" ")}
          >
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-brand-50)] text-[var(--color-brand-orange)]"
              aria-hidden
            >
              <MessageSquare className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--color-ink-body)]">
                {t("workshop.dashboard.manageConversations")}
              </p>
              <p className="text-xs text-[var(--color-muted)] truncate">
                {t("workshop.dashboard.manageConversationsHint")}
              </p>
            </div>
            <ChevronRight
              className="h-4 w-4 shrink-0 text-[var(--color-muted)] rtl:rotate-180"
              aria-hidden
            />
          </Link>
        </ProviderCard>

        {/* Edit profile */}
        <ProviderCard padded={false} interactive>
          <Link
            to="/provider/workshop/profile"
            className={[
              "flex items-center gap-4 p-5",
              "rounded-[var(--radius-lg)]",
              "focus-visible:outline-none",
              "focus-visible:ring-2 focus-visible:ring-inset",
              "focus-visible:ring-[var(--color-brand-orange)]/40",
            ].join(" ")}
          >
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-2)] text-[var(--color-ink-body)]"
              aria-hidden
            >
              <UserCircle className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--color-ink-body)]">
                {t("workshop.dashboard.editProfile")}
              </p>
              <p className="text-xs text-[var(--color-muted)] truncate">
                {t("workshop.dashboard.editProfileHint")}
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
