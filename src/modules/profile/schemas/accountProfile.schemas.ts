/**
 * @file accountProfile.schemas.ts
 * @description Zod schemas for the signed-in user's own profile: edit form,
 * password reset, and the two-step phone-change flow. Role-neutral — reused
 * by admin, dealer, workshop, and scrap account pages. Error messages are
 * i18n keys, resolved at render time — same convention as workshop.schemas.ts.
 */

import { z } from "zod";

// Saudi mobile numbers: starts with 5, then 8 digits.
const saudiMobile = /^5\d{8}$/;

// Mirrors RegisterRequestDto's backend rule: min 8, lower + upper + digit + special.
const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export const accountProfileEditSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, { message: "accountProfile.errors.required" })
    .max(100),
  phoneNumber: z
    .string()
    .trim()
    .regex(saudiMobile, { message: "accountProfile.errors.invalidPhone" }),
  address: z.string().trim().min(1, { message: "accountProfile.errors.required" }),
  city: z.string().trim().min(1, { message: "accountProfile.errors.required" }),
  identityNumber: z.string().trim().min(1, { message: "accountProfile.errors.required" }),
});

export type AccountProfileEditFormValues = z.infer<typeof accountProfileEditSchema>;

export const accountResetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .regex(strongPassword, { message: "accountProfile.password.errors.weak" }),
    confirmPassword: z.string().min(1, { message: "accountProfile.password.errors.confirmRequired" }),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "accountProfile.password.errors.mismatch",
    path: ["confirmPassword"],
  });

export type AccountResetPasswordFormValues = z.infer<typeof accountResetPasswordSchema>;

export const accountChangePhoneRequestSchema = z.object({
  newPhoneNumber: z
    .string()
    .trim()
    .regex(saudiMobile, { message: "accountProfile.phone.errors.invalidPhone" }),
});

export type AccountChangePhoneRequestFormValues = z.infer<typeof accountChangePhoneRequestSchema>;

export const accountChangePhoneVerifySchema = z.object({
  code: z
    .string()
    .trim()
    .min(4, { message: "accountProfile.phone.errors.codeRequired" }),
});

export type AccountChangePhoneVerifyFormValues = z.infer<typeof accountChangePhoneVerifySchema>;
