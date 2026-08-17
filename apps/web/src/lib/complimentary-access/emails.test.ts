import { describe, expect, it, vi } from "vitest";

vi.mock("../env/server-env", () => ({
  serverEnv: {
    NEXT_PUBLIC_APP_URL: "https://www.my-property-assistant.com"
  }
}));

import { TESTER_FEEDBACK_REPLY_TO } from "@mpa/shared";
import { renderComplimentaryExpiryEmail, renderComplimentaryWelcomeEmail } from "./emails";

describe("docs/185 complimentary email copy", () => {
  it("renders tester welcome with reply-to and screenshot ask", () => {
    const rendered = renderComplimentaryWelcomeEmail({
      grant: {
        grantType: "tester",
        productSku: "mpa_property_manager",
        expiresAt: "2026-09-01T00:00:00.000Z",
        recipientEmail: "tester@example.com"
      },
      claimToken: "tok_test"
    });
    expect(rendered.replyTo).toBe(TESTER_FEEDBACK_REPLY_TO);
    expect(rendered.subject).toMatch(/tester access/i);
    expect(rendered.html).toMatch(/Set Up Your Account/);
    expect(rendered.html).toMatch(/complimentary\/claim\?token=tok_test/);
    expect(rendered.text).toMatch(/No payment is required/i);
    expect(rendered.text).toMatch(/bugs, errors, confusing behavior, or suggestions/i);
    expect(rendered.text).toMatch(/screenshot/i);
    expect(rendered.html).not.toMatch(/payment was successful/i);
  });

  it("omits tester feedback from gift welcome", () => {
    const rendered = renderComplimentaryWelcomeEmail({
      grant: {
        grantType: "gift",
        productSku: "mpa_complete_platform",
        expiresAt: null,
        recipientEmail: "gift@example.com"
      },
      claimToken: "tok_gift"
    });
    expect(rendered.text).not.toMatch(/bugs, errors/i);
    expect(rendered.text).toMatch(/no expiration/i);
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
    expect(rendered.text).toMatch(/will not be charged automatically/i);
    expect(rendered.html).toMatch(/pricing\?from=complimentary/);
  });
});
