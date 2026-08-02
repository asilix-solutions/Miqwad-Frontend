/**
 * @file adminProfile.schemas.ts
 * @description Zod schemas for the admin's own profile: edit form, password
 * reset, and the two-step phone-change flow. Error messages are i18n keys,
 * resolved at render time — same convention as workshop.schemas.ts.
 */

import { z } from "zod";

// Saudi mobile numbers: starts with 5, then 8 digits.
const saudiMobile = /^5\d{8}$/;

// Mirrors RegisterRequestDto's backend rule: min 8, lower + upper + digit + special.
const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export const adminProfileEditSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, { message: "admin.profile.errors.required" })
    .max(100),
  phoneNumber: z
    .string()
    .trim()
    .regex(saudiMobile, { message: "admin.profile.errors.invalidPhone" }),
  address: z.string().trim().min(1, { message: "admin.profile.errors.required" }),
  city: z.string().trim().min(1, { message: "admin.profile.errors.required" }),
  identityNumber: z.string().trim().min(1, { message: "admin.profile.errors.required" }),
});

export type AdminProfileEditFormValues = z.infer<typeof adminProfileEditSchema>;

export const adminResetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .regex(strongPassword, { message: "admin.profile.password.errors.weak" }),
    confirmPassword: z.string().min(1, { message: "admin.profile.password.errors.confirmRequired" }),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "admin.profile.password.errors.mismatch",
    path: ["confirmPassword"],
  });

export type AdminResetPasswordFormValues = z.infer<typeof adminResetPasswordSchema>;

export const adminChangePhoneRequestSchema = z.object({
  newPhoneNumber: z
    .string()
    .trim()
    .regex(saudiMobile, { message: "admin.profile.phone.errors.invalidPhone" }),
});

export type AdminChangePhoneRequestFormValues = z.infer<typeof adminChangePhoneRequestSchema>;

export const adminChangePhoneVerifySchema = z.object({
  code: z
    .string()
    .trim()
    .min(4, { message: "admin.profile.phone.errors.codeRequired" }),
});

export type AdminChangePhoneVerifyFormValues = z.infer<typeof adminChangePhoneVerifySchema>;
