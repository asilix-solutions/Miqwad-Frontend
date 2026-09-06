/**
 * @file subscriptionPlan.schema.ts
 * @description Zod schema for the admin Subscription Plan create/edit form.
 * Matches the real backend write DTO exactly:
 *   { name (req, 1-150), description? (<=1000, nullable), price? (>=0),
 *     billingCycle (req, int enum [1,2]) }
 *
 * Validation messages are i18n keys (resolved bilingually via i18next by the
 * form) — never hardcoded copy. Stage 2 builds the form that consumes this.
 */
import { z } from "zod";
import { BILLING_CYCLE } from "../types";

export const subscriptionPlanSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "common.requiredField")
    .max(150, "common.maxLengthExceeded"),
  description: z
    .string()
    .trim()
    .max(1000, "common.maxLengthExceeded")
    .nullish(),
  price: z
    .number("common.requiredField")
    .min(0, "common.mustBeZeroOrMore")
    .optional(),
  billingCycle: z
    .number("common.requiredField")
    .refine(
      (v) => v === BILLING_CYCLE.monthly || v === BILLING_CYCLE.yearly,
      "common.invalidSelection",
    ),
});

export type SubscriptionPlanFormValues = z.infer<typeof subscriptionPlanSchema>;
