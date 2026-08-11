const SECRET_KEY =
  /(password|passwd|secret|token|api[_-]?key|authorization|cookie|set-cookie|stripe[_-]?(secret|key)|service[_-]?role|private[_-]?key|card|cvv|cvc|pan|ssn| Maglink|bind[_-]?token)/i;

const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const BEARER_RE = /\bBearer\s+[A-Za-z0-9._-]+\b/gi;
const LONG_KEY_RE = /\b(?:sk|pk|rk|whsec)_[A-Za-z0-9_]{12,}\b/g;

export function scrubString(value: string): string {
  return value
    .replace(EMAIL_RE, "[redacted-email]")
    .replace(BEARER_RE, "Bearer [redacted]")
    .replace(LONG_KEY_RE, "[redacted-key]");
}

export function scrubUnknown(value: unknown, depth = 0): unknown {
  if (depth > 4) {
    return "[truncated]";
  }
  if (value == null) {
    return value;
  }
  if (typeof value === "string") {
    return scrubString(value);
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => scrubUnknown(item, depth + 1));
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (SECRET_KEY.test(key)) {
        out[key] = "[redacted]";
        continue;
      }
      out[key] = scrubUnknown(nested, depth + 1);
    }
    return out;
  }
  return String(value);
}

export function scrubMetadata(
  metadata: Record<string, string | number | boolean | null | undefined> = {}
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (value == null) continue;
    if (SECRET_KEY.test(key)) {
      out[key] = "[redacted]";
      continue;
    }
    const scrubbed = scrubUnknown(value);
    out[key] = typeof scrubbed === "string" ? scrubbed : JSON.stringify(scrubbed);
  }
  return out;
}
