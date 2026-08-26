/**
 * @file currentUser.ts
 *
 * Bridges the auth user id (string) to the chat module's numeric id space
 * (ChatMessage.senderId/receiverId are number). Isolated here so the
 * coercion has exactly one place to change.
 */

/**
 * Resolves the current user's chat id as a number, or null if unavailable
 * or non-numeric.
 *
 * // TODO: wire to backend — confirm id type (numeric vs GUID). If GUID,
 * // chat ids must become string end-to-end and this helper + ChatMessage
 * // types change together.
 */
export function resolveCurrentUserId(rawId: string | number | undefined | null): number | null {
  if (rawId === undefined || rawId === null || rawId === "") return null;
  const resolved = Number(rawId);
  return Number.isNaN(resolved) ? null : resolved;
}
