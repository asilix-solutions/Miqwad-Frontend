/**
 * @file AdminInvoiceDetailPage.tsx
 * @description Admin Invoice detail — READ-ONLY, route-based, wired to live
 * GET /api/Invoices/{id}. The backend returns a not-found business error for
 * missing ids → friendly bilingual "الفاتورة غير موجودة" + back-to-list.
 *
 * The ONLY real data is the four-field summary card, styled as a financial
 * document (issuer block + large total). Everything below is a FUTURE-VISION
 * placeholder — line items, tax/VAT, parties, payment — each an unmistakably
 * disabled "قريباً / Coming soon" frame with no fabricated values. Each frame
 * is a real component fed by an optional field on the Invoice view-model, so
 * it lights up automatically when the DTO grows.
 * TODO: wire when backend enriches InvoiceResponseDto (lineItems, tax, parties, orderId, status)
 */
import { useTranslation } from "react-i18next";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, ReceiptText, ListTree, Percent, Users, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@shared/lib/formatCurrency";
import { formatOrderDate } from "@shared/lib/formatOrderDate";
import { useInvoice } from "../hooks/useInvoicesQueries";
import { ComingSoonSection } from "../components/ComingSoonSection";

function PlaceholderRow({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--color-divider)] py-2.5 last:border-0">
      <span className="text-sm text-[var(--color-ink-body)]">{label}</span>
      <span className="text-sm tabular-nums text-[var(--color-muted)]">—</span>
    </div>
  );
}

export function AdminInvoiceDetailPage() {
  const { t, i18n } = useTranslation();
  const { id = "" } = useParams<{ id: string }>();
  const isRTL = i18n.dir() === "rtl";
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  const { data: invoice, isLoading, isError } = useInvoice(id);

  const backLink = (
    <Link
      to="/admin/invoices"
      className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-ink-body)]"
    >
      <BackArrow className="h-4 w-4" aria-hidden />
      {t("invoices.backToList")}
    </Link>
  );

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-40 w-full rounded-[var(--radius-lg)]" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-[var(--radius-md)]" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !invoice) {
    return (
      <div className="space-y-6 p-6">
        {backLink}
        <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--color-divider)] bg-[var(--color-surface)] px-6 py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-surface-2)]" aria-hidden>
            <ReceiptText className="h-7 w-7 text-[var(--color-muted)]" />
          </div>
          <h2 className="text-base font-semibold text-[var(--color-ink-body)]">
            {t("invoices.notFoundTitle")}
          </h2>
          <p className="mt-1.5 max-w-sm text-sm text-[var(--color-muted)]">
            {t("invoices.notFoundDescription")}
          </p>
          <Link to="/admin/invoices" className="mt-5">
            <Button type="button" variant="outline">
              <BackArrow className="size-4" aria-hidden />
              {t("invoices.backToList")}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {backLink}

      {/* ── Real data: the financial-document summary card ────────────────── */}
      <article className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-divider)] bg-[var(--color-surface)] shadow-[var(--shadow-1)]">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--color-divider)] bg-[var(--color-surface-2)] px-6 py-5">
          <div className="flex items-start gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-brand-blue)] shadow-[var(--shadow-1)]"
              aria-hidden
            >
              <ReceiptText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
                {t("invoices.summaryTitle")}
              </p>
              <h1 className="mt-0.5 font-mono text-lg font-bold text-[var(--color-ink-body)]" dir="ltr">
                {t("invoices.codeLabel", { code: invoice.code })}
              </h1>
            </div>
          </div>
          <div className="text-end">
            <p className="text-xs text-[var(--color-muted)]">{t("invoices.colDate")}</p>
            <p className="mt-0.5 text-sm tabular-nums text-[var(--color-ink-body)]">
              {formatOrderDate(invoice.createdAt, i18n.language)}
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 px-6 py-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
              {t("invoices.colName")}
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--color-ink-body)]">
              {invoice.fullName || "—"}
            </p>
          </div>
          <div className="sm:text-end">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
              {t("invoices.colAmount")}
            </p>
            <p
              className="mt-1 text-2xl font-bold tabular-nums text-[var(--color-brand-orange)]"
              dir="ltr"
            >
              {formatCurrency(invoice.totalPrice, i18n.language)}
            </p>
          </div>
        </div>
      </article>

      {/* ── Future-vision placeholders (clearly not yet available) ────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ComingSoonSection icon={ListTree} title={t("invoices.sections.lineItems")} ready={!!invoice.lineItems}>
          <div className="space-y-2">
            {invoice.lineItems
              ? invoice.lineItems.map((row) => (
                  <div key={row.id} className="flex items-center justify-between gap-4 rounded-[var(--radius-sm)] bg-[var(--color-surface-2)] px-3 py-2.5">
                    <span className="text-sm text-[var(--color-ink-body)]">
                      {row.description || "—"}
                      {row.quantity > 1 ? ` × ${row.quantity}` : ""}
                    </span>
                    <span className="text-sm tabular-nums text-[var(--color-ink-body)]" dir="ltr">
                      {formatCurrency(row.subtotal, i18n.language)}
                    </span>
                  </div>
                ))
              : ["a", "b", "c"].map((k) => (
                  <div key={k} className="flex items-center justify-between gap-4 rounded-[var(--radius-sm)] bg-[var(--color-surface-2)] px-3 py-2.5">
                    <span className="text-sm text-[var(--color-muted)]">—</span>
                    <span className="text-sm tabular-nums text-[var(--color-muted)]">—</span>
                  </div>
                ))}
          </div>
        </ComingSoonSection>

        <ComingSoonSection icon={Percent} title={t("invoices.sections.taxBreakdown")} ready={!!invoice.tax}>
          <div>
            <PlaceholderRow label={t("invoices.tax.subtotal")} />
            <PlaceholderRow label={t("invoices.tax.discount")} />
            <PlaceholderRow label={t("invoices.tax.vat")} />
            <div className="flex items-center justify-between gap-4 pt-2.5">
              <span className="text-sm font-bold text-[var(--color-ink-body)]">{t("invoices.tax.total")}</span>
              <span className="text-sm font-bold tabular-nums text-[var(--color-muted)]">—</span>
            </div>
          </div>
        </ComingSoonSection>

        <ComingSoonSection icon={Users} title={t("invoices.sections.parties")} ready={!!invoice.parties}>
          <div>
            <PlaceholderRow label={t("invoices.parties.customer")} />
            <PlaceholderRow label={t("invoices.parties.provider")} />
          </div>
        </ComingSoonSection>

        <ComingSoonSection icon={CreditCard} title={t("invoices.sections.payment")} ready={!!invoice.payment}>
          <div>
            <PlaceholderRow label={t("invoices.payment.method")} />
            <PlaceholderRow label={t("invoices.payment.status")} />
          </div>
        </ComingSoonSection>
      </div>
    </div>
  );
}
