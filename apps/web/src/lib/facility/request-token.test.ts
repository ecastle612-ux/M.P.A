import { describe, expect, it } from "vitest";
import { generateFacilityRequestToken, hashFacilityRequestToken, looksLikeHighEntropyToken } from "./request-token";

describe("facility request tokens", () => {
  it("generates high-entropy tokens and hashes them", () => {
    const token = generateFacilityRequestToken();
    expect(looksLikeHighEntropyToken(token)).toBe(true);
    expect(hashFacilityRequestToken(token)).toHaveLength(64);
    expect(hashFacilityRequestToken(token)).toBe(hashFacilityRequestToken(token));
    expect(hashFacilityRequestToken(token)).not.toBe(token);
  });

  it("rejects short or enumerable tokens", () => {
    expect(looksLikeHighEntropyToken("abc")).toBe(false);
    expect(looksLikeHighEntropyToken("11111111-1111-4111-8111-111111111111")).toBe(false);
  });
});
