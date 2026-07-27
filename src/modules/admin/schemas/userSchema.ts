/**
 * @file userSchema.ts
 * @description Zod discriminated union for the admin "Add User" dialog.
 * The `type` field is the single source of truth for both the type-first
 * stepper (AddUserDialog) and field validation. Per the SRS, "specialty"
 * means something different per provider subtype, so each provider variant
 * diverges from a shared base rather than sharing one field set:
 *   - workshop: service categoryIds (via CategoryMultiSelectTree, providerType
 *               "workshop") + free-text specialization + workingHours.
 *   - dealer:   product categoryIds (via CategoryMultiSelectTree, providerType
 *               "dealer") — a real closed taxonomy exists, no free text.
 *   - scrapyard: BOTH categoryIds (part categories, providerType "scrap") AND
 *               brandSpecialization (vehicle makes the yard deals in, over the
 *               existing ScrapVehicleBrand enum) — orthogonal concerns.
 */

import { z } from "zod";
import { SCRAP_VEHICLE_BRANDS } from "@modules/scrap/schemas/scrap.schemas";

// Saudi mobile numbers: starts with 5, then 8 digits.
const saudiMobile = /^5\d{8}$/;

const clientSchema = z.object({
  type: z.literal("client"),
  name: z
    .string()
    .trim()
    .min(2, { message: "superAdmin.users.form.errors.nameRequired" })
    .max(100),
  phoneNumber: z
    .string()
    .trim()
    .regex(saudiMobile, { message: "superAdmin.users.form.errors.phoneInvalid" }),
  email: z
    .string()
    .trim()
    .email({ message: "superAdmin.users.form.errors.emailInvalid" })
    .optional()
    .or(z.literal("")),
});

/**
 * Shared field set for provider subtypes, mirroring the core of
 * RegisterProviderRequest (providers/types.ts). lat/lng and documents are
 * intentionally out of scope this round.
 * TODO: wire to backend — KYC docs (documents field on RegisterProviderRequest).
 */
const providerBaseFields = {
  companyName: z
    .string()
    .trim()
    .min(2, { message: "superAdmin.users.form.errors.companyNameRequired" })
    .max(150),
  email: z
    .string()
    .trim()
    .email({ message: "superAdmin.users.form.errors.emailInvalid" }),
  phoneNumber: z
    .string()
    .trim()
    .regex(saudiMobile, { message: "superAdmin.users.form.errors.phoneInvalid" }),
  password: z
    .string()
    .min(6, { message: "superAdmin.users.form.errors.passwordMin" }),
  city: z.string().trim().optional().or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),
};

const workshopSchema = z.object({
  type: z.literal("workshop"),
  ...providerBaseFields,
  categoryIds: z.array(z.number()).optional(),
  specialization: z.string().trim().max(200).optional().or(z.literal("")),
  workingHours: z.string().trim().optional().or(z.literal("")),
});

const dealerSchema = z.object({
  type: z.literal("dealer"),
  ...providerBaseFields,
  categoryIds: z.array(z.number()).optional(),
});

const scrapyardSchema = z.object({
  type: z.literal("scrapyard"),
  ...providerBaseFields,
  categoryIds: z.array(z.number()).optional(),
  brandSpecialization: z.array(z.enum(SCRAP_VEHICLE_BRANDS)).optional(),
});

export const userSchema = z.discriminatedUnion("type", [
  clientSchema,
  workshopSchema,
  dealerSchema,
  scrapyardSchema,
]);

export type UserFormValues = z.infer<typeof userSchema>;
export type UserType = UserFormValues["type"];
