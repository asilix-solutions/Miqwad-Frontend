/**
 * @file carMake.schema.ts
 * Zod contract gate for car make/model reference data. Any drift in the
 * external source's shape fails loudly here instead of silently at render time.
 */
import { z } from "zod";

export const carMakeSchema = z.object({
  id: z.string(),
  nameEn: z.string(),
  nameAr: z.string(),
});

export const carModelSchema = z.object({
  id: z.string(),
  makeId: z.string(),
  nameEn: z.string(),
  nameAr: z.string(),
});

export const carMakesResponseSchema = z.object({ items: z.array(carMakeSchema) });
export const carModelsResponseSchema = z.object({ items: z.array(carModelSchema) });
