/**
 * @file InvoiceItemsTable.tsx
 * @description Invoice lines retain server amounts. The labeled scroll region
 * keeps financial columns comparable and keyboard-accessible on narrow screens.
 */
import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatInvoiceAmount } from "../lib/formatInvoiceAmount";
import type { InvoiceLineItem } from "../types";

export function InvoiceItemsTable({
  items,
  quantity,
}: {
  items: InvoiceLineItem[];
  quantity: number;
}) {
  const { t, i18n } = useTranslation();
  const amount = (value: number) => (
    <bdi className="tabular-nums">{formatInvoiceAmount(value, i18n.language)}</bdi>
  );
  const hasOffers = items.some((item) => item.offer !== null || item.offerName !== null);
  return (
    <section className="min-w-0 space-y-3" aria-labelledby="invoice-lines">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="invoice-lines" className="text-base font-semibold">
          {t("invoices.sections.lineItems")}
        </h2>
        <p className="text-sm text-[var(--color-muted)]">
          {t("invoices.linesAndQuantity", { lines: items.length, quantity })}
        </p>
      </div>
      {items.length === 0 ? (
        <p className="py-5 text-sm text-[var(--color-muted)]">{t("invoices.noLines")}</p>
      ) : (
        <>
          <p className="text-xs text-[var(--color-muted)] lg:hidden">{t("invoices.scrollItems")}</p>
          <div
            role="region"
            aria-labelledby="invoice-lines"
            tabIndex={0}
            className="min-w-0 overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-divider)] focus-visible:outline-2 [&>div]:overflow-visible"
          >
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow className="bg-[var(--color-surface-2)]">
                  {[
                    "service",
                    "provider",
                    "unitPrice",
                    "quantity",
                    ...(hasOffers ? ["offer"] : []),
                    "gross",
                    "net",
                  ].map((key) => (
                    <TableHead key={key} scope="col">
                      {t(`invoices.line.${key}`)}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="max-w-72 min-w-40 font-medium break-words whitespace-normal">
                      <bdi>{item.serviceName || t("invoices.unavailable")}</bdi>
                    </TableCell>
                    <TableCell className="max-w-56 min-w-32 break-words whitespace-normal">
                      <bdi>{item.providerName || t("invoices.unavailable")}</bdi>
                    </TableCell>
                    <TableCell>{amount(item.price)}</TableCell>
                    <TableCell className="tabular-nums">
                      {item.quantity.toLocaleString(i18n.language)}
                    </TableCell>
                    {hasOffers && (
                      <TableCell>
                        {item.offer === null ? t("invoices.unavailable") : amount(item.offer)}
                        {item.offerName && (
                          <p className="mt-1 max-w-40 text-xs break-words whitespace-normal text-[var(--color-muted)]">
                            <bdi>{item.offerName}</bdi>
                          </p>
                        )}
                      </TableCell>
                    )}
                    <TableCell>{amount(item.grossAmount)}</TableCell>
                    <TableCell className="font-semibold">{amount(item.netAmount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </section>
  );
}
