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

/** Schema used by the admin resolve dispute dialog. */
export const resolveDisputeSchema = z.object({
  decision: z.enum(["release_to_provider", "refund_to_customer", "partial_refund"], {
    error: "common.requiredField",
  }),
  note: z
    .string()
    .min(3, { message: "common.requiredField" })
    .max(500),
  partialAmount: z.number().optional(),
}).superRefine((data, ctx) => {
  if (data.decision === "partial_refund") {
    if (data.partialAmount === undefined || data.partialAmount <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "common.requiredField",
        path: ["partialAmount"],
      });
    }
  }
});

export type ResolveDisputeFormValues = z.infer<typeof resolveDisputeSchema>;

/** Schema used by the admin category create/edit dialog. */
export const categorySchema = z.object({
  nameAr: z
    .string()
    .min(2, { message: "common.requiredField" })
    .max(100),
  nameEn: z
    .string()
    .min(2, { message: "common.requiredField" })
    .max(100),
  iconUrl: z.string().url({ message: "common.invalidUrl" }).optional().or(z.literal("")),
  colorHint: z.enum(["blue", "green", "orange", "purple", "red", "navy"]).optional(),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;
