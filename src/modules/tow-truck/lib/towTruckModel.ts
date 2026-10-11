/** Read-only projection of Orders GET. Never infer payment from an amount. */
import type { RawOrder, OrdersReadPage } from "@modules/orders/api/ordersApi";
import { orderStatusFromNumber, PAYMENT_STATUS_MAP } from "@modules/orders/lib/orderEnums";

const text = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);
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

export function adaptTowTruck(raw: RawOrder) {
  const orderId = id(raw?.id);
  if (!orderId || raw.orderType !== 3) throw new Error("Invalid tow-truck order response");
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
  const vehicle = [text(raw.brandName), text(raw.brandModel), text(raw.brandYear)]
    .filter(Boolean)
    .join(" · ");
  const missingTrip =
    (!origin.title && !origin.description) ||
    (!destination.title && !destination.description) ||
    (!vehicle && !text(raw.plateNumber));
  const driverId = id(raw.towTruckDriverId);
  const assignment = driverId
    ? "assigned"
    : raw.towTruckDriverId === null
      ? "unassigned"
      : "unknown";
  const parsedDate =
    typeof raw.createdAt === "string" && Number.isFinite(Date.parse(raw.createdAt))
      ? raw.createdAt
      : null;
  return {
    id: orderId,
    number: text(raw.orderNumber) ?? `#${orderId}`,
    createdAt: parsedDate,
    customer: text(raw.userFullName),
    customerId: id(raw.userId),
    phone: text(raw.customerPhoneNumber),
    vehicle: vehicle || null,
    vehicleId: id(raw.vehicleId),
    plate: text(raw.plateNumber),
    origin,
    destination,
    driverId,
    driverName: text(raw.towTruckDriverFullName),
    assignment,
    statusCode: number(raw.status),
    status: orderStatusFromNumber(raw.status),
    paymentCode: number(raw.paymentStatus),
    paymentStatusValid:
      raw.paymentStatus == null ||
      (typeof raw.paymentStatus === "number" && Number.isSafeInteger(raw.paymentStatus)),
    paymentPending: raw.paymentStatus === PAYMENT_STATUS_MAP.Pending.number,
    paymentMethodCode: number(raw.paymentMethod),
    subtotal: number(raw.subtotal),
    discount: number(raw.discountAmount),
    total: number(raw.totalPrice),
    duration: text(raw.duration),
    notes: text(raw.notes),
    sameLocations,
    missingTrip,
    // Status names use the shared existing map, but no trip stage is derived
    // from its disputed lifecycle semantics. Numeric payment names remain
    // unverified (including 0/null); never translate code 2 into "Paid" here.
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
