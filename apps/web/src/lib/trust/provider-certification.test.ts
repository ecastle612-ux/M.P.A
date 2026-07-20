import { describe, expect, it } from "vitest";
import { runProviderCertification } from "./provider-certification";

describe("PT-001 provider certification", () => {
  it("returns every required provider with checks", async () => {
    const report = await runProviderCertification();
    const names = report.map((p) => p.provider);
    expect(names).toEqual(
      expect.arrayContaining([
        "OneSignal",
        "Stripe",
        "Dropbox Sign",
        "Checkr",
        "Resend",
        "Twilio",
        "Google Maps",
        "Supabase Storage",
        "Supabase Auth"
      ])
    );
    for (const provider of report) {
      expect(provider.checks.length).toBeGreaterThan(0);
      expect(["pass", "warn", "fail", "skipped", "not_in_path"]).toContain(provider.overall);
    }
    const resend = report.find((p) => p.provider === "Resend");
    const twilio = report.find((p) => p.provider === "Twilio");
    // Delivery adapters are out of path; overall is skipped (disabled) or warn (credentials-only).
    expect(["skipped", "warn", "not_in_path"]).toContain(resend?.overall);
    expect(["skipped", "warn", "not_in_path"]).toContain(twilio?.overall);
    expect(resend?.checks.some((c) => c.check === "successful_request" && c.status === "not_in_path")).toBe(
      true
    );
    expect(twilio?.checks.some((c) => c.check === "successful_request" && c.status === "not_in_path")).toBe(
      true
    );
  });
});
