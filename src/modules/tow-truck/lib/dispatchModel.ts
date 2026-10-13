import { z } from "zod";
import type { PaginatedResponse } from "@shared/types/api";
import type { AdminUserRow } from "@modules/admin/types";
import type { TowTruckOrder } from "./towTruckModel";

// Account eligibility for preparation only; not availability or permission to dispatch.
export function canSelectDriver(driver: AdminUserRow): boolean {
  return (
    driver.role === 5 &&
    driver.isActive === true &&
    /^[1-9]\d*$/.test(driver.id) &&
    Number.isSafeInteger(Number(driver.id))
  );
}

// Avoid silently changing a financial value while converting the decimal input
// to the numeric JSON DTO. No currency precision or business maximum is invented.
export function quoteCostError(value: string): string | null {
  if (!value) return "costRequired";
  if (!/^\d+(?:\.\d+)?$/.test(value)) return "costInvalid";
  const cost = Number(value);
  if (cost < 0.01) return "costMinimum";
  const canonical = value
    .replace(/^0+(?=\d)/, "")
    .replace(/(\.\d*?)0+$/, "$1")
    .replace(/\.$/, "");
  if (!Number.isFinite(cost) || cost > Number.MAX_SAFE_INTEGER || String(cost) !== canonical)
    return "costPrecision";
  return null;
}

export function dispatchDraftSchema(quoteAllowed: boolean) {
  return z.object({
    driverId: z
      .string()
      .regex(/^[1-9]\d*$/, "driverRequired")
      .refine((value) => Number.isSafeInteger(Number(value)), "driverRequired"),
    cost: z
      .string()
      .trim()
      .superRefine((value, ctx) => {
        const message = quoteAllowed ? quoteCostError(value) : null;
        if (message) ctx.addIssue({ code: "custom", message });
      }),
    duration: z.string().trim().min(1, "durationRequired").max(100, "durationTooLong"),
  });
}
export type DispatchDraft = z.infer<ReturnType<typeof dispatchDraftSchema>>;

// Detect changes between preparation and authoritative GET review. Never derive
// a paid quote from subtotal/total: the applicable financial field is unconfirmed.
export function dispatchSnapshot(order: TowTruckOrder): string {
  return JSON.stringify([
    order.id,
    order.statusCode,
    order.paymentCode,
    order.paymentMethodCode,
    order.assignment,
    order.driverId,
    order.subtotal,
    order.discount,
    order.total,
    order.duration,
  ]);
}

// Initial assignment is now confirmed; all other driver mutations remain out of scope.
export function initialAssignmentBlock(order: TowTruckOrder): string | null {
  if (order.assignment === "unknown") return "driverStateUnknown";
  if (order.assignment === "assigned") return "initialNeedsUnassigned";
  if (order.statusCode !== 1 || order.status !== "InWaiting") return "initialNeedsWaiting";
  // Legacy new requests use null/0. Pending=1 is the existing attested mapping.
  // Other payment codes remain unverified and must not enter an initial quote.
  if (
    !order.paymentStatusValid ||
    (order.paymentCode !== null && order.paymentCode !== 0 && order.paymentCode !== 1)
  )
    return "initialPaymentBlocked";
  return null;
}

export function validateDriverPage(data: PaginatedResponse<AdminUserRow>, page: number) {
  if (
    !Array.isArray(data.items) ||
    data.page !== page ||
    data.pageSize !== 10 ||
    !Number.isSafeInteger(data.total) ||
    data.total < 0 ||
    !Number.isSafeInteger(data.totalPages) ||
    data.totalPages !== Math.ceil(data.total / 10) ||
    data.items.length > 10 ||
    (data.total === 0 && data.items.length > 0) ||
    (page > Math.max(1, data.totalPages) && data.items.length > 0) ||
    data.items.some(
      (driver) =>
        driver.role !== 5 ||
        typeof driver.isActive !== "boolean" ||
        !/^[1-9]\d*$/.test(driver.id) ||
        !Number.isSafeInteger(Number(driver.id)),
    ) ||
    new Set(data.items.map((driver) => driver.id)).size !== data.items.length
  ) {
    throw new Error("Invalid tow-truck driver page");
  }
  return data;
}

// Editing a reviewed proposal requires a new GET review and explicit confirmation.
export function reviewMatchesDraft(
  reviewed: DispatchDraft,
  current: Partial<DispatchDraft>,
): boolean {
  return (
    reviewed.driverId === current.driverId &&
    reviewed.cost.trim() === current.cost?.trim() &&
    reviewed.duration.trim() === current.duration?.trim()
  );
}

export function nextActionMessage(order: TowTruckOrder): string {
  if (order.stage === "checkDetails") return "checkHint";
  if (order.paymentPending && order.assignment === "assigned") return "pendingCustomerHint";
  return initialAssignmentBlock(order) ?? "reviewHint";
}
