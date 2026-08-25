import { describe, expect, it } from "vitest";
import {
  COMMERCE_CLAIM_CHECK_EMAIL_COPY,
  friendlyCommerceClaimError
} from "./commerce-claim-copy";

describe("P1-04 SaaS claim copy", () => {
  it("does not present raw bind_token_required to the customer", () => {
    expect(friendlyCommerceClaimError("bind_token_required")).toBe(COMMERCE_CLAIM_CHECK_EMAIL_COPY);
    expect(friendlyCommerceClaimError("bind_token_required")).not.toMatch(/bind_token_required/);
  });

  it("preserves expiry guidance for invalid or expired bind tokens", () => {
    expect(friendlyCommerceClaimError("invalid_or_expired_bind_token")).toMatch(
      /no longer valid/i
    );
    expect(friendlyCommerceClaimError("invalid_or_expired_bind_token")).not.toMatch(
      /bind_token/
    );
  });

  it("keeps email-mismatch guidance", () => {
    expect(friendlyCommerceClaimError("email_mismatch")).toMatch(/same email/i);
  });

  it("describes the 12-character password contract", () => {
    expect(friendlyCommerceClaimError("password_too_short")).toMatch(/12/);
    expect(friendlyCommerceClaimError("password_too_short")).not.toMatch(/8 characters/);
  });
});
