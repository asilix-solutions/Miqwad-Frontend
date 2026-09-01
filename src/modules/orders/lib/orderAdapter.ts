/**
 * @file orderAdapter.ts
 * @description Single translation boundary between raw /api/Orders payloads
 * (numeric ids, numeric enum codes) and the internal Order model, which
 * carries the string code-names the badges/forms bind to. Never throws —
 * malformed raw items or unrecognised enum codes fall back to "" so i18n
 * lookup yields a neutral label rather than silently mislabeling the order.
 */
import type { RawOrder, OrderWritePayload } from "../api/ordersApi";
import type {
  Order,
  OrderAddress,
  OrderAttachment,
  OrderDetail,
  OrderLineItem,
  OrderStatus,
  OrderType,
  OrderVehicle,
  PaymentMethod,
  UpdateOrderInput,
} from "../types";
import {
  orderStatusFromNumber,
  orderStatusToNumber,
  orderTypeFromNumber,
  orderTypeToNumber,
  paymentMethodFromNumber,
  paymentMethodToNumber,
  paymentStatusFromNumber,
} from "./orderEnums";

export function adaptRawOrder(raw: RawOrder): Order {
  return {
    id: String(raw?.id ?? ""),
    userId: String(raw?.userId ?? ""),
    userFullName: raw?.userFullName ?? "",
    type: orderTypeFromNumber(raw?.orderType) as OrderType,
    status: orderStatusFromNumber(raw?.status) as OrderStatus,
    paymentMethod: paymentMethodFromNumber(raw?.paymentMethod) as PaymentMethod,
    trackNumber: raw?.trackNumber ?? "",
    createdAt: raw?.createdAt ?? "",
  };
}

const num = (v: number | null | undefined): number => (typeof v === "number" && isFinite(v) ? v : 0);
const str = (v: string | null | undefined): string => v ?? "";

function adaptAddress(raw: RawOrder): OrderAddress | null {
  const title = str(raw?.addressTitle);
  const description = str(raw?.addressDescription);
  const shortNumber = str(raw?.addressShortNumber);
  if (!title && !description && !shortNumber) return null;
  return {
    title,
    description,
    shortNumber,
    latitude: typeof raw?.addressLatitude === "number" ? raw.addressLatitude : null,
    longitude: typeof raw?.addressLongitude === "number" ? raw.addressLongitude : null,
  };
}

function adaptVehicle(raw: RawOrder): OrderVehicle | null {
  const vehicle: OrderVehicle = {
    brandName: str(raw?.brandName),
    brandModel: str(raw?.brandModel),
    brandYear: str(raw?.brandYear),
    piecesName: str(raw?.piecesName),
    serialNumber: str(raw?.serialNumber),
  };
  const hasAny = Object.values(vehicle).some((v) => v !== "");
  return hasAny ? vehicle : null;
}

function adaptItems(raw: RawOrder): OrderLineItem[] {
  return (raw?.orderItems ?? []).map((item) => ({
    id: String(item?.id ?? ""),
    serviceName: str(item?.serviceName),
    providerName: str(item?.providerName),
    unitPrice: num(item?.unitPrice),
    quantity: num(item?.quantity),
    subtotal: num(item?.subtotal),
  }));
}

function adaptAttachments(raw: RawOrder): OrderAttachment[] {
  return (raw?.attachments ?? [])
    .filter((a) => !!a?.filePath)
    .map((a) => ({
      id: String(a?.id ?? ""),
      fileName: str(a?.originalFileName) || str(a?.filePath),
      fileUrl: str(a?.filePath),
      uploadedBy: str(a?.userName),
    }));
}

/**
 * Richer mapping for GET /api/Orders/{id}. Builds on adaptRawOrder and adds
 * the polymorphic detail blocks (amounts, address, payment status, line
 * items, salvage vehicle, attachments). Missing blocks map to null / [] so
 * the detail view can drop their sections cleanly.
 */
export function adaptRawOrderDetail(raw: RawOrder): OrderDetail {
  return {
    ...adaptRawOrder(raw),
    paymentStatus: paymentStatusFromNumber(raw?.paymentStatus),
    subtotal: num(raw?.subtotal),
    discountAmount: num(raw?.discountAmount),
    totalPrice: num(raw?.totalPrice),
    address: adaptAddress(raw),
    items: adaptItems(raw),
    vehicle: adaptVehicle(raw),
    attachments: adaptAttachments(raw),
  };
}

export function adaptToUpdatePayload(input: UpdateOrderInput): OrderWritePayload {
  return {
    type: orderTypeToNumber(input.type),
    paymentMethod: paymentMethodToNumber(input.paymentMethod),
    status: orderStatusToNumber(input.status),
    trackNumber: input.trackNumber,
  };
}
