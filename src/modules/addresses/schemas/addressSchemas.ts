/**
 * @file addressSchemas.ts
 * @description Zod validation for the address create/edit form. Error
 * messages are i18n keys (translated at render time via `t()`), not literal
 * strings, so both ar/en are covered from a single schema.
 */
import { z } from "zod";

export const addressSchema = z.object({
  title: z.string().min(1, "addresses.validation.titleRequired"),
  description: z.string().min(1, "addresses.validation.descriptionRequired"),
  shortNumber: z.string().min(1, "addresses.validation.shortNumberRequired"),
  longitude: z
    .number()
    .min(-180, "addresses.validation.longitudeRange")
    .max(180, "addresses.validation.longitudeRange"),
  latitude: z
    .number()
    .min(-90, "addresses.validation.latitudeRange")
    .max(90, "addresses.validation.latitudeRange"),
});

export type AddressFormValues = z.infer<typeof addressSchema>;
