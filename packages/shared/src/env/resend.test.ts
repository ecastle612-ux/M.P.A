import { afterEach, describe, expect, it } from "vitest";
import {
  deriveVerifiedResendFrom,
  isResendDeliveryConfigured,
  isResendFromAddress,
  resolveResendSender
} from "./resend";

describe("Resend sender resolution", () => {
  const original = {
    key: process.env["RESEND_API_KEY"],
    from: process.env["RESEND_FROM_EMAIL"],
    appUrl: process.env["NEXT_PUBLIC_APP_URL"],
    vercel: process.env["VERCEL_ENV"],
    node: process.env.NODE_ENV
  };

  afterEach(() => {
    restore("RESEND_API_KEY", original.key);
    restore("RESEND_FROM_EMAIL", original.from);
    restore("NEXT_PUBLIC_APP_URL", original.appUrl);
    restore("VERCEL_ENV", original.vercel);
    if (original.node === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = original.node;
    }
  });

  it("accepts bare email and Name <email> from addresses", () => {
    expect(isResendFromAddress("noreply@my-property-assistant.com")).toBe(true);
    expect(isResendFromAddress("My Property Assistant <noreply@my-property-assistant.com>")).toBe(
      true
    );
    expect(isResendFromAddress('"My Property Assistant" <noreply@my-property-assistant.com>')).toBe(
      true
    );
    expect(isResendFromAddress("M.P.A. <onboarding@resend.dev>")).toBe(true);
    expect(isResendFromAddress("not-an-email")).toBe(false);
  });

  it("derives noreply@ from the production app host", () => {
    expect(deriveVerifiedResendFrom("https://www.my-property-assistant.com")).toBe(
      "My Property Assistant <noreply@my-property-assistant.com>"
    );
    expect(deriveVerifiedResendFrom("http://localhost:3000")).toBeNull();
  });

  it("fails closed when the API key is missing", () => {
    const result = resolveResendSender({
      RESEND_FROM_EMAIL: "noreply@my-property-assistant.com"
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("missing_api_key");
    }
  });

  it("uses Production EMAIL_FROM when RESEND_FROM_EMAIL is unset", () => {
    const result = resolveResendSender({
      RESEND_API_KEY: "re_test",
      EMAIL_FROM: "My Property Assistant <noreply@my-property-assistant.com>",
      VERCEL_ENV: "production"
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.from).toBe("My Property Assistant <noreply@my-property-assistant.com>");
      expect(result.fromSource).toBe("email_from");
    }
  });

  it("uses the verified-domain from in production when RESEND_FROM_EMAIL is unset", () => {
    const result = resolveResendSender({
      RESEND_API_KEY: "re_test",
      NEXT_PUBLIC_APP_URL: "https://www.my-property-assistant.com",
      VERCEL_ENV: "production"
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.from).toBe("My Property Assistant <noreply@my-property-assistant.com>");
      expect(result.fromSource).toBe("derived_app_url");
    }
    expect(
      isResendDeliveryConfigured({
        RESEND_API_KEY: "re_test",
        NEXT_PUBLIC_APP_URL: "https://www.my-property-assistant.com",
        VERCEL_ENV: "production"
      })
    ).toBe(true);
  });

  it("replaces onboarding@resend.dev in production with the derived verified from", () => {
    const result = resolveResendSender({
      RESEND_API_KEY: "re_test",
      RESEND_FROM_EMAIL: "M.P.A. <onboarding@resend.dev>",
      NEXT_PUBLIC_APP_URL: "https://www.my-property-assistant.com",
      VERCEL_ENV: "production"
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.from).not.toMatch(/resend\.dev/);
      expect(result.from).toMatch(/noreply@my-property-assistant\.com/);
    }
  });

  it("does not use the resend.dev fallback in production when no from can be derived", () => {
    const result = resolveResendSender(
      {
        RESEND_API_KEY: "re_test",
        VERCEL_ENV: "production"
      },
      { allowTestDomainFallback: true }
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("missing_from");
    }
  });

  it("allows the local test-domain fallback only when explicitly requested", () => {
    const blocked = resolveResendSender({
      RESEND_API_KEY: "re_test",
      NODE_ENV: "test"
    });
    expect(blocked.ok).toBe(false);

    const allowed = resolveResendSender(
      {
        RESEND_API_KEY: "re_test",
        NODE_ENV: "test"
      },
      { allowTestDomainFallback: true }
    );
    expect(allowed.ok).toBe(true);
    if (allowed.ok) {
      expect(allowed.fromSource).toBe("test_fallback");
      expect(isResendDeliveryConfigured({ RESEND_API_KEY: "re_test", NODE_ENV: "test" })).toBe(
        false
      );
    }
  });
});

function restore(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}
