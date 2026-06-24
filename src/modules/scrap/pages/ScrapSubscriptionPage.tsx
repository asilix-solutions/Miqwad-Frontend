/**
 * @file ScrapSubscriptionPage.tsx
 *
 * Full subscription management page for the scrap provider.
 * Sections (top → bottom):
 *   1. Current-plan hero card — plan name, status pill, price/cycle, days-left
 *      progress bar, start/end/renewedAt dates.
 *   2. Privileges — priorityListing + verifiedBadge with on/off indicators.
 *   3. Renew / Reactivate action — confirm dialog → mutation → toast → query refresh.
 *   4. Other plans teaser — two non-functional coming-soon placeholder cards.
 *
 * Days-left logic is shared via @shared/lib/subscriptionStatus so workshop and
 * scrap always show consistent thresholds.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  CreditCard,
  CalendarClock,
  CheckCircle2,
  XCircle,
  Star,
  BadgeCheck,
  RefreshCw,
} from "lucide-react";
import {
  ProviderCard,
  ProviderPageHeader,
  ProviderEmptyState,
  ProviderSkeleton,
  ProviderStatusPill,
  ProviderDialog,
} from "@shared/provider-ui";
import { useToast } from "@shared/components/ui/toastContext";
import {
  useScrapSubscriptionQuery,
  useRenewScrapSubscriptionMutation,
} from "../hooks/useScrapQueries";
import {
  computeSubscriptionDaysLeft,
  subscriptionTone,
  subscriptionProgressColor,
} from "@shared/lib/subscriptionStatus";
import type { ScrapSubscription } from "../types";

// ── Date helper ───────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("ar-SA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

// ── PlanHeroSkeleton ──────────────────────────────────────────────────────────

function PlanHeroSkeleton() {
  return (
    <ProviderCard className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <ProviderSkeleton variant="line" width="45%" height={28} />
          <ProviderSkeleton variant="line" width="30%" height={20} />
          <ProviderSkeleton variant="line" width="38%" height={16} />
        </div>
        <ProviderSkeleton variant="circle" width={48} height={48} />
      </div>
      <ProviderSkeleton variant="block" height={10} className="rounded-full" />
      <div className="flex gap-4">
        <ProviderSkeleton variant="line" width="40%" height={14} />
        <ProviderSkeleton variant="line" width="40%" height={14} />
      </div>
    </ProviderCard>
  );
}

// ── PlanHeroCard ──────────────────────────────────────────────────────────────

interface PlanHeroCardProps {
  sub: ScrapSubscription;
  onRenew: () => void;
  isRenewing: boolean;
}

function PlanHeroCard({ sub, onRenew, isRenewing }: PlanHeroCardProps) {
  const { t } = useTranslation();

  const daysLeft = computeSubscriptionDaysLeft(sub.endDate);
  const tone = subscriptionTone(sub.status, daysLeft);
  const progressColor = subscriptionProgressColor(sub.status, daysLeft);

  const totalMs = new Date(sub.endDate).getTime() - new Date(sub.startDate).getTime();
  const elapsedMs = Date.now() - new Date(sub.startDate).getTime();
  const remainingPct = Math.min(
    100,
    Math.max(0, Math.round(((totalMs - elapsedMs) / totalMs) * 100)),
  );

  const isExpiredOrCancelled = sub.status === "expired" || sub.status === "cancelled";
  const renewLabel = isExpiredOrCancelled
    ? t("scrap.subscription.reactivate")
    : t("scrap.subscription.renewBtn");

  const statusLabel = t(`scrap.subscription.status.${sub.status}` as const);
  const cycleSuffix = t(`scrap.subscription.cycleLabel.${sub.billingCycle}` as const);

  const daysDisplayColor =
    daysLeft <= 0
      ? "var(--color-danger-500)"
      : daysLeft <= 7
      ? "var(--color-warning-500)"
      : "var(--color-success-500)";

  return (
    <ProviderCard
      className="relative overflow-hidden"
      style={{ borderTop: "4px solid var(--color-brand-orange)" }}
    >
      {/* ── Plan identity ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="min-w-0">
          <p className="text-xs font-medium text-[var(--color-muted)] mb-1">
            {t("scrap.subscription.currentPlan")}
          </p>
          <h2 className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-ink-body)] leading-tight mb-2">
            {sub.planName}
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            <ProviderStatusPill tone={tone} label={statusLabel} />
            <span className="text-sm font-semibold text-[var(--color-ink-body)]">
              {sub.price.toLocaleString("ar-SA")}{" "}
              <span className="font-normal text-[var(--color-muted)]">ر.س</span>{" "}
              <span className="font-normal text-[var(--color-muted)]">{cycleSuffix}</span>
            </span>
          </div>
        </div>

        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-brand-50)]"
          aria-hidden
        >
          <CreditCard className="h-6 w-6 text-[var(--color-brand-orange)]" />
        </div>
      </div>

      {/* ── Days-remaining + progress bar ─────────────────────────────── */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[var(--color-muted)]">
            {t("scrap.subscription.progressLabel")}
          </span>
          <span className="text-sm font-bold" style={{ color: daysDisplayColor }}>
            {daysLeft <= 0
              ? t("scrap.subscription.status.expired")
              : t("scrap.subscription.daysRemaining", { count: Math.max(0, daysLeft) })}
          </span>
        </div>

        <div
          className="relative h-2.5 w-full overflow-hidden rounded-full"
          style={{ backgroundColor: "var(--color-divider)" }}
          role="progressbar"
          aria-valuenow={remainingPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t("scrap.subscription.daysRemaining", { count: Math.max(0, daysLeft) })}
        >
          <div
            className="absolute inset-y-0 start-0 rounded-full"
            style={{
              width: `${remainingPct}%`,
              backgroundColor: progressColor,
              transition: "width var(--dur-slow) var(--ease-provider)",
            }}
          />
        </div>
      </div>

      {/* ── Date details ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-sm mb-6">
        <span className="text-[var(--color-muted)]">
          <span className="font-medium text-[var(--color-ink-body)]">
            {t("scrap.subscription.startedOn")}
          </span>{" "}
          {formatDate(sub.startDate)}
        </span>
        <span className="text-[var(--color-muted)]">
          <span className="font-medium text-[var(--color-ink-body)]">
            {t("scrap.subscription.expiresOn")}
          </span>{" "}
          {formatDate(sub.endDate)}
        </span>
        {sub.renewedAt && (
          <span className="text-[var(--color-muted)]">
            <span className="font-medium text-[var(--color-ink-body)]">
              {t("scrap.subscription.renewedOn")}
            </span>{" "}
            {formatDate(sub.renewedAt)}
          </span>
        )}
      </div>

      {/* ── Renew button ──────────────────────────────────────────────── */}
      <button
        type="button"
        disabled={isRenewing}
        onClick={onRenew}
        className="inline-flex items-center gap-2 rounded-[var(--radius-md)] px-5 text-sm font-semibold text-white transition-colors duration-[var(--dur-fast)] disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-orange)]/40"
        style={{
          height: "var(--size-input-h)",
          backgroundColor: "var(--color-brand-orange)",
        }}
        onMouseEnter={(e) => {
          if (!isRenewing)
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#E3460F";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor =
            "var(--color-brand-orange)";
        }}
      >
        <RefreshCw className={`h-4 w-4 ${isRenewing ? "animate-spin" : ""}`} aria-hidden />
        {isRenewing ? t("common.loading") : renewLabel}
      </button>
    </ProviderCard>
  );
}

