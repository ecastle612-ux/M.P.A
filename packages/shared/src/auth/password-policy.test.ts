import { describe, expect, it } from "vitest";
import {
  MIN_PASSWORD_LENGTH,
  PASSWORD_TOO_SHORT_MESSAGE,
  meetsMinPasswordLength
} from "./password-policy";

describe("SEC-001 password contract", () => {
  it("requires 12 characters for new or reset passwords", () => {
    expect(MIN_PASSWORD_LENGTH).toBe(12);
    expect(meetsMinPasswordLength("password123")).toBe(false);
    expect(meetsMinPasswordLength("password1234")).toBe(true);
    expect(meetsMinPasswordLength("")).toBe(false);
    expect(meetsMinPasswordLength(null)).toBe(false);
    expect(PASSWORD_TOO_SHORT_MESSAGE).toContain("12");
    expect(PASSWORD_TOO_SHORT_MESSAGE).not.toContain("8");
  });
});
