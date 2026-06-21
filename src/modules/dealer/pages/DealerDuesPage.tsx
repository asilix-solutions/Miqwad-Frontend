/**
 * @file DealerDuesPage.tsx
 *
 * Dealer financial dues view (FR-MKT-05/07).
 * Shows commission rate (READ-ONLY, admin-owned), gross sales, total commission
 * owed, net earnings, outstanding debt, and a >500 SAR debt alert banner.
 * All values are derived from useDealerDuesQuery which computes from delivered orders.
 */

import { useTranslation } from "react-i18next";
import {
  TrendingUp,
  Percent,
  Wallet,
  AlertCircle,
  AlertTriangle,
  Lock,
  Minus,
  Equal,
} from "lucide-react";
import {
  ProviderPageHeader,
  ProviderStatCard,
  ProviderCard,
  ProviderEmptyState,
  ProviderSkeleton,
} from "@shared/provider-ui";
import { useDealerDuesQuery } from "../hooks/useDealerQueries";
import { cn } from "@shared/lib/utils";

// ── Helpers ───────────────────────────────────────────────────────────────────

function useCurrencyFormatter() {
  const { i18n } = useTranslation();
  return (amount: number) =>
    new Intl.NumberFormat(i18n.language === "ar" ? "ar-SA" : "en-US", {
      style: "currency",
      currency: "SAR",
      maximumFractionDigits: 0,
    }).format(amount);
}

