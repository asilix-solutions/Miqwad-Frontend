/**
 * @file serviceEntity.schema.ts
 * @description Zod schema for the Service self-join tree entity's
 * create/edit form (name + parentServiceId). Kept in its own file/export
 * name (`serviceEntitySchema`, not `serviceSchema`) to avoid colliding with
 * the unrelated legacy `serviceSchema` in
 * `src/modules/admin/schemas/admin.schemas.ts` (category-scoped priced
 * `Service`, distinct entity — see `service.types.ts` for the same
 * naming-collision note).
 */
import { z } from "zod";

export const serviceEntitySchema = z.object({
  name: z.string().min(1, { message: "common.requiredField" }).max(150),
  parentServiceId: z.number().nullable(),
});

export type ServiceEntityFormValues = z.infer<typeof serviceEntitySchema>;
