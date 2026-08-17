/**
 * @file types.ts
 * @description Provider-type-agnostic types for the `/api/provider-services`
 * flow, shared by dealer, scrap, and (eventually) workshop. A "provider
 * service" is a priced service-catalog offering — picking a service, then
 * setting price/quantity/notes, IS adding the offering; there is no
 * free-standing name/sku/category on any provider side. `serviceId` is
 * immutable after create (PUT only accepts quantity/price/notes/images).
 */

export interface ProviderService {
  id: string;
  providerId: string; // owning provider — server-derived from the JWT, never sent on write
  serviceId: string; // FK into the admin service catalog (GET /api/Services)
  serviceName: string; // denormalised by the backend for display
  orderId: string | null; // set once a customer order references this offering
  quantity: number;
  price: number; // SAR
  notes?: string;
  isCompatibleWith?: string; // free-text vehicle compatibility note, raw passthrough
  images: string[]; // attachment URLs — add-only on update, no confirmed removal path
}

/** A category a catalog service belongs to (denormalised on the service itself). */
export interface ServiceCategoryRef {
  id: string;
  name: string;
}

/** One `GET /api/Services` entry, adapted for a provider's service picker. */
export interface ServiceCatalogItem {
  id: string;
  name: string;
  parentServiceId: string | null;
  categories: ServiceCategoryRef[];
  isActive: boolean;
}
