import { describe, expect, it, vi } from "vitest";

vi.mock("../env/server-env", () => ({
  serverEnv: {
    NEXT_PUBLIC_APP_URL: "https://www.my-property-assistant.com"
  }
}));

import { TESTER_FEEDBACK_REPLY_TO } from "@mpa/shared";
import { resolveEmailLogoUrl } from "@mpa/email";
import { renderComplimentaryExpiryEmail, renderComplimentaryWelcomeEmail } from "./emails";

describe("docs/185 complimentary email copy", () => {
  it("renders branded tester welcome with product headline and shell", () => {
    const rendered = renderComplimentaryWelcomeEmail({
      grant: {
        grantType: "tester",
        productSku: "mpa_facility_operations",
        expiresAt: "2026-09-01T00:00:00.000Z",
        recipientEmail: "tester@example.com"
      },
      claimToken: "tok_test"
    });
    expect(TESTER_FEEDBACK_REPLY_TO).toBe("feedback@my-property-assistant.com");
    expect(rendered.replyTo).toBe("feedback@my-property-assistant.com");
    expect(rendered.subject).toBe("Your Complimentary Facility Operations Access");
    expect(rendered.html).toContain("Your Complimentary Facility Operations Access");
    expect(rendered.html).toContain("Expires on September 1, 2026.");
    expect(rendered.html).toContain("Set Up Your Account");
    expect(rendered.html).toContain("complimentary/claim?token=tok_test");
    expect(rendered.html).toContain(resolveEmailLogoUrl("https://www.my-property-assistant.com"));
    expect(rendered.html).toContain("/branding/logo-email-lockup.png");
    expect(rendered.html).toContain('class="mpa-logo-plate"');
    expect(rendered.html).toContain('bgcolor="#FFFFFF"');
    expect(rendered.html).toContain("#0F6B56");
    expect(rendered.html).toContain("If the button does not work");
    expect(rendered.text).toMatch(/No payment is required/i);
    expect(rendered.text).toMatch(/will not be charged automatically/i);
    expect(rendered.text).toMatch(/bugs, errors, confusing behavior, or suggestions/i);
    expect(rendered.text).toMatch(/screenshot/i);
    expect(rendered.html).not.toMatch(/payment was successful/i);
  });

  it("omits tester feedback from gift welcome and shows no expiration", () => {
    const rendered = renderComplimentaryWelcomeEmail({
      grant: {
        grantType: "gift",
        productSku: "mpa_complete_platform",
        expiresAt: null,
        recipientEmail: "gift@example.com"
      },
      claimToken: "tok_gift"
    });
    expect(rendered.replyTo).toBe("feedback@my-property-assistant.com");
    expect(rendered.subject).toBe("Your Complimentary Complete Platform Access");
    expect(rendered.html).toContain("Your Complimentary Complete Platform Access");
    expect(rendered.html).toContain("No expiration.");
    expect(rendered.html).toContain("/branding/logo-email-lockup.png");
    expect(rendered.html).toContain("#0F6B56");
    expect(rendered.text).not.toMatch(/bugs, errors/i);
    expect(rendered.text).toMatch(/No expiration/i);
  });

  it("renders Property Manager headline dynamically", () => {
    const rendered = renderComplimentaryWelcomeEmail({
      grant: {
        grantType: "gift",
        productSku: "mpa_property_manager",
        expiresAt: "2026-10-15T00:00:00.000Z",
        recipientEmail: "pm@example.com"
      },
      claimToken: "tok_pm"
    });
    expect(rendered.subject).toBe("Your Complimentary Property Manager Access");
    expect(rendered.html).toContain("Your Complimentary Property Manager Access");
    expect(rendered.html).toContain("Expires on October 15, 2026.");
  });

  it("renders expiry mail with Continue With M.P.A. and no auto-charge", () => {
    const rendered = renderComplimentaryExpiryEmail({
      grant: {
        productSku: "mpa_facility_operations",
        expiresAt: "2026-09-01T00:00:00.000Z"
      }
    });
    expect(rendered.subject).toMatch(/ending/i);
    expect(rendered.html).toMatch(/Continue With M\.P\.A\./);
    expect(rendered.html).toContain("/branding/logo-email-lockup.png");
    expect(rendered.text).toMatch(/will not be charged automatically/i);
    expect(rendered.html).toMatch(/pricing\?from=complimentary/);
  });
});
