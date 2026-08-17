/**
 * @file index.ts
 * @description Barrel export for the shared provider-services flow —
 * `/api/provider-services` + `/api/Services` CRUD, adapters, form schema,
 * types, and the images picker. Consumed by dealer, scrap, and (eventually)
 * workshop provider modules.
 */
export * from "./types";
export * from "./api/providerServicesApi";
export * from "./lib/providerServiceAdapter";
export * from "./schemas/providerServiceSchema";
export { ProviderServiceImagesPicker } from "./components/ProviderServiceImagesPicker";
