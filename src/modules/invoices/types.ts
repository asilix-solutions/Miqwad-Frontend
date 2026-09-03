/**
 * @file types.ts
 * @description Type contract for the admin Invoices module.
 *
 * LIVE-CONFIRMED contract (2026-09-03): the backend `InvoiceResponseDto` is a
 * bare scaffold — list AND detail return the SAME four fields. There are no
 * enums, no status, no order/provider/customer ids, no line items, no
 * tax/VAT/discount, and no human invoice number. `totalPrice` is declared
 * `double` server-side but (per the Orders precedent) may be int-bound — it is
 * typed as `number` and rendered via `formatCurrency`, never assumed decimal.
 *
 * The view-model carries OPTIONAL forward-looking fields (lineItems, tax,
 * parties, payment, status, orderId) so the detail page's "coming soon"
 * sections light up automatically once the DTO grows.
 * TODO: wire when backend enriches InvoiceResponseDto (lineItems, tax, parties, orderId, status)
 */

/** Exact raw shape returned by GET /api/Invoices and GET /api/Invoices/{id}. */
export interface RawInvoice {
  /** int64 */
  id: number;
  fullName: string | null;
  /** Declared double; may be int-bound. Render via formatCurrency. */
  totalPrice: number;
  /** ISO-8601 with NO timezone suffix — parsed as local time. */
  createdAt: string;
}

/**
 * A single invoice line item. Not yet returned by the backend — present so the
 * detail "coming soon" section is a real component fed by optional data.
 */
export interface InvoiceLineItem {
  id: string;
  description: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

/** Tax / VAT breakdown. Not yet returned by the backend. */
export interface InvoiceTaxBreakdown {
  subtotal: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

/** Customer / provider parties block. Not yet returned by the backend. */
export interface InvoiceParties {
  customerName: string | null;
  providerName: string | null;
}

/** Payment leg. Not yet returned by the backend. */
export interface InvoicePayment {
  method: string | null;
  status: string | null;
}

/** View-model consumed by the pages. Real data = the first four fields. */
export interface Invoice {
  id: string;
  /** Display code, e.g. `#42`. See lib/invoiceCode.ts. */
  code: string;
  fullName: string | null;
  totalPrice: number;
  /** Raw local ISO string; format at render time with formatOrderDate. */
  createdAt: string;

  // ── Forward-looking, all optional (backend does not send these yet) ──
  status?: string;
  orderId?: string;
  lineItems?: InvoiceLineItem[];
  tax?: InvoiceTaxBreakdown;
  parties?: InvoiceParties;
  payment?: InvoicePayment;
}

/**
 * Typed params for GET /api/Invoices. Live-validated: PageNumber, PageSize
 * (1–100), SortBy, SortDescending, FromDate/ToDate are accepted; a bad
 * SortBy/FilterBy returns HTTP 400. No status/order filter exists.
 */
export interface InvoicesListParams {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortDescending?: boolean;
  fromDate?: string;
  toDate?: string;
}
