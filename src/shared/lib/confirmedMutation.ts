import type { AxiosRequestConfig } from "axios";
import { AppError } from "@shared/types/api";

/** Opt-in for destructive operations whose result must never be replayed by auth refresh. */
export const noMutationReplay: AxiosRequestConfig & { _retry: boolean } = { _retry: true };

export function confirmMutation(response: { status: number; data: unknown }): void {
  const data = response.data;
  const envelope = data !== null && typeof data === "object" && "success" in data ? data : null;
  if (envelope?.success === false) throw new AppError("Operation rejected", "OP_REJECTED");
  if (response.status === 200 && envelope?.success === true) return;
  if (response.status === 204 && (data == null || data === "")) return;
  throw new AppError("Operation acknowledgment unavailable", "OP_UNCERTAIN");
}