// ── PrivilegesCard ────────────────────────────────────────────────────────────

interface PrivilegesCardProps {
  sub: ScrapSubscription;
}

function PrivilegesCard({ sub }: PrivilegesCardProps) {
  const { t } = useTranslation();

  const rows: Array<{ key: keyof typeof sub.privileges; Icon: typeof Star }> = [
    { key: "priorityListing", Icon: Star },
    { key: "verifiedBadge", Icon: BadgeCheck },
  ];

  return (
    <ProviderCard>
      <h3 className="text-sm font-semibold text-[var(--color-ink-body)] mb-4">
        {t("scrap.subscription.privileges.title")}
      </h3>
      <div className="divide-y divide-[var(--color-divider)]">
        {rows.map(({ key, Icon }, idx) => {
          const active = sub.privileges[key];
          return (
            <div
              key={key}
              className={`flex items-center gap-4 py-3.5 ${idx === 0 ? "pt-0" : ""}`}
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)]"
                style={{
                  backgroundColor: active
                    ? "var(--color-brand-50)"
                    : "var(--color-surface-2)",
                }}
                aria-hidden
              >
                <Icon
                  className="h-4 w-4"
                  style={{
                    color: active ? "var(--color-brand-orange)" : "var(--color-muted)",
                  }}
                />
              </div>

              <span
                className="flex-1 text-sm"
                style={{
                  color: active ? "var(--color-ink-body)" : "var(--color-muted)",
                }}
              >
                {t(`scrap.subscription.privileges.${key}` as const)}
              </span>

              <div className="flex items-center gap-1.5 shrink-0">
                {active ? (
                  <>
                    <CheckCircle2
                      className="h-4 w-4"
                      style={{ color: "var(--color-success-500)" }}
                      aria-hidden
                    />
                    <span
                      className="text-xs font-medium"
                      style={{ color: "var(--color-success-500)" }}
                    >
                      {t("scrap.subscription.privilegeActive")}
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-[var(--color-muted)]" aria-hidden />
                    <span className="text-xs font-medium text-[var(--color-muted)]">
                      {t("scrap.subscription.privilegeInactive")}
                    </span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ProviderCard>
  );
}

// ── RenewConfirmDialog ────────────────────────────────────────────────────────

interface RenewConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading: boolean;
  isExpiredOrCancelled: boolean;
}

function RenewConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
  isExpiredOrCancelled,
}: RenewConfirmDialogProps) {
  const { t } = useTranslation();

  return (
    <ProviderDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("scrap.subscription.renewConfirmTitle")}
      size="sm"
      blurBackdrop
      footer={
        <>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="inline-flex h-9 items-center rounded-[var(--radius-md)] border border-[var(--color-divider)] px-4 text-sm font-medium text-[var(--color-ink-body)] transition-colors duration-[var(--dur-fast)] hover:bg-[var(--color-surface-2)] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-orange)]/40"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-md)] px-4 text-sm font-semibold text-white transition-colors duration-[var(--dur-fast)] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-orange)]/40"
            style={{ backgroundColor: "var(--color-brand-orange)" }}
            onMouseEnter={(e) => {
              if (!isLoading)
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#E3460F";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "var(--color-brand-orange)";
            }}
          >
            {isLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden />}
            {isExpiredOrCancelled
              ? t("scrap.subscription.reactivate")
              : t("scrap.subscription.renewBtn")}
          </button>
        </>
      }
    >
      <p className="text-sm text-[var(--color-muted)]">
        {t("scrap.subscription.renewConfirmBody")}
      </p>
    </ProviderDialog>
  );
}

