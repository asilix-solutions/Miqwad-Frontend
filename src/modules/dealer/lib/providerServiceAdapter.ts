/**
 * @file providerServiceAdapter.ts
 * @description Single translation boundary between the real numeric-id
 * `/api/provider-services` + `/api/Services` contracts and the dealer
 * module's UI types. Per repo convention, ids are stringified on the way in
 * and parsed back to numbers on the way out. Never throws — a malformed row
 * falls back to neutral values instead of crashing the list/picker.
 */
import type {
  RawProviderService,
  RawServiceCatalogItem,
  ProviderServiceCreateInput,
  ProviderServiceUpdateInput,
} from "../api/providerServicesApi";
import type { Product, ServiceCatalogItem } from "../types";
import type { ProductFormValues } from "../schemas/productSchema";

/** Adapts one raw `/api/provider-services` row into the dealer's `Product` shape. */
export function adaptProviderService(raw: RawProviderService): Product {
  return {
    id: String(raw?.id ?? ""),
    providerId: String(raw?.providerId ?? ""),
    serviceId: String(raw?.serviceId ?? ""),
    serviceName: raw?.serviceName ?? "",
    orderId: raw?.orderId != null ? String(raw.orderId) : null,
    quantity: raw?.quantity ?? 0,
    price: raw?.price ?? 0,
    notes: raw?.notes ?? undefined,
  };
}

/** Builds the `POST /api/provider-services` body — `providerId` is server-derived, never sent. */
export function adaptToCreatePayload(values: ProductFormValues): ProviderServiceCreateInput {
  return {
    serviceId: Number(values.serviceId),
    quantity: values.quantity,
    price: values.price,
    notes: values.notes || undefined,
  };
}

/** Builds the `PUT /api/provider-services/{id}` body — `serviceId` is immutable after create. */
export function adaptToUpdatePayload(values: Omit<ProductFormValues, "serviceId">): ProviderServiceUpdateInput {
  return {
    quantity: values.quantity,
    price: values.price,
    notes: values.notes || undefined,
  };
}

/** Adapts one raw `/api/Services` catalog entry for the dealer's service picker. */
export function adaptServiceCatalogItem(raw: RawServiceCatalogItem): ServiceCatalogItem {
  return {
    id: String(raw?.id ?? ""),
    name: raw?.name ?? "",
    parentServiceId: raw?.parentServiceId != null ? String(raw.parentServiceId) : null,
    categories: Array.isArray(raw?.categories)
      ? raw.categories.map((c) => ({ id: String(c.id), name: c.name ?? "" }))
      : [],
    isActive: raw?.isActive ?? true,
  };
}
