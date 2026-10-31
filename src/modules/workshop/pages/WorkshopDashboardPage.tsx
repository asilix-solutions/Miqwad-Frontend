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
  MessageSquare,
  CalendarClock,
  ChevronRight,
  UserCheck,
  UserCircle,
} from "lucide-react";
import { ProviderCard, ProviderStatCard, ProviderSkeleton } from "@shared/provider-ui";
import type { StatusPillTone } from "@shared/provider-ui";
import { useAppSelector } from "@app/store";
import { useAccountProfileQuery } from "@modules/profile/hooks/useProfileQueries";
import { computeProfileCompleteness } from "../lib/profileCompleteness";

// ── Component ─────────────────────────────────────────────────────────────────

export function WorkshopDashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const user = useAppSelector((s) => s.auth.user);
  const accountProfileQuery = useAccountProfileQuery();

  const accountProfile = accountProfileQuery.data;

  const displayName = accountProfile?.fullName || user?.fullName || "";
  const workingHoursLabel = [accountProfile?.workingDays, accountProfile?.workingHours]
    .filter(Boolean)
    .join(" · ");

  // Subscription: /workshop/subscription returns 404 on live backend.
  // Display truthful unavailable state ("—") without calling the legacy endpoint.
  const subValue = "—";
  const subTone: StatusPillTone = "info";

  // Completeness & rating: WorkshopProfile is mock-only on legacy endpoint.
  // When no verified WorkshopProfile exists, display "—" rather than false 0% or 0.0.
  const profileCompleteness = computeProfileCompleteness(undefined);
  const completenessValue = profileCompleteness === null ? "—" : `${profileCompleteness}%`;
  const completenessTone: StatusPillTone =
    profileCompleteness === null
      ? "info"
      : profileCompleteness < 50
        ? "danger"
        : profileCompleteness < 80
          ? "warning"
          : "success";
  const completenessTrend =
    profileCompleteness === null ? undefined : t("workshop.dashboard.completenessHint");

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

          {accountProfileQuery.isLoading && (
            <div className="absolute inset-0 flex items-end p-6">
              <div className="flex-1 space-y-2">
                <ProviderSkeleton variant="line" width="48%" height={22} className="opacity-40" />
                <ProviderSkeleton variant="line" width="30%" height={14} className="opacity-30" />
              </div>
            </div>
          )}

          {!accountProfileQuery.isLoading && (
            <div className="absolute inset-0 flex items-end p-6">
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1
                    className="truncate text-xl leading-tight font-[var(--font-display)] font-bold text-white"
                    style={{ textShadow: "0 1px 6px rgba(0,0,0,0.35)" }}
                  >
                    {displayName
                      ? t("workshop.dashboard.greeting", { name: displayName })
                      : t("workshop.dashboard.title")}
                  </h1>
                  <span
                    className={[
                      "inline-flex items-center gap-1",
                      "rounded-full px-2 py-0.5 text-[10px] leading-none font-semibold",
                      "border border-white/20 bg-white/15 text-white/90",
                    ].join(" ")}
                  >
                    {t("superAdmin.providers.types.workshop")}
                  </span>
                </div>

                <p className="text-xs leading-snug text-white/70">
                  {t("workshop.dashboard.subtitle")}
                </p>

                {(accountProfile?.city || workingHoursLabel) && (
                  <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
                    {accountProfile?.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        {accountProfile.city}
                      </span>
                    )}
                    {workingHoursLabel && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
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

      {/* ── 2. KPI cards (3) ────────────────────────────────────────────── */}
      <div
        className="provider-fade-up grid grid-cols-1 gap-4 sm:grid-cols-3"
        style={{ animationDelay: "60ms" }}
      >
        {/* 1. Subscription + days remaining — clickable */}
        <button
          type="button"
          className="block w-full rounded-[var(--radius-lg)] text-start focus-visible:ring-2 focus-visible:ring-[var(--color-brand-orange)]/40 focus-visible:outline-none"
          onClick={() => void navigate("/provider/workshop/subscription")}
        >
          <ProviderStatCard
            label={t("workshop.dashboard.kpiSubscription")}
            value={subValue}
            icon={<CalendarClock className="h-5 w-5" aria-hidden />}
            tone={subTone}
          />
        </button>

        {/* 2. Rating + reviews count */}
        <ProviderStatCard
          label={t("workshop.dashboard.kpiRating")}
          value="—"
          icon={<Star className="h-5 w-5" aria-hidden />}
          tone="warning"
          loading={accountProfileQuery.isLoading}
        />

        {/* 3. Profile completeness — clickable */}
        <button
          type="button"
          className="block w-full rounded-[var(--radius-lg)] text-start focus-visible:ring-2 focus-visible:ring-[var(--color-brand-orange)]/40 focus-visible:outline-none"
          onClick={() => void navigate("/provider/workshop/profile")}
        >
          <ProviderStatCard
            label={t("workshop.dashboard.kpiCompleteness")}
            value={completenessValue}
            icon={<UserCheck className="h-5 w-5" aria-hidden />}
            tone={completenessTone}
            trend={completenessTrend}
            loading={accountProfileQuery.isLoading}
          />
        </button>
      </div>

      {/* ── 3. Quick-action cards ────────────────────────────────────────── */}
      <div
        className="provider-fade-up grid grid-cols-1 gap-4 sm:grid-cols-2"
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
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[var(--color-ink-body)]">
                {t("workshop.dashboard.manageConversations")}
              </p>
              <p className="truncate text-xs text-[var(--color-muted)]">
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
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[var(--color-ink-body)]">
                {t("workshop.dashboard.editProfile")}
              </p>
              <p className="truncate text-xs text-[var(--color-muted)]">
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