// ── OtherPlansTeaser ──────────────────────────────────────────────────────────

function OtherPlansTeaser() {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === "en";

  const placeholders = [
    {
      Icon: CalendarClock,
      label: isEn ? "Monthly Plan" : "الباقة الشهرية",
      price: isEn ? "249 SAR / month" : "249 ر.س / شهريًا",
    },
    {
      Icon: Star,
      label: isEn ? "Annual Plan" : "الباقة السنوية",
      price: isEn ? "1,999 SAR / year" : "1,999 ر.س / سنويًا",
    },
  ];

  return (
    <div>
      <h3 className="text-sm font-semibold text-[var(--color-ink-body)] mb-3">
        {t("scrap.subscription.otherPlans")}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {placeholders.map(({ Icon, label, price }) => (
          <div
            key={label}
            aria-disabled="true"
            className="relative overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-surface)] shadow-[var(--shadow-provider-sm)] p-5 opacity-60 cursor-default select-none"
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-surface-2)]"
                aria-hidden
              >
                <Icon className="h-4 w-4 text-[var(--color-muted)]" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--color-ink-body)] leading-tight">
                  {label}
                </p>
                <p className="text-xs text-[var(--color-muted)]">{price}</p>
              </div>
            </div>

            <span className="inline-flex items-center rounded-[var(--radius-pill)] px-2.5 py-0.5 text-xs font-medium bg-[var(--color-surface-2)] text-[var(--color-muted)]">
              {t("scrap.subscription.comingSoonBadge")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function ScrapSubscriptionPage() {
  const { t } = useTranslation();
  const toast = useToast();

  const subscriptionQuery = useScrapSubscriptionQuery();
  const renewMutation = useRenewScrapSubscriptionMutation();

  const [confirmOpen, setConfirmOpen] = useState(false);

  const sub = subscriptionQuery.data;

  function handleRenewClick() {
    setConfirmOpen(true);
  }

  function handleConfirm() {
    renewMutation.mutate(undefined, {
      onSuccess: () => {
        setConfirmOpen(false);
        toast.success(t("scrap.subscription.renewSuccess"));
      },
      onError: () => {
        toast.error(t("scrap.subscription.renewFailed"));
      },
    });
  }

  const isExpiredOrCancelled =
    sub?.status === "expired" || sub?.status === "cancelled";

  return (
    <div className="space-y-6 provider-fade-up">
      <ProviderPageHeader
        icon={<CreditCard className="h-5 w-5" aria-hidden />}
        title={t("scrap.subscription.title")}
        subtitle={t("scrap.subscription.subtitle")}
      />

      {/* ── Loading ────────────────────────────────────────────────────── */}
      {subscriptionQuery.isLoading && (
        <div className="space-y-4">
          <PlanHeroSkeleton />
          <ProviderCard className="space-y-3">
            <ProviderSkeleton variant="line" width="30%" height={16} />
            <ProviderSkeleton variant="line" width="80%" height={14} />
            <ProviderSkeleton variant="line" width="80%" height={14} />
          </ProviderCard>
        </div>
      )}

      {/* ── Error ─────────────────────────────────────────────────────── */}
      {!subscriptionQuery.isLoading && subscriptionQuery.isError && (
        <ProviderEmptyState
          icon={<CreditCard className="h-10 w-10" aria-hidden />}
          title={t("common.errorTitle")}
          description={t("common.errorRetry")}
          action={
            <button
              type="button"
              onClick={() => void subscriptionQuery.refetch()}
              className="inline-flex h-9 items-center rounded-[var(--radius-md)] border border-[var(--color-divider)] px-4 text-sm font-medium text-[var(--color-ink-body)] transition-colors duration-[var(--dur-fast)] hover:bg-[var(--color-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-orange)]/40"
            >
              {t("common.retry")}
            </button>
          }
        />
      )}

      {/* ── Empty (no subscription / 404) ─────────────────────────────── */}
      {!subscriptionQuery.isLoading && !subscriptionQuery.isError && !sub && (
        <ProviderEmptyState
          icon={<CreditCard className="h-10 w-10" aria-hidden />}
          title={t("scrap.subscription.emptyTitle")}
          description={t("scrap.subscription.emptyDescription")}
        />
      )}

      {/* ── Loaded ────────────────────────────────────────────────────── */}
      {!subscriptionQuery.isLoading && sub && (
        <>
          <div className="provider-fade-up" style={{ animationDelay: "40ms" }}>
            <PlanHeroCard
              sub={sub}
              onRenew={handleRenewClick}
              isRenewing={renewMutation.isPending}
            />
          </div>

          <div className="provider-fade-up" style={{ animationDelay: "80ms" }}>
            <PrivilegesCard sub={sub} />
          </div>

          <div className="provider-fade-up" style={{ animationDelay: "120ms" }}>
            <OtherPlansTeaser />
          </div>
        </>
      )}

      {/* ── Renew confirm dialog (defer-mount) ────────────────────────── */}
      {confirmOpen && (
        <RenewConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          onConfirm={handleConfirm}
          isLoading={renewMutation.isPending}
          isExpiredOrCancelled={isExpiredOrCancelled ?? false}
        />
      )}
    </div>
  );
}
