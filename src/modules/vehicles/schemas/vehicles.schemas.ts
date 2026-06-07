import { z } from "zod";

/**
 * Zod validation for the Vehicles module.
 * All error messages are i18n keys — components run them through `t()`.
 */

// Saudi vehicle plates: 1–3 Arabic/Latin letters + 1–4 digits.
// We accept both Latin and Arabic letters with optional dashes/spaces.
const plateRegex = /^[\u0621-\u064AA-Za-z]{1,3}[\s-]?\d{1,4}$/;

const currentYear = new Date().getFullYear();
const MIN_YEAR = 1980;
// Allow one year ahead for new models released near year-end.
const MAX_YEAR = currentYear + 1;

/** Shared shape used by Add + Edit. */
export const vehicleSchema = z.object({
  brandId: z
    .number({ message: "common.requiredField" })
    .int()
    .positive({ message: "common.requiredField" }),
  modelId: z
    .number({ message: "common.requiredField" })
    .int()
    .positive({ message: "common.requiredField" }),
  year: z
    .number({ message: "common.requiredField" })
    .int()
    .min(MIN_YEAR, { message: "vehicles.invalidYear" })
    .max(MAX_YEAR, { message: "vehicles.invalidYear" }),
  plateNumber: z
    .string()
    .trim()
    .min(2, { message: "vehicles.invalidPlate" })
    .regex(plateRegex, { message: "vehicles.invalidPlate" }),
  nickname: z.string().trim().max(40).optional().or(z.literal("")),
  color: z.string().trim().max(20).optional().or(z.literal("")),
  mileage: z
    .number()
    .int()
    .min(0, { message: "vehicles.invalidMileage" })
    .max(2_000_000)
    .optional(),
  vin: z
    .string()
    .trim()
    .length(17, { message: "vehicles.invalidVin" })
    .regex(/^[A-HJ-NPR-Z0-9]+$/i, { message: "vehicles.invalidVin" })
    .optional()
    .or(z.literal("")),
  registrationDate: z.string().trim().optional().or(z.literal("")),
  fuelType: z.enum(["gasoline", "diesel", "hybrid", "electric"]).optional(),
  imageUrl: z.string().trim().optional().or(z.literal("")),
});

export type VehicleFormValues = z.infer<typeof vehicleSchema>;

export const maintenanceRecordSchema = z.object({
  serviceName: z.string().trim().min(2, { message: "common.requiredField" }),
  providerName: z.string().trim().max(80).optional().or(z.literal("")),
  date: z.string().trim().min(1, { message: "common.requiredField" }),
  mileage: z.number().int().min(0).optional(),
  cost: z.number().min(0).optional(),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type MaintenanceRecordFormValues = z.infer<typeof maintenanceRecordSchema>;

export const YEAR_RANGE = { min: MIN_YEAR, max: MAX_YEAR };
