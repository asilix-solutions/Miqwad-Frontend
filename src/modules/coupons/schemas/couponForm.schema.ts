import { z } from "zod";

const date = z
  .string()
  .min(1, "common.requiredField")
  .refine(
    (value) =>
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) && Number.isFinite(new Date(value).getTime()),
    "coupons.validation.date",
  );
const number = z.number("coupons.validation.number");
const rules = {
  discountPercentage: number
    .min(1, "coupons.validation.discount")
    .max(100, "coupons.validation.discount"),
  minimumOrderAmount: number.min(0.01, "coupons.validation.minimum").nullable(),
  usageLimit: number
    .int("coupons.validation.usage")
    .min(1, "coupons.validation.usage")
    .max(2147483647, "coupons.validation.usage")
    .nullable(),
  startDate: date,
  endDate: z.union([date, z.literal("")]),
};
export const couponFormSchema = z.object({ code: z.string(), ...rules });
export const createCouponFormSchema = couponFormSchema.extend({
  code: z.string().trim().min(1, "common.requiredField").max(50, "coupons.validation.code"),
});
export type CouponFormValues = z.infer<typeof couponFormSchema>;
