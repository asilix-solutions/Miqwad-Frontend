/** Read-only projection of Orders GET. Never infer payment from an amount. */
import { AppError } from "@shared/types/api";
import type { RawOrder, OrdersReadPage } from "@modules/orders/api/ordersApi";
import type { OrderStatus, PaymentMethod, PaymentStatus } from "@modules/orders/types";
import {
  orderStatusFromNumber,
  paymentStatusFromNumber,
  paymentMethodFromNumber,
  ORDER_STATUS_MAP,
  PAYMENT_STATUS_MAP,
  PAYMENT_METHOD_MAP,
} from "@modules/orders/lib/orderEnums";
import { getModelArabicNameByBrand } from "@modules/vehicles/lib/modelLocalization";
import { getBrandEnglishName } from "@modules/vehicles/lib/brandLocalization";

const SWAGGER_PLACEHOLDERS = new Set(["string", "null", "undefined"]);

export const normalizeText = (v: unknown): string | null => {
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  if (!trimmed || SWAGGER_PLACEHOLDERS.has(trimmed.toLowerCase())) return null;
  return trimmed;
};

const text = normalizeText;
const number = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;
const id = (v: unknown): string | null =>
  typeof v === "number" && Number.isSafeInteger(v) && v > 0 ? String(v) : null;

export function location(title: unknown, description: unknown, lat: unknown, lng: unknown) {
  const latitude = number(lat),
    longitude = number(lng);
  const valid =
    latitude !== null &&
    longitude !== null &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180;
  // A valid numeric pair is not evidence of a real pickup. Null Island is a
  // known placeholder risk; other valid-looking placeholders remain unverified.
  const suspect = valid && latitude === 0 && longitude === 0;
  return {
    title: text(title),
    description: text(description),
    latitude,
    longitude,
    quality:
      lat == null && lng == null
        ? "missing"
        : !valid
          ? "invalid"
          : suspect
            ? "suspect"
            : "unverified",
  } as const;
}

