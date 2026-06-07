import { z } from "zod";

/**
 * Schemas for the discovery module forms (filters, etc).
 *
 * Most filter state lives in Redux + URL search params; the schema here
 * is the source of truth for runtime parsing of the URL (so the page
 * is shareable) and for any future "advanced filter" form.
 */

const priceBandSchema = z.enum(["lte_100", "100_300", "300_700", "gt_700"]);

export const nearbyFiltersSchema = z.object({
  /** Search origin. */
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  /** Radius in km — clamp 1..200 to keep the bounding box reasonable. */
  radiusKm: z.number().min(1).max(200).default(10),
  categoryId: z.number().int().positive().nullable(),
  minRating: z.union([z.literal(0), z.literal(3), z.literal(4), z.literal(4.5)]).default(0),
  priceBand: priceBandSchema.nullable().default(null),
  openNowOnly: z.boolean().default(false),
  q: z.string().max(80).default(""),
});

export type NearbyFiltersValues = z.infer<typeof nearbyFiltersSchema>;
