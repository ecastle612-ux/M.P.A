/**
 * Normalize API error payloads for UI display.
 * `apiError` returns `{ error: string, code: string }`; some older handlers nest `{ error: { message } }`.
 */
export function readApiError(payload: unknown, fallback = "Something went wrong. Please try again."): string {
  if (!payload || typeof payload !== "object") return fallback;
  const value = payload as Record<string, unknown>;
  if (typeof value["error"] === "string" && value["error"].trim()) {
    return humanizeErrorMessage(value["error"]);
  }
  const nested = value["error"];
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    const message = (nested as Record<string, unknown>)["message"];
    if (typeof message === "string" && message.trim()) {
      return humanizeErrorMessage(message);
    }
  }
  if (typeof value["message"] === "string" && value["message"].trim()) {
    return humanizeErrorMessage(value["message"]);
  }
  return fallback;
}

export function humanizeErrorMessage(message: string): string {
  const trimmed = message.trim();
  const lower = trimmed.toLowerCase();

  if (!trimmed || lower === "[object object]" || lower === "undefined" || lower === "null") {
    return "Something went wrong. Please try again.";
  }
  if (lower.includes("jwt") || lower.includes("unauthenticated") || lower.includes("not authenticated")) {
    return "Your session expired. Please sign in again.";
  }
  if (lower.includes("forbidden") || lower.includes("permission") || lower.includes("not authorized")) {
    return "You don’t have permission to do that. Ask an administrator if you need access.";
  }
  if (lower.includes("duplicate") || lower.includes("unique constraint") || lower.includes("already exists") || lower.includes("23505")) {
    return "That record already exists. Check for a duplicate and try again.";
  }
  if (lower.includes("foreign key") || lower.includes("violates") || lower.includes("23503")) {
    return "This change couldn’t be saved because related records are missing or locked.";
  }
  if (lower.includes("network") || lower.includes("failed to fetch") || lower.includes("timeout") || lower.includes("econnreset")) {
    return "We couldn’t reach the server. Check your connection and try again.";
  }
  if (lower.includes("row-level security") || lower.includes("rls") || lower.includes("42501")) {
    return "You don’t have access to this record in the current organization.";
  }
  if (lower.includes("invalid_json") || lower.includes("malformed json") || lower.includes("unexpected token")) {
    return "The request couldn’t be read. Refresh the page and try again.";
  }
  if (lower.includes("stripe") && (lower.includes("card") || lower.includes("payment"))) {
    return "The payment couldn’t be completed. Check the payment method and try again.";
  }
  if (lower.includes("onesignal") || lower.includes("notification provider")) {
    return "We couldn’t send that notification. Retry in a moment or check notification settings.";
  }
  if (lower.includes("checkr") || lower.includes("screening")) {
    return "The screening request couldn’t be completed. Retry or review applicant details.";
  }
  if (lower.includes("dropbox") || lower.includes("hellosign") || lower.includes("signature")) {
    return "The signature request couldn’t be completed. Retry or check signer email addresses.";
  }
  if (lower.includes("storage") || lower.includes("bucket") || lower.includes("signed url")) {
    return "The file couldn’t be uploaded or opened. Retry the upload.";
  }
  if (lower.includes("hydration") || lower.includes("text content does not match")) {
    return "This page didn’t finish loading cleanly. Refresh once to continue.";
  }
  if (lower.includes("internal_error") || lower.includes("unexpected error") || lower.includes("internal server")) {
    return "Something went wrong on our side. Please retry. If it keeps happening, contact support.";
  }
  // Strip Postgres / stack-ish prefixes when they leak through
  if (lower.includes("at object.") || lower.includes("\n    at ") || lower.includes("stack:")) {
    return "Something went wrong on our side. Please retry. If it keeps happening, contact support.";
  }
  return trimmed
    .replace(/^error:\s*/i, "")
    .replace(/^postgres(?:ql)?:\s*/i, "")
    .replace(/\s+/g, " ");
}
