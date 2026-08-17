/**
 * @file providerServiceSchema.ts
 * @description Shared provider-service (offering) form schema — pick a
 * service, then set price/quantity/notes. `serviceId` stays in the schema
 * for both modes so a single form type covers create and edit; the edit
 * form just never lets the user change it (PUT doesn't accept it).
 * Validation messages live under the neutral `providerService.validation.*`
 * i18n namespace since the shape is identical for every provider type.
 */
import { z } from "zod";

export const providerServiceSchema = z.object({
  serviceId: z.string().min(1, "providerService.validation.serviceRequired"),
  quantity: z
    .number()
    .int("providerService.validation.quantityMin")
    .min(1, "providerService.validation.quantityMin"),
  // Whole numbers only — the live multipart binder rejects decimal Price strings (confirmed backend limitation).
  price: z
    .number()
    .int("providerService.validation.priceInteger")
    .min(0, "providerService.validation.priceNonNegative"),
  notes: z.string().max(500, "providerService.validation.notesMax").optional(),
  isCompatibleWith: z.string().max(300, "providerService.validation.compatibilityMax").optional(),
  files: z.array(z.instanceof(File)).optional(),
});

export type ProviderServiceFormValues = z.infer<typeof providerServiceSchema>;
