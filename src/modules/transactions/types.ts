/** Backend transaction records represent final dealer balances, not money movements. */
export interface Transaction {
  id: number;
  dealerId: number;
  dealerName: string | null;
  balance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}
export interface TransactionsListParams {
  page: number;
  pageSize: number;
}
export interface CreateTransactionRequest {
  dealerId: number;
  balance: number;
}
export interface UpdateTransactionRequest {
  balance: number;
  isActive: boolean;
}
