/** Presentation-only — does not change claim-password API contracts. */
export const COMMERCE_CLAIM_CHECK_EMAIL_COPY =
  "Check your email to finish setting up your M.P.A. account.";

export function friendlyCommerceClaimError(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("email_mismatch") || (lower.includes("email") && lower.includes("mismatch"))) {
    return "Use the same email address from your Stripe purchase receipt, then try again.";
  }
  if (lower.includes("expired") || lower.includes("invalid") || lower.includes("used")) {
    return "This claim link is no longer valid. Open your purchase email again, or recover access from Sign in.";
  }
  if (lower.includes("bind_token_required") || lower.includes("bind_token")) {
    return COMMERCE_CLAIM_CHECK_EMAIL_COPY;
  }
  if (lower.includes("password") && (lower.includes("weak") || lower.includes("short") || lower.includes("least"))) {
    return "Choose a stronger password (at least 8 characters), then try again.";
  }
  if (lower.includes("already") && (lower.includes("claim") || lower.includes("bound"))) {
    return "This workspace may already be claimed. Sign in with your purchase email and password.";
  }
  if (lower.includes("session") && (lower.includes("not found") || lower.includes("missing"))) {
    return "We could not find this purchase session. Open the link from your confirmation email.";
  }
  return raw;
}
