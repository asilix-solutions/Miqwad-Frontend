import { z } from "zod";

/**
 * Zod schemas for the Sprint 3 provider flows.
 *
 * i18n message keys are emitted as `message` so the rendering layer
 * can translate uniformly across the app.
 *
 * IMPORTANT: schema input and output shapes are kept aligned so the
 * react-hook-form generics stay simple. Numeric inputs use a plain
 * `z.number()` schema; the rendering forms coerce string ↔ number
 * via `setValueAs` on the `register()` call.
 */

/** Step 1 — Company basics. */
export const providerCompanySchema = z.object({
  companyName: z
    .string()
    .min(2, { message: "common.requiredField" })
    .max(120),
  email: z
    .string()
    .min(1, { message: "common.requiredField" })
    .email({ message: "auth.invalidEmail" }),
  phone: z
    .string()
    .regex(/^5\d{8}$/u, { message: "auth.invalidPhone" }),
  password: z
    .string()
    .min(6, { message: "common.requiredField" })
    .max(72),
});
export type ProviderCompanyValues = z.infer<typeof providerCompanySchema>;

/** Step 2 — Location and working hours. */
export const providerLocationSchema = z.object({
  address: z.string().max(255).optional().or(z.literal("")),
  city: z.string().max(80).optional().or(z.literal("")),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  workingHours: z.string().max(255).optional().or(z.literal("")),
});
export type ProviderLocationValues = z.infer<typeof providerLocationSchema>;

/** Step 3 — Category selection (multiple). */
export const providerServicesSchema = z.object({
  categoryIds: z.array(z.number()).default([]),
});
export type ProviderServicesValues = z.infer<typeof providerServicesSchema>;

/** Step 4 — KYC metadata only (the files are tracked separately in Redux). */
export const providerDocumentsSchema = z.object({
  acknowledgedOptional: z.boolean().optional(),
});
export type ProviderDocumentsValues = z.infer<typeof providerDocumentsSchema>;

/** Provider service form (Add / Edit). */
export const providerServiceSchema = z.object({
  name: z.string().min(2, { message: "common.requiredField" }).max(120),
  description: z.string().max(500).optional().or(z.literal("")),
  price: z
    .number({ message: "providers.services.invalidPrice" })
    .positive({ message: "providers.services.invalidPrice" }),
  estimatedDuration: z
    .number({ message: "providers.services.invalidDuration" })
    .positive({ message: "providers.services.invalidDuration" })
    .nullable(),
  categoryId: z
    .number({ message: "common.requiredField" })
    .int()
    .positive({ message: "common.requiredField" }),
  subcategoryId: z.number().int().positive().nullable(),
});
export type ProviderServiceFormValues = z.infer<typeof providerServiceSchema>;
