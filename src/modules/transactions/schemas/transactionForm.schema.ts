import { z } from "zod";
// Swagger double has no minimum constraint. Preserve negative and fractional final balances.
export const transactionFormSchema = z.object({
  balance: z.number({ error: "transactions.validation.balance" }),
  isActive: z.boolean(),
});
export type TransactionFormValues = z.infer<typeof transactionFormSchema>;
