import { describe, expect, it } from "vitest";
import { detectRecoveryFlow, parseRecoveryParams, stripRecoveryParamsFromUrl } from "./password-recovery";

describe("password recovery params", () => {
  it("parses recovery code from query parameters", () => {
    const params = parseRecoveryParams("?code=abc123&type=recovery", "");
    expect(params.code).toBe("abc123");
    expect(params.type).toBe("recovery");
    expect(detectRecoveryFlow(params)).toBe("code");
  });

  it("parses implicit access and refresh tokens from hash parameters", () => {
    const params = parseRecoveryParams("", "#access_token=at&refresh_token=rt&type=recovery");
    expect(params.accessToken).toBe("at");
    expect(params.refreshToken).toBe("rt");
    expect(detectRecoveryFlow(params)).toBe("session_tokens");
  });

  it("parses token_hash recovery links", () => {
    const params = parseRecoveryParams("?token_hash=hashed&type=recovery", "");
    expect(params.tokenHash).toBe("hashed");
    expect(detectRecoveryFlow(params)).toBe("token_hash");
  });

  it("strips recovery credentials and errors from url", () => {
    const cleaned = stripRecoveryParamsFromUrl(
      new URL(
        "https://example.com/reset-password?code=abc&type=recovery&error_description=bad&keep=1#access_token=at&refresh_token=rt"
      )
    );
    expect(cleaned).toBe("/reset-password?keep=1");
  });
});
