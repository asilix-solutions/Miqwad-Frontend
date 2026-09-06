/**
 * @file computeLinePreview.ts
 *
 * Pure helper for one offer discount line's live preview. Isolated so the
 * dialog's "original → discounted" preview and its pre-submit validity gate
 * share exactly one rule.
 *
 * `isInvalid` mirrors the backend's constraints so bad input is flagged (and
 * blocked) client-side BEFORE submit:
 *   - `discountAmount` must be `> 0` (backend 400s on `0` / negative)
 *   - `discountAmount` must not exceed the service price (would yield a
 *     negative final price)
 * A non-finite amount (empty / NaN field) is treated as invalid.
 */

/** Result of {@link computeLinePreview}. */
export interface LinePreview {
  /** `servicePrice - discountAmount`, floored at 0. */
  discountedPrice: number;
  /** True when the discount is `<= 0`, exceeds the price, or is not a number. */
  isInvalid: boolean;
}

export function computeLinePreview(servicePrice: number, discountAmount: number): LinePreview {
  const amount = Number.isFinite(discountAmount) ? discountAmount : 0;
  const isInvalid =
    !Number.isFinite(discountAmount) || amount <= 0 || amount > servicePrice;
  return {
    discountedPrice: Math.max(servicePrice - amount, 0),
    isInvalid,
  };
}
