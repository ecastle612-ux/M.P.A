import { describe, expect, it } from "vitest";
import { bindTokenValid, hashBindToken, issueBindToken } from "./tokens";

describe("STAB-002 bind token crypto helpers", () => {
  it("validates issued token against hash", () => {
    const issued = issueBindToken();
    expect(
      bindTokenValid(
        { bindTokenHash: issued.hash, bindExpiresAt: issued.expiresAt },
        issued.token
      )
    ).toBe(true);
  });

  it("rejects wrong token with constant-time hash compare", () => {
    const issued = issueBindToken();
    expect(
      bindTokenValid(
        { bindTokenHash: issued.hash, bindExpiresAt: issued.expiresAt },
        "not-the-token"
      )
    ).toBe(false);
  });

  it("rejects when hash or expiry missing", () => {
    const issued = issueBindToken();
    expect(
      bindTokenValid({ bindTokenHash: null, bindExpiresAt: issued.expiresAt }, issued.token)
    ).toBe(false);
    expect(
      bindTokenValid({ bindTokenHash: issued.hash, bindExpiresAt: null }, issued.token)
    ).toBe(false);
  });

  it("stores only hashed form", () => {
    const issued = issueBindToken();
    expect(issued.hash).toBe(hashBindToken(issued.token));
    expect(issued.hash).not.toBe(issued.token);
  });
});
