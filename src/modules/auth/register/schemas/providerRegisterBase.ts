/**
 * @file Shared Zod field set for per-type provider signup schemas.
 * Mirrors the variant pattern in `@modules/admin/schemas/userSchema.ts`:
 * a common base spread into each type's own schema object, so future
 * per-type field divergence only touches that type's config file.
 * Validation messages are i18n KEYS (resolved via t() at render time),
 * not hardcoded Arabic strings.
 *
 * `password` must satisfy the real backend's pattern (min 8, lower+upper+
 * digit+symbol) — confirmed live against POST /api/auth/register.
 */

import { z } from "zod";

// Saudi mobile numbers: starts with 5, then 8 digits.
const saudiMobile = /^5\d{8}$/;
const strongPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;

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
  password: z.string().regex(strongPasswordPattern, { message: "auth.register.errors.passwordWeak" }),
  confirmPassword: z.string().min(1, { message: "auth.register.errors.confirmRequired" }),
  termsOfServiceAccepted: z.boolean().refine((accepted) => accepted === true, {
    message: "auth.register.errors.termsRequired",
  }),
};

/**
 * Builds a per-type provider signup schema: a `type` literal discriminator
 * plus the shared base fields, with a cross-field password-match check.
 */
export function createProviderRegisterSchema<T extends string>(type: T) {
  return z
    .object({
      type: z.literal(type),
      ...providerRegisterBaseFields,
    })
    .refine((values) => values.password === values.confirmPassword, {
      message: "auth.register.errors.passwordMismatch",
      path: ["confirmPassword"],
    });
}
