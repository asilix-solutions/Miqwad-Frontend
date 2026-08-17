/**
 * @file productSchema.ts
 * @description Dealer product (provider-service offering) form schema —
 * a dealer-scoped alias of the shared `providerServiceSchema`, promoted to
 * `@shared/provider-services` so scrap (and future provider types) can
 * reuse the identical pick-a-service-then-price/quantity/notes shape.
 */
export {
  providerServiceSchema as productSchema,
  type ProviderServiceFormValues as ProductFormValues,
} from "@shared/provider-services";
