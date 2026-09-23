/**
 * @file types.ts
 * @description Rich read-only contract supplied from live verification.
 * Dates retain the timezone-less representation; amounts are server-authoritative.
 */
export interface InvoiceFacility {
  name: string | null;
  taxIdNumber: string | null;
  commercialRegister: string | null;
  address: string | null;
}
export interface InvoiceBuyer {
  name: string | null;
  vatNumber: string | null;
  address: string | null;
  commercialRegister: string | null;
}
export interface InvoiceLineItem {
  id: number;
  providerServiceId: number;
  serviceName: string | null;
  providerName: string | null;
  price: number;
  quantity: number;
  /** Observed monetary discount, not a percentage. */
  offer: number | null;
  offerName: string | null;
  grossAmount: number;
  netAmount: number;
}
/** TODO(backend): confirm meanings of values 1 and 2 before labeling. */
export type InvoiceType = number;

/** List and detail share this entity; no duplicate presentation type is needed. */
export interface Invoice {
  id: number;
  invoiceNumber: string;
  invoiceType: InvoiceType;
  buyerId: number | null;
  sellerId: number | null;
  orderId: number | null;
  customerName: string;
  orderNumber: string | null;
  issueDate: string;
  supplyDate: string;
  /** Observed sum of quantities; items.length is the number of lines. */
  itemCount: number;
  qrCode: string;
  facilityInformation: InvoiceFacility;
  buyerInformation: InvoiceBuyer | null;
  items: InvoiceLineItem[];
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  /** Fractional rate: 0.15 is displayed as 15%. */
  taxRate: number;
  taxAmount: number;
  totalPrice: number;
}
export interface InvoicesListParams {
  pageNumber?: number;
  pageSize?: number;
  /** Existing implementation supports amount sorting; new fields need probes. */
  sortBy?: "totalPrice";
  sortDescending?: boolean;
}
