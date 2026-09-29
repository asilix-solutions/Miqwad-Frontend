import { adminApi } from "@modules/admin/api/adminApi";
import { AppError } from "@shared/types/api";
import { transactionsApi } from "../api/transactionsApi";
import type { CreateTransactionRequest, Transaction } from "../types";

export class ExistingDealerBalanceError extends Error {
  readonly record: Transaction;
  constructor(record: Transaction) {
    super("Dealer balance already exists");
    this.record = record;
  }
}
/** V1 policy, not a backend uniqueness guarantee. Always preflight uncached. */
export async function createDealerBalance(input: CreateTransactionRequest) {
  const user = await adminApi.getUser(String(input.dealerId));
  // Existing Users adapter maps wire roleId onto role and normalizes id to string.
  if (user.role !== 2 || Number(user.id) !== input.dealerId)
    throw new AppError("", "TRANSACTION_DEALER");
  const existing = await transactionsApi.byDealer(input.dealerId);
  if (existing) throw new ExistingDealerBalanceError(existing);
  await transactionsApi.create(input);
}
