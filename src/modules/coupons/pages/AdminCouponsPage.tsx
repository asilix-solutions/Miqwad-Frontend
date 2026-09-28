import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, TicketPercent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable, type DataTableColumn } from "@shared/components/DataTable";
import { usePermissions } from "@shared/auth/usePermissions";
import { formatDate } from "@shared/lib/formatDate";
import { useCouponsList } from "../hooks/useCouponsQueries";
import { couponAmount, couponPercentage, couponErrorKey } from "../lib/couponPresentation";
import { CouponActions, type CouponAction } from "../components/CouponActions";
import { CouponDialog, type CouponDialogState } from "../components/CouponDialog";
import { CouponStatus } from "../components/CouponStatus";
import { CouponFilters } from "../components/CouponFilters";
import {
  defaultCouponFilters,
  couponFiltersParams,
  type CouponFiltersValue,
} from "../lib/couponFilters";
import type { Coupon } from "../types";

export function AdminCouponsPage() {
  const { t, i18n } = useTranslation();
  const { can } = usePermissions();
  const [filters, setFilters] = useState(defaultCouponFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dialog, setDialog] = useState<CouponDialogState | null>(null);
  const restoreTarget = useRef<HTMLButtonElement | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const params = { ...couponFiltersParams(filters), page, pageSize };
  const q = useCouponsList(params);
  const filtered = !!(params.filter || params.fromDate || params.toDate);
  const apply = (value: CouponFiltersValue) => {
    setFilters(value);
    setPage(1);
  };
  const reset = () => apply(defaultCouponFilters);
  const open = (coupon: Coupon, action: CouponAction, target: HTMLButtonElement | null) => {
    restoreTarget.current = target;
    setDialog({ action, id: coupon.id });
  };
  const number = (value: number) => value.toLocaleString(i18n.language);
  const minimum = (coupon: Coupon) =>
    coupon.minimumOrderAmount === null
      ? t("coupons.noMinimum")
      : couponAmount(coupon.minimumOrderAmount, i18n.language);
  const usage = (coupon: Coupon) => (
    <div className="space-y-1">
      <bdi className="tabular-nums">
        {coupon.usageLimit === null
          ? number(coupon.usedCount)
          : `${number(coupon.usedCount)} / ${number(coupon.usageLimit)}`}
      </bdi>
      <p className="text-xs text-[var(--color-muted)]">
        {t(
          coupon.usageLimit === null
            ? "coupons.limitNotSet"
            : coupon.usedCount >= coupon.usageLimit
              ? "coupons.usageReached"
              : "coupons.usedOfLimit",
        )}
      </p>
    </div>
  );
  const validity = (coupon: Coupon) => (
    <div className="space-y-1 text-xs">
      <p>{t("coupons.starts", { date: formatDate(coupon.startDate, i18n.language) })}</p>
      <p>
        {coupon.endDate === null
          ? t("coupons.endNotSet")
          : t("coupons.ends", { date: formatDate(coupon.endDate, i18n.language) })}
      </p>
    </div>
  );
  const code = (coupon: Coupon) => (
    <button
      type="button"
      disabled={q.isFetching}
      onClick={(event) => open(coupon, "detail", event.currentTarget)}
      className="max-w-full text-start font-semibold break-words text-[var(--color-brand-blue)] underline-offset-4 hover:underline focus-visible:outline-2 disabled:opacity-60"
    >
      <bdi>{coupon.code ?? t("coupons.notSet")}</bdi>
    </button>
  );
  const actions = (coupon: Coupon) => (
    <CouponActions
      coupon={coupon}
      disabled={q.isFetching}
      onAction={(action, trigger) => open(coupon, action, trigger)}
    />
  );
  const columns: DataTableColumn<Coupon>[] = [
    {
      key: "code",
      header: t("coupons.code"),
      className: "max-w-52 whitespace-normal",
      render: code,
    },
    {
      key: "discountPercentage",
      header: t("coupons.discount"),
      render: (coupon) => (
        <bdi className="font-semibold tabular-nums">
          {couponPercentage(coupon.discountPercentage, i18n.language)}
        </bdi>
      ),
    },
    {
      key: "minimumOrderAmount",
      header: t("coupons.minimumOrder"),
      render: (coupon) => <bdi>{minimum(coupon)}</bdi>,
    },
    { key: "usedCount", header: t("coupons.usage"), render: usage },
    { key: "startDate", header: t("coupons.validity"), render: validity },
    {
      key: "isActive",
      header: t("common.status"),
      render: (coupon) => <CouponStatus coupon={coupon} />,
    },
    { key: "actions", header: t("common.actions"), render: actions },
  ];
  const currentPage = q.data?.page ?? page;
  const totalPages = Math.max(1, q.data?.totalPages ?? 1);
  return (
    <div className="@container min-w-0 space-y-5" dir={i18n.dir()}>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <TicketPercent
            className="mt-1 size-6 shrink-0 text-[var(--color-brand-blue)]"
            aria-hidden
          />
          <div>
            <h1 ref={heading} tabIndex={-1} className="text-xl font-bold">
              {t("coupons.title")}
            </h1>
            <p className="mt-1 text-sm text-[var(--color-muted)]">{t("coupons.subtitle")}</p>
          </div>
        </div>
        {can("coupons.create") && (
          <Button
            onClick={(event) => {
              restoreTarget.current = event.currentTarget;
              setDialog({ action: "create" });
            }}
          >
            <Plus className="size-4" aria-hidden />
            {t("coupons.create")}
          </Button>
        )}
      </header>
      <CouponFilters
        key={JSON.stringify(filters)}
        value={filters}
        onApply={apply}
        onReset={reset}
      />
      <div role="status" className="min-h-5 text-sm text-[var(--color-muted)]">
        {q.isFetching
          ? t("coupons.loading")
          : q.isError
            ? ""
            : t("coupons.results", { total: number(q.data?.total ?? 0) })}
      </div>
      {q.isError ? (
        <div
          role="alert"
          className="space-y-3 rounded-md border border-[var(--color-divider)] bg-[var(--color-surface)] p-6"
        >
          <p>{t(couponErrorKey(q.error))}</p>
          <Button variant="outline" onClick={() => void q.refetch()}>
            {t("common.retry")}
          </Button>
        </div>
      ) : q.isPending ? (
        <div aria-busy="true" className="space-y-3">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-20 w-full" />
          ))}
        </div>
      ) : q.data.items.length === 0 ? (
        <div className="space-y-3 rounded-md border border-[var(--color-divider)] bg-[var(--color-surface)] px-5 py-12 text-center">
          <TicketPercent className="mx-auto size-9 text-[var(--color-muted)]" aria-hidden />
          <h2 className="font-semibold">{t(filtered ? "coupons.noResults" : "coupons.empty")}</h2>
          <p className="text-sm text-[var(--color-muted)]">
            {t(filtered ? "coupons.noResultsHint" : "coupons.emptyHint")}
          </p>
          {filtered && (
            <Button variant="outline" onClick={reset}>
              {t("coupons.reset")}
            </Button>
          )}
        </div>
      ) : (
        <div aria-busy={q.isFetching}>
          <div className="hidden @4xl:block">
            <DataTable
              columns={columns}
              rows={q.data.items}
              getRowKey={(coupon) => String(coupon.id)}
            />
          </div>
          <ul className="grid gap-3 @2xl:grid-cols-2 @4xl:hidden">
            {q.data.items.map((coupon) => (
              <li
                key={coupon.id}
                className="min-w-0 space-y-4 rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    {code(coupon)}
                    <p className="text-lg font-semibold">
                      <bdi>{couponPercentage(coupon.discountPercentage, i18n.language)}</bdi>
                    </p>
                  </div>
                  {actions(coupon)}
                </div>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="mb-1 text-xs text-[var(--color-muted)]">
                      {t("coupons.minimumOrder")}
                    </dt>
                    <dd>
                      <bdi>{minimum(coupon)}</bdi>
                    </dd>
                  </div>
                  <div>
                    <dt className="mb-1 text-xs text-[var(--color-muted)]">{t("coupons.usage")}</dt>
                    <dd>{usage(coupon)}</dd>
                  </div>
                  <div>
                    <dt className="mb-1 text-xs text-[var(--color-muted)]">
                      {t("coupons.validity")}
                    </dt>
                    <dd>{validity(coupon)}</dd>
                  </div>
                  <div>
                    <dt className="mb-1 text-xs text-[var(--color-muted)]">{t("common.status")}</dt>
                    <dd>
                      <CouponStatus coupon={coupon} />
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        </div>
      )}
      {!q.isError && (
        <nav
          aria-label={t("coupons.pagination")}
          className="flex flex-wrap items-center justify-between gap-3"
        >
          <label className="flex items-center gap-2 text-sm">
            {t("coupons.pageSize")}
            <select
              className="rounded-md border border-[var(--color-divider)] bg-[var(--color-surface)] p-2"
              value={pageSize}
              disabled={q.isFetching}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
            >
              {[10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {number(size)}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={q.isFetching || currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
            >
              {t("common.back")}
            </Button>
            <span className="text-sm">
              {t("coupons.pageOf", { page: number(currentPage), total: number(totalPages) })}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={q.isFetching || currentPage >= totalPages}
              onClick={() => setPage(currentPage + 1)}
            >
              {t("common.next")}
            </Button>
          </div>
        </nav>
      )}
      {dialog && (
        <CouponDialog
          state={dialog}
          onClose={() => setDialog(null)}
          restoreFocus={() => {
            if (restoreTarget.current?.isConnected) restoreTarget.current.focus();
            else heading.current?.focus();
          }}
        />
      )}
    </div>
  );
}
