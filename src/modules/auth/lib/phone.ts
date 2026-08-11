/**
 * Phone-number transforms between the app's local-number form (what the
 * user types, validated by `saudiMobile` in auth.schemas.ts) and the
 * backend's expected `00966` + 9-digit form. Applied only at the
 * payload-assembly boundary — form state and validation stay local.
 */

const ARABIC_INDIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

function normalizeDigits(value: string): string {
  return value.replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC_DIGITS.indexOf(d)));
}

/**
 * Converts a local Saudi mobile number (`5XXXXXXXX`) to the backend's
 * expected `00966XXXXXXXXX` shape. Idempotent: a value already prefixed
 * with `00966` is returned unchanged.
 */
export function toBackendPhone(local: string): string {
  const digits = normalizeDigits(local).replace(/\s+/g, "");
  if (digits.startsWith("00966")) return digits;
  if (!/^5\d{8}$/.test(digits)) {
    throw new Error(`Invalid Saudi mobile number: ${local}`);
  }
  return `00966${digits}`;
}

/**
 * Converts a backend phone number (`00966XXXXXXXXX`, `966XXXXXXXXX`, or
 * `+966XXXXXXXXX`) back to the local 9-digit form for display.
 */
export function toLocalPhone(backend: string): string {
  const digits = normalizeDigits(backend).replace(/\s+/g, "");
  return digits.replace(/^(\+?966|00966)/, "");
}
