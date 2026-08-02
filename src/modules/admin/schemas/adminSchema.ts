/**
 * @file adminSchema.ts
 * @description Zod schema for the elevated-privilege "Add Admin" flow.
 * Deliberately kept SEPARATE from `userSchema`'s 4-type discriminated union
 * (client/workshop/dealer/scrapyard) — admin creation is a distinct,
 * higher-privilege action and must not be reachable through the normal
 * Add-User stepper. `confirmGrant` is a safeguard checkbox with no backend
 * meaning; it only gates the submit button client-side. There is no
 * password field — the backend emails the new admin an activation OTP and
 * they set their own password via the existing reset-password flow.
 */

import { z } from "zod";

// Saudi mobile numbers: starts with 5, then 8 digits.
const saudiMobile = /^5\d{8}$/;

export const adminCreateSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, { message: "admin.addAdmin.errors.required" })
    .max(100),
  email: z
    .string()
    .trim()
    .min(1, { message: "admin.addAdmin.errors.required" })
    .email({ message: "admin.addAdmin.errors.invalidEmail" }),
  phoneNumber: z
    .string()
    .trim()
    .regex(saudiMobile, { message: "admin.addAdmin.errors.invalidPhone" }),
  city: z.string().trim().min(1, { message: "admin.addAdmin.errors.required" }),
  address: z.string().trim().min(1, { message: "admin.addAdmin.errors.required" }),
  confirmGrant: z.literal(true, { message: "admin.addAdmin.errors.confirmRequired" }),
});

export type AdminCreateFormValues = z.infer<typeof adminCreateSchema>;
