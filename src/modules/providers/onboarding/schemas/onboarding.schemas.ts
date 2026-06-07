/**
 * @file Onboarding Zod schemas (placeholder).
 *
 * Will contain validation schemas for the optional-documents step
 * once the documents UI is implemented. Kept as a placeholder to
 * maintain the module directory structure.
 */

import { z } from "zod";

/**
 * Placeholder schema for the optional documents step.
 * Will be expanded with file-type, size, and count constraints.
 */
export const optionalDocumentsSchema = z.object({
  /** Whether the user has acknowledged the optional-docs prompt. */
  acknowledged: z.boolean().default(false),
});

export type OptionalDocumentsValues = z.infer<typeof optionalDocumentsSchema>;
