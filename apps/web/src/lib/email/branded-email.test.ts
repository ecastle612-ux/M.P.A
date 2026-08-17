import { describe, expect, it } from "vitest";
import {
  renderFoundationEmail,
  renderInvitationEmail,
  resolveEmailLogoUrl
} from "@mpa/email";

describe("customer email branding", () => {
  it("wraps operational notices in the branded shell with a CTA", () => {
    const html = renderFoundationEmail({
      title: "New message from your property team",
      previewText: "Message for Conversation",
      body: "<p>The lobby light is out.</p>",
      ctaUrl: "https://www.my-property-assistant.com/portal/tenant/messages",
      ctaLabel: "Open Message"
    });
    expect(html).toContain("Open Message");
    expect(html).toContain("M.P.A. · My Property Assistant");
    expect(html).toContain(resolveEmailLogoUrl("https://www.my-property-assistant.com"));
  });

  it("keeps staff invitation copy organization-specific", () => {
    const email = renderInvitationEmail({
      organizationName: "North Clinic",
      roleLabel: "Organization Admin",
      acceptUrl: "https://www.my-property-assistant.com/accept-invitation/abc"
    });
    expect(email.subject).toBe("You've been invited to help manage North Clinic");
    expect(email.html).toContain("Accept Invitation");
  });
});
