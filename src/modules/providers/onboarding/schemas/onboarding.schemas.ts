/**
 * @file Onboarding Zod schemas.
 *
 * Validation schemas for the provider onboarding wizard steps.
 */

import { z } from "zod";

/**
 * Services step — provider picks which category branches they serve.
 * At least one category must be selected.
 */
export const servicesStepSchema = z.object({
  categoryIds: z
    .array(z.number().int().positive())
    .min(1, "providers.onboarding.services.noneSelected"),
});

export type ServicesStepValues = z.infer<typeof servicesStepSchema>;

/**
 * Placeholder schema for the optional documents step.
 * Will be expanded with file-type, size, and count constraints.
 */
export const optionalDocumentsSchema = z.object({
  /** Whether the user has acknowledged the optional-docs prompt. */
  acknowledged: z.boolean().default(false),
});

export type OptionalDocumentsValues = z.infer<typeof optionalDocumentsSchema>;
