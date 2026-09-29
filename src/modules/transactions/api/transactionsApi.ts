import { z } from "zod";
import type { AxiosRequestConfig } from "axios";
import { apiClient } from "@shared/lib/axios";
import { AppError, type PaginatedResponse } from "@shared/types/api";
import type {
  Transaction,
  TransactionsListParams,
  CreateTransactionRequest,
  UpdateTransactionRequest,
} from "../types";

const idSchema = z.number().int().positive().safe();
const transactionSchema = z.object({
  id: idSchema,
  dealerId: idSchema,
  dealerName: z.string().nullable(),
  balance: z.number(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});
const envelopeSchema = z.object({
  success: z.boolean(),
  message: z.string().nullable(),
  data: z.unknown(),
  errors: z.array(z.string()).nullable(),
});
const pageSchema = z.object({
  items: z.array(transactionSchema).nullable(),
  pageNumber: z.number().int().positive(),
  pageSize: z.number().int().min(1).max(100),
  totalCount: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});
function contractError() {
  return new AppError("Invalid transaction response", "TRANSACTION_CONTRACT");
}
function unwrap(raw: unknown): unknown {
  const result = envelopeSchema.safeParse(raw);
  if (!result.success) throw contractError();
  if (!result.data.success)
    throw new AppError(
      result.data.message ?? "",
      "TRANSACTION_REJECTED",
      undefined,
      undefined,
      result.data.errors ?? undefined,
    );
  return result.data.data;
}
function entity(raw: unknown): Transaction {
  const result = transactionSchema.safeParse(unwrap(raw));
  if (!result.success) throw contractError();
  return result.data;
}
const path = (id: number) => `/transaction/${idSchema.parse(id)}`;
// The shared interceptor otherwise replays requests after token refresh.
// Financial writes must never be replayed automatically, including on 401.
const writeConfig: AxiosRequestConfig & { _retry: boolean } = { _retry: true };
async function page(params: TransactionsListParams): Promise<PaginatedResponse<Transaction>> {
  const query = z
    .object({ page: z.number().int().positive(), pageSize: z.number().int().min(1).max(100) })
    .parse(params);
  const { data } = await apiClient.get<unknown>("/transaction", {
    params: { PageNumber: query.page, PageSize: query.pageSize },
  });
  const result = pageSchema.safeParse(unwrap(data));
  if (!result.success || (result.data.items === null && result.data.totalCount !== 0))
    throw contractError();
  return {
    items: result.data.items ?? [],
    page: result.data.pageNumber,
    pageSize: result.data.pageSize,
    total: result.data.totalCount,
    totalPages: result.data.totalPages,
  };
}
export const transactionsApi = {
  async list(params: TransactionsListParams) {
    const result = await page(params);
    const last = Math.max(1, result.totalPages);
    return result.page > last ? page({ ...params, page: last }) : result;
  },
  async detail(id: number) {
    return entity((await apiClient.get<unknown>(path(id))).data);
  },
  async byDealer(dealerId: number): Promise<Transaction | null> {
    const response = await apiClient.get<unknown>(
      `/transaction/dealer/${idSchema.parse(dealerId)}`,
      {
        validateStatus: (status) => (status >= 200 && status < 300) || status === 404,
      },
    );
    if (response.status === 404) {
      // Only the API's JSON not-found envelope establishes absence; not a proxy HTML 404.
      const result = envelopeSchema.safeParse(response.data);
      if (result.success && !result.data.success && result.data.data === null) return null;
      throw contractError();
    }
    const result = entity(response.data);
    if (result.dealerId !== dealerId) throw contractError();
    return result;
  },
  async create(input: CreateTransactionRequest): Promise<void> {
    const { data } = await apiClient.post<unknown>(
      "/transaction",
      { dealerId: idSchema.parse(input.dealerId), balance: z.number().parse(input.balance) },
      writeConfig,
    );
    unwrap(data);
  },
  async update(id: number, input: UpdateTransactionRequest): Promise<void> {
    const { data } = await apiClient.put<unknown>(
      path(id),
      { balance: z.number().parse(input.balance), isActive: z.boolean().parse(input.isActive) },
      writeConfig,
    );
    unwrap(data);
  },
  async remove(id: number): Promise<void> {
    const { data } = await apiClient.delete<unknown>(path(id), writeConfig);
    unwrap(data); // DELETE's documented Task-shaped data is not an entity.
  },
};