function useDateFormatter() {
  const { i18n } = useTranslation();
  return (iso: string) =>
    new Intl.DateTimeFormat(i18n.language === "ar" ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
}

// ── Sub-components ────────────────────────────────────────────────────────────

/** Breakdown row inside the earnings breakdown card. */
function BreakdownRow({
  label,
  value,
  bold,
  tone,
}: {
  label: string;
  value: string;
  bold?: boolean;
  tone?: "success" | "danger" | "muted";
}) {
  const valueColor =
    tone === "success"
      ? "text-[var(--color-success-500)]"
      : tone === "danger"
        ? "text-[var(--color-danger-500)]"
        : "text-[var(--color-muted)]";

  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span
        className={cn(
          "text-sm",
          bold
            ? "font-semibold text-[var(--color-ink-body)]"
            : "text-[var(--color-ink-secondary)]",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "tabular-nums text-sm font-semibold",
          bold ? "text-[var(--color-ink-body)]" : valueColor,
        )}
      >
        {value}
      </span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

/** Dealer financial dues page — shows KPIs, debt alert, commission info, and breakdown. */
export function DealerDuesPage() {
  const { t } = useTranslation();
  const fmt = useCurrencyFormatter();
  const fmtDate = useDateFormatter();

  const { data: dues, isLoading, isError, refetch } = useDealerDuesQuery();

  const isEmpty = !isLoading && !isError && dues !== undefined && dues.grossSales === 0;
  const debtTone = dues?.debtAlert ? "danger" : "warning";

  return (
    <div className="space-y-8">
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="provider-fade-up">
        <ProviderPageHeader
          icon={<Wallet className="h-5 w-5" aria-hidden />}
          title={t("dealer.dues.title")}
          subtitle={t("dealer.dues.subtitle")}
        />
      </div>

      {/* ── Error state ──────────────────────────────────────────────────── */}
      {isError && (
        <div className="provider-fade-up">
          <ProviderCard className="flex flex-col items-center gap-4 py-12 text-center">
            <AlertCircle
              className="h-10 w-10 text-[var(--color-danger-500)]"
              aria-hidden
            />
            <p className="text-sm text-[var(--color-muted)]">
              {t("common.errorTitle")}
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              className={cn(
                "rounded-[var(--radius-sm)] px-4 py-2 text-sm font-medium",
                "bg-[var(--color-brand-orange)] text-white",
                "transition-colors hover:bg-[#E3460F]",
              )}
            >
              {t("common.retry")}
            </button>
          </ProviderCard>
        </div>
      )}

      {/* ── KPI stat cards ───────────────────────────────────────────────── */}
      {!isError && (
        <div
          className="provider-fade-up grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          style={{ animationDelay: "40ms" }}
        >
          <ProviderStatCard
            label={t("dealer.dues.grossSales")}
            value={isLoading ? "" : fmt(dues?.grossSales ?? 0)}
            icon={<TrendingUp className="h-5 w-5" aria-hidden />}
            tone="brand"
            loading={isLoading}
          />
          <ProviderStatCard
            label={t("dealer.dues.totalCommission")}
            value={isLoading ? "" : fmt(dues?.totalCommission ?? 0)}
            icon={<Percent className="h-5 w-5" aria-hidden />}
            tone="info"
            loading={isLoading}
          />
          <ProviderStatCard
            label={t("dealer.dues.netEarnings")}
            value={isLoading ? "" : fmt(dues?.netEarnings ?? 0)}
            icon={<Wallet className="h-5 w-5" aria-hidden />}
            tone="success"
            loading={isLoading}
          />
          {/* Outstanding debt — tone shifts to danger when alert is active */}
          <ProviderStatCard
            label={t("dealer.dues.outstandingDebt")}
            value={isLoading ? "" : fmt(dues?.outstandingDebt ?? 0)}
            icon={<AlertCircle className="h-5 w-5" aria-hidden />}
            tone={isLoading ? "warning" : debtTone}
            loading={isLoading}
          />
        </div>
      )}

      {/* ── Debt alert banner (visible only when debtAlert = true) ──────── */}
      {!isLoading && !isError && dues?.debtAlert && (
        <div className="provider-fade-up" style={{ animationDelay: "80ms" }}>
          <ProviderCard
            className={cn(
              "flex items-start gap-4",
              "border border-[var(--color-danger-200)]",
              "bg-[var(--color-danger-50)]",
            )}
          >
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                "bg-[var(--color-danger-100)] text-[var(--color-danger-500)]",
              )}
              aria-hidden
            >
              <AlertTriangle className="h-5 w-5" />
            </div>

            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-[var(--color-danger-700)]">
                {t("dealer.dues.debtAlert.title")}
              </p>
              <p className="text-sm leading-relaxed text-[var(--color-danger-600)]">
                {t("dealer.dues.debtAlert.body")}
              </p>
            </div>
          </ProviderCard>
        </div>
      )}

      {/* ── Empty state ──────────────────────────────────────────────────── */}
      {isEmpty && (
        <div className="provider-fade-up" style={{ animationDelay: "120ms" }}>
          <ProviderCard padded={false}>
            <ProviderEmptyState
              icon={<Wallet className="h-8 w-8" aria-hidden />}
              title={t("dealer.dues.emptyTitle")}
              description={t("dealer.dues.emptyDescription")}
            />
          </ProviderCard>
        </div>
      )}

      {/* ── Detail cards (visible once data is loaded and non-empty) ─────── */}
      {!isLoading && !isError && !isEmpty && (
        <div
          className="provider-fade-up grid grid-cols-1 gap-4 lg:grid-cols-2"
          style={{ animationDelay: "120ms" }}
        >
          {/* Commission info card */}
          <ProviderCard className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                  "bg-[var(--color-info-50)] text-[var(--color-info-500)]",
                )}
                aria-hidden
              >
                <Percent className="h-5 w-5" />
              </div>
              <h2 className="text-sm font-semibold text-[var(--color-ink-body)]">
                {t("dealer.dues.commissionRate")}
              </h2>
            </div>

            <div className="flex items-end justify-between gap-4">
              <span
                className={cn(
                  "font-[var(--font-display)] text-4xl font-bold leading-none",
                  "text-[var(--color-info-500)]",
                )}
              >
                {dues?.commissionRate ?? 0}%
              </span>

              <span
                className={cn(
                  "flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-1.5",
                  "bg-[var(--color-surface-2)] text-xs font-medium text-[var(--color-muted)]",
                )}
              >
                <Lock className="h-3 w-3 shrink-0" aria-hidden />
                {t("dealer.dues.commissionReadOnlyNote")}
              </span>
            </div>
          </ProviderCard>

          {/* Earnings breakdown card */}
          <ProviderCard className="flex flex-col gap-2">
            <h2 className="mb-1 text-sm font-semibold text-[var(--color-ink-body)]">
              {t("dealer.dues.breakdownTitle")}
            </h2>

            <div className="divide-y divide-[var(--color-divider)]">
              <BreakdownRow
                label={t("dealer.dues.breakdownGross")}
                value={fmt(dues?.grossSales ?? 0)}
                tone="muted"
              />

              <div className="flex items-center justify-between gap-4 py-2.5">
                <span className="flex items-center gap-1.5 text-sm text-[var(--color-ink-secondary)]">
                  <Minus className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {t("dealer.dues.breakdownMinus")}
                </span>
                <span className="tabular-nums text-sm font-semibold text-[var(--color-danger-500)]">
                  -{fmt(dues?.totalCommission ?? 0)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 py-2.5">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-[var(--color-ink-body)]">
                  <Equal className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {t("dealer.dues.breakdownNet")}
                </span>
                <span className="tabular-nums text-sm font-bold text-[var(--color-success-500)]">
                  {fmt(dues?.netEarnings ?? 0)}
                </span>
              </div>
            </div>
          </ProviderCard>
        </div>
      )}

      {/* ── Skeleton for the detail cards while loading ───────────────────── */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ProviderCard className="space-y-4">
            <ProviderSkeleton variant="line" width="40%" height={14} />
            <ProviderSkeleton variant="block" width="30%" height={40} />
          </ProviderCard>
          <ProviderCard className="space-y-3">
            <ProviderSkeleton variant="line" width="50%" height={14} />
            <ProviderSkeleton variant="line" width="80%" height={12} />
            <ProviderSkeleton variant="line" width="80%" height={12} />
            <ProviderSkeleton variant="line" width="80%" height={12} />
          </ProviderCard>
        </div>
      )}

      {/* ── Last updated timestamp ───────────────────────────────────────── */}
      {!isLoading && !isError && dues?.updatedAt && (
        <p
          className="provider-fade-up text-xs text-[var(--color-muted)]"
          style={{ animationDelay: "160ms" }}
        >
          {t("dealer.dues.updatedAt")}: {fmtDate(dues.updatedAt)}
        </p>
      )}
    </div>
  );
}