export function safeAttachmentUrl(value: unknown): string | null {
  const path = text(value);
  if (!path) return null;
  try {
    // Only absolute HTTP(S) links are established by the existing Orders contract.
    const url = new URL(path);
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export function parseTowTruckPayment(rawPayment: unknown): {
  code: number | null;
  status: PaymentStatus | "";
  valid: boolean;
} {
  if (rawPayment == null) {
    return { code: null, status: "", valid: true };
  }
  if (typeof rawPayment === "number" && Number.isSafeInteger(rawPayment)) {
    if ([0, 1, 2, 3, 4].includes(rawPayment)) {
      return {
        code: rawPayment,
        status: paymentStatusFromNumber(rawPayment),
        valid: true,
      };
    }
    return { code: rawPayment, status: "", valid: false };
  }
  if (typeof rawPayment === "string") {
    const trimmed = rawPayment.trim();
    if (/^[0-4]$/.test(trimmed)) {
      const code = Number(trimmed);
      return {
        code,
        status: paymentStatusFromNumber(code),
        valid: true,
      };
    }
    const matchedKey = (Object.keys(PAYMENT_STATUS_MAP) as PaymentStatus[]).find(
      (k) => k.toLowerCase() === trimmed.toLowerCase(),
    );
    if (matchedKey) {
      return {
        code: PAYMENT_STATUS_MAP[matchedKey].number,
        status: matchedKey,
        valid: true,
      };
    }
  }
  return { code: null, status: "", valid: false };
}

export function parseTowTruckStatus(rawStatus: unknown): {
  code: number | null;
  status: OrderStatus | "";
} {
  if (rawStatus == null) {
    return { code: null, status: "" };
  }
  if (typeof rawStatus === "number" && Number.isSafeInteger(rawStatus)) {
    return {
      code: rawStatus,
      status: orderStatusFromNumber(rawStatus),
    };
  }
  if (typeof rawStatus === "string") {
    const trimmed = rawStatus.trim();
    if (/^[1-5]$/.test(trimmed)) {
      const code = Number(trimmed);
      return {
        code,
        status: orderStatusFromNumber(code),
      };
    }
    const matchedKey = (Object.keys(ORDER_STATUS_MAP) as OrderStatus[]).find(
      (k) => k.toLowerCase() === trimmed.toLowerCase(),
    );
    if (matchedKey) {
      return {
        code: ORDER_STATUS_MAP[matchedKey].number,
        status: matchedKey,
      };
    }
  }
  return { code: null, status: "" };
}

export function parseTowTruckPaymentMethod(rawMethod: unknown): {
  code: number | null;
  method: PaymentMethod | "";
} {
  if (rawMethod == null) {
    return { code: null, method: "" };
  }
  if (typeof rawMethod === "number" && Number.isSafeInteger(rawMethod)) {
    return {
      code: rawMethod,
      method: paymentMethodFromNumber(rawMethod),
    };
  }
  if (typeof rawMethod === "string") {
    const trimmed = rawMethod.trim();
    if (/^[1-4]$/.test(trimmed)) {
      const code = Number(trimmed);
      return {
        code,
        method: paymentMethodFromNumber(code),
      };
    }
    const matchedKey = (Object.keys(PAYMENT_METHOD_MAP) as PaymentMethod[]).find(
      (k) => k.toLowerCase() === trimmed.toLowerCase(),
    );
    if (matchedKey) {
      return {
        code: PAYMENT_METHOD_MAP[matchedKey].number,
        method: matchedKey,
      };
    }
  }
  return { code: null, method: "" };
}

export function adaptTowTruck(raw: RawOrder) {
  const orderId = id(raw?.id);
  if (!orderId) throw new AppError("Invalid order identity", "TOW_ORDER_ID");
  if (raw.orderType !== 3) throw new AppError("Unexpected order type", "TOW_ORDER_TYPE");
  const origin = location(
    raw.addressTitle,
    raw.addressDescription,
    raw.addressLatitude,
    raw.addressLongitude,
  );
  const destination = location(
    raw.destinationAddressTitle,
    raw.destinationAddressDescription,
    raw.destinationLatitude,
    raw.destinationLongitude,
  );
  const sameLocations =
    origin.quality === "unverified" &&
    destination.quality === "unverified" &&
    origin.latitude === destination.latitude &&
    origin.longitude === destination.longitude;
  const rawBrand = text(raw.brandName);
  const rawModel = text(raw.brandModel);
  const rawYear = text(raw.brandYear);
  const brandEn = rawBrand ? (getBrandEnglishName(undefined, rawBrand) ?? rawBrand) : null;
  const modelAr = getModelArabicNameByBrand(rawBrand, rawModel);
  const vehicle = [brandEn ?? rawBrand, rawModel, rawYear]
    .filter(Boolean)
    .join(" · ");
  const vehicleAr = [rawBrand, modelAr ?? rawModel, rawYear]
    .filter(Boolean)
    .join(" · ");
  const missingTrip =
    (!origin.title && !origin.description) ||
    (!destination.title && !destination.description) ||
    (!vehicle && !text(raw.plateNumber));
  const driverId = id(raw.towTruckDriverId);
  const rawDriver = raw.towTruckDriverId as unknown;
  const isUnassigned =
    rawDriver === null ||
    rawDriver === undefined ||
    rawDriver === 0 ||
    rawDriver === "0" ||
    (typeof rawDriver === "string" && rawDriver.trim() === "");
  const assignment = driverId
    ? ("assigned" as const)
    : isUnassigned
      ? ("unassigned" as const)
      : ("unknown" as const);
  const parsedDate =
    typeof raw.createdAt === "string" && Number.isFinite(Date.parse(raw.createdAt))
      ? raw.createdAt
      : null;
  const parsedPayment = parseTowTruckPayment(raw.paymentStatus);
  const paymentStatus = parsedPayment.status;
  const parsedStatus = parseTowTruckStatus(raw.status);
  const parsedPaymentMethod = parseTowTruckPaymentMethod(raw.paymentMethod);
  const rawServiceType = number(raw.towTruckServiceType ?? raw.serviceType);
  // InterCity is verified by explicit service type code 2 or explicit intercity details/roadId.
  // Never infer InterCity solely from arbitrary addresses or city names.
  const hasExplicitIntercityDetails = Boolean(
    raw.intercityTowTruckDetails?.roadId ||
    raw.intercityTowTruckDetails?.originCityId ||
    raw.roadId,
  );
  const serviceType: "intracity" | "intercity" | "unknown" =
    rawServiceType === 2 || (rawServiceType === null && hasExplicitIntercityDetails)
      ? "intercity"
      : rawServiceType === 1
        ? "intracity"
        : "unknown";
  const isInterCity = serviceType === "intercity";

  const rawIntercity = raw.intercityTowTruckDetails;
  const originCityName = text(rawIntercity?.originCityNameSnapshot ?? raw.originCityName);
  const destinationCityName = text(rawIntercity?.destinationCityNameSnapshot ?? raw.destinationCityName);

  const intercityDetails = {
    roadId: id(rawIntercity?.roadId ?? raw.roadId),
    originCityId: id(rawIntercity?.originCityId ?? raw.originCityId),
    destinationCityId: id(rawIntercity?.destinationCityId ?? raw.destinationCityId),
    originCityName,
    destinationCityName,
    receiverName: text(rawIntercity?.receiverName ?? raw.receiverName),
    receiverPhone: text(rawIntercity?.receiverPhone ?? raw.receiverPhone),
  };
  // Route summary requires verified human-readable city names.
  // Avoid displaying raw city IDs as though they were human-readable route names.
  const hasInterCityRoute = Boolean(originCityName && destinationCityName);
  const routeSummary = hasInterCityRoute ? `${originCityName} → ${destinationCityName}` : null;

  return {
    id: orderId,
    // Preserve raw material-field distinctions for confirmation; never infer a
    // payment name from the order status or non-payment fields.
    operationSnapshot: JSON.stringify([
      raw.id,
      raw.orderNumber,
      raw.orderType,
      raw.status,
      raw.paymentStatus,
      raw.paymentMethod,
      raw.towTruckDriverId,
      raw.towTruckDriverFullName,
      raw.subtotal,
      raw.discountAmount,
      raw.totalPrice,
      raw.duration,
      raw.towTruckServiceType,
      intercityDetails.roadId,
    ]),
    financeSnapshot: JSON.stringify([
      raw.paymentStatus,
      raw.paymentMethod,
      raw.subtotal,
      raw.discountAmount,
      raw.totalPrice,
    ]),
    removalPayment:
      paymentStatus === "Paid"
        ? ("paid" as const)
        : paymentStatus === "Pending"
          ? ("pending" as const)
          : ("unknown" as const),
    number: text(raw.orderNumber) ?? `#${orderId}`,
    createdAt: parsedDate,
    customer: text(raw.userFullName),
    customerId: id(raw.userId),
    phone: text(raw.customerPhoneNumber),
    vehicle: vehicle || null,
    vehicleAr: vehicleAr || null,
    brandName: rawBrand,
    brandModel: rawModel,
    brandModelAr: modelAr ?? null,
    brandYear: rawYear,
    serialNumber: text(raw.serialNumber),
    vehicleId: id(raw.vehicleId),
    plate: text(raw.plateNumber),
    origin,
    destination,
    driverId,
    driverName: text(raw.towTruckDriverFullName),
    assignment,
    statusCode: parsedStatus.code,
    status: parsedStatus.status,
    paymentStatus,
    paymentCode: parsedPayment.code,
    paymentStatusValid: parsedPayment.valid,
    paymentPending: paymentStatus === "Pending",
    paymentMethod: parsedPaymentMethod.method,
    paymentMethodCode: parsedPaymentMethod.code,
    subtotal: number(raw.subtotal),
    discount: number(raw.discountAmount),
    total: number(raw.totalPrice),
    agreedPrice: number(raw.totalPrice),
    duration: text(raw.duration),
    notes: text(raw.notes),
    serviceType,
    serviceTypeCode: rawServiceType,
    isInterCity,
    intercityDetails,
    hasInterCityRoute,
    routeSummary,
    sameLocations,
    missingTrip,
    // Status and payment names reuse the shared canonical maps. Numeric payment codes
    // 1=Pending, 2=Paid, 3=Failed, 4=Refunded map to their canonical states;
    // 0/null/unrecognized remain unverified ("").
    stage:
      missingTrip ||
      sameLocations ||
      [origin, destination].some((p) => ["invalid", "suspect"].includes(p.quality))
        ? "checkDetails"
        : "review",
    attachmentsKnown: Array.isArray(raw.attachments),
    attachments: Array.isArray(raw.attachments)
      ? raw.attachments.map((a, index) => ({
          key: `${a?.id ?? "attachment"}-${index}`,
          name: text(a?.originalFileName),
          url: safeAttachmentUrl(a?.filePath),
        }))
      : [],
  };
}
export type TowTruckOrder = ReturnType<typeof adaptTowTruck>;
export type TripLocation = TowTruckOrder["origin"];

export function adaptTowTruckPage(page: OrdersReadPage<RawOrder>) {
  if (
    !page.serverPaginated ||
    !Array.isArray(page.items) ||
    !Number.isSafeInteger(page.page) ||
    page.page < 1 ||
    !Number.isSafeInteger(page.pageSize) ||
    page.pageSize < 1 ||
    !Number.isSafeInteger(page.total) ||
    page.total < 0 ||
    !Number.isSafeInteger(page.totalPages) ||
    page.totalPages < 0 ||
    (page.total > 0 && page.totalPages === 0) ||
    page.items.length > page.pageSize ||
    (page.total === 0 && page.items.length > 0)
  )
    throw new Error("Invalid orders pagination");
  const items = page.items.map(adaptTowTruck);
  if (new Set(items.map((o) => o.id)).size !== items.length)
    throw new Error("Duplicate order identities");
  return { ...page, items };
}
