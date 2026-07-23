/**
 * @file Shared Zod field set for per-type provider signup schemas.
 * Mirrors the variant pattern in `@modules/admin/schemas/userSchema.ts`:
 * a common base spread into each type's own schema object, so future
 * per-type field divergence only touches that type's config file.
 * Validation messages are i18n KEYS (resolved via t() at render time),
 * not hardcoded Arabic strings.
 */

import { z } from "zod";

// Saudi mobile numbers: starts with 5, then 8 digits.
const saudiMobile = /^5\d{8}$/;

export const providerRegisterBaseFields = {
  companyName: z
    .string()
    .trim()
    .min(2, { message: "auth.providerSignup.companyNameRequired" })
    .max(150),
  email: z
    .string()
    .trim()
    .min(1, { message: "common.requiredField" })
    .email({ message: "common.invalidEmail" }),
  phone: z.string().trim().regex(saudiMobile, { message: "auth.invalidPhone" }),
  password: z.string().min(6, { message: "auth.providerSignup.passwordMin" }),
};
