import { describe, expect, it } from "vitest";
import {
  renderBrandedEmail,
  resolveEmailLogoUrl,
  resolvePublicBrandOrigin
} from "./shell";
import { invitationEmailCopy, lifecycleEmailPresentation } from "./copy";
import { renderInvitationEmail } from "./index";

describe("branded email shell", () => {
  it("uses the Production logo host for localhost and preview URLs", () => {
    expect(resolvePublicBrandOrigin("http://localhost:3000")).toBe(
      "https://www.my-property-assistant.com"
    );
    expect(resolvePublicBrandOrigin("https://m-p-a-web.vercel.app")).toBe(
      "https://www.my-property-assistant.com"
    );
    expect(resolveEmailLogoUrl("http://127.0.0.1:3000")).toBe(
      "https://www.my-property-assistant.com/branding/logo-dark.png"
    );
  });

  it("keeps a custom production origin when it is not a preview host", () => {
    expect(resolvePublicBrandOrigin("https://www.my-property-assistant.com")).toBe(
      "https://www.my-property-assistant.com"
    );
  });

  it("renders logo, headline, CTA, fallback link, and footer", () => {
    const html = renderBrandedEmail({
      title: "New work order assigned",
      previewText: "Open the work order",
      bodyHtml: "<p>You were assigned a work order.</p>",
      ctaUrl: "https://www.my-property-assistant.com/pm/maintenance",
      ctaLabel: "Open Work Order",
      year: 2026
    });

    expect(html).toContain("M.P.A. — My Property Assistant");
    expect(html).toContain("/branding/logo-dark.png");
    expect(html).toContain("New work order assigned");
    expect(html).toContain("Open Work Order");
    expect(html).toContain("If the button does not work");
    expect(html).toContain("https://www.my-property-assistant.com/pm/maintenance");
    expect(html).toContain("© 2026 My Property Assistant");
    expect(html).not.toContain("googleapis");
    expect(html).not.toContain("uuid");
    expect(html).not.toContain("organization_id");
  });
});

describe("invitation copy", () => {
  it("uses tenant-facing language for Tenant invitations", () => {
    const copy = invitationEmailCopy({
      organizationName: "Harbor Court",
      roleLabel: "Tenant"
    });
    expect(copy.subject).toBe("You've been invited to M.P.A.");
    expect(copy.ctaLabel).toBe("Accept Invitation");
    expect(copy.paragraphs.join(" ")).toMatch(/home, payments, maintenance/i);
  });

  it("uses staff-facing language for Property Manager invitations", () => {
    const copy = invitationEmailCopy({
      organizationName: "Harbor Court",
      roleLabel: "Property Manager",
      inviterLabel: "Alex"
    });
    expect(copy.subject).toBe("You've been invited to help manage Harbor Court");
    expect(copy.paragraphs[0]).toContain("Alex invited you");
  });

  it("renders invitation HTML without internal identifiers", () => {
    const email = renderInvitationEmail({
      organizationName: "Harbor Court",
      roleLabel: "Tenant",
      acceptUrl: "https://www.my-property-assistant.com/accept-invitation/token"
    });
    expect(email.subject).toBe("You've been invited to M.P.A.");
    expect(email.html).toContain("Accept Invitation");
    expect(email.html).toContain("accept-invitation/token");
    expect(email.html).not.toMatch(/org_[a-z0-9-]+/i);
    expect(email.text).toContain("Accept Invitation:");
  });
});

describe("lifecycle email presentation", () => {
  it("maps assignment keys to customer-facing subjects", () => {
    expect(
      lifecycleEmailPresentation({
        key: "work_order.assigned",
        title: "Work order assigned",
        body: "You were assigned: Leak in unit 2"
      }).subject
    ).toBe("New work order assigned");
    expect(
      lifecycleEmailPresentation({
        key: "vendor.assigned",
        title: "Vendor work assigned",
        body: "Assigned work order: Leak"
      }).ctaLabel
    ).toBe("Open Vendor Portal");
  });
});
