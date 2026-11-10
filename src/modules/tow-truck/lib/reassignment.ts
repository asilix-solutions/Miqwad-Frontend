import type { TowTruckOrder } from "./towTruckModel";

// Stored in the existing actor/order removal-history slot. An attempted removal
// is never an authorization to replace. Legacy markers remain blocked.
export interface RemovalReceipt {
  orderId: string;
  driverId: string;
  finance: string;
  service: string;
}
export type RemovalEvidence = RemovalReceipt | "unverified" | null;
export const removalHistoryKey = (actor: string, orderId: string) =>
  `miqwad:removed-driver-history:${actor}:${orderId}`;
export function serviceSnapshot(order: TowTruckOrder): string {
  return JSON.stringify([order.dispatchService, order.intercityDetails.roadId]);
}
export function readRemovalEvidence(actor: string, orderId: string): RemovalEvidence {
  try {
    const raw = sessionStorage.getItem(removalHistoryKey(actor, orderId));
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (
      value &&
      typeof value === "object" &&
      "orderId" in value &&
      value.orderId === orderId &&
      "driverId" in value &&
      typeof value.driverId === "string" &&
      /^[1-9]\d*$/.test(value.driverId) &&
      Number.isSafeInteger(Number(value.driverId)) &&
      "finance" in value &&
      typeof value.finance === "string" &&
      "service" in value &&
      typeof value.service === "string"
    )
      return { orderId, driverId: value.driverId, finance: value.finance, service: value.service };
    return "unverified";
  } catch {
    return "unverified";
  }
}
export function replacementBlock(order: TowTruckOrder, evidence: RemovalEvidence): string | null {
  if (!evidence) return null;
  if (evidence === "unverified" || evidence.orderId !== order.id) return "r2RemovalUnverified";
  if (order.financeSnapshot !== evidence.finance || serviceSnapshot(order) !== evidence.service)
    return "r2FinancialChanged";
  if (order.dispatchService !== "intercity") return "r2LocalCostUnverified";
  if ([order.subtotal, order.discount, order.total].some((amount) => amount === null || amount < 0))
    return "r2FinancialChanged";
  if (!order.paymentStatusValid || ![0, 1, 2, null].includes(order.paymentCode))
    return "initialPaymentBlocked";
  return null;
}
