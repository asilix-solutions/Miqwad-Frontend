import { z } from "zod";
import { passwordStrengthScore } from "@shared/components/ui/PasswordStrengthMeter";

/**
 * Validation schemas for the auth flow.
 * Kept colocated with the module so consumers import directly.
 */

// Saudi mobile numbers: starts with 5, then 8 digits.
const saudiMobile = /^5\d{8}$/;

export const phoneSchema = z.object({
  phoneNumber: z
    .string()
    .trim()
    .regex(saudiMobile, { message: "رقم الجوال غير صحيح، يجب أن يبدأ بـ 5" }),
});
export type PhoneFormValues = z.infer<typeof phoneSchema>;

export const otpSchema = z.object({
  code: z
    .string()
    .trim()
    .length(6, { message: "الرمز غير صحيح" })
    .regex(/^\d{6}$/, { message: "الرمز غير صحيح" }),
});
export type OtpFormValues = z.infer<typeof otpSchema>;

export const emailLoginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, { message: "هذا الحقل مطلوب" })
    .email({ message: "البريد الإلكتروني غير صحيح" }),
  password: z
    .string()
    .trim()
    .min(6, { message: "كلمة المرور يجب ألا تقل عن 6 أحرف" }),
});
export type EmailLoginFormValues = z.infer<typeof emailLoginSchema>;

export const completeProfileSchema = z.object({
  fullName: z.string().trim().min(3, { message: "هذا الحقل مطلوب" }),
  email: z
    .string()
    .trim()
    .email({ message: "البريد الإلكتروني غير صحيح" })
    .optional()
    .or(z.literal("")),
  role: z.enum(["customer", "provider"]),
});
export type CompleteProfileFormValues = z.infer<typeof completeProfileSchema>;

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, { message: "الاسم مطلوب ولا يقل عن حرفين" }),
  phoneNumber: z.string().trim().regex(saudiMobile, { message: "رقم الجوال غير صحيح، يجب أن يبدأ بـ 5" }),
  email: z.string().trim().email({ message: "البريد الإلكتروني غير صحيح" }),
  accountType: z.enum(["provider", "customer"], {
    message: "نوع الحساب مطلوب",
  }),
});
export type RegisterFormData = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: "auth.forgotPassword.errors.required" })
    .email({ message: "auth.forgotPassword.errors.invalidEmail" }),
});
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, { message: "auth.resetPassword.errors.tooShort" })
      .refine((pw) => passwordStrengthScore(pw) >= 2, {
        message: "auth.resetPassword.errors.weak",
      }),
    confirmPassword: z.string().min(1, { message: "auth.resetPassword.errors.confirmRequired" }),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "auth.resetPassword.errors.mismatch",
    path: ["confirmPassword"],
  });
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
