/**
 * @file providerServiceAdapter.ts
 * @description Single translation boundary between the real numeric-id
 * `/api/provider-services` + `/api/Services` contracts and the shared UI
 * types, used by every provider type. Per repo convention, ids are
 * stringified on the way in and parsed back to numbers on the way out.
 * Never throws — a malformed row falls back to neutral values instead of
 * crashing the list/picker.
 */
import type {
  RawProviderService,
  RawProviderServiceAttachment,
  RawServiceCatalogItem,
  ProviderServiceCreateInput,
  ProviderServiceUpdateInput,
} from "../api/providerServicesApi";
import type { ProviderService, ServiceCatalogItem } from "../types";
import type { ProviderServiceFormValues } from "../schemas/providerServiceSchema";

/** Pulls a usable image URL off one raw attachment ref — null-tolerant, never throws. */
function adaptAttachmentUrl(raw: RawProviderServiceAttachment): string | null {
  const url = raw?.filePath ?? (raw?.["url"] as string | undefined) ?? (raw?.["fileUrl"] as string | undefined);
  return typeof url === "string" && url ? url : null;
}

/** Adapts one raw `/api/provider-services` row into the shared `ProviderService` shape. */
export function adaptProviderService(raw: RawProviderService): ProviderService {
  return {
    id: String(raw?.id ?? ""),
    providerId: String(raw?.providerId ?? ""),
    serviceId: String(raw?.serviceId ?? ""),
    serviceName: raw?.serviceName ?? "",
    orderId: raw?.orderId != null ? String(raw.orderId) : null,
    quantity: raw?.quantity ?? 0,
    price: raw?.price ?? 0,
    notes: raw?.notes ?? undefined,
    isCompatibleWith: raw?.isCompatibleWith ?? undefined,
    images: Array.isArray(raw?.attachments)
      ? raw.attachments.map(adaptAttachmentUrl).filter((url): url is string => url !== null)
      : [],
  };
}

/** Builds the `POST /api/provider-services` body — `providerId` is server-derived, never sent. */
export function adaptToCreatePayload(values: ProviderServiceFormValues): ProviderServiceCreateInput {
  return {
    serviceId: Number(values.serviceId),
    quantity: values.quantity,
    price: values.price,
    notes: values.notes || undefined,
    isCompatibleWith: values.isCompatibleWith || undefined,
    files: values.files,
  };
}

/** Builds the `PUT /api/provider-services/{id}` body — `serviceId` is immutable after create. */
export function adaptToUpdatePayload(
  values: Omit<ProviderServiceFormValues, "serviceId">,
): ProviderServiceUpdateInput {
  return {
    quantity: values.quantity,
    price: values.price,
    notes: values.notes || undefined,
    isCompatibleWith: values.isCompatibleWith || undefined,
    files: values.files,
  };
}

/** Adapts one raw `/api/Services` catalog entry for a provider's service picker. */
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
