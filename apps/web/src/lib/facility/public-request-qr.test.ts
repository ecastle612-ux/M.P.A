import { describe, expect, it } from "vitest";
import { assertSafePublicRequestUrl, buildPublicRequestQrSvg, publicRequestAbsoluteUrl } from "./public-request-qr";

describe("public request QR payload", () => {
  it("encodes only the public token URL", async () => {
    const url = publicRequestAbsoluteUrl("https://www.my-property-assistant.com", "safe_public_token_value_24", "qr");
    expect(url).toBe("https://www.my-property-assistant.com/request/safe_public_token_value_24?via=qr");
    expect(assertSafePublicRequestUrl(url).ok).toBe(true);
    const svg = await buildPublicRequestQrSvg(url);
    expect(svg).toContain("svg");
    expect(svg).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  });

  it("rejects internal identifiers in a QR payload", () => {
    expect(
      assertSafePublicRequestUrl(
        "https://www.my-property-assistant.com/request/abc?organization_id=11111111-1111-4111-8111-111111111111"
      ).ok
    ).toBe(false);
  });
});
