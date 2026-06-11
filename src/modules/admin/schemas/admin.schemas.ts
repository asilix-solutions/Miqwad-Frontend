import { z } from "zod";

/** Schema used by the admin reject dialog. */
export const rejectProviderSchema = z.object({
  reason: z
    .string()
    .min(3, { message: "common.requiredField" })
    .max(500),
});

export type RejectProviderFormValues = z.infer<typeof rejectProviderSchema>;

/** Schema used by the admin suspend user dialog. */
export const suspendUserSchema = z.object({
  reason: z
    .string()
    .min(3, { message: "common.requiredField" })
    .max(500),
});

export type SuspendUserFormValues = z.infer<typeof suspendUserSchema>;

/** Schema used by the admin reject settlement dialog. */
export const rejectSettlementSchema = z.object({
  reason: z
    .string()
    .min(3, { message: "common.requiredField" })
    .max(500),
});

export type RejectSettlementFormValues = z.infer<typeof rejectSettlementSchema>;

