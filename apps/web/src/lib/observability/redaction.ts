const EMAIL_PATTERN = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const LONG_NUMBER_PATTERN = /\b\d{13,19}\b/g; // card / account-like sequences
const PHONE_PATTERN = /\+?\d[\d\s().-]{7,}\d/g;

/**
 * Best-effort scrub of common PII (email, payment/account numbers, phone) from a string.
 * Order matters: emails and long numbers are removed before the looser phone pattern.
 */
export function redactString(value: string): string {
  return value
    .replace(EMAIL_PATTERN, "[redacted-email]")
    .replace(LONG_NUMBER_PATTERN, "[redacted-number]")
    .replace(PHONE_PATTERN, "[redacted-phone]");
}

/**
 * Redact string values in a context bag while leaving non-string values untouched.
 * Drops `undefined` entries so records stay clean under exactOptionalPropertyTypes.
 */
export function redactContext(
  context: Record<string, string | number | boolean | null | undefined>,
): Record<string, string | number | boolean | null> {
  const result: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(context)) {
    if (value === undefined) continue;
    result[key] = typeof value === "string" ? redactString(value) : value;
  }
  return result;
}
