/**
 * @file AdminInvoiceDetailPage.tsx
 * @description Read-only invoice document with authoritative parties and amounts.
 */
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { isAxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AppError } from "@shared/types/api";
import { formatOrderDate } from "@shared/lib/formatOrderDate";
import { useInvoice } from "../hooks/useInvoicesQueries";
import { InvoiceItemsTable } from "../components/InvoiceItemsTable";
import { InvoiceQrCode } from "../components/InvoiceQrCode";
import { formatInvoiceAmount, formatInvoiceRate } from "../lib/formatInvoiceAmount";

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-[var(--color-muted)]">{label}</dt>
      <dd className="mt-1 text-sm break-words whitespace-pre-line">
        <bdi>{children}</bdi>
      </dd>
    </div>
  );
}

export function AdminInvoiceDetailPage() {
  const { t, i18n } = useTranslation();
  const { id = "" } = useParams<{ id: string }>();
  const q = useInvoice(id);
  const invoice = q.data;
  const BackArrow = i18n.dir() === "rtl" ? ArrowRight : ArrowLeft;
  const backLink = (
    <Button asChild variant="ghost" size="sm">
      <Link to="/admin/invoices">
        <BackArrow aria-hidden />
        {t("invoices.backToList")}
      </Link>
    </Button>
  );
  const status =
    q.error instanceof AppError
      ? q.error.status
      : isAxiosError(q.error)
        ? q.error.response?.status
        : undefined;
  const notFound = !/^[1-9]\d*$/.test(id) || status === 404;

  if (q.isLoading)
    return (
      <div className="space-y-5 p-4 sm:p-6" role="status" aria-label={t("invoices.loading")}>
        {backLink}
        <Skeleton className="h-36 w-full" />
        <div className="grid gap-5 sm:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  if (notFound || q.isError || !invoice)
    return (
      <div className="space-y-5 p-4 sm:p-6">
        {backLink}
        <section
          role="alert"
          className="rounded-[var(--radius-lg)] border border-[var(--color-divider)] bg-[var(--color-surface)] p-8 text-center"
        >
          <h1 className="font-semibold">
            {t(notFound ? "invoices.notFoundTitle" : "invoices.errorTitle")}
          </h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            {t(notFound ? "invoices.notFoundDescription" : "invoices.errorDescription")}
          </p>
          {!notFound && (
            <Button className="mt-5" variant="outline" onClick={() => void q.refetch()}>
              {t("invoices.retry")}
            </Button>
          )}
        </section>
      </div>
    );

  const missing = t("invoices.unavailable");
  const facility = invoice.facilityInformation;
  const buyer = invoice.buyerInformation;
  const totals = [
    ["subtotal", invoice.subtotal],
    ["discount", invoice.discountAmount],
    ["taxable", invoice.taxableAmount],
    ["vat", invoice.taxAmount],
  ] as const;
  return (
    <div className="min-w-0 space-y-4 p-4 sm:p-6">
      {backLink}
      <article className="min-w-0 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-divider)] bg-[var(--color-surface)] text-[var(--color-ink-body)] shadow-[var(--shadow-1)]">
        <header className="space-y-6 border-b border-[var(--color-divider)] bg-[var(--color-surface-2)] p-4 sm:p-6">
          <div>
            <p className="mb-1 text-sm text-[var(--color-muted)]">{t("invoices.detailTitle")}</p>
            <h1 className="text-xl font-bold break-words sm:text-2xl">
              <bdi>{invoice.invoiceNumber}</bdi>
            </h1>
          </div>
          <dl className="grid gap-4 sm:grid-cols-3">
            <Fact label={t("invoices.colDate")}>
              {formatOrderDate(invoice.issueDate, i18n.language)}
            </Fact>
            <Fact label={t("invoices.supplyDate")}>
              {formatOrderDate(invoice.supplyDate, i18n.language)}
            </Fact>
            {invoice.orderNumber && (
              <Fact label={t("invoices.orderReference")}>{invoice.orderNumber}</Fact>
            )}
          </dl>
        </header>
        <div className="space-y-8 p-4 sm:p-6">
          <div className="grid gap-6 border-b border-[var(--color-divider)] pb-6 md:grid-cols-2">
            <section className="min-w-0 space-y-4">
              <h2 className="text-base font-semibold">{t("invoices.facility")}</h2>
              <dl className="grid gap-4 sm:grid-cols-2">
                <Fact label={t("invoices.partyName")}>{facility.name || missing}</Fact>
                <Fact label={t("invoices.taxId")}>{facility.taxIdNumber || missing}</Fact>
                <Fact label={t("invoices.register")}>{facility.commercialRegister || missing}</Fact>
                <Fact label={t("invoices.address")}>{facility.address || missing}</Fact>
              </dl>
            </section>
            <section className="min-w-0 space-y-4">
              <h2 className="text-base font-semibold">{t("invoices.buyer")}</h2>
              <dl className="grid gap-4 sm:grid-cols-2">
                <Fact label={t("invoices.colName")}>{invoice.customerName || missing}</Fact>
                {buyer && (
                  <>
                    <Fact label={t("invoices.partyName")}>{buyer.name || missing}</Fact>
                    <Fact label={t("invoices.taxId")}>{buyer.vatNumber || missing}</Fact>
                    <Fact label={t("invoices.register")}>
                      {buyer.commercialRegister || missing}
                    </Fact>
                    <Fact label={t("invoices.address")}>{buyer.address || missing}</Fact>
                  </>
                )}
              </dl>
              {!buyer && (
                <p className="text-sm text-[var(--color-muted)]">{t("invoices.noBuyerFiscal")}</p>
              )}
            </section>
          </div>
          <InvoiceItemsTable items={invoice.items} quantity={invoice.itemCount} />
          <div className="grid items-start gap-8 border-t border-[var(--color-divider)] pt-6 lg:grid-cols-2">
            <InvoiceQrCode payload={invoice.qrCode} />
            <section aria-labelledby="invoice-totals" className="min-w-0">
              <h2 id="invoice-totals" className="mb-3 font-semibold">
                {t("invoices.sections.taxBreakdown")}
              </h2>
              <dl className="space-y-3">
                {totals.map(([key, value]) => (
                  <div key={key} className="flex flex-wrap justify-between gap-2 text-sm">
                    <dt>
                      {t(`invoices.tax.${key}`)}
                      {key === "vat" && (
                        <span className="ms-2 text-[var(--color-muted)]">
                          <bdi>{formatInvoiceRate(invoice.taxRate, i18n.language)}</bdi>
                        </span>
                      )}
                    </dt>
                    <dd className="font-medium tabular-nums">
                      <bdi>{formatInvoiceAmount(value, i18n.language)}</bdi>
                    </dd>
                  </div>
                ))}
                <div className="flex flex-wrap items-baseline justify-between gap-3 border-t border-[var(--color-divider)] pt-4">
                  <dt className="font-semibold">{t("invoices.tax.total")}</dt>
                  <dd className="text-xl font-bold text-[var(--color-brand-blue)] tabular-nums">
                    <bdi>{formatInvoiceAmount(invoice.totalPrice, i18n.language)}</bdi>
                  </dd>
                </div>
              </dl>
            </section>
          </div>
        </div>
      </article>
    </div>
  );
}
