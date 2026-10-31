/**
 * @file citySchema.ts
 * @description Zod schema for City creation validated against live backend CreateCityDto.
 * Fields:
 * - name: string (1-150 chars, required)
 * - countryCode: string (1-10 chars, required, defaults to "SA")
 * - googlePlaceId: string (1-255 chars, required)
 * - latitude: number (-90 to 90, required)
 * - longitude: number (-180 to 180, required)
 */

import { z } from "zod";

const optionalCoordinateField = (min: number, max: number, key: "latitude" | "longitude") =>
  z
    .union([z.number(), z.string(), z.null(), z.undefined()])
    .optional()
    .transform((val) => {
      if (val === undefined || val === null) return undefined;
      if (typeof val === "string") {
        const trimmed = val.trim();
        if (trimmed === "") return undefined;
        return Number(trimmed);
      }
      return val;
    })
    .refine((val) => val === undefined || (!isNaN(val) && isFinite(val)), {
      message: `superAdmin.cities.validation.${key}Invalid`,
    })
    .refine((val) => val === undefined || (val >= min && val <= max), {
      message: `superAdmin.cities.validation.${key}Range`,
    });

export const createCitySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "superAdmin.cities.validation.nameRequired" })
    .max(150, { message: "superAdmin.cities.validation.nameMax" }),
  countryCode: z
    .string()
    .trim()
    .min(1, { message: "superAdmin.cities.validation.countryCodeRequired" })
    .max(10, { message: "superAdmin.cities.validation.countryCodeMax" }),
  googlePlaceId: z
    .string()
    .trim()
    .min(1, { message: "superAdmin.cities.validation.googlePlaceIdRequired" })
    .max(255, { message: "superAdmin.cities.validation.googlePlaceIdMax" }),
  latitude: optionalCoordinateField(-90, 90, "latitude"),
  longitude: optionalCoordinateField(-180, 180, "longitude"),
});

export type CreateCityFormValues = z.input<typeof createCitySchema>;
export type CreateCityParsedValues = z.output<typeof createCitySchema>;
