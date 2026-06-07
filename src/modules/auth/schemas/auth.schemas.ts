import { z } from "zod";

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
