/**
 * @file roadsSchema.ts
 * @description Zod validation schemas for InterCity Route creation and update.
 */

import { z } from "zod";
import { normalizeArabicNumerals } from "@modules/tow-truck/lib/dispatchModel";

export function validateCostString(val: string): number | null {
  if (!val || typeof val !== "string") return null;
  const normalized = normalizeArabicNumerals(val.trim());
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) return null;
  const num = Number(normalized);
  if (!Number.isFinite(num) || num < 0.01 || num > Number.MAX_SAFE_INTEGER) return null;
  return num;
}

export const createRoadSchema = z
  .object({
    originCityId: z
      .string()
      .min(1, "originCityRequired")
      .refine((v) => /^[1-9]\d*$/.test(v) && Number.isSafeInteger(Number(v)), "originCityInvalid"),
    destinationCityId: z
      .string()
      .min(1, "destinationCityRequired")
      .refine((v) => /^[1-9]\d*$/.test(v) && Number.isSafeInteger(Number(v)), "destinationCityInvalid"),
    cost: z
      .string()
      .trim()
      .min(1, "costRequired")
      .refine((val) => validateCostString(val) !== null, "costMinimum"),
  })
  .refine((data) => data.originCityId !== data.destinationCityId, {
    message: "sameCitiesError",
    path: ["destinationCityId"],
  });

export type CreateRoadFormValues = z.infer<typeof createRoadSchema>;

export const updateRoadSchema = z.object({
  cost: z
    .string()
    .trim()
    .min(1, "costRequired")
    .refine((val) => validateCostString(val) !== null, "costMinimum"),
  isActive: z.boolean(),
});

export type UpdateRoadFormValues = z.infer<typeof updateRoadSchema>;
